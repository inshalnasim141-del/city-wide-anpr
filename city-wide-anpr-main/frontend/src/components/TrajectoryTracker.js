import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../lib/api";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Download, Route, Clock, MapPin, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

const hopIcon = L.divIcon({
    className: "",
    html: '<div class="anpr-marker hop"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

const startIcon = L.divIcon({
    className: "",
    html: '<div class="anpr-marker"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

function FitBounds({ points }) {
    // handled inline via map key change on new points
    return null;
}

export default function TrajectoryTracker() {
    const [plate, setPlate] = useState("");
    const [hours, setHours] = useState("24");
    const [loading, setLoading] = useState(false);
    const [trajectory, setTrajectory] = useState(null);
    const [suggest, setSuggest] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/detections", { params: { limit: 12 } });
                const unique = [...new Set(data.map((d) => d.plate))];
                setSuggest(unique.slice(0, 6));
            } catch {}
        })();
    }, []);

    const doSearch = async (searchPlate) => {
        const q = (searchPlate ?? plate).trim();
        if (!q) return toast.error("Enter a plate to track");
        setLoading(true);
        try {
            const { data } = await api.get("/trajectory", { params: { plate: q, hours: parseInt(hours, 10) } });
            setTrajectory(data);
            if (data.hop_count === 0) toast.info("No detections found for this plate in the selected window");
            else toast.success(`Reconstructed route with ${data.hop_count} hops`);
        } catch (e) {
            toast.error("Trajectory query failed");
        } finally {
            setLoading(false);
        }
    };

    const exportCsv = () => {
        if (!trajectory?.hops?.length) return;
        const header = ["timestamp", "plate", "camera", "lat", "lng", "speed_kph", "confidence"];
        const rows = trajectory.hops.map((h) => [h.timestamp, h.plate, h.camera_name, h.lat, h.lng, h.speed_kph, h.confidence]);
        const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `trajectory_${trajectory.plate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Trajectory exported");
    };

    const points = useMemo(
        () => (trajectory?.hops || []).map((h) => [h.lat, h.lng]),
        [trajectory]
    );

    const center = points[0] || [12.9716, 77.5946];

    return (
        <div className="space-y-6" data-testid="trajectory-root">
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-mono-anpr mb-1.5">Trajectory Reconstruction</div>
                    <h1 className="font-display text-3xl font-bold">Vehicle Route Tracker</h1>
                    <p className="text-slate-400 text-sm mt-1">Chronologically reconstruct a vehicle's path across all cameras in the network.</p>
                </div>
            </div>

            <Card className="bg-[#111827] border-white/10 p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[240px]">
                        <label className="text-[10px] uppercase tracking-widest text-slate-400 font-mono-anpr">License plate</label>
                        <Input
                            data-testid="trajectory-search-input"
                            value={plate}
                            onChange={(e) => setPlate(e.target.value.toUpperCase())}
                            placeholder="e.g. KA05-AB-1234"
                            className="mt-1 bg-[#0b1220] border-white/10 font-mono-anpr uppercase"
                            onKeyDown={(e) => e.key === "Enter" && doSearch()}
                        />
                    </div>
                    <div className="w-40">
                        <label className="text-[10px] uppercase tracking-widest text-slate-400 font-mono-anpr">Time window</label>
                        <Select value={hours} onValueChange={setHours}>
                            <SelectTrigger data-testid="hours-select" className="mt-1 bg-[#0b1220] border-white/10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Last 1 hour</SelectItem>
                                <SelectItem value="6">Last 6 hours</SelectItem>
                                <SelectItem value="24">Last 24 hours</SelectItem>
                                <SelectItem value="168">Last 7 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={() => doSearch()}
                        data-testid="plate-search-btn"
                        disabled={loading}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-2" /> Track</>}
                    </Button>
                    {trajectory && (
                        <Button
                            variant="outline"
                            data-testid="export-trajectory-csv"
                            onClick={exportCsv}
                            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                        >
                            <Download className="w-4 h-4 mr-2" /> Export CSV
                        </Button>
                    )}
                </div>
                {suggest.length > 0 && !trajectory && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 mr-1 mt-1 font-mono-anpr">Try:</span>
                        {suggest.map((p) => (
                            <button
                                key={p}
                                onClick={() => { setPlate(p); doSearch(p); }}
                                className="text-xs px-2 py-1 rounded border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-slate-300 font-mono-anpr"
                                data-testid={`suggest-${p}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </Card>

            {trajectory && (
                <>
                    {/* Summary stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCell icon={Route} label="Hops" value={trajectory.hop_count} testid="stat-hops" />
                        <StatCell icon={MapPin} label="Distance" value={`${trajectory.total_distance_km} km`} testid="stat-distance" />
                        <StatCell
                            icon={Clock}
                            label="First seen"
                            value={trajectory.first_seen ? new Date(trajectory.first_seen).toLocaleTimeString() : "—"}
                            testid="stat-first"
                        />
                        <StatCell
                            icon={Zap}
                            label="Last seen"
                            value={trajectory.last_seen ? new Date(trajectory.last_seen).toLocaleTimeString() : "—"}
                            testid="stat-last"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Map */}
                        <Card className="lg:col-span-2 bg-[#111827] border-white/10 p-2 overflow-hidden">
                            <div className="h-[520px] rounded-lg overflow-hidden relative" data-testid="trajectory-map">
                                <MapContainer
                                    key={trajectory.plate + trajectory.hop_count}
                                    center={center}
                                    zoom={12}
                                    scrollWheelZoom={true}
                                    className="h-full w-full"
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                    {points.length > 1 && (
                                        <Polyline
                                            positions={points}
                                            pathOptions={{ color: "#00F0FF", weight: 3, opacity: 0.85, dashArray: "8 6" }}
                                        />
                                    )}
                                    {trajectory.hops.map((h, i) => (
                                        <Marker
                                            key={h.id}
                                            position={[h.lat, h.lng]}
                                            icon={i === 0 || i === trajectory.hops.length - 1 ? startIcon : hopIcon}
                                        >
                                            <Popup>
                                                <div className="text-xs">
                                                    <div className="font-semibold text-cyan-300 font-mono-anpr">{h.plate}</div>
                                                    <div>{h.camera_name}</div>
                                                    <div>{new Date(h.timestamp).toLocaleString()}</div>
                                                    <div>{h.speed_kph} kph · {h.direction}</div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>
                        </Card>

                        {/* Timeline */}
                        <Card className="bg-[#111827] border-white/10 p-5">
                            <div className="text-[11px] uppercase tracking-widest text-cyan-400 font-mono-anpr mb-4">Hop-by-hop timeline</div>
                            <div className="space-y-4 max-h-[520px] overflow-auto pr-1">
                                {trajectory.hops.map((h, i) => (
                                    <div key={h.id} className="relative pl-6" data-testid={`hop-${i}`}>
                                        <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.6)]" />
                                        {i < trajectory.hops.length - 1 && (
                                            <div className="absolute left-[5px] top-4 bottom-[-16px] w-px bg-cyan-500/30" />
                                        )}
                                        <div className="text-sm font-medium text-slate-200">{h.camera_name}</div>
                                        <div className="text-xs text-slate-500 font-mono-anpr mt-0.5">
                                            {new Date(h.timestamp).toLocaleTimeString()} · {h.speed_kph} kph · {h.direction}
                                        </div>
                                        {h.segment_from_prev && (
                                            <div className="text-[11px] mt-1 text-cyan-300 font-mono-anpr">
                                                +{h.segment_from_prev.distance_km} km · {h.segment_from_prev.minutes} min · {h.segment_from_prev.avg_kph} kph avg
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCell({ icon: Icon, label, value, testid }) {
    return (
        <Card data-testid={testid} className="bg-[#111827] border-white/10 p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Icon className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-mono-anpr">{label}</div>
                <div className="font-display text-lg font-semibold text-slate-100 truncate">{value}</div>
            </div>
        </Card>
    );
}
