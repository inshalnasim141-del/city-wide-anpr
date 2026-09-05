import { useState } from "react";
import { Card } from "./ui/card";
import DetectionFeedTable from "./DetectionFeedTable";
import { Input } from "./ui/input";

export default function DetectionsPage() {
    const [plate, setPlate] = useState("");
    return (
        <div className="space-y-6" data-testid="detections-page">
            <div>
                <div className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-mono-anpr mb-1.5">Detection Feed</div>
                <h1 className="font-display text-3xl font-bold">All ANPR Reads</h1>
                <p className="text-slate-400 text-sm mt-1">Streaming plate reads with camera and confidence scoring.</p>
            </div>
            <Card className="bg-[#111827] border-white/10 p-5">
                <Input
                    data-testid="detections-filter"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="Filter by plate (partial match)..."
                    className="mb-4 bg-[#0b1220] border-white/10 font-mono-anpr uppercase max-w-md"
                />
                <DetectionFeedTable limit={100} plate={plate || undefined} tick={0} />
            </Card>
        </div>
    );
}
