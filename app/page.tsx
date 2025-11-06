"use client";
import { useEffect, useState } from "react";


export default function Page() {
const [data, setData] = useState<any>(null);
const [loading, setLoading] = useState(false);
const [bwOnly, setBwOnly] = useState(false);
const [noRun, setNoRun] = useState(false);


async function load() {
setLoading(true);
const qs = new URLSearchParams({ bwOnly: String(bwOnly), noRunning: String(noRun) });
const res = await fetch(`/api/weekly?${qs.toString()}`, { cache: "no-store" });
const j = await res.json();
setData(j);
setLoading(false);
}

useEffect(() => { load(); /* initial */ }, []);
<div>
<h2 className="text-lg font-semibold">This Week's Pick</h2>
<div className="space-x-2 mt-1">
{data.reasons?.map((r:string, i:number)=> (<span key={i} className="badge">{r}</span>))}
</div>
</div>
{data.source_url && (
<a className="small" href={data.source_url} target="_blank" rel="noreferrer">Original WOD ↗</a>
)}
</div>


<div className="grid gap-3">
<div className="small">Date range evaluated: {data.window?.start} → {data.window?.end}</div>
{data.title && <div><strong>Title:</strong> {data.title}</div>}
{data.type && <div><strong>Type:</strong> {data.type.toUpperCase()}</div>}
{typeof data.est_duration_min === 'number' && (
<div><strong>Est. duration:</strong> ~{data.est_duration_min} min</div>
)}
</div>


<div className="overflow-x-auto">
<table className="table">
<thead>
<tr>
<th>Block / Dose</th>
<th>Exercise</th>
<th>Sets / Reps / Time</th>
<th>Substitutions</th>
</tr>
</thead>
<tbody>
{data.rows?.map((row:any, idx:number)=> (
<tr key={idx}>
<td>{row.block || "—"}</td>
<td>{row.exercise}</td>
<td>{row.dose || "—"}</td>
<td className="small">
{row.subs?.primary && <div><strong>Primary:</strong> {row.subs.primary}</div>}
{row.subs?.bodyweight && <div><strong>BW:</strong> {row.subs.bodyweight}</div>}
</td>
</tr>
))}
</tbody>
</table>
</div>


{data.coaching && (
<div className="small">{data.coaching}</div>
)}
</section>
)}


<footer className="small">
<p>Content summary generated from publicly available WOD posts; we show minimal structured info and always link back. © You.</p>
</footer>
</div>
);
}
