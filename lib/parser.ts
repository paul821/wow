// Structure-agnostic text parser → internal workout object
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
// compact name extraction; keep head words
const m = s.match(/(burpees?|pull[- ]?ups?|chin[- ]?ups?|ring rows?|rope climbs?|muscle[- ]?ups?|deadlifts?|kb swings?|kettlebell swings?|good[- ]?mornings?|hip thrusts?|sdhp|sumo deadlift high pulls?|push[- ]?ups?|press(?:es)?|push press(?:es)?|jerks?|handstand push[- ]?ups?|dips?|squats?|thrusters?|wall ?balls?|lunges?|step[- ]?ups?|box jumps?|broad jumps?|sit[- ]?ups?|v[- ]?ups?|toes[- ]?to[- ]?bar|knee raises?|hollow rocks?|planks?|run|shuttle runs?|row|bike|ski)/);
return m ? m[0] : s.split(",")[0].split(" with ")[0].slice(0,60);
}


function deriveTitle(lower: string) {
const name = lower.match(/\b(murph|fran|annie|cindy|helen|dt|kelly|wood)\b/);
if (name) return name[0].toUpperCase();
const type = TITLE_TYPES.find(([_, r]) => r.test(lower))?.[0];
return type ? type.toUpperCase() : "Workout";
}


export function inferDuration(parsed: ReturnType<typeof parseWodText>) {
// heuristic by type and item count; capped elsewhere
const n = parsed.items.length;
if (parsed.type === "amrap") return 20;
if (parsed.type === "emom") return 20;
if (parsed.type === "for_time") return Math.min(40, 10 + n * 2);
if (parsed.type === "chipper") return Math.min(50, 20 + n * 3);
return Math.min(30, 12 + n);
}
