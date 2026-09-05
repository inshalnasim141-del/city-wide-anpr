import { useEffect, useState } from "react";
import api from "../lib/api";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { Check, ArrowUp, X, Siren } from "lucide-react";

const priBadge = {
    critical: "border-rose-500/60 text-rose-300 bg-rose-500/10",
    high: "border-orange-500/50 text-orange-300 bg-orange-500/10",
    medium: "border-amber-500/40 text-amber-300 bg-amber-500/10",
    low: "border-slate-500/40 text-slate-300 bg-slate-500/10",
};

export default function AlertsPanel({ tick, compact = false, statusFilter = "open" }) {
    const [alerts, setAlerts] = useState([]);

    const load = async () => {
        try {
            const { data } = await api.get("/alerts", { params: { status: statusFilter, limit: compact ? 8 : 200 } });
            setAlerts(data);
        } catch (e) { /* ignore */ }
    };

    useEffect(() => { load(); }, [tick, statusFilter, compact]);

    const doAction = async (id, action) => {
        try {
            await api.post(`/alerts/${id}/action`, { action });
            toast.success(`Alert ${action}d`);
            load();
        } catch (e) {
            toast.error("Action failed");
        }
    };

    return (
        <div className="space-y-2" data-testid="alerts-panel">
            {alerts.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                    <Siren className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No active alerts
                </div>
            )}
            {alerts.map((a) => (
                <div
                    key={a.id}
                    data-testid={`alert-${a.id}`}
                    className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/[0.03] hover:border-rose-500/40 transition-all"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="pulse-dot red" />
                                <span className="font-mono-anpr text-rose-300 font-semibold">{a.plate}</span>
                                <Badge variant="outline" className={`${priBadge[a.priority] || priBadge.medium} text-[10px] uppercase tracking-wider`}>
                                    {a.priority}
                                </Badge>
                            </div>
                            <div className="text-xs text-slate-400 truncate">{a.reason}</div>
                            <div className="text-[11px] text-slate-500 mt-1 font-mono-anpr">
                                {a.camera_name} · {new Date(a.created_at).toLocaleTimeString()}
                            </div>
                        </div>
                        {a.status === "open" && (
                            <div className="flex flex-col gap-1 shrink-0">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => doAction(a.id, "acknowledge")}
                                    data-testid={`ack-${a.id}`}
                                    className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/10"
                                >
                                    <Check className="w-3 h-3 mr-1" /> Ack
                                </Button>
                                {!compact && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => doAction(a.id, "escalate")}
                                            data-testid={`escalate-${a.id}`}
                                            className="h-7 text-xs text-amber-400 hover:bg-amber-500/10"
                                        >
                                            <ArrowUp className="w-3 h-3 mr-1" /> Escalate
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => doAction(a.id, "close")}
                                            data-testid={`close-${a.id}`}
                                            className="h-7 text-xs text-slate-400 hover:bg-slate-500/10"
                                        >
                                            <X className="w-3 h-3 mr-1" /> Close
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                        {a.status !== "open" && (
                            <Badge variant="outline" className="text-[10px] uppercase border-slate-500/40 text-slate-400">
                                {a.status}
                            </Badge>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
