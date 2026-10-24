/** Browser-only. Load this module with import() inside a client effect. */
import mermaid from "mermaid";
import { createBatchRenderer } from "./batch";

export const renderBatch = createBatchRenderer({
  initialize(config) {
    mermaid.initialize({ ...config, suppressErrorRendering: true });
  },
  getThemeVariables() {
    // Mermaid exposes no public resolved-theme getter. Keep this internal API
    // dependency confined here and cover it with real-browser integration tests.
    const variables: unknown = mermaid.mermaidAPI.getConfig().themeVariables;
    return variables;
  },
  async render(id, source) {
    const container = document.createElement("div");
    container.style.cssText = "position:absolute;left:-10000px;top:0;width:1024px;visibility:hidden;pointer-events:none";
    container.setAttribute("aria-hidden", "true");
    document.body.append(container);
    try {
      return await mermaid.render(id, source, container);
    } finally {
      container.remove();
    }
  },
});
