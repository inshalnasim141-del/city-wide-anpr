import { useEffect, useState } from "react";
import api from "../lib/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { toast } from "sonner";
import { formatApiErrorDetail } from "../lib/api";
import { Plus, Trash2, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const priBadge = {
    critical: "border-rose-500/60 text-rose-300 bg-rose-500/10",
    high: "border-orange-500/50 text-orange-300 bg-orange-500/10",
    medium: "border-amber-500/40 text-amber-300 bg-amber-500/10",
    low: "border-slate-500/40 text-slate-300 bg-slate-500/10",
};

export default function BlacklistPage() {
    const { user } = useAuth();
    const canEdit = user?.role === "admin" || user?.role === "investigator";
    const [rows, setRows] = useState([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ plate: "", reason: "", priority: "medium", notes: "" });

    const load = async () => {
        try {
            const { data } = await api.get("/blacklist");
            setRows(data);
        } catch {}
    };

    useEffect(() => { load(); }, []);

    const add = async () => {
        try {
            await api.post("/blacklist", form);
            toast.success("Added to blacklist");
            setOpen(false);
            setForm({ plate: "", reason: "", priority: "medium", notes: "" });
            load();
        } catch (e) {
            toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Add failed");
        }
    };

    const remove = async (p) => {
        try {
            await api.delete(`/blacklist/${p}`);
            toast.success("Removed");
            load();
        } catch (e) {
            toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Delete failed");
        }
    };

    return (
        <div className="space-y-6" data-testid="blacklist-root">
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-amber-400 font-mono-anpr mb-1.5">Watchlist Management</div>
                    <h1 className="font-display text-3xl font-bold">Blacklist Registry</h1>
                    <p className="text-slate-400 text-sm mt-1">Plates that trigger a real-time alert when detected by any camera.</p>
                </div>
                {canEdit && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button data-testid="add-blacklist-plate-btn" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">
                                <Plus className="w-4 h-4 mr-2" /> Add plate
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0d1322] border-white/10">
                            <DialogHeader>
                                <DialogTitle className="font-display">Add plate to blacklist</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-slate-400">Plate</Label>
                                    <Input
                                        data-testid="blacklist-plate-input"
                                        value={form.plate}
                                        onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value.toUpperCase() }))}
                                        placeholder="KA05-AB-1234"
                                        className="mt-1 bg-[#0b1220] border-white/10 font-mono-anpr uppercase"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-slate-400">Reason</Label>
                                    <Input
                                        data-testid="blacklist-reason-input"
                                        value={form.reason}
                                        onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                                        placeholder="e.g. Reported stolen"
                                        className="mt-1 bg-[#0b1220] border-white/10"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-slate-400">Priority</Label>
                                    <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                                        <SelectTrigger data-testid="blacklist-priority-select" className="mt-1 bg-[#0b1220] border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-slate-400">Notes</Label>
                                    <Input
                                        data-testid="blacklist-notes-input"
                                        value={form.notes}
                                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                        placeholder="Optional context"
                                        className="mt-1 bg-[#0b1220] border-white/10"
                                    />
                                </div>
                                <Button
                                    data-testid="blacklist-submit-btn"
                                    onClick={add}
                                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                                >
                                    Add to blacklist
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card className="bg-[#111827] border-white/10 p-4">
                {rows.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Watchlist is empty
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        <div className="grid grid-cols-12 gap-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-mono-anpr">
                            <div className="col-span-3">Plate</div>
                            <div className="col-span-4">Reason</div>
                            <div className="col-span-2">Priority</div>
                            <div className="col-span-2">Added</div>
                            <div className="col-span-1 text-right">Action</div>
                        </div>
                        {rows.map((r) => (
                            <div key={r.id} data-testid={`blacklist-row-${r.plate}`} className="grid grid-cols-12 gap-3 py-3 items-center text-sm">
                                <div className="col-span-3 font-mono-anpr text-rose-300 font-semibold">{r.plate}</div>
                                <div className="col-span-4 text-slate-300">{r.reason}</div>
                                <div className="col-span-2">
                                    <Badge variant="outline" className={`${priBadge[r.priority] || priBadge.medium} text-[10px] uppercase tracking-wider`}>
                                        {r.priority}
                                    </Badge>
                                </div>
                                <div className="col-span-2 text-slate-500 text-xs font-mono-anpr">
                                    {new Date(r.created_at).toLocaleDateString()}
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    {canEdit && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => remove(r.plate)}
                                            data-testid={`remove-${r.plate}`}
                                            className="h-7 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
