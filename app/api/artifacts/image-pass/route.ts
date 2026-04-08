import { readFile } from "fs/promises";
import { join } from "path";
import Replicate from "replicate";

export const maxDuration = 60;

const DEFAULT_MODEL = "google/nano-banana-pro";
const MANUAL_DIR = join(process.cwd(), "public", "manual-pages");

/**
 * Each entry maps content keywords → a relevant manual page image.
 * When the SVG title or labels mention "MIG" we include the MIG polarity diagram
 * as a reference so flux-2-pro stays visually faithful to the real documentation.
 */
const REFERENCE_RULES: { keywords: string[]; file: string }[] = [
  { keywords: ["mig", "dcep", "mig wire"],               file: "owner-manual-p14.png" },
  { keywords: ["flux", "dcen", "flux-core", "flux cored"],file: "owner-manual-p13.png" },
  { keywords: ["tig"],                                     file: "owner-manual-p24.png" },
  { keywords: ["stick", "smaw"],                           file: "owner-manual-p27.png" },
  { keywords: ["spec", "duty cycle", "amperage"],          file: "owner-manual-p07.png" },
  { keywords: ["troubleshoot", "porosity", "spatter"],     file: "owner-manual-p42.png" },
];

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (!process.env.REPLICATE_API_TOKEN) {
    console.warn(`[image-pass:${requestId}] skipped: no REPLICATE_API_TOKEN`);
    return Response.json({
      enabled: false,
      error: "Set REPLICATE_API_TOKEN to enable the Nano Banana image pass.",
    });
  }

  let body: { svg?: string; title?: string };
  try {
    body = (await request.json()) as { svg?: string; title?: string };
  } catch {
    return Response.json({ enabled: true, error: "Invalid request body." }, { status: 400 });
  }

  const svg = body.svg?.trim();
  const title = body.title?.trim() || "SVG artifact";

  if (!svg) {
    return Response.json({ enabled: true, error: "Missing SVG content." }, { status: 400 });
  }

  const model = (process.env.IMAGE_MODEL || DEFAULT_MODEL) as `${string}/${string}`;
  const labels = extractSvgLabels(svg);
  const prompt = buildPrompt(title, labels);
  const referenceImages = await matchReferenceImages(svg, title);

  console.log(`[image-pass:${requestId}] start`, {
    model,
    title,
    promptLength: prompt.length,
    references: referenceImages.length,
  });

  try {
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const output = await replicate.run(model, {
      input: {
        prompt,
        resolution: "2K",
        aspect_ratio: "1:1",
        output_format: "png",
        safety_filter_level: "block_only_high",
        allow_fallback_model: false,
        ...(referenceImages.length > 0 ? { image_input: referenceImages } : {}),
      },
    });

    // flux-2-pro returns a single FileOutput, not an array
    const result = output as { url?: () => URL; blob?: () => Promise<Blob> } | string;

    let buffer: ArrayBuffer;
    if (typeof result === "object" && result !== null && typeof result.blob === "function") {
      buffer = await (await result.blob()).arrayBuffer();
    } else {
      const url = typeof result === "string" ? result : String(result);
      buffer = await (await fetch(url)).arrayBuffer();
    }

    const base64 = Buffer.from(buffer).toString("base64");
    const mediaType = "image/png";

    console.log(`[image-pass:${requestId}] complete`, {
      bytes: buffer.byteLength,
      model,
      references: referenceImages.length,
    });

    return Response.json({
      enabled: true,
      image: { mediaType, dataUrl: `data:${mediaType};base64,${base64}` },
      model,
    });
  } catch (error) {
    console.error(`[image-pass:${requestId}] failed`, error);
    return Response.json(
      { enabled: true, error: error instanceof Error ? error.message : "Unknown image pass error." },
      { status: 500 },
    );
  }
}

/* ── Helpers ─────────────────────────────────────────── */

/** Pull visible text from <text> and <title> elements inside the SVG. */
function extractSvgLabels(svg: string): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  for (const match of svg.matchAll(/<(?:text|title|tspan)[^>]*>([^<]+)<\/(?:text|title|tspan)>/gi)) {
    const label = match[1].trim();
    if (label && !seen.has(label)) {
      seen.add(label);
      results.push(label);
    }
  }
  return results;
}

/** Build a Flux prompt from the SVG metadata. */
function buildPrompt(title: string, labels: string[]): string {
  const labelClause =
    labels.length > 0
      ? ` Labeled components: ${labels.slice(0, 16).join(", ")}.`
      : "";

  return (
    `Clean technical manual illustration: ${title}.${labelClause} ` +
    "Industrial diagram style, precise line art with a white background, " +
    "crisp labels, professional welding equipment manual aesthetic. " +
    "Faithful to source — do not add components that are not described."
  );
}

/**
 * Scan the SVG content + title for domain keywords and load matching
 * manual page images as base64 data URIs for flux-2-pro's input_images.
 * Capped at 2 references to keep upload size reasonable (~1 MB total).
 */
async function matchReferenceImages(svg: string, title: string): Promise<string[]> {
  const haystack = `${title}\n${svg}`.toLowerCase();
  const matched: string[] = [];

  for (const rule of REFERENCE_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      matched.push(rule.file);
    }
    if (matched.length >= 2) break;
  }

  const results: string[] = [];
  for (const file of matched) {
    try {
      const buf = await readFile(join(MANUAL_DIR, file));
      results.push(`data:image/png;base64,${buf.toString("base64")}`);
    } catch {
      // skip if the file is missing
    }
  }

  return results;
}
