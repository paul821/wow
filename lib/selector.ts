import { CFG } from "@/lib/config";
else if (["dumbbell","kettlebell","wall_ball","sandbag"].includes(e)) equipScore += 2;
else if (["barbell","rings","rower","bike","ski"].includes(e)) equipScore += 3;
}
if (opts.bwOnly) equipScore += 5; // penalize any equipment when BW-only is requested


// Duration fit
const durationFit = 0; // computed at API level; keep simple here


const score = CFG.weights.fullBody * fullBody + CFG.weights.equip * (-equipScore) + CFG.weights.duration * durationFit + CFG.weights.variety * Math.min(3, parsed.items.length/3);
return score;
}


export function buildRows(pick:any){
const rows: any[] = [];
for (const i of pick.items){
const name = i.exercise.replace(/\s+/g, " ").trim();
const base = MOVEMENT_SUBS[name] || undefined;
const fam = FAMILY_SUBS[i.family] || undefined;
const subs = base ? { primary: base.primary, bodyweight: base.bodyweight } : (fam || { primary: "—", bodyweight: "—" });
rows.push({ block: i.block, exercise: capitalize(name), dose: i.dose, subs });
}
return rows;
}


export function REASONS(pick:any){
const badges:string[] = [];
const fams = new Set(pick.items.map((i:any)=> i.family));
const regions = new Set<string>();
for (const f of fams){
if (f === "pull" || f === "press") regions.add("upper"), regions.add("core");
if (["squat","hinge","lunge","jump"].includes(f)) regions.add("lower"), regions.add("core");
if (f === "burpee") regions.add("upper"), regions.add("lower"), regions.add("core");
if (f === "mono") regions.add("lower");
}
if (regions.has("upper") && regions.has("lower") && regions.has("core")) badges.push("Upper + Lower + Core");
else badges.push(`${regions.size} region(s)`);
const equipSet = new Set<string>();
pick.items.forEach((i:any)=> i.equipment.forEach((e:string)=> equipSet.add(e)));
badges.push(equipSet.size? `${equipSet.size} implement(s)`: "Bodyweight");
if (pick.est_duration_min) badges.push(`~${pick.est_duration_min} min`);
return badges;
}


function capitalize(s:string){ return s.charAt(0).toUpperCase()+s.slice(1); }
