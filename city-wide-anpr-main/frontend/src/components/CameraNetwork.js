import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../lib/api";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Camera as CameraIcon, WifiOff, Wifi } from "lucide-react";

const onlineIcon = L.divIcon({
    className: "",
    html: '<div class="anpr-marker"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});
const offlineIcon = L.divIcon({
    className: "",
    html: '<div class="anpr-marker offline"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

export default function CameraNetwork() {
    const [cams, setCams] = useState([]);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/cameras");
                setCams(data);
            } catch {}
        })();
    }, []);

    const filtered = useMemo(() => {
        if (filter === "all") return cams;
        return cams.filter((c) => c.status === filter);
    }, [cams, filter]);

    const online = cams.filter((c) => c.status === "online").length;

    return (
        <div className="space-y-6" data-testid="cameras-root">
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-mono-anpr mb-1.5">Camera Network</div>
                    <h1 className="font-display text-3xl font-bold">City-Wide ANPR Nodes</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {online}/{cams.length} nodes online across the metropolitan grid.
                    </p>
                </div>
                <div className="flex gap-1 p-1 bg-white/[0.03] rounded-lg border border-white/10">
                    {[
                        { k: "all", label: "All" },
                        { k: "online", label: "Online" },
                        { k: "offline", label: "Offline" },
                    ].map((f) => (
                        <button
                            key={f.k}
                            onClick={() => setFilter(f.k)}
                            data-testid={`camera-status-filter-${f.k}`}
                            className={`px-3 py-1.5 rounded text-xs uppercase tracking-widest font-mono-anpr transition-all ${
                                filter === f.k ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-slate-100"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 bg-[#111827] border-white/10 p-2 overflow-hidden">
                    <div className="h-[560px] rounded-lg overflow-hidden" data-testid="camera-map">
                        <MapContainer center={[12.9716, 77.5946]} zoom={11} scrollWheelZoom className="h-full w-full">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                            {filtered.map((c) => (
                                <Marker
                                    key={c.id}
                                    position={[c.lat, c.lng]}
                                    icon={c.status === "online" ? onlineIcon : offlineIcon}
                                >
                                    <Popup>
                                        <div className="text-xs">
                                            <div className="font-semibold text-cyan-300 font-mono-anpr">{c.id}</div>
                                            <div>{c.name}</div>
                                            <div>Status: {c.status}</div>
                                            <div>Direction: {c.direction} · FOV {c.fov_deg}°</div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </Card>

                <Card className="bg-[#111827] border-white/10 p-4">
                    <div className="text-[11px] uppercase tracking-widest text-cyan-400 font-mono-anpr mb-4">
                        Node registry · {filtered.length} nodes
                    </div>
                    <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                        {filtered.map((c) => (
                            <div
                                key={c.id}
                                data-testid={`camera-${c.id}`}
                                className="p-3 rounded-lg border border-white/10 bg-white/[0.02] hover:border-cyan-500/30 transition-all"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="font-mono-anpr text-sm text-slate-200">{c.id}</div>
                                    {c.status === "online" ? (
                                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] uppercase">
                                            <Wifi className="w-3 h-3 mr-1" /> online
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-rose-500/40 text-rose-400 text-[10px] uppercase">
                                            <WifiOff className="w-3 h-3 mr-1" /> offline
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-xs text-slate-300">{c.name}</div>
                                <div className="text-[10px] text-slate-500 mt-1 font-mono-anpr">
                                    {c.direction} · FOV {c.fov_deg}° · {c.lat.toFixed(3)}, {c.lng.toFixed(3)}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
