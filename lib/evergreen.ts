export function evergreenPick(opts:{bwOnly:boolean, noRunning:boolean}){
  const lib = [
    {
      title: "CINDY (scaled)", type: "amrap", est_duration_min: 20, source_url: "https://www.crossfit.com/workout/2008/05/14",
      items: [
        { block: "AMRAP 20", exercise: "pull-up", dose: "5 reps", family:"pull", equipment:["pullup_bar"] },
        { block: "AMRAP 20", exercise: "push-up", dose: "10 reps", family:"press", equipment:[] },
        { block: "AMRAP 20", exercise: "squat", dose: "15 reps", family:"squat", equipment:[] }
      ],
      coaching: "Move smoothly from minute 0. Aim unbroken push-ups early; break pull-ups before failure."
    },
    {
      title: "Annie (no rope version)", type: "for_time", est_duration_min: 12, source_url: "https://wodwell.com/wod/annie/",
      items: [
        { block: "For time", exercise: "sit-up", dose: "50-40-30-20-10", family:"core", equipment:[] },
        { block: "For time", exercise: "jumping jacks", dose: "50-40-30-20-10", family:"mono", equipment:[] }
      ],
      coaching: "Steady breathing; protect lower back by anchoring feet lightly and keeping tension on sit-ups."
    },
    {
      title: "Full-body EMOM", type: "emom", est_duration_min: 18, source_url: "",
      items: [
        { block: "EMOM 18", exercise: "burpee", dose: "Min 1: 10 reps", family:"burpee", equipment:[] },
        { block: "EMOM 18", exercise: "lunge", dose: "Min 2: 14 alt lunge", family:"lunge", equipment:[] },
        { block: "EMOM 18", exercise: "sit-up", dose: "Min 3: 16 reps", family:"core", equipment:[] }
      ],
      coaching: "Leave 10–15 sec rest each minute; scale reps to finish by ~:45."
    }
  ];
  const filtered = lib.filter(w => {
    if (opts.noRunning && w.items.some(i=> /run/.test(i.exercise))) return false;
    if (opts.bwOnly && w.items.some(i=> i.equipment.length > 0)) return false;
    return true;
  });
  return filtered[0] || lib[0];
}
