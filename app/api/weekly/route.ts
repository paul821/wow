import { NextRequest } from "next/server";
const duration = Math.min(60, inferDuration(parsed));
if (duration > 60) continue; // hard cap safeguard


const score = computeScore(parsed, { bwOnly, noRunning });
candidates.push({ ...parsed, date: p.date, source_url: p.url, est_duration_min: duration, score });
}


let data: any;
if (candidates.length) {
candidates.sort((a,b)=> b.score - a.score);
const pick = candidates[0];
data = {
window: { start: startStr, end: endStr },
title: pick.title || "Workout",
type: pick.type,
source_url: pick.source_url,
est_duration_min: pick.est_duration_min,
rows: buildRows(pick),
reasons: REASONS(pick),
coaching: pick.coaching
};
} else {
const pick = evergreenPick({ bwOnly, noRunning });
data = {
window: { start: startStr, end: endStr },
title: pick.title,
type: pick.type,
source_url: pick.source_url,
est_duration_min: pick.est_duration_min,
rows: buildRows(pick),
reasons: REASONS(pick),
banner: "Couldn’t fetch/parse last week’s WODs or none matched filters — showing an evergreen minimal-gear classic.",
coaching: pick.coaching
};
}


CACHE = { ts: Date.now(), key: cacheKey, data };
return Response.json(data);
}
