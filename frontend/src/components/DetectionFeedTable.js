import { useEffect, useState } from "react";
import api from "../lib/api";
import { Badge } from "./ui/badge";

const conf = (c) => {
    const pct = Math.round(c * 100);
    if (pct >= 95) return { color: "text-emerald-400 border-emerald-500/40", label: `${pct}%` };
    if (pct >= 88) return { color: "text-cyan-400 border-cyan-500/40", label: `${pct}%` };
    return { color: "text-amber-400 border-amber-500/40", label: `${pct}%` };
};

export default function DetectionFeedTable({ tick, limit = 30, plate }) {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/detections", { params: { limit, plate } });
                setRows(data);
            } catch (e) { /* ignore */ }
        })();
    }, [tick, limit, plate]);

    return (
        <div className="overflow-hidden" data-testid="detection-feed-table">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 grid grid-cols-12 gap-2 pb-2 border-b border-white/5 font-mono-anpr">
                <div className="col-span-3">Plate</div>
                <div className="col-span-4">Camera</div>
                <div className="col-span-2">Speed</div>
                <div className="col-span-2">Time</div>
                <div className="col-span-1 text-right">Conf.</div>
            </div>
            <div className="divide-y divide-white/5 max-h-[400px] overflow-auto">
                {rows.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-sm">Awaiting first detection...</div>
                )}
                {rows.map((r) => {
                    const c = conf(r.confidence);
                    const t = new Date(r.timestamp);
                    return (
                        <div key={r.id} className="grid grid-cols-12 gap-2 py-2.5 text-sm items-center hover:bg-white/[0.02] transition-colors">
                            <div className="col-span-3 font-mono-anpr text-cyan-300 font-medium">{r.plate}</div>
                            <div className="col-span-4 text-slate-300 truncate">{r.camera_name}</div>
                            <div className="col-span-2 font-mono-anpr text-slate-400">{r.speed_kph} kph</div>
                            <div className="col-span-2 text-slate-500 text-xs font-mono-anpr">
                                {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <Badge variant="outline" className={`${c.color} text-[10px] font-mono-anpr`}>
                                    {c.label}
                                </Badge>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
