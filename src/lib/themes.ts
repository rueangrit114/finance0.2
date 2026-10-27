// สร้างธีม 150 แบบ = 30 โทนสี x 5 สไตล์ (คำนวณจาก HSL ไม่ต้องเก็บตารางยาว)
export interface Theme {
  id: string;
  name: string;
  vars: Record<string, string>;
  swatch: [string, string, string];
}

const HUES: [string, number][] = [
  ["Teal", 178], ["Ocean", 205], ["Sky", 195], ["Azure", 215], ["Cobalt", 225],
  ["Indigo", 245], ["Violet", 262], ["Grape", 280], ["Orchid", 295], ["Magenta", 315],
  ["Rose", 335], ["Raspberry", 345], ["Crimson", 355], ["Coral", 8], ["Tangerine", 22],
  ["Amber", 38], ["Gold", 48], ["Lemon", 58], ["Lime", 80], ["Spring", 100],
  ["Fern", 125], ["Emerald", 150], ["Jade", 163], ["Mint", 170], ["Aqua", 186],
  ["Peacock", 190], ["Lagoon", 200], ["Twilight", 255], ["Sunset", 15], ["Peach", 28],
];

const STYLES = ["Dark", "Midnight Glow", "Light", "Pastel Gradient", "Vivid Gradient"] as const;

const hsl = (h: number, s: number, l: number) => `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`;

function build(name: string, h: number, style: (typeof STYLES)[number]): Theme {
  const a1 = hsl(h, 75, 55);        // accent
  const a2 = hsl(h + 40, 80, 60);   // accent 2 (analogous)
  let v: Record<string, string>;
  switch (style) {
    case "Dark":
      v = {
        "--bg": `linear-gradient(160deg, ${hsl(h, 45, 12)}, ${hsl(h, 50, 18)})`,
        "--surface": hsl(h, 35, 16), "--surface2": hsl(h, 35, 21),
        "--text": hsl(h, 20, 94), "--muted": hsl(h, 15, 66), "--border": hsl(h, 30, 28),
        "--accent": a1, "--accent2": a2, "--on-accent": hsl(h, 50, 8),
      };
      break;
    case "Midnight Glow":
      v = {
        "--bg": `radial-gradient(120% 90% at 20% 0%, ${hsl(h, 70, 24)} 0%, ${hsl(h + 30, 55, 9)} 70%)`,
        "--surface": `hsl(${h} 50% 14% / .72)`, "--surface2": `hsl(${h} 55% 22% / .75)`,
        "--text": hsl(h, 30, 96), "--muted": hsl(h, 25, 72), "--border": hsl(h, 55, 34),
        "--accent": hsl(h + 15, 95, 65), "--accent2": hsl(h + 70, 95, 68), "--on-accent": hsl(h, 60, 8),
      };
      break;
    case "Light":
      v = {
        "--bg": hsl(h, 40, 96),
        "--surface": "#ffffff", "--surface2": hsl(h, 45, 93),
        "--text": hsl(h, 40, 14), "--muted": hsl(h, 15, 40), "--border": hsl(h, 35, 84),
        "--accent": hsl(h, 80, 40), "--accent2": hsl(h + 40, 80, 45), "--on-accent": "#ffffff",
      };
      break;
    case "Pastel Gradient":
      v = {
        "--bg": `linear-gradient(135deg, ${hsl(h, 90, 90)}, ${hsl(h + 50, 85, 90)} 55%, ${hsl(h + 100, 85, 92)})`,
        "--surface": "rgba(255,255,255,.78)", "--surface2": hsl(h, 70, 93),
        "--text": hsl(h, 45, 16), "--muted": hsl(h, 18, 40), "--border": hsl(h, 50, 82),
        "--accent": hsl(h, 70, 46), "--accent2": hsl(h + 50, 75, 52), "--on-accent": "#ffffff",
      };
      break;
    default: // Vivid Gradient
      v = {
        "--bg": `linear-gradient(135deg, ${hsl(h, 85, 45)}, ${hsl(h + 60, 85, 42)} 60%, ${hsl(h + 120, 80, 40)})`,
        "--surface": "rgba(255,255,255,.16)", "--surface2": "rgba(255,255,255,.26)",
        "--text": "#ffffff", "--muted": "rgba(255,255,255,.8)", "--border": "rgba(255,255,255,.32)",
        "--accent": hsl(h + 175, 100, 78), "--accent2": hsl(h + 55, 100, 78), "--on-accent": hsl(h, 70, 12),
      };
  }
  const swatch: [string, string, string] =
    style === "Light" || style === "Pastel Gradient"
      ? [hsl(h, 90, 88), hsl(h + 50, 80, 80), v["--accent"]]
      : [hsl(h, 55, 14), v["--accent"], v["--accent2"]];
  return {
    id: `${name}-${style}`.toLowerCase().replace(/\s+/g, "-"),
    name: `${name} ${style}`,
    vars: v,
    swatch,
  };
}

export const THEMES: Theme[] = HUES.flatMap(([name, h]) => STYLES.map((s) => build(name, h, s)));
export const DEFAULT_THEME_ID = "teal-dark";
export const themeById = (id: string | null | undefined) =>
  THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;
