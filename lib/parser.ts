export type MovementItem = {
  block?: string;
  exercise: string;
  dose?: string;
  family: string;
  equipment: string[];
};

const FAMILY_REGEX: [string, RegExp][] = [
  ["burpee", /\bburpee\b/],
  ["pull", /\b(pull[- ]?up|chin[- ]?up|muscle[- ]?up|ring row|rope climb)\b/],
  ["press", /\b(hspu|handstand push|press|push press|jerk|strict press|shoulder press|dip)\b/],
  ["squat", /\b(squat|thruster|wall ?ball)\b/],
  ["hinge", /\b(deadlift|kb swing|kettlebell swing|good[- ]?morning|hip thrust|sdhp)\b/],
  ["lunge", /\b(lunge|step[- ]?up)\b/],
  ["jump", /\b(box jump|broad jump|jumping)\b/],
  ["core", /\b(sit[- ]?up|v[- ]?up|t2b|toes[- ]?to[- ]?bar|ghd|hollow|plank|knee raise)\b/],
  ["mono", /\b(run|row|bike|ski|echo|assault|airdyne|shuttle)\b/]
];

const EQUIP_HINTS: [string, RegExp][] = [
  ["barbell", /\b(barbell|clean|snatch|jerk|thruster|front squat|back squat|ohs|overhead squat|shoulder to overhead|s2o)\b/],
  ["dumbbell", /\b(db|dumbbell)\b/],
  ["kettlebell", /\b(kb|kettlebell)\b/],
  ["rings", /\brings?\b/],
  ["pullup_bar", /\bpull[- ]?up\b/],
  ["rope", /\b(double[- ]?under|single[- ]?under|jump rope|du\b|su\b)\b/],
  ["rower", /\b(row|rower)\b/],
  ["bike", /\b(bike|echo|assault|airdyne)\b/],
  ["ski", /\bski\b/],
  ["box", /\bbox\b/],
  ["wall_ball", /\bwall ?ball\b/],
  ["sandbag", /\bsandbag\b/]
];

const TITLE_TYPES: [string, RegExp][] = [
  ["amrap", /\bamrap\b/],
  ["for_time", /\bfor time\b/],
  ["emom", /\bemom\b/],
  ["interval", /\btabata|interval\b/],
  ["chipper", /\bchipper\b/]
];

export function parseWodText(text: string) {
  const lower = text.toLowerCase();
  const type = TITLE_TYPES.find(([_, r]) => r.test(lower))?.[0] || "unknown";

  const lines = lower
    .replace(/[^\x20-\x7E\n]/g, " ")
    .split(/\n|\.|;|\r|\t/)
    .map(s=>s.trim())
    .filter(Boolean)
    .slice(0, 40);

  const items: MovementItem[] = [];
  let currentBlock = type === "unknown" ? undefined : type.toUpperCase();

  for (const ln of lines) {
    if (/amrap|for time|emom|every minute|interval|tabata|rounds/.test(ln)) {
      currentBlock = ln.toUpperCase();
      continue;
    }
    const fam = FAMILY_REGEX.find(([_, r])=> r.test(ln))?.[0] || guessFamilyByHeadword(ln);
    if (!fam) continue;

    const equipment = EQUIP_HINTS.filter(([_, r])=> r.test(ln)).map(([k])=>k);

    const dose = (ln.match(/(\d+\s*(reps?|cal|m|meters|km|minutes?|min|seconds?|sec|x|rft|rds|rounds?))/g)||[]).join(" ");

    const exercise = normalizeExercise(ln);

    items.push({ block: currentBlock, exercise, dose, family: fam, equipment });
  }

  const requiresLoad = items.some(i=> i.equipment.includes("barbell") || i.equipment.includes("dumbbell") || i.equipment.includes("kettlebell") || i.equipment.includes("sandbag") || i.equipment.includes("wall_ball"));
  const containsRunning = items.some(i=> i.family === "mono" && /run|shuttle/.test(i.exercise));

  return {
    title: deriveTitle(lower),
    type,
    items,
    requiresLoad,
    containsRunning
  };
}

function guessFamilyByHeadword(s: string): string | undefined {
  if (/(squat|thruster)/.test(s)) return "squat";
  if (/(deadlift|hinge|rdl|kb swing|kettlebell swing)/.test(s)) return "hinge";
  if (/(press|push-up|pushup|jerk|dip|handstand)/.test(s)) return "press";
  if (/(pull-up|chin-up|row|muscle-up|rope climb)/.test(s)) return "pull";
  if (/(sit-up|v-up|toes-to-bar|knee raise|hollow|plank)/.test(s)) return "core";
  if (/(lunge|step-up)/.test(s)) return "lunge";
  if (/(jump)/.test(s)) return "jump";
  if (/(run|row|bike|ski|echo|assault|airdyne|shuttle)/.test(s)) return "mono";
  if (/(burpee)/.test(s)) return "burpee";
  return undefined;
}

function normalizeExercise(s: string) {
  const m = s.match(/(burpees?|pull[- ]?ups?|chin[- ]?ups?|ring rows?|rope climbs?|muscle[- ]?ups?|deadlifts?|kb swings?|kettlebell swings?|good[- ]?mornings?|hip thrusts?|sdhp|sumo deadlift high pulls?|push[- ]?ups?|press(?:es)?|push press(?:es)?|jerks?|handstand push[- ]?ups?|dips?|squats?|thrusters?|wall ?balls?|lunges?|step[- ]?ups?|box jumps?|broad jumps?|sit[- ]?ups?|v[- ]?ups?|toes[- ]?to[- ]?bar|knee raises?|hollow rocks?|planks?|run|shuttle runs?|row|bike|ski)/);
  return m ? m[0] : s.split(",")[0].split(" with ")[0].slice(0,60);
}

function deriveTitle(lower: string) {
  const name = lower.match(/\b(murph|fran|annie|cindy|helen|dt|kelly|wood)\b/);
  if (name) return name[0].toUpperCase();
  const type = ["amrap","for_time","emom","interval","chipper"].find(t=> lower.includes(t));
  return type ? type.toUpperCase() : "Workout";
}

export function inferDuration(parsed: ReturnType<typeof parseWodText>) {
  const n = parsed.items.length;
  if (parsed.type === "amrap") return 20;
  if (parsed.type === "emom") return 20;
  if (parsed.type === "for_time") return Math.min(40, 10 + n * 2);
  if (parsed.type === "chipper") return Math.min(50, 20 + n * 3);
  return Math.min(30, 12 + n);
}
