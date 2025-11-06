import { NextRequest } from "next/server";
import { format, addDays, isAfter } from "date-fns";
// no tz lib needed – use native timeZone conversion
import { load as loadHTML } from "cheerio";
import { WINDOWS, computeScore, buildRows, REASONS, BAN_JUMP_ROPE } from "@/lib/selector";
import { parseWodText, inferDuration } from "@/lib/parser";
import { evergreenPick } from "@/lib/evergreen";
import { CFG } from "@/lib/config";

let CACHE: any = { ts: 0, key: "", data: null };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bwOnly = searchParams.get("bwOnly") === "true";
  const noRunning = searchParams.get("noRunning") === "true";

  const tz = CFG.timezone;
  const nowZoned = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  const day = nowZoned.getDay();
  const mondayOffset = (day === 0 ? 6 : day - 1);
  const lastMonday = addDays(nowZoned, -(mondayOffset + 7));
  const lastSunday = addDays(nowZoned, -(mondayOffset + 1));



  const startStr = format(lastMonday, "yyyy-MM-dd");
  const endStr = format(lastSunday, "yyyy-MM-dd");
  const cacheKey = `${startStr}_${endStr}_${bwOnly}_${noRunning}`;

  if (CACHE.data && CACHE.key === cacheKey && Date.now() - CACHE.ts < WINDOWS.cacheMs) {
    return Response.json(CACHE.data);
  }

  // Build date list inclusive
  const dates: string[] = [];
  let cursor = new Date(lastMonday);
  while (!isAfter(cursor, lastSunday)) {
    dates.push(format(cursor, "yyyy/MM/dd"));
    cursor = addDays(cursor, 1);
  }



  const pages: { date: string; url: string; text: string | null }[] = [];

  for (const d of dates) {
    const url = `https://www.crossfit.com/workout/${d}`;
    let text: string | null = null;
    try {
      const res = await fetch(url, { headers: { "User-Agent": CFG.userAgent }, next: { revalidate: 60 } });
      if (res.ok) {
        const html = await res.text();
        const $ = loadHTML(html);
        let main =
           $("main, article, [class*=workout], [id*=workout], .content, #content")
             .find("h1,h2,h3,p,li,pre")
             .map((_, el) => $(el).text())
             .get()
             .join("\n");
        if (!main || main.replace(/\s+/g, " ").trim().length < 60) {
           // fallback to meta description or whole body
           const meta = $('meta[property="og:description"]').attr("content") || $("body").text();
           main = meta || "";
        }
      const compact = (main || "").replace(/\s+/g, " ").trim();
      }
    } catch (_) {}
    pages.push({ date: d, url, text });
  }

  const candidates: any[] = [];
  for (const p of pages) {
    if (p.text) {
      const parsed = parseWodText(p.text);
      if (!parsed.items || parsed.items.length === 0) continue;
      const failsJump = BAN_JUMP_ROPE(parsed);
      const failsBW   = bwOnly && parsed.requiresLoad;
      const failsRun  = noRunning && parsed.containsRunning;
      const duration  = Math.min(60, inferDuration(parsed));
      const failsCap  = duration > 60;
  
      if (!(failsJump || failsBW || failsRun || failsCap)) {
        const score = computeScore(parsed, { bwOnly, noRunning });
        candidates.push({
          ...parsed,
          date: p.date,
          source_url: p.url,
          est_duration_min: duration,
          score
        });
      }
    }
  }



  let data: any;
  if (candidates.length > 0) {
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
