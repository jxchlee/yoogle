export const LOGO_THEMES = {
  classic: ["#4285f4", "#ea4335", "#fbbc05", "#4285f4", "#34a853", "#ea4335"],
  ink: ["#202124", "#202124", "#202124", "#202124", "#202124", "#202124"],
  graphite: ["#111827", "#374151", "#6b7280", "#111827", "#4b5563", "#1f2937"],
  aurora: ["#0f766e", "#155e75", "#a16207", "#1d4ed8", "#0f766e", "#9d174d"],
} as const;

export const LOGO_THEME_COOKIE = "vtid";

export type LogoTheme = keyof typeof LOGO_THEMES;

export function pickLogoTheme(): LogoTheme {
  const roll = Math.random();

  if (roll < 0.82) {
    return "classic";
  }

  if (roll < 0.92) {
    return "ink";
  }

  if (roll < 0.97) {
    return "graphite";
  }

  return "aurora";
}

export function isLogoTheme(value: string | undefined | null): value is LogoTheme {
  if (!value) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(LOGO_THEMES, value);
}
