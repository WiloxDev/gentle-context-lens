import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { ContextBreakdown, ContextSegment, ToolRoiMetric } from "./types.js";

// Registro en memoria de invocaciones de herramientas durante la sesión
const toolInvocations = new Map<string, number>();

export function recordToolInvocation(toolName: string): void {
  const current = toolInvocations.get(toolName) || 0;
  toolInvocations.set(toolName, current + 1);
}

export function getToolInvocations(): Map<string, number> {
  return new Map(toolInvocations);
}

export function resetToolInvocations(): void {
  toolInvocations.clear();
}

/**
 * Calcula el desglose del contexto utilizando los datos reales de Pi/Gentle-Shell
 * evitando el problema de 'Token Mismatch' de las estimaciones heurísticas.
 */
export function calculateContextBreakdown(ctx: ExtensionContext): ContextBreakdown {
  const usage = ctx.getContextUsage();
  const contextWindow = usage?.contextWindow || 128_000;
  const totalUsed = usage?.tokens || 0;
  const usedPercent = usage?.percent || Math.round((totalUsed / contextWindow) * 100);
  const remainingTokens = Math.max(0, contextWindow - totalUsed);

  // Estimación de pesos relativos basada en las entradas de la sesión activa
  const entries = ctx.sessionManager.getEntries();
  let chatTokens = 0;
  let toolOutputTokens = 0;

  for (const entry of entries as any[]) {
    if (entry.type === "message") {
      const msg = entry.message;
      const textLen = typeof msg?.content === "string" 
        ? msg.content.length 
        : JSON.stringify(msg?.content || "").length;
      
      const estimatedMsgTokens = Math.round(textLen / 4);

      if (msg?.role === "tool" || msg?.role === "tool_result") {
        toolOutputTokens += estimatedMsgTokens;
      } else {
        chatTokens += estimatedMsgTokens;
      }
    }
  }

  // Estimación de System Prompt y Esquemas de Herramientas
  const toolsCount = (ctx as any).tools?.length || 15;
  const estimatedToolsTokens = toolsCount * 450; // promedio de 450 tokens por esquema JSON
  const estimatedSystemTokens = Math.max(1_500, totalUsed - (chatTokens + toolOutputTokens + estimatedToolsTokens));

  const safeChatTokens = Math.max(0, chatTokens);
  const safeToolsTokens = Math.max(500, toolOutputTokens + estimatedToolsTokens);
  const safeSystemTokens = Math.max(1_000, estimatedSystemTokens);

  const segments: ContextSegment[] = [
    {
      category: "system",
      label: "System & Reglas",
      tokens: safeSystemTokens,
      percent: Math.round((safeSystemTokens / contextWindow) * 100)
    },
    {
      category: "tools",
      label: "Herramientas & Outputs",
      tokens: safeToolsTokens,
      percent: Math.round((safeToolsTokens / contextWindow) * 100)
    },
    {
      category: "chat",
      label: "Chat (User & AI)",
      tokens: safeChatTokens,
      percent: Math.round((safeChatTokens / contextWindow) * 100)
    },
    {
      category: "free",
      label: "Espacio Libre",
      tokens: remainingTokens,
      percent: Math.max(0, 100 - usedPercent)
    }
  ];

  let trafficStatus: "green" | "yellow" | "red" = "green";
  if (usedPercent >= 75) {
    trafficStatus = "red";
  } else if (usedPercent >= 50 || safeToolsTokens > (contextWindow * 0.35)) {
    trafficStatus = "yellow";
  }

  return {
    totalUsed,
    contextWindow,
    usedPercent,
    remainingTokens,
    trafficStatus,
    segments,
    timestamp: Date.now()
  };
}

/**
 * Calcula el retorno de inversión (ROI) por herramienta en la sesión actual.
 */
export function calculateToolRois(ctx: ExtensionContext): ToolRoiMetric[] {
  const tools = (ctx as any).tools || [];
  const metrics: ToolRoiMetric[] = [];

  for (const t of tools) {
    const name = t.name || "desconocido";
    const schemaStr = JSON.stringify(t.parameters || {});
    const tokenCost = Math.max(100, Math.round(schemaStr.length / 4));
    const invocations = toolInvocations.get(name) || 0;

    let status: "HIGH_ROI" | "BALANCED" | "IDLE_DRAIN" = "IDLE_DRAIN";
    if (invocations >= 3) {
      status = "HIGH_ROI";
    } else if (invocations >= 1) {
      status = "BALANCED";
    }

    const roiScore = parseFloat((invocations / (tokenCost / 1000)).toFixed(2));

    metrics.push({
      name,
      tokenCost,
      invocations,
      roiScore,
      status
    });
  }

  // Ordenar: primero las que más tokens queman sin usarse (IDLE_DRAIN)
  metrics.sort((a, b) => {
    if (a.status === "IDLE_DRAIN" && b.status !== "IDLE_DRAIN") return -1;
    if (b.status === "IDLE_DRAIN" && a.status !== "IDLE_DRAIN") return 1;
    return b.tokenCost - a.tokenCost;
  });

  return metrics;
}
