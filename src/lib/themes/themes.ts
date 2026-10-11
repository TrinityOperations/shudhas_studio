/**
 * Seasonal themes (PW-90, PW-91, OD-35). A theme changes only `--brand-accent` on public pages
 * (primary buttons, the seasonal banner, the footer, chips when on, the focus ring); `--mark`
 * stays sindoor and no theme brings its own hero image. Adding or removing a season is one
 * entry here: the validator, the picker and the resolver all read this list. The list is a
 * placeholder until the client confirms her seasons (docs/DECISIONS.md).
 */

export type ThemeId =
  "everyday" | "eid" | "pohela-boishakh" | "wedding" | "christmas" | "mothers-day" | "valentines";

/** Suggested seasonal banner copy; the owner applies it with one click, never automatically. */
export type ThemeBannerText = {
  label: string;
  labelBn: string;
  headline: string;
  headlineBn: string;
};

export type Theme = {
  id: ThemeId;
  /** Hex accent, upper case, `#RRGGBB`. */
  accent: string;
  banner?: ThemeBannerText;
};

export const DEFAULT_THEME_ID: ThemeId = "everyday";

export const THEMES: readonly Theme[] = [
  { id: "everyday", accent: "#1E4A3A" },
  {
    id: "eid",
    accent: "#2D4356",
    banner: {
      label: "Eid collection",
      labelBn: "ঈদ কালেকশন",
      headline: "Order early for Eid gifts. Consultations fill up in the last two weeks.",
      headlineBn: "ঈদের উপহার আগেভাগে অর্ডার করুন। শেষ দুই সপ্তাহে পরামর্শের সময় পাওয়া কঠিন।",
    },
  },
  {
    id: "pohela-boishakh",
    accent: "#9A2B22",
    banner: {
      label: "Pohela Boishakh",
      labelBn: "পহেলা বৈশাখ",
      headline: "Welcome the Bengali New Year with a gift made just for them.",
      headlineBn: "বাংলা নববর্ষে প্রিয়জনকে দিন শুধু তাঁর জন্য বানানো উপহার।",
    },
  },
  {
    id: "wedding",
    accent: "#5B3F4E",
    banner: {
      label: "Wedding season",
      labelBn: "বিয়ের মৌসুম",
      headline: "Nameplates, hampers and keepsakes for the couple. Book early for a wedding date.",
      headlineBn: "নবদম্পতির জন্য নেমপ্লেট, হ্যাম্পার ও স্মারক। বিয়ের তারিখের জন্য আগে বুক করুন।",
    },
  },
  {
    id: "christmas",
    accent: "#6E2B2B",
    banner: {
      label: "Christmas and New Year",
      labelBn: "বড়দিন ও ইংরেজি নববর্ষ",
      headline: "Personalised gifts for Christmas and the New Year. Order by early December.",
      headlineBn: "বড়দিন ও নববর্ষের জন্য ব্যক্তিগত উপহার। ডিসেম্বরের শুরুতেই অর্ডার করুন।",
    },
  },
  {
    id: "mothers-day",
    accent: "#6B4A5E",
    banner: {
      label: "Mother's Day",
      labelBn: "মা দিবস",
      headline: "A gift with her name on it. Order early for Mother's Day.",
      headlineBn: "মায়ের নাম লেখা একটি উপহার। মা দিবসের জন্য আগেভাগে অর্ডার করুন।",
    },
  },
  {
    id: "valentines",
    accent: "#8A2E45",
    banner: {
      label: "Valentine's Day",
      labelBn: "ভ্যালেন্টাইনস ডে",
      headline: "Say it with something made just for them. Order early for 14 February.",
      headlineBn:
        "শুধু তাঁর জন্য বানানো কিছু দিয়ে মনের কথা বলুন। ১৪ ফেব্রুয়ারির জন্য আগে অর্ডার করুন।",
    },
  },
];

export const THEME_IDS = THEMES.map((theme) => theme.id) as [ThemeId, ...ThemeId[]];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEME_IDS as readonly string[]).includes(value);
}

/** The theme with this id, or the everyday theme for anything unknown. */
export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

/** Set by src/proxy.ts when the URL carries `?theme=`; honoured only for the signed-in owner. */
export const THEME_PREVIEW_HEADER = "x-theme";
/** The query parameter that previews a theme for one request. */
export const THEME_PREVIEW_PARAM = "theme";
