import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { PrunableTarget, PruneResult } from "./types.js";
import { classifyEntryRisk } from "./safety-matrix.js";

/**
 * Escanea el historial de la sesión para encontrar candidatos seguros de poda.
 */
export function scanPrunableTargets(ctx: ExtensionContext): PrunableTarget[] {
  const entries = ctx.sessionManager.getEntries() as any[];
  const targets: PrunableTarget[] = [];
  const totalTurns = entries.length;

  entries.forEach((entry, idx) => {
    if (entry.type === "message") {
      const msg = entry.message;
      const role = msg?.role || "";
      const contentStr = typeof msg?.content === "string" 
        ? msg.content 
        : JSON.stringify(msg?.content || "");

      const { risk, reason } = classifyEntryRisk(role, contentStr, idx, totalTurns);

      if (risk === "SAFE") {
        const lines = contentStr.split("\n").length;
        const tokens = Math.round(contentStr.length / 4);
        const preview = contentStr.slice(0, 80).replace(/\n/g, " ") + "...";

        targets.push({
          id: entry.id || `entry-${idx}`,
          type: "tool_output",
          title: `Salida de herramienta (Turno #${idx + 1}, ${lines} líneas)`,
          tokens,
          risk,
          preview,
          turnIndex: idx
        });
      }
    }
  });

  return targets;
}

/**
 * Ejecuta la poda de forma no destructiva:
 * Reemplaza los bloques pesados con un stub de 1 línea informando que la salida
 * fue comprimida, manteniendo el código de retorno y preservando el hilo de chat.
 */
export function executePruning(ctx: ExtensionContext, specificTargets?: PrunableTarget[]): PruneResult {
  const targetsToPrune = specificTargets || scanPrunableTargets(ctx).filter(t => t.risk === "SAFE");
  let tokensReclaimed = 0;
  let itemsPrunedCount = 0;
  const details: string[] = [];

  if (targetsToPrune.length === 0) {
    return {
      tokensReclaimed: 0,
      itemsPrunedCount: 0,
      details: ["No se encontraron salidas seguras para podar."]
    };
  }

  const entries = ctx.sessionManager.getEntries() as any[];

  for (const target of targetsToPrune) {
    const entry = entries[target.turnIndex];
    if (entry && entry.type === "message" && entry.message) {
      const originalLength = typeof entry.message.content === "string" 
        ? entry.message.content.length 
        : JSON.stringify(entry.message.content).length;

      const stub = `[Salida podada por Gentle Context Lens: ${target.tokens} tokens recuperados del turno #${target.turnIndex + 1}. El comando finalizó con éxito.]`;

      entry.message.content = stub;
      const newLength = stub.length;
      const savedTokens = Math.max(0, Math.round((originalLength - newLength) / 4));

      tokensReclaimed += savedTokens;
      itemsPrunedCount++;
      details.push(`Turno #${target.turnIndex + 1}: recuperados ~${savedTokens} tokens.`);
    }
  }

  return {
    tokensReclaimed,
    itemsPrunedCount,
    details
  };
}
