/**
 * Lint rules that enforce design.md in code.
 *
 * - class-names: in className attributes and cn() calls, rejects utilities the
 *   manual prohibits (radius, shadows, rings, blurs, gradients, Tailwind's
 *   default palette) and spacing values off the §1.1 scale. Off-scale spacing
 *   classes generate no CSS at all, so without this they fail silently.
 * - no-hex: no hex colour literals in components (CLAUDE.md, code conventions).
 */

const SPACING_SCALE = new Set(["0", "1", "2", "3", "4", "6", "8", "12", "16", "24"]);

const SPACING =
  /^(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|w|h|min-w|min-h|max-w|max-h|size|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|bottom|left|right|start|end|translate-x|translate-y|scroll-m[tblrxy]?|scroll-p[tblrxy]?|basis|leading)-(\d+(?:\.\d+)?)$/;

const DEFAULT_PALETTE =
  /^(?:bg|text|border(?:-[trblxyse])?|fill|stroke|outline|decoration|divide|ring|from|via|to|accent|caret|placeholder|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}$/;

const PROHIBITED = [
  { pattern: /^rounded(?:-(?!full$|none$)\S+)?$/, reason: "corner radius is 0 everywhere; only bullets use rounded-full (§1.5)" },
  { pattern: /^(?:shadow|inset-shadow|drop-shadow|text-shadow)(?:-\S+)?$/, reason: "no shadows anywhere (§1.5)" },
  { pattern: /^(?:ring|inset-ring|ring-offset)(?:-\S+)?$/, reason: "rings are box-shadows; focus uses the outline ring (§1.2.6)" },
  { pattern: /^(?:blur|backdrop-\S+)(?:-\S+)?$/, reason: "no blurs or glass (§8)" },
  { pattern: /^bg-(?:gradient|linear|radial|conic)(?:-\S+)?$/, reason: "no gradients (§8)" },
];

const HEX = /(?<![&\w])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/i;

function utilityOf(token) {
  // Drop variants (hover:, md:, has-[…]:) and the important / negative markers.
  let depth = 0;
  let start = 0;
  for (let i = 0; i < token.length; i++) {
    const ch = token[i];
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth--;
    else if (ch === ":" && depth === 0) start = i + 1;
  }
  return token.slice(start).replace(/^!/, "").replace(/!$/, "").replace(/^-/, "");
}

function problemWith(utility) {
  const spacing = SPACING.exec(utility);
  if (spacing && !SPACING_SCALE.has(spacing[1])) {
    return `"${utility}" is off the spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 96) and generates no CSS. Use a scale value or an arbitrary length for layout sizes.`;
  }
  if (DEFAULT_PALETTE.test(utility)) {
    return `"${utility}" is Tailwind's default palette. Use the semantic colours (ink, page, muted, rule…).`;
  }
  for (const { pattern, reason } of PROHIBITED) {
    if (pattern.test(utility)) return `"${utility}" is not allowed: ${reason}.`;
  }
  return null;
}

function inClassContext(context, node) {
  return context.sourceCode.getAncestors(node).some(
    (ancestor) =>
      (ancestor.type === "JSXAttribute" && ancestor.name.name === "className") ||
      (ancestor.type === "CallExpression" && ancestor.callee.type === "Identifier" && ancestor.callee.name === "cn"),
  );
}

const classNames = {
  meta: {
    type: "problem",
    docs: { description: "Only utilities the Linework manual allows." },
    schema: [],
  },
  create(context) {
    const check = (node, text) => {
      if (typeof text !== "string" || !inClassContext(context, node)) return;
      for (const token of text.split(/\s+/)) {
        if (!token) continue;
        const message = problemWith(utilityOf(token));
        if (message) context.report({ node, message });
      }
    };
    return {
      Literal: (node) => check(node, node.value),
      TemplateElement: (node) => check(node, node.value.cooked),
    };
  },
};

const noHex = {
  meta: {
    type: "problem",
    docs: { description: "No hex colour literals in components; use tokens." },
    schema: [],
  },
  create(context) {
    const check = (node, text) => {
      if (typeof text === "string" && HEX.test(text)) {
        context.report({
          node,
          message: "Hex colour in a component. Use a semantic token (bg-ink, text-muted…) or pass the colour in as data.",
        });
      }
    };
    return {
      Literal: (node) => check(node, node.value),
      TemplateElement: (node) => check(node, node.value.cooked),
      JSXText: (node) => check(node, node.value),
    };
  },
};

const plugin = {
  meta: { name: "linework" },
  rules: { "class-names": classNames, "no-hex": noHex },
};

export default plugin;
