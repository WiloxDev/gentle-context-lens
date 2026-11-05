export type ComponentCategory =
  | "tools"
  | "skills"
  | "system"
  | "chat"
  | "free";

export interface ContextSegment {
  category: ComponentCategory;
  label: string;
  tokens: number;
  percent: number;
}

export interface ContextBreakdown {
  totalUsed: number;
  contextWindow: number;
  usedPercent: number;
  remainingTokens: number;
  trafficStatus: "green" | "yellow" | "red";
  segments: ContextSegment[];
  timestamp: number;
}

export type RoiStatus = "HIGH_ROI" | "BALANCED" | "IDLE_DRAIN";

export interface ToolRoiMetric {
  name: string;
  tokenCost: number;
  invocations: number;
  roiScore: number;
  status: RoiStatus;
}

export type PruneRiskLevel = "SAFE" | "CAUTION" | "IMMUTABLE";

export interface PrunableTarget {
  id: string;
  type: "tool_output" | "old_diff" | "idle_tool" | "raw_log";
  title: string;
  tokens: number;
  risk: PruneRiskLevel;
  preview: string;
  turnIndex: number;
}

export interface PruneResult {
  tokensReclaimed: number;
  itemsPrunedCount: number;
  details: string[];
}
