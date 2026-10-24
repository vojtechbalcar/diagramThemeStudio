/** Additional Mermaid variables reuse mapped roles; they introduce no saved roles. */
import type { Role } from "@/lib/model";

export type DiagramThemeVariables = Partial<Record<
  `cScale${number}` | `cScaleLabel${number}` | `pie${number}` | "pieSectionTextColor" | "pieTitleTextColor" | "pieLegendTextColor" | "pieStrokeColor" | "pieOuterStrokeColor",
  string
>>;

export function diagramTheme(roles: Partial<Record<Role, string>>): DiagramThemeVariables {
  const variables: DiagramThemeVariables = {};
  const fills = [roles.primaryColor, roles.secondaryColor, roles.tertiaryColor].filter((fill): fill is string => Boolean(fill));
  // A full palette uses only mapped fills. With none mapped, Mermaid derives it.
  for (let i = 0; i < 12; i++) {
    if (fills.length) {
      variables[`pie${i + 1}`] = fills[i % fills.length];
      variables[`cScale${i}`] = fills[i % fills.length];
    }
    if (roles.primaryTextColor) variables[`cScaleLabel${i}`] = roles.primaryTextColor;
  }
  if (roles.primaryTextColor) {
    variables.pieSectionTextColor = roles.primaryTextColor;
    variables.pieTitleTextColor = roles.primaryTextColor;
    variables.pieLegendTextColor = roles.primaryTextColor;
  }
  if (roles.primaryBorderColor) {
    variables.pieStrokeColor = roles.primaryBorderColor;
    variables.pieOuterStrokeColor = roles.primaryBorderColor;
  }
  return variables;
}
