import { tool } from "ai";
import { z } from "zod";

import { knowledgeBase } from "@/lib/knowledge";

const processSchema = z.enum(["mig", "flux-cored", "tig", "stick"]);
const voltageSchema = z.enum(["120V", "240V"]);

export const tools = {
  lookupSpecifications: tool({
    description: "Look up validated OmniPro 220 specifications by process and voltage.",
    inputSchema: z.object({
      process: processSchema,
      voltage: voltageSchema,
    }),
    execute: async ({ process, voltage }) => {
      logToolStart("lookupSpecifications", { process, voltage });
      const normalizedProcess = process === "flux-cored" ? "mig" : process;
      const specification =
        knowledgeBase.specifications[normalizedProcess as keyof typeof knowledgeBase.specifications][voltage];

      const result = {
        process,
        voltage,
        specification,
        note:
          process === "flux-cored"
            ? "Flux-cored uses the same wire-feed platform specs as MIG, but the polarity is different."
            : null,
      };

      logToolEnd("lookupSpecifications", result);
      return result;
    },
  }),
  getPolaritySetup: tool({
    description: "Return the cable routing and socket assignments for a welding process.",
    inputSchema: z.object({
      process: processSchema,
    }),
    execute: async ({ process }) => {
      logToolStart("getPolaritySetup", { process });
      const result = knowledgeBase.polarity[process];
      logToolEnd("getPolaritySetup", result);
      return result;
    },
  }),
  calculateDutyCycle: tool({
    description:
      "Return validated duty-cycle data for a specific process, voltage, and amperage, including weld and rest minutes in a 10-minute cycle.",
    inputSchema: z.object({
      process: processSchema,
      voltage: voltageSchema,
      amperage: z.number().positive(),
    }),
    execute: async ({ process, voltage, amperage }) => {
      logToolStart("calculateDutyCycle", { process, voltage, amperage });
      const normalizedProcess = process === "flux-cored" ? "mig" : process;
      const points =
        knowledgeBase.specifications[normalizedProcess as keyof typeof knowledgeBase.specifications][voltage]
          .dutyCyclePoints;

      const exactMatch = points.find((point) => point.amperage === amperage);
      const nearest = [...points]
        .sort((left, right) => Math.abs(left.amperage - amperage) - Math.abs(right.amperage - amperage))
        .slice(0, 2)
        .map((point) => ({
          ...point,
          weldMinutes: Number(((point.percent / 100) * 10).toFixed(2)),
          restMinutes: Number((10 - (point.percent / 100) * 10).toFixed(2)),
        }));

      if (!exactMatch) {
        const result = {
          exactMatch: false,
          process,
          voltage,
          amperage,
          nearest,
          note:
            "The starter data only includes validated manual duty-cycle points. Use the nearest validated values instead of inventing an interpolation.",
        };

        logToolEnd("calculateDutyCycle", result);
        return result;
      }

      const result = {
        exactMatch: true,
        process,
        voltage,
        amperage,
        dutyCyclePercent: exactMatch.percent,
        weldMinutes: Number(((exactMatch.percent / 100) * 10).toFixed(2)),
        restMinutes: Number((10 - (exactMatch.percent / 100) * 10).toFixed(2)),
        manualPage: knowledgeBase.specifications[normalizedProcess as keyof typeof knowledgeBase.specifications][voltage]
          .manualPage,
        referencePoint: exactMatch,
      };

      logToolEnd("calculateDutyCycle", result);
      return result;
    },
  }),
  getTroubleshooting: tool({
    description: "Look up troubleshooting causes and solutions that match a problem description.",
    inputSchema: z.object({
      issue: z.string().min(2),
      process: processSchema.optional(),
    }),
    execute: async ({ issue, process }) => {
      logToolStart("getTroubleshooting", { issue, process });
      const issueWords = tokenize(issue);

      const matches = knowledgeBase.troubleshooting
        .filter((entry) => (process ? entry.processes.includes(process) : true))
        .map((entry) => ({
          ...entry,
          score: scoreEntry(entry.issue, issueWords),
        }))
        .sort((left, right) => right.score - left.score)
        .slice(0, 3);

      const result = {
        query: issue,
        process: process ?? null,
        matches,
      };

      logToolEnd("getTroubleshooting", result);
      return result;
    },
  }),
  getManualPage: tool({
    description: "Return a manual page image path for a given topic or page number.",
    inputSchema: z.object({
      topic: z.string().optional(),
      page: z.number().int().positive().optional(),
      source: z.enum(["owner-manual", "quick-start-guide", "selection-chart"]).default("owner-manual"),
    }),
    execute: async ({ topic, page, source }) => {
      logToolStart("getManualPage", { topic, page, source });
      const normalizedTopic = topic?.toLowerCase().trim();

      const match =
        knowledgeBase.manualPages.find((entry) => entry.source === source && (page ? entry.page === page : false)) ??
        knowledgeBase.manualPages.find(
          (entry) =>
            entry.source === source &&
            normalizedTopic &&
            `${entry.topic} ${entry.label}`.toLowerCase().includes(normalizedTopic),
        ) ??
        null;

      const result =
        match ?? {
          source,
          page: page ?? null,
          label: "No extracted manual page matches that request yet.",
          imagePath: null,
        };

      logToolEnd("getManualPage", result);
      return result;
    },
  }),
  getWeldSettings: tool({
    description:
      "Look up validated weld settings for a process, material, and thickness. Returns a clear fallback when validated settings are not loaded yet.",
    inputSchema: z.object({
      process: processSchema,
      material: z.string(),
      thickness: z.string(),
    }),
    execute: async ({ process, material, thickness }) => {
      logToolStart("getWeldSettings", { process, material, thickness });
      const result = {
        process,
        material,
        thickness,
        results: knowledgeBase.weldSettings,
      };

      logToolEnd("getWeldSettings", result);
      return result;
    },
  }),
};

function tokenize(input: string) {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function scoreEntry(issue: string, issueWords: string[]) {
  const haystack = tokenize(issue);
  return issueWords.reduce((score, word) => (haystack.includes(word) ? score + 1 : score), 0);
}

function logToolStart(toolName: string, input: unknown) {
  console.log(`[tool:${toolName}] start`, previewValue(input));
}

function logToolEnd(toolName: string, output: unknown) {
  console.log(`[tool:${toolName}] end`, previewValue(output));
}

function previewValue(value: unknown) {
  try {
    const serialized = JSON.stringify(value);
    return serialized.length > 500 ? `${serialized.slice(0, 500)}…` : serialized;
  } catch {
    return String(value);
  }
}
