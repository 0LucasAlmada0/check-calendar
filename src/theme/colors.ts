export type ThemeMode = "light" | "dark";

export type AppTheme = {
  mode: ThemeMode;
  colors: {
    primary: string;
    primarySoft: string;
    primaryMuted: string;
    background: string;
    backgroundTop: string;
    backgroundBottom: string;
    surface: string;
    surfaceAlt: string;
    surfaceSoft: string;
    border: string;
    borderStrong: string;
    text: string;
    textMuted: string;
    textOnPrimary: string;
    disabledText: string;
    success: string;
    successText: string;
    shadow: string;
    orbPrimary: string;
    orbSecondary: string;
    calendarBackground: string;
    inputBackground: string;
    emojiBadgeBackground: string;
  };
};

export const themes: Record<ThemeMode, AppTheme> = {
  light: {
    mode: "light",
    colors: {
      primary: "#2563eb",
      primarySoft: "#dbeafe",
      primaryMuted: "#93c5fd",
      background: "#ffffff",
      backgroundTop: "#eaf3ff",
      backgroundBottom: "#ffffff",
      surface: "#ffffff",
      surfaceAlt: "#f8fbff",
      surfaceSoft: "#dbeafe",
      border: "#bfdbfe",
      borderStrong: "#93c5fd",
      text: "#1e3a8a",
      textMuted: "#64748b",
      textOnPrimary: "#ffffff",
      disabledText: "#cbd5e1",
      success: "#86efac",
      successText: "#065f46",
      shadow: "#000000",
      orbPrimary: "rgba(37, 99, 235, 0.08)",
      orbSecondary: "rgba(147, 197, 253, 0.08)",
      calendarBackground: "#ffffff",
      inputBackground: "#f8fbff",
      emojiBadgeBackground: "",
    },
  },
  dark: {
    mode: "dark",
    colors: {
      primary: "#60a5fa",
      primarySoft: "#172554",
      primaryMuted: "#93c5fd",
      background: "#08111f",
      backgroundTop: "#0f1f36",
      backgroundBottom: "#08111f",
      surface: "#101827",
      surfaceAlt: "#142033",
      surfaceSoft: "#172554",
      border: "#244166",
      borderStrong: "#3b82f6",
      text: "#dbeafe",
      textMuted: "#94a3b8",
      textOnPrimary: "#07111f",
      disabledText: "#475569",
      success: "#4ade80",
      successText: "#052e16",
      shadow: "#000000",
      orbPrimary: "rgba(96, 165, 250, 0.12)",
      orbSecondary: "rgba(59, 130, 246, 0.1)",
      calendarBackground: "#101827",
      inputBackground: "#0f1a2c",
      emojiBadgeBackground: "#f8fbff",
    },
  },
};
