import type { ContextBreakdown } from "./types.js";

/**
 * Genera la insignia semafórica viva para la barra de estado de Gentle Shell.
 */
export function renderTrafficLightBadge(breakdown: ContextBreakdown): string {
  const percent = breakdown.usedPercent;

  if (breakdown.trafficStatus === "green") {
    return `🟢 CTX ${percent}%`;
  }
  if (breakdown.trafficStatus === "yellow") {
    return `🟡 CTX ${percent}% (Alerta)`;
  }
  return `🔴 CTX ${percent}% (/lens prune)`;
}

/**
 * Genera el mini-widget horizontal segmentado para el sidebar de TelarDev o Gentle Shell.
 */
export function renderSidebarMiniWidget(breakdown: ContextBreakdown, maxWidth: number = 42): string {
  const tools = breakdown.segments.find(s => s.category === "tools")?.percent || 0;
  const chat = breakdown.segments.find(s => s.category === "chat")?.percent || 0;
  const sys = breakdown.segments.find(s => s.category === "system")?.percent || 0;
  const free = breakdown.segments.find(s => s.category === "free")?.percent || 0;

  const bar = `[ 🟣 Tools ${tools}% | 🟢 Chat ${chat}% | 🟡 Sys ${sys}% | ⚪ Libre ${free}% ]`;
  return bar.length > maxWidth ? `[ 🟣 ${tools}% | 🟢 ${chat}% | 🟡 ${sys}% | ⚪ ${free}% ]` : bar;
}

/**
 * Formatea un informe visual limpio en texto para el comando /lens status.
 */
export function formatContextStatusReport(breakdown: ContextBreakdown): string {
  const lines: string[] = [];
  lines.push("\n🔍 GENTLE CONTEXT LENS — CABINA DE MANDO");
  lines.push("========================================");
  lines.push(`Semáforo: ${renderTrafficLightBadge(breakdown)}`);
  lines.push(`Uso total: ${breakdown.totalUsed.toLocaleString()} / ${breakdown.contextWindow.toLocaleString()} tokens (${breakdown.usedPercent}%)`);
  lines.push(`Espacio libre restante: ${breakdown.remainingTokens.toLocaleString()} tokens`);
  lines.push("\nDesglose de Memoria:");

  for (const s of breakdown.segments) {
    const barBlocks = "█".repeat(Math.max(1, Math.round(s.percent / 5)));
    lines.push(`  ${s.label.padEnd(24)} ${barBlocks.padEnd(20)} ${s.tokens.toLocaleString()} tokens (${s.percent}%)`);
  }

  lines.push("========================================");
  if (breakdown.trafficStatus === "red") {
    lines.push("⚠️ ALERTA: La compactación ocurrirá pronto. Ejecuta '/lens prune' para podar salidas antiguas.");
  } else if (breakdown.trafficStatus === "yellow") {
    lines.push("💡 Consejo: Las herramientas o reglas ocupan bastante espacio. Usa '/lens roi' para auditar.");
  } else {
    lines.push("✓ Contexto saludable. Flujo óptimo.");
  }

  return lines.join("\n");
}
