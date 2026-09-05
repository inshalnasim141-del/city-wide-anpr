import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";
import { Radar, ShieldCheck, Loader2 } from "lucide-react";

const roles = [
    { email: "admin@anpr.city", password: "Admin@123", label: "System Admin", id: "role-admin" },
    { email: "operator@anpr.city", password: "Operator@123", label: "Traffic Operator", id: "role-operator" },
    { email: "investigator@anpr.city", password: "Investigator@123", label: "Investigator", id: "role-investigator" },
];

export default function LoginPage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (user) return <Navigate to="/dashboard" replace />;

    const doLogin = async (e) => {
        e?.preventDefault?.();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            toast.success("Access granted. Welcome to ANPR.CITY");
            navigate("/dashboard");
        } catch (err) {
            const msg = formatApiErrorDetail(err.response?.data?.detail) || err.message;
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (r) => {
        setEmail(r.email);
        setPassword(r.password);
    };

    return (
        <div className="min-h-screen relative overflow-hidden tactical-grid">
            <div className="absolute inset-0 bg-gradient-to-br from-[#090d16] via-[#0b1220] to-[#090d16]" />
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-3xl" />

            <div className="relative z-10 min-h-screen grid lg:grid-cols-2 gap-0">
                {/* Left: Brand panel */}
                <div className="hidden lg:flex flex-col justify-between p-12 border-r border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
                            <Radar className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <div className="font-display text-xl font-bold tracking-tight">ANPR.CITY</div>
                            <div className="text-xs uppercase tracking-[0.3em] text-slate-500 font-mono-anpr">
                                Command Grid v1.0
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
                            City-Wide<br />
                            <span className="text-cyan-400">Vehicle Trajectory</span><br />
                            Intelligence Engine
                        </h1>
                        <p className="text-slate-400 max-w-md leading-relaxed">
                            Multi-camera ANPR ingestion, cross-node trajectory reconstruction,
                            blacklist alerting and urban traffic analytics — unified in one tactical dashboard.
                        </p>
                        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400 font-mono-anpr">
                            <ShieldCheck className="w-4 h-4" />
                            RBAC · Audit logging · Encrypted at rest
                        </div>
                    </div>

                    <div className="text-[10px] uppercase tracking-[0.3em] text-slate-600 font-mono-anpr">
                        Restricted Access · Authorized Personnel Only
                    </div>
                </div>

                {/* Right: form */}
                <div className="flex items-center justify-center p-6 sm:p-12">
                    <Card className="w-full max-w-md bg-[#111827]/80 border-white/10 backdrop-blur p-8">
                        <div className="mb-6">
                            <div className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-mono-anpr mb-2">
                                Sign in
                            </div>
                            <h2 className="font-display text-2xl font-semibold">Access Command Grid</h2>
                            <p className="text-slate-400 text-sm mt-2">
                                Authenticate to view live detections, trajectories and alerts.
                            </p>
                        </div>

                        <form onSubmit={doLogin} className="space-y-4">
                            <div>
                                <Label htmlFor="email" className="text-slate-300 text-xs uppercase tracking-widest">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    data-testid="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1.5 bg-[#0b1220] border-white/10 focus-visible:ring-cyan-400"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="password" className="text-slate-300 text-xs uppercase tracking-widest">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    data-testid="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1.5 bg-[#0b1220] border-white/10 focus-visible:ring-cyan-400"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-rose-400 bg-rose-500/5 border border-rose-500/20 px-3 py-2 rounded-lg" data-testid="login-error">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                data-testid="login-submit-btn"
                                disabled={loading}
                                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-white/5">
                            <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3 font-mono-anpr">
                                Demo credentials · tap to autofill
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {roles.map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        data-testid={r.id}
                                        onClick={() => fillDemo(r)}
                                        className="text-xs px-2 py-2 rounded-md bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-slate-300 transition-all"
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
