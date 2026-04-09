import { z } from "zod";

const processSchema = z.enum(["mig", "flux-cored", "tig", "stick"]);
const voltageSchema = z.enum(["120V", "240V"]);

const dutyCyclePointSchema = z.object({
  percent: z.number(),
  amperage: z.number(),
  voltage: z.number(),
});

const specificationSchema = z
  .object({
    powerInput: z.string(),
    currentInputAtOutput: z.string(),
    weldingCurrentRange: z.string(),
    maximumOCV: z.string(),
    weldableMaterials: z.array(z.string()).min(1),
    dutyCyclePoints: z.array(dutyCyclePointSchema).min(1),
    manualPage: z.number().int().positive(),
  })
  .passthrough();

const troubleshootingMatchSchema = z.object({
  issue: z.string(),
  manualPage: z.number().int().positive(),
  causes: z.array(z.string()).min(1),
  solutions: z.array(z.string()).min(1),
  processes: z.array(processSchema).min(1),
  score: z.number(),
});

const weldSettingValidatedSchema = z
  .object({
    validated: z.literal(true),
    process: processSchema,
    material: z.string(),
    thickness: z.string(),
    source: z.string(),
  })
  .passthrough();

const weldSettingFallbackSchema = z
  .object({
    validated: z.literal(false),
    message: z.string(),
  })
  .passthrough();

export const toolContracts = {
  lookupSpecifications: {
    input: z.object({
      process: processSchema,
      voltage: voltageSchema,
    }),
    output: z.object({
      process: processSchema,
      voltage: voltageSchema,
      specification: specificationSchema,
      note: z.string().nullable(),
    }),
    sampleInput: {
      process: "mig",
      voltage: "240V",
    } as const,
  },
  getPolaritySetup: {
    input: z.object({
      process: processSchema,
    }),
    output: z.object({
      polarity: z.string(),
      summary: z.string(),
      groundClampSocket: z.enum(["positive", "negative"]),
      leadSocket: z.enum(["positive", "negative"]),
      steps: z.array(z.string()).min(1),
      manualPage: z.number().int().positive(),
      imagePath: z.string(),
    }),
    sampleInput: {
      process: "tig",
    } as const,
  },
  calculateDutyCycle: {
    input: z.object({
      process: processSchema,
      voltage: voltageSchema,
      amperage: z.number().positive(),
    }),
    output: z.union([
      z.object({
        exactMatch: z.literal(true),
        process: processSchema,
        voltage: voltageSchema,
        amperage: z.number().positive(),
        dutyCyclePercent: z.number().positive(),
        weldMinutes: z.number().nonnegative(),
        restMinutes: z.number().nonnegative(),
        manualPage: z.number().int().positive(),
        referencePoint: dutyCyclePointSchema,
      }),
      z.object({
        exactMatch: z.literal(false),
        process: processSchema,
        voltage: voltageSchema,
        amperage: z.number().positive(),
        nearest: z
          .array(
            dutyCyclePointSchema.extend({
              weldMinutes: z.number().nonnegative(),
              restMinutes: z.number().nonnegative(),
            }),
          )
          .min(1),
        note: z.string(),
      }),
    ]),
    sampleInput: {
      process: "mig",
      voltage: "240V",
      amperage: 200,
    } as const,
  },
  getTroubleshooting: {
    input: z.object({
      issue: z.string().min(2),
      process: processSchema.optional(),
    }),
    output: z.object({
      query: z.string(),
      process: processSchema.nullable(),
      matches: z.array(troubleshootingMatchSchema),
    }),
    sampleInput: {
      issue: "porosity in weld",
      process: "flux-cored",
    } as const,
  },
  getManualPage: {
    input: z.object({
      topic: z.string().optional(),
      page: z.number().int().positive().optional(),
      source: z.enum(["owner-manual", "quick-start-guide", "selection-chart"]).default("owner-manual"),
    }),
    output: z.object({
      source: z.enum(["owner-manual", "quick-start-guide", "selection-chart"]),
      page: z.number().int().positive().nullable(),
      label: z.string(),
      imagePath: z.string().nullable(),
    }),
    sampleInput: {
      page: 24,
      source: "owner-manual",
    } as const,
  },
  getWeldSettings: {
    input: z.object({
      process: processSchema,
      material: z.string().min(1).max(120),
      thickness: z.string().min(1).max(120),
    }),
    output: z.object({
      process: processSchema,
      material: z.string(),
      thickness: z.string(),
      exactMatch: z.boolean(),
      note: z.string().nullable(),
      results: z.array(
        z.union([weldSettingValidatedSchema, weldSettingFallbackSchema]),
      ),
    }),
    sampleInput: {
      process: "stick",
      material: "mild steel",
      thickness: "1/8 in",
    } as const,
  },
};

export type ToolName = keyof typeof toolContracts;
