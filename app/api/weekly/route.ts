import { NextRequest, NextResponse } from "next/server";
import { format, addDays, isAfter } from "date-fns";
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

  // Return cached data if still valid
  if (CACHE.data && CACHE.key === cacheKey && Date.now() - CACHE.ts < WINDOWS.cacheMs) {
    return NextResponse.json(CACHE.data);
  }

  // Build date list inclusive
  const dates: string[] = [];
  let cursor = new Date(lastMonday);
  while (!isAfter(cursor, lastSunday)) {
    dates.push(format(cursor, "yyyy/MM/dd"));
    cursor = addDays(cursor, 1);
  }

  const pages: { date: string; url: string; text: string | null }[] = [];

  // Fetch all workout pages
  for (const d of dates) {
    const url = `https://www.crossfit.com/workout/${d}`;
    let text: string | null = null;
    
    try {
      const res = await fetch(url, { 
        headers: { "User-Agent": CFG.userAgent }, 
        next: { revalidate: 3600 } // Cache for 1 hour
      });
      
      if (res.ok) {
        const html = await res.text();
        const $ = loadHTML(html);
        
        // Try to extract workout content from main semantic areas
        let main = $("main, article, [class*=workout], [id*=workout], .content, #content")
          .find("h1,h2,h3,p,li,pre,div")
          .map((_, el) => $(el).text())
          .get()
          .join("\n");
        
        // Fallback to meta description or body if extraction failed
        if (!main || main.replace(/\s+/g, " ").trim().length < 60) {
          const meta = $('meta[property="og:description"]').attr("content") || 
                      $('meta[name="description"]').attr("content") ||
                      $("body").text();
          main = meta || "";
        }
        
        // CRITICAL FIX: Actually assign the cleaned text
        text = (main || "").replace(/\s+/g, " ").trim();
      }
    } catch (err) {
      console.error(`Failed to fetch ${url}:`, err);
    }
    
    pages.push({ date: d, url, text });
  }

  const candidates: any[] = [];
  
  // Parse and score each workout
  for (const p of pages) {
    if (!p.text || p.text.length < 20) continue; // Skip empty/invalid pages
    
    const parsed = parseWodText(p.text);
    if (!parsed.items || parsed.items.length === 0) continue;
    
    // Apply filters
    const failsJump = BAN_JUMP_ROPE(parsed);
    const failsBW = bwOnly && parsed.requiresLoad;
    const failsRun = noRunning && parsed.containsRunning;
    const duration = Math.min(60, inferDuration(parsed));
    const failsCap = duration > 60;

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

  let data: any;
  
  if (candidates.length > 0) {
    // Pick the highest-scoring workout
    candidates.sort((a, b) => b.score - a.score);
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
    // Fallback to evergreen workout
    const pick = evergreenPick({ bwOnly, noRunning });
    
    data = {
      window: { start: startStr, end: endStr },
      title: pick.title,
      type: pick.type,
      source_url: pick.source_url,
      est_duration_min: pick.est_duration_min,
      rows: buildRows(pick),
      reasons: REASONS(pick),
      banner: "Couldn't fetch/parse last week's WODs or none matched filters — showing an evergreen minimal-gear classic.",
      coaching: pick.coaching
    };
  }

  CACHE = { ts: Date.now(), key: cacheKey, data };
  return NextResponse.json(data);
}
