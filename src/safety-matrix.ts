import type { PruneRiskLevel, PrunableTarget } from "./types.js";

/**
 * Matriz de Clasificación de Seguridad:
 * - IMMUTABLE: Nunca se toca (System Prompt, AGENTS.md, último mensaje del usuario).
 * - CAUTION: Requiere confirmación (herramientas sin uso).
 * - SAFE: Completamente seguro de podar (salidas de bash/diffs de turnos anteriores).
 */
export function classifyEntryRisk(
  role: string,
  contentStr: string,
  turnIndex: number,
  totalTurns: number
): { risk: PruneRiskLevel; reason: string } {
  // Últimos 2 turnos siempre son inmutables para no perder el hilo activo
  if (turnIndex >= totalTurns - 2) {
    return {
      risk: "IMMUTABLE",
      reason: "Turno activo reciente en curso."
    };
  }

  // System prompts y reglas son inmutables
  if (role === "system") {
    return {
      risk: "IMMUTABLE",
      reason: "Instrucciones base del sistema y reglas de proyecto."
    };
  }

  // Mensajes de usuario
  if (role === "user") {
    return {
      risk: "IMMUTABLE",
      reason: "Mensaje explícito del usuario."
    };
  }

  // Salidas de herramientas antiguas que superen los 1,000 caracteres (aprox 250 tokens)
  if (role === "tool" || role === "tool_result") {
    if (contentStr.length > 800) {
      return {
        risk: "SAFE",
        reason: "Salida extensa de herramienta en turno pasado (log, diff o compilación superada)."
      };
    }
  }

  return {
    risk: "CAUTION",
    reason: "Mensaje intermedio del asistente."
  };
}

export function isSafeToPrune(target: PrunableTarget): boolean {
  return target.risk === "SAFE";
}
