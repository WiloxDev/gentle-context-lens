import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { calculateContextBreakdown } from "./telemetry-engine.js";
import { renderTrafficLightBadge } from "./hud-renderer.js";

export interface ScannerLensPayload {
  pressureScore: number; // 0.0 a 1.0
  trafficStatus: "green" | "yellow" | "red";
  badgeText: string;
  recommendedAction: "NONE" | "AUDIT" | "PRUNE_NOW";
  tokensUsed: number;
  tokensLimit: number;
}

/**
 * Hook de interoperabilidad para scanner-working-chat y TelarDev.
 * Permite que otros plugins consulten el estado de presión sin acoplamiento duro.
 */
export function getScannerLensPayload(ctx: ExtensionContext): ScannerLensPayload {
  const breakdown = calculateContextBreakdown(ctx);
  const pressureScore = parseFloat((breakdown.usedPercent / 100).toFixed(2));

  let recommendedAction: "NONE" | "AUDIT" | "PRUNE_NOW" = "NONE";
  if (breakdown.trafficStatus === "red") {
    recommendedAction = "PRUNE_NOW";
  } else if (breakdown.trafficStatus === "yellow") {
    recommendedAction = "AUDIT";
  }

  return {
    pressureScore,
    trafficStatus: breakdown.trafficStatus,
    badgeText: renderTrafficLightBadge(breakdown),
    recommendedAction,
    tokensUsed: breakdown.totalUsed,
    tokensLimit: breakdown.contextWindow
  };
}
