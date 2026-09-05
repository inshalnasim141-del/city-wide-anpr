import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import api from "../lib/api";
import {
    ScanLine, Siren, Camera, ShieldAlert, TrendingUp, Zap,
    ArrowUpRight, Activity,
} from "lucide-react";
import { toast } from "sonner";
import DetectionFeedTable from "./DetectionFeedTable";
import AlertsPanel from "./AlertsPanel";
import HourlyFlowChart from "./HourlyFlowChart";

const kpiTiles = [
    { key: "detections_last_hour", label: "Detections · 1h", icon: ScanLine, color: "cyan" },
    { key: "open_alerts", label: "Open Alerts", icon: Siren, color: "rose" },
    { key: "cameras_online", label: "Cameras Online", icon: Camera, color: "emerald" },
    { key: "blacklist_size", label: "Blacklist Size", icon: ShieldAlert, color: "amber" },
];

const colorMap = {
    cyan: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
    rose: "text-rose-400 border-rose-500/30 bg-rose-500/5",
    emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    amber: "text-amber-400 border-amber-500/30 bg-amber-500/5",
};

export default function LiveDashboard() {
    const [kpis, setKpis] = useState({});
    const [tick, setTick] = useState(0);

    const loadKpis = async () => {
        try {
            const { data } = await api.get("/analytics/kpis");
            setKpis(data);
        } catch (e) { /* ignore */ }
    };

    const simulate = async () => {
        try {
            const { data } = await api.post("/detections/simulate", null, { params: { count: 3 } });
            if (data?.created) setTick((t) => t + 1);
        } catch (e) { /* ignore */ }
    };

    useEffect(() => {
        loadKpis();
        const kpiTimer = setInterval(loadKpis, 5000);
        const simTimer = setInterval(simulate, 4000);
        return () => { clearInterval(kpiTimer); clearInterval(simTimer); };
    }, []);

    return (
        <div className="space-y-6" data-testid="dashboard-root">
            <div className="flex items-end justify-between">
                <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-mono-anpr mb-1.5">
                        Live Operations · realtime feed
                    </div>
                    <h1 className="font-display text-3xl font-bold">Command Overview</h1>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-anpr">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    {kpis.detections_last_24h ?? 0} reads · last 24h
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiTiles.map((k) => (
                    <Card
                        key={k.key}
                        data-testid={`kpi-${k.key}`}
                        className={`bg-[#111827] border-white/10 p-5 hover:border-cyan-500/30 transition-all ${colorMap[k.color]} border`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-[11px] uppercase tracking-widest text-slate-400">{k.label}</div>
                                <div className="mt-3 font-display text-3xl font-bold">
                                    {kpis[k.key] ?? "—"}
                                </div>
                            </div>
                            <k.icon className="w-5 h-5 opacity-70" />
                        </div>
                        <div className="mt-3 text-[10px] uppercase tracking-widest opacity-60 font-mono-anpr">
                            {k.key === "cameras_online" && `${kpis.cameras_online ?? 0}/${kpis.cameras_total ?? 0} nodes`}
                            {k.key === "detections_last_hour" && "rolling window"}
                            {k.key === "open_alerts" && "requires triage"}
                            {k.key === "blacklist_size" && "active watchlist"}
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="xl:col-span-2 bg-[#111827] border-white/10 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-[11px] uppercase tracking-widest text-cyan-400 font-mono-anpr">Detection Feed</div>
                            <div className="font-display text-lg font-semibold mt-1">Live Plate Reads</div>
                        </div>
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] uppercase tracking-widest">
                            <span className="pulse-dot mr-2" /> streaming
                        </Badge>
                    </div>
                    <DetectionFeedTable tick={tick} limit={20} />
                </Card>

                <Card className="bg-[#111827] border-white/10 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-[11px] uppercase tracking-widest text-rose-400 font-mono-anpr">Active Alerts</div>
                            <div className="font-display text-lg font-semibold mt-1">Blacklist Hits</div>
                        </div>
                    </div>
                    <AlertsPanel tick={tick} compact />
                </Card>
            </div>

            <Card className="bg-[#111827] border-white/10 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-[11px] uppercase tracking-widest text-cyan-400 font-mono-anpr">24h Flow</div>
                        <div className="font-display text-lg font-semibold mt-1">Traffic Volume Timeline</div>
                    </div>
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <HourlyFlowChart tick={tick} />
            </Card>
        </div>
    );
}
