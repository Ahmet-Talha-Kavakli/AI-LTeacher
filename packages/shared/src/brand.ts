export const BRAND = {
  name: "Suno",
  tagline: "Konuş, gül, öğren.",
  primaryFont: "Sora",
} as const;

// Mercan + krem paleti. Sıcak, davetkar, oyunsu ama çocuksu değil.
// Duolingo-yeşili ve Praktika-mor klişelerinden uzak duruyoruz.
export const COLORS = {
  light: {
    background: "#FFFBF5",      // sıcak fildişi
    surface: "#FFF1E6",         // krem
    text: "#1A0F0F",            // sıcak siyah (saf siyah değil)
    textSecondary: "#6B5B5B",   // sıcak nötr
    border: "#F3E2D2",          // krem-bej
    accent: "#FF5A5F",          // mercan (marka rengi)
    accentSoft: "#FFE3E4",      // soluk mercan
    success: "#2DA86B",          // sıcak yeşil
    warning: "#E89B2B",          // amber
    error: "#D6453F",            // koyu mercan-kırmızı
    streak: "#FF8042",          // turuncu (mercanın komşusu)
    xp: "#F2B33C",              // bal sarısı
  },
  dark: {
    background: "#150C0C",      // sıcak deep maroon-black
    surface: "#211717",         // bir ton açık
    text: "#FFF7ED",            // krem
    textSecondary: "#B8A5A5",   // sıcak gri
    border: "#3A2A2A",
    accent: "#FF7A7E",          // mercan, biraz açık (kontrast için)
    accentSoft: "#3A1F22",      // koyu mercan
    success: "#4ADE80",
    warning: "#F2B33C",
    error: "#FF6B6B",
    streak: "#FF9F5C",
    xp: "#FFD66B",
  },
} as const;

export type ThemeMode = keyof typeof COLORS;
export type ColorToken = keyof (typeof COLORS)["light"];
