import { useEffect, useState } from "react";
import api from "../lib/api";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function HourlyFlowChart({ tick }) {
    const [data, setData] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/analytics/hourly");
                setData(data);
            } catch (e) { /* ignore */ }
        })();
    }, [tick]);

    return (
        <div className="h-64" data-testid="hourly-chart">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                    <defs>
                        <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#00F0FF" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <XAxis dataKey="hour" stroke="#64748B" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                    <Tooltip
                        contentStyle={{
                            background: "#0b1220",
                            border: "1px solid rgba(0,240,255,0.3)",
                            borderRadius: 8,
                            color: "#F8FAFC",
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#00F0FF"
                        strokeWidth={2}
                        fill="url(#cyanGrad)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
