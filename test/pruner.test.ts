import test from "node:test";
import assert from "node:assert/strict";
import { classifyEntryRisk } from "../src/safety-matrix.ts";
import { renderTrafficLightBadge } from "../src/hud-renderer.ts";

test("classifyEntryRisk protege turnos recientes y system prompts", () => {
  const systemCheck = classifyEntryRisk("system", "Eres un asistente...", 0, 10);
  assert.equal(systemCheck.risk, "IMMUTABLE");

  const userCheck = classifyEntryRisk("user", "Por favor ayuda...", 1, 10);
  assert.equal(userCheck.risk, "IMMUTABLE");

  const recentCheck = classifyEntryRisk("tool", "x".repeat(2000), 9, 10);
  assert.equal(recentCheck.risk, "IMMUTABLE");
});

test("classifyEntryRisk marca salidas pesadas antiguas como SAFE", () => {
  const safeCheck = classifyEntryRisk("tool", "npm build log output... ".repeat(100), 2, 10);
  assert.equal(safeCheck.risk, "SAFE");
});

test("renderTrafficLightBadge emite colores correctos según la presión", () => {
  const green = renderTrafficLightBadge({
    usedPercent: 35,
    trafficStatus: "green",
    totalUsed: 35000,
    contextWindow: 100000,
    remainingTokens: 65000,
    segments: [],
    timestamp: Date.now()
  });
  assert.match(green, /🟢/);

  const red = renderTrafficLightBadge({
    usedPercent: 82,
    trafficStatus: "red",
    totalUsed: 82000,
    contextWindow: 100000,
    remainingTokens: 18000,
    segments: [],
    timestamp: Date.now()
  });
  assert.match(red, /🔴/);
});
