// Movement-by-movement substitutions first; family-level fallback second
export const MOVEMENT_SUBS: Record<string, { primary: string; bodyweight: string; family: string }> = {
// Pull
"pull-up": { primary: "Ring or table rows", bodyweight: "Prone towel lat pulls", family: "pull" },
"chin-up": { primary: "Ring or table rows", bodyweight: "Prone towel lat pulls", family: "pull" },
"muscle-up": { primary: "Chest-to-bar / deep ring rows", bodyweight: "Tempo table rows", family: "pull" },
"rope climb": { primary: "Seated rope pulls (towel) x reps", bodyweight: "Supinated table rows", family: "pull" },
// Press
"push-up": { primary: "Elevated push-ups / dips (parallel bars)", bodyweight: "Tempo push-ups (3-1-3)", family: "press" },
"handstand push-up": { primary: "Pike push-ups on box", bodyweight: "Decline push-ups", family: "press" },
"press": { primary: "DB push press", bodyweight: "Pike push-ups", family: "press" },
"push press": { primary: "DB push press", bodyweight: "Pike push-ups", family: "press" },
"jerk": { primary: "DB push press", bodyweight: "Pike push-ups", family: "press" },
// Squat
"squat": { primary: "Goblet squat", bodyweight: "Tempo air squat / pause squat", family: "squat" },
"thruster": { primary: "DB thruster", bodyweight: "Jump squat + push-up couplet", family: "squat" },
"wall ball": { primary: "DB thruster", bodyweight: "Air squats (jump optional)", family: "squat" },
// Hinge
"deadlift": { primary: "DB/KB deadlift", bodyweight: "Good-mornings / backpack RDL", family: "hinge" },
"kb swing": { primary: "Backpack swing (secure straps)", bodyweight: "Hip hinge jumps / good-mornings", family: "hinge" },
"sdhp": { primary: "DB high pull", bodyweight: "Burpee jump + high pull mimic", family: "hinge" },
// Lunge / Jump
"lunge": { primary: "DB walking lunge", bodyweight: "Reverse lunges (tempo)", family: "lunge" },
"step-up": { primary: "Weighted step-ups (DB)", bodyweight: "Step-ups", family: "lunge" },
"box jump": { primary: "Step-ups", bodyweight: "Broad jumps", family: "jump" },
// Core
"sit-up": { primary: "Weighted sit-ups (plate)", bodyweight: "Sit-ups", family: "core" },
"v-up": { primary: "Tuck-ups / leg raises", bodyweight: "V-ups", family: "core" },
"toes-to-bar": { primary: "Hanging knee raises", bodyweight: "V-ups / sit-ups", family: "core" },
// Mono (we already ban jump ropes globally)
"row": { primary: "Run (time-equated)", bodyweight: "Fast step-ups / jumping jacks", family: "mono" },
"bike": { primary: "Run (time-equated)", bodyweight: "Fast step-ups / jumping jacks", family: "mono" },
"ski": { primary: "Run (time-equated)", bodyweight: "Fast step-ups / jumping jacks", family: "mono" },
"run": { primary: "Row/Bike/Ski (if available)", bodyweight: "Step-ups / fast stair climbs", family: "mono" }
};


export const FAMILY_SUBS: Record<string, { primary: string; bodyweight: string }> = {
pull: { primary: "Ring/table rows", bodyweight: "Prone towel lat pulls" },
press: { primary: "DB push press", bodyweight: "Pike/decline push-ups" },
squat: { primary: "Goblet squat", bodyweight: "Tempo/pause air squat" },
hinge: { primary: "DB/KB deadlift", bodyweight: "Good-mornings / backpack RDL" },
lunge: { primary: "DB walking lunge", bodyweight: "Reverse lunges (tempo)" },
jump: { primary: "Step-ups", bodyweight: "Broad jumps" },
core: { primary: "V-ups / leg raises", bodyweight: "Sit-ups / deadbugs" },
mono: { primary: "Run or row (time)", bodyweight: "Step-ups / jumping jacks" },
burpee: { primary: "Step-back burpee", bodyweight: "Squat thrust + push-up" }
};
