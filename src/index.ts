import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { calculateContextBreakdown, calculateToolRois, recordToolInvocation } from "./telemetry-engine.js";
import { renderTrafficLightBadge, renderSidebarMiniWidget, formatContextStatusReport } from "./hud-renderer.js";
import { scanPrunableTargets, executePruning } from "./pruner-engine.js";
import { formatInjectionsReport } from "./injections-inspector.js";
import { getScannerLensPayload } from "./scanner-hook.js";

export default function activate(api: ExtensionAPI): void {
  // 1. Rastreo pasivo de invocación de herramientas para calcular el ROI
  api.on("tool_call" as any, (event: any) => {
    const toolName = event?.toolName || event?.name;
    if (toolName) {
      recordToolInvocation(toolName);
    }
  });

  // 2. Registro del comando principal /lens
  api.registerCommand("lens", {
    description: "Gentle Context Lens: Cabina de mando y optimizador de contexto (/lens status, /lens roi, /lens prune, /lens injections)",
    handler: async (args: string, ctx: ExtensionContext) => {
      const sub = args.trim().toLowerCase();

      // /lens roi -> Auditoría de retorno de inversión por herramienta
      if (sub === "roi") {
        const rois = calculateToolRois(ctx);
        const lines: string[] = [];
        lines.push("\n📊 RETORNO DE INVERSIÓN POR HERRAMIENTA (Tool ROI)");
        lines.push("====================================================");
        for (const r of rois.slice(0, 12)) {
          const badge = r.status === "HIGH_ROI" ? "🟢 ALTO ROI" : r.status === "BALANCED" ? "🟡 EQUILIBRADO" : "🔴 DRENAJE (0 usos)";
          lines.push(`${r.name.padEnd(24)} Costo: ~${r.tokenCost}t | Usos: ${r.invocations} | Score: ${r.roiScore} [${badge}]`);
        }
        lines.push("====================================================");
        lines.push("💡 Las herramientas marcadas como DRENAJE consumen tokens en cada turno sin ser llamadas.");
        ctx.ui?.notify(lines.join("\n"), "info");
        return;
      }

      // /lens prune -> Poda quirúrgica de salidas y logs viejos
      if (sub === "prune") {
        const targets = scanPrunableTargets(ctx);
        if (targets.length === 0) {
          ctx.ui?.notify("No se encontraron salidas antiguas o pesadas para podar en este momento.", "info");
          return;
        }

        const result = executePruning(ctx, targets);
        const report = `✂️ PODA QUIRÚRGICA COMPLETADA:\n• Bloques comprimidos: ${result.itemsPrunedCount}\n• Tokens recuperados: ~${result.tokensReclaimed.toLocaleString()}\n• Estado: Conversación preservada sin forzar compactación.`;
        ctx.ui?.notify(report, "info");
        return;
      }

      // /lens injections -> Explicación transparente de lo inyectado
      if (sub === "injections") {
        const report = formatInjectionsReport(ctx);
        ctx.ui?.notify(report, "info");
        return;
      }

      // /lens o /lens status -> Reporte general
      const breakdown = calculateContextBreakdown(ctx);
      const report = formatContextStatusReport(breakdown);
      ctx.ui?.notify(report, breakdown.trafficStatus === "red" ? "warning" : "info");
    }
  });

  // 3. Exposición de API abierta para TelarDev y scanner-working-chat
  (globalThis as any).__GENTLE_CONTEXT_LENS__ = {
    getBreakdown: (ctx: ExtensionContext) => calculateContextBreakdown(ctx),
    getMiniWidget: (ctx: ExtensionContext) => renderSidebarMiniWidget(calculateContextBreakdown(ctx)),
    getBadge: (ctx: ExtensionContext) => renderTrafficLightBadge(calculateContextBreakdown(ctx)),
    getScannerPayload: (ctx: ExtensionContext) => getScannerLensPayload(ctx),
    pruneSafe: (ctx: ExtensionContext) => executePruning(ctx)
  };
}
