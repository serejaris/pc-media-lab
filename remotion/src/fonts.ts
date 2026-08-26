import { loadFont } from "@remotion/google-fonts/Inter";

// Канон типографики: Factory substitute (Geist нет кириллицы на GF) — Inter 400/500, cyrillic обязателен.
const { fontFamily } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin", "cyrillic"],
});

export const fontSans = fontFamily;
