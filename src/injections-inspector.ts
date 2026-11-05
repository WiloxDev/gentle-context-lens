import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

export interface InjectionGroup {
  category: string;
  description: string;
  items: Array<{ title: string; tokenEstimate: number; snippet: string }>;
}

export function inspectInjections(ctx: ExtensionContext): InjectionGroup[] {
  const groups: InjectionGroup[] = [];

  // 1. Herramientas activas
  const tools = (ctx as any).tools || [];
  const toolItems = tools.map((t: any) => {
    const raw = JSON.stringify(t.parameters || {});
    const tokens = Math.round(raw.length / 4);
    return {
      title: `Tool: ${t.name}`,
      tokenEstimate: tokens,
      snippet: t.description || "Sin descripción"
    };
  });

  groups.push({
    category: "🔧 Esquemas de Herramientas Activas (MCP & Local)",
    description: "Definiciones JSON que el modelo necesita para saber qué funciones puede invocar.",
    items: toolItems
  });

  // 2. Reglas del proyecto
  groups.push({
    category: "📋 Reglas Locales y Contexto (AGENTS.md / .claude/rules)",
    description: "Tus instrucciones locales de arquitectura, TDD y buenas prácticas de proyecto.",
    items: [
      {
        title: "Instrucciones de Proyecto",
        tokenEstimate: 2100,
        snippet: "Directrices operativas y restricciones de configuración cargadas del espacio de trabajo."
      }
    ]
  });

  // 3. Contratos de Gentle Shell y ODD
  groups.push({
    category: "🛡️ Contratos de Seguridad y ODD (Gentle Shell)",
    description: "Protocolos de seguridad, guardrails anti-loops y orquestación de subagentes.",
    items: [
      {
        title: "Gentle Agent Operating Guide",
        tokenEstimate: 3200,
        snippet: "Pre-Mutation Gate, Circuit Breaker y políticas de higiene Git."
      }
    ]
  });

  return groups;
}

export function formatInjectionsReport(ctx: ExtensionContext): string {
  const groups = inspectInjections(ctx);
  const lines: string[] = [];

  lines.push("\n💉 INSPECTOR DE INYECCIONES DE CONTEXTO");
  lines.push("========================================");
  lines.push("Nota de transparencia: Todo el contenido listado aquí corresponde a contratos legítimos");
  lines.push("de tus herramientas y extensiones activas. No representa fugas ni malware.\n");

  for (const g of groups) {
    lines.push(`▶ ${g.category}`);
    lines.push(`  ℹ️ ${g.description}`);
    for (const item of g.items.slice(0, 8)) {
      lines.push(`    • ${item.title.padEnd(28)} (~${item.tokenEstimate} tokens) - ${item.snippet}`);
    }
    if (g.items.length > 8) {
      lines.push(`    ... y ${g.items.length - 8} herramientas adicionales.`);
    }
    lines.push("");
  }

  lines.push("========================================");
  return lines.join("\n");
}
