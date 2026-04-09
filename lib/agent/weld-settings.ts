import type { ProcessKey } from "@/lib/knowledge";

export type WeldSettingsFallback = {
  validated: false;
  message: string;
};

export type ValidatedWeldSetting = {
  validated: true;
  process: ProcessKey;
  material: string;
  thickness: string;
  source: string;
  amperage?: string;
  voltage?: string;
  wireSpeed?: string;
  gas?: string | null;
  electrodeType?: string;
  electrodeDiameter?: string;
  polarity?: string;
  manualPage?: number;
  notes?: string[];
  processAliases?: string[];
  materialAliases?: string[];
  thicknessAliases?: string[];
};

export type WeldSettingEntry = ValidatedWeldSetting | WeldSettingsFallback;

export type WeldSettingsLookupInput = {
  process: ProcessKey;
  material: string;
  thickness: string;
};

export type WeldSettingsLookupResult = {
  exactMatch: boolean;
  note: string | null;
  results: WeldSettingEntry[];
};

export function lookupWeldSettings(
  entries: readonly WeldSettingEntry[],
  query: WeldSettingsLookupInput,
): WeldSettingsLookupResult {
  const validatedEntries = entries.filter(isValidatedSetting);
  const matches = validatedEntries
    .filter((entry) => matchesSetting(entry, query))
    .sort((left, right) => scoreSetting(right, query) - scoreSetting(left, query));

  if (matches.length > 0) {
    const singleMatch = matches.length === 1 ? matches[0] : null;
    const partialRowNote =
      singleMatch && (!singleMatch.wireSpeed || !singleMatch.voltage)
        ? "A validated row was found, but the repo-sourced manual screenshot does not include a full wire-speed and voltage pair for this exact combination."
        : null;

    return {
      exactMatch: matches.length === 1,
      note:
        matches.length === 1
          ? partialRowNote
          : "Multiple validated weld settings matched this query. Review the returned results to choose the right row.",
      results: matches,
    };
  }

  if (validatedEntries.length === 0) {
    const fallbackEntries = entries.filter(isFallbackSetting);
    return {
      exactMatch: false,
      note: "No validated weld-setting rows are loaded into the knowledge base yet.",
      results:
        fallbackEntries.length > 0
          ? fallbackEntries
          : [
              {
                validated: false,
                message:
                  "No validated weld-setting rows are loaded yet, so exact process/material/thickness settings are not available.",
              },
            ],
    };
  }

  return {
    exactMatch: false,
    note: "Validated weld settings are loaded, but no exact match was found for this process/material/thickness combination.",
    results: [
      {
        validated: false,
        message: `No validated weld settings were found for ${query.process} welding on ${query.material} at ${query.thickness}.`,
      },
    ],
  };
}

function isValidatedSetting(entry: WeldSettingEntry): entry is ValidatedWeldSetting {
  return entry.validated === true;
}

function isFallbackSetting(entry: WeldSettingEntry): entry is WeldSettingsFallback {
  return entry.validated === false;
}

function matchesSetting(entry: ValidatedWeldSetting, query: WeldSettingsLookupInput): boolean {
  return (
    matchesProcess(entry, query.process) &&
    matchesText(entry.material, entry.materialAliases, query.material, normalizeText) &&
    matchesText(entry.thickness, entry.thicknessAliases, query.thickness, normalizeThickness)
  );
}

function scoreSetting(entry: ValidatedWeldSetting, query: WeldSettingsLookupInput): number {
  let score = 0;

  score += matchesProcess(entry, query.process) ? 3 : 1;
  score += normalizeText(entry.material) === normalizeText(query.material) ? 3 : 1;
  score += normalizeThickness(entry.thickness) === normalizeThickness(query.thickness) ? 3 : 1;

  return score;
}

function matchesProcess(entry: ValidatedWeldSetting, process: ProcessKey): boolean {
  if (entry.process === process) return true;
  return (entry.processAliases ?? []).some((alias) => normalizeText(alias) === normalizeText(process));
}

function matchesText(
  primary: string,
  aliases: string[] | undefined,
  query: string,
  normalizer: (input: string) => string,
): boolean {
  const normalizedQuery = normalizer(query);
  if (normalizer(primary) === normalizedQuery) return true;
  return (aliases ?? []).some((alias) => normalizer(alias) === normalizedQuery);
}

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/["'`]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeThickness(input: string): string {
  return normalizeText(input)
    .replace(/\b(inches|inch)\b/g, "in")
    .replace(/(\d\/\d|\d)\s*in\b/g, "$1 in")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+in\b/g, " in");
}
