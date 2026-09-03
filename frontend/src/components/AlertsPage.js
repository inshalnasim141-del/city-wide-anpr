import { useState } from "react";
import { Card } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import AlertsPanel from "./AlertsPanel";

export default function AlertsPage() {
    return (
        <div className="space-y-6" data-testid="alerts-page">
            <div>
                <div className="text-xs uppercase tracking-[0.3em] text-rose-400 font-mono-anpr mb-1.5">Alert Management</div>
                <h1 className="font-display text-3xl font-bold">Blacklist Hits & Anomalies</h1>
                <p className="text-slate-400 text-sm mt-1">Triage active alerts. Acknowledge, escalate or close incidents.</p>
            </div>
            <Card className="bg-[#111827] border-white/10 p-5">
                <Tabs defaultValue="open" className="w-full">
                    <TabsList className="bg-white/[0.03] border border-white/10">
                        <TabsTrigger value="open" data-testid="tab-open">Open</TabsTrigger>
                        <TabsTrigger value="acknowledged" data-testid="tab-ack">Acknowledged</TabsTrigger>
                        <TabsTrigger value="escalated" data-testid="tab-esc">Escalated</TabsTrigger>
                        <TabsTrigger value="closed" data-testid="tab-closed">Closed</TabsTrigger>
                    </TabsList>
                    {["open", "acknowledged", "escalated", "closed"].map((s) => (
                        <TabsContent key={s} value={s} className="mt-4">
                            <AlertsPanel statusFilter={s} tick={0} />
                        </TabsContent>
                    ))}
                </Tabs>
            </Card>
        </div>
    );
}
