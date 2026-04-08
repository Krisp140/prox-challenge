export type ParsedArtifact = {
  identifier: string;
  type: string;
  title: string;
  content: string;
  attributes: Record<string, string>;
};

export type ArtifactSegment =
  | { kind: "text"; content: string }
  | { kind: "artifact"; artifact: ParsedArtifact }
  | { kind: "pending"; title: string; type: string };

// Case-insensitive. Accepts </antArtifact>, </artifact>, </Artifact>, </ant_artifact>, whitespace, etc.
const ARTIFACT_PATTERN =
  /<antArtifact\s+([^>]+)>([\s\S]*?)<\/\s*(?:ant[-_]?)?artifact\s*>/gi;

// Captures the opening tag + everything after it (unclosed artifact)
const PENDING_PATTERN = /<antArtifact\s+([^>]+)>([\s\S]*)$/i;

const ATTRIBUTE_PATTERN = /(\w+)="([^"]*)"/g;

// Minimum content length to consider a tagless artifact "complete" rather than "pending"
const COMPLETE_THRESHOLD = 60;

type ParseArtifactsOptions = {
  allowIncompleteArtifacts?: boolean;
};

export function parseArtifacts(source: string, options: ParseArtifactsOptions = {}) {
  const { allowIncompleteArtifacts = true } = options;

  if (!source.toLowerCase().includes("<antartifact")) {
    return [{ kind: "text", content: source }] satisfies ArtifactSegment[];
  }

  const segments: ArtifactSegment[] = [];
  let lastIndex = 0;

  for (const match of source.matchAll(ARTIFACT_PATTERN)) {
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      segments.push({
        kind: "text",
        content: source.slice(lastIndex, matchIndex),
      });
    }

    const attributes = parseAttributes(match[1] ?? "");
    segments.push({
      kind: "artifact",
      artifact: buildArtifact(attributes, (match[2] ?? "").trim(), segments.length),
    });

    lastIndex = matchIndex + match[0].length;
  }

  // Handle unclosed artifact (streaming or missing closing tag)
  const remaining = source.slice(lastIndex);
  const pendingMatch = remaining.match(PENDING_PATTERN);

  if (pendingMatch && pendingMatch.index !== undefined) {
    const textBefore = remaining.slice(0, pendingMatch.index);
    if (textBefore.trim()) {
      segments.push({ kind: "text", content: textBefore });
    }

    const attrs = parseAttributes(pendingMatch[1] ?? "");
    const content = (pendingMatch[2] ?? "").trim();

    // If the content is substantial, treat as a complete artifact (Claude dropped the closing tag)
    if (allowIncompleteArtifacts && content.length > COMPLETE_THRESHOLD) {
      segments.push({
        kind: "artifact",
        artifact: buildArtifact(attrs, content, segments.length),
      });
    } else {
      segments.push({
        kind: "pending",
        title: attrs.title ?? "Artifact",
        type: attrs.type ?? "unknown",
      });
    }
  } else if (remaining.trim()) {
    segments.push({ kind: "text", content: remaining });
  }

  return segments;
}

function buildArtifact(
  attributes: Record<string, string>,
  content: string,
  segmentIndex: number,
): ParsedArtifact {
  return {
    identifier:
      attributes.identifier ??
      `artifact-${segmentIndex + 1}-${Math.random().toString(36).slice(2, 8)}`,
    type: mapArtifactType(attributes.type ?? "unknown"),
    title: attributes.title ?? "Artifact",
    content,
    attributes,
  };
}

function parseAttributes(attributeBlock: string) {
  const attributes: Record<string, string> = {};
  for (const match of attributeBlock.matchAll(ATTRIBUTE_PATTERN)) {
    const [, key, value] = match;
    attributes[key] = value;
  }
  return attributes;
}

/** Normalize the type attribute from Claude's artifact tags. */
function mapArtifactType(raw: string): string {
  if (raw === "application/vnd.ant.react" || raw === "react") return "react";
  if (raw === "application/vnd.ant.mermaid" || raw === "mermaid") return "mermaid";
  if (raw === "image/svg+xml" || raw === "svg") return "svg";
  if (raw === "manual-image") return "manual-image";
  return raw;
}
