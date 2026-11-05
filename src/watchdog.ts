export interface WatchdogAlert {
  source: string;
  injectedTokens: number;
  threshold: number;
  timestamp: number;
}

const DEFAULT_INJECTION_THRESHOLD = 5_000;

export function evaluatePromptInflation(
  beforeTokens: number,
  afterTokens: number,
  sourceLabel: string = "Extensión externa",
  threshold: number = DEFAULT_INJECTION_THRESHOLD
): WatchdogAlert | null {
  const diff = afterTokens - beforeTokens;

  if (diff > threshold) {
    return {
      source: sourceLabel,
      injectedTokens: diff,
      threshold,
      timestamp: Date.now()
    };
  }

  return null;
}

export function formatWatchdogWarning(alert: WatchdogAlert): string {
  return `🔔 [Context Lens Watchdog] Alerta: Se detectó una inyección masiva de ~${alert.injectedTokens.toLocaleString()} tokens por parte de '${alert.source}'.\nEjecuta '/lens status' o '/lens injections' para auditar.`;
}
