import { z } from "zod";
import { describe, expect, it } from "vitest";

import { knowledgeBase } from "@/lib/knowledge";
import { tools } from "@/lib/agent/tools";
import { lookupWeldSettings } from "@/lib/agent/weld-settings";
import { toolContracts, type ToolName } from "@/tests/contracts/tool-contracts";

type ToolDefinition = {
  inputSchema?: z.ZodTypeAny;
  execute?: (input: unknown) => Promise<unknown>;
};

const contractEntries = Object.entries(toolContracts) as [
  ToolName,
  (typeof toolContracts)[ToolName],
][];

describe("agent tool contracts", () => {
  it.each(contractEntries)(
    "validates the happy path for %s",
    async (toolName, contract) => {
      const definition = tools[toolName] as ToolDefinition;

      expect(definition.inputSchema).toBeDefined();
      expect(typeof definition.execute).toBe("function");
      expect(contract.input.safeParse(contract.sampleInput).success).toBe(true);
      expect(definition.inputSchema?.safeParse(contract.sampleInput).success).toBe(true);

      const result = await definition.execute?.(contract.sampleInput);
      expect(() => contract.output.parse(result)).not.toThrow();
    },
  );

  it("normalizes flux-cored specifications to the MIG data table", async () => {
    const result = await (tools.lookupSpecifications as ToolDefinition).execute?.({
      process: "flux-cored",
      voltage: "240V",
    });

    const parsed = toolContracts.lookupSpecifications.output.parse(result);

    expect(parsed.process).toBe("flux-cored");
    expect(parsed.specification.weldingCurrentRange).toBe("30-220 A");
    expect(parsed.note).toContain("same wire-feed platform specs as MIG");
  });

  it("returns exact duty-cycle values when a validated amperage exists", async () => {
    const result = await (tools.calculateDutyCycle as ToolDefinition).execute?.({
      process: "mig",
      voltage: "240V",
      amperage: 200,
    });

    const parsed = toolContracts.calculateDutyCycle.output.parse(result);

    expect(parsed.exactMatch).toBe(true);

    if (parsed.exactMatch) {
      expect(parsed.dutyCyclePercent).toBe(25);
      expect(parsed.weldMinutes).toBe(2.5);
      expect(parsed.restMinutes).toBe(7.5);
    }
  });

  it("returns nearest validated duty-cycle points when no exact amperage exists", async () => {
    const result = await (tools.calculateDutyCycle as ToolDefinition).execute?.({
      process: "mig",
      voltage: "240V",
      amperage: 190,
    });

    const parsed = toolContracts.calculateDutyCycle.output.parse(result);

    expect(parsed.exactMatch).toBe(false);

    if (!parsed.exactMatch) {
      expect(parsed.nearest).toHaveLength(2);
      expect(parsed.nearest.map((point) => point.amperage)).toEqual([200, 130]);
      expect(parsed.note).toContain("nearest validated values");
    }
  });

  it("returns the best troubleshooting match first", async () => {
    const result = await (tools.getTroubleshooting as ToolDefinition).execute?.({
      issue: "porosity in weld metal",
      process: "flux-cored",
    });

    const parsed = toolContracts.getTroubleshooting.output.parse(result);

    expect(parsed.process).toBe("flux-cored");
    expect(parsed.matches.length).toBeGreaterThanOrEqual(2);
    expect(parsed.matches[0]?.issue).toBe("Porosity in the weld metal");
    expect(parsed.matches[0]?.score).toBeGreaterThanOrEqual(parsed.matches[1]?.score ?? 0);
  });

  it("returns a clear fallback when a manual page is not extracted yet", async () => {
    const result = await (tools.getManualPage as ToolDefinition).execute?.({
      topic: "selection chart",
      source: "selection-chart",
    });

    const parsed = toolContracts.getManualPage.output.parse(result);

    expect(parsed.imagePath).toBeNull();
    expect(parsed.label).toContain("No extracted manual page matches");
  });

  it("returns a clear fallback when no validated row matches the requested settings", async () => {
    const result = await (tools.getWeldSettings as ToolDefinition).execute?.({
      process: "stick",
      material: "mild steel",
      thickness: "1/8 in",
    });

    const parsed = toolContracts.getWeldSettings.output.parse(result);

    expect(parsed.exactMatch).toBe(false);
    expect(parsed.note).toContain("no exact match");
    expect(parsed.results[0]?.validated).toBe(false);
    expect(parsed.results[0]?.message).toContain("No validated weld settings were found");
  });

  it("matches a validated repo-sourced weld-setting entry from the owner manual", async () => {
    const result = await (tools.getWeldSettings as ToolDefinition).execute?.({
      process: "mig",
      material: "steel",
      thickness: "24ga",
    });

    const parsed = toolContracts.getWeldSettings.output.parse(result);

    expect(parsed.exactMatch).toBe(true);
    expect(parsed.note).toBeNull();
    expect(parsed.results[0]).toMatchObject({
      validated: true,
      process: "mig",
      material: "steel",
      thickness: "24 ga",
      wireSpeed: "121 in/min",
      voltage: "13.8 V",
      manualPage: 20,
    });
  });

  it("returns a partial-data note when a validated row omits wire speed and voltage", async () => {
    const result = await (tools.getWeldSettings as ToolDefinition).execute?.({
      process: "mig",
      material: "stainless steel",
      thickness: "24 gauge",
    });

    const parsed = toolContracts.getWeldSettings.output.parse(result);

    expect(parsed.exactMatch).toBe(true);
    expect(parsed.note).toContain("does not include a full wire-speed and voltage pair");
    expect(parsed.results[0]).toMatchObject({
      validated: true,
      process: "mig",
      material: "stainless steel",
      thickness: "24 ga",
      wireDiameter: ".025 in",
      gas: "Stainless Tri-Mix",
    });
  });

  it("returns a match from the pure weld-settings lookup helper for normalized thickness input", () => {
    const steelRow = knowledgeBase.weldSettings.find(
      (entry) =>
        entry.validated === true &&
        entry.process === "mig" &&
        entry.material === "steel" &&
        entry.thickness === "24 ga",
    );

    expect(steelRow).toBeDefined();

    const result = lookupWeldSettings(
      [steelRow!],
      {
        process: "mig",
        material: "steel",
        thickness: "24ga",
      },
    );

    expect(result.exactMatch).toBe(true);
    expect(result.note).toBeNull();
    expect(result.results[0]).toMatchObject({
      validated: true,
      thickness: "24 ga",
      wireSpeed: "121 in/min",
    });
  });
});
