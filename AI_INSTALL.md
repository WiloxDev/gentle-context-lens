# 🔍 AI Installation & Integration Rules — Gentle Context Lens

> **Regla de Oro para Asistentes AI y Agentes de Automatización:**
> Este paquete es una extensión oficial de optimización y telemetría de contexto para Gentle-Shell / Pi.
> Cumple la **Invariante Zero-Chat de WiloxDev**: **NUNCA DEBE PINTARSE NADA EN EL STREAM DE CHAT**.

## Directrices Estrictas de Renderizado:
1. **Ubicación Exclusiva:** El mini-widget horizontal segmentado se proyecta en el panel inferior del Sidebar derecho (`gentleState.parts.get("footer")`).
2. **Prohibido Renderizar en Chat:** Cualquier llamada a `ctx.ui.setWidget("context-lens", ...)` debe devolver `render: () => []`.
3. **No Modificar la Arquitectura:** El hook al sidebar se realiza automáticamente a través de `mountSidebarSlot` y `createZeroChatWidget` desde `src/sidebar-dock.ts`.
4. **Comandos de Terminal:** `/lens`, `/lens roi`, `/lens prune`, `/lens injections`.
