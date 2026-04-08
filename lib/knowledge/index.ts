import rawKnowledgeBase from "./knowledge-base.json";

export type VoltageKey = "120V" | "240V";
export type ProcessKey = "mig" | "flux-cored" | "tig" | "stick";

export type KnowledgeBase = typeof rawKnowledgeBase;

export const knowledgeBase = rawKnowledgeBase;

