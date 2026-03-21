import type { GroupStyle } from "./types";

export type ThemePreset = {
  id: string;
  name: string;
  style: GroupStyle;
};

export const GROUP_THEME_PRESETS: ThemePreset[] = [
  {
    id: "catppuccin-latte",
    name: "Catppuccin Latte",
    style: {
      cardColor: "#eff1f5",
      tileColor: "#ccd0da",
      textColor: "#4c4f69",
    },
  },
  {
    id: "catppuccin-mocha",
    name: "Catppuccin Mocha",
    style: {
      cardColor: "#1e1e2e",
      tileColor: "#313244",
      textColor: "#cdd6f4",
    },
  },
  {
    id: "nord",
    name: "Nord",
    style: {
      cardColor: "#2e3440",
      tileColor: "#3b4252",
      textColor: "#eceff4",
    },
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    style: {
      cardColor: "#1a1b26",
      tileColor: "#24283b",
      textColor: "#c0caf5",
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    style: {
      cardColor: "#282a36",
      tileColor: "#44475a",
      textColor: "#f8f8f2",
    },
  },
  {
    id: "rose-pine",
    name: "Rose Pine",
    style: {
      cardColor: "#191724",
      tileColor: "#26233a",
      textColor: "#e0def4",
    },
  },
  {
    id: "gruvbox-dark",
    name: "Gruvbox Dark",
    style: {
      cardColor: "#282828",
      tileColor: "#3c3836",
      textColor: "#ebdbb2",
    },
  },
  {
    id: "everforest-dark",
    name: "Everforest Dark",
    style: {
      cardColor: "#2d353b",
      tileColor: "#374247",
      textColor: "#d3c6aa",
    },
  },
  {
    id: "solarized-light",
    name: "Solarized Light",
    style: {
      cardColor: "#fdf6e3",
      tileColor: "#eee8d5",
      textColor: "#586e75",
    },
  },
];

export function findThemePreset(style: GroupStyle) {
  return GROUP_THEME_PRESETS.find(
    (preset) =>
      preset.style.cardColor === style.cardColor &&
      preset.style.tileColor === style.tileColor &&
      preset.style.textColor === style.textColor,
  );
}
