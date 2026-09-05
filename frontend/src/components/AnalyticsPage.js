import { useEffect, useState } from "react";
import api from "../lib/api";
import { Card } from "./ui/card";
import HourlyFlowChart from "./HourlyFlowChart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";

export default function AnalyticsPage() {
    const [topCams, setTopCams] = useState([]);
    const [kpis, setKpis] = useState({});

    useEffect(() => {
        (async () => {
            try {
                const [t, k] = await Promise.all([api.get("/analytics/top-cameras"), api.get("/analytics/kpis")]);
                setTopCams(t.data);
                setKpis(k.data);
            } catch {}
        })();
    }, []);

    const total = kpis.detections_last_24h ?? 0;
    const avgPerCam = kpis.cameras_online ? Math.round(total / kpis.cameras_online) : 0;

    return (
        <div className="space-y-6" data-testid="analytics-root">
            <div>
                <div className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-mono-anpr mb-1.5">Urban Analytics</div>
                <h1 className="font-display text-3xl font-bold">Traffic Movement Insights</h1>
                <p className="text-slate-400 text-sm mt-1">Aggregate flows, top-performing cameras and hourly volumes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="bg-[#111827] border-white/10 p-5">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-mono-anpr">Reads · 24h</div>
                    <div className="font-display text-4xl font-bold mt-2 text-cyan-300">{total}</div>
                </Card>
                <Card className="bg-[#111827] border-white/10 p-5">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-mono-anpr">Avg / camera / 24h</div>
                    <div className="font-display text-4xl font-bold mt-2 text-emerald-300">{avgPerCam}</div>
                </Card>
                <Card className="bg-[#111827] border-white/10 p-5">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-mono-anpr">Uptime</div>
                    <div className="font-display text-4xl font-bold mt-2 text-amber-300">
                        {kpis.cameras_total ? Math.round((kpis.cameras_online / kpis.cameras_total) * 100) : 0}%
                    </div>
                </Card>
            </div>

            <Card className="bg-[#111827] border-white/10 p-5">
                <div className="text-[11px] uppercase tracking-widest text-cyan-400 font-mono-anpr mb-4">Hourly Volume · last 24h</div>
                <HourlyFlowChart tick={0} />
            </Card>

            <Card className="bg-[#111827] border-white/10 p-5">
                <div className="text-[11px] uppercase tracking-widest text-cyan-400 font-mono-anpr mb-4">Top Cameras · by volume</div>
                <div className="h-72" data-testid="top-cameras-chart">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topCams} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} angle={-20} textAnchor="end" height={60} />
                            <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid rgba(0,240,255,0.3)", borderRadius: 8 }} />
                            <Bar dataKey="count" fill="#00F0FF" radius={[6, 6, 0, 0]}>
                                {topCams.map((_, i) => (
                                    <Cell key={i} fill={i === 0 ? "#00F0FF" : i < 3 ? "#22D3EE" : "#0891B2"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
}
