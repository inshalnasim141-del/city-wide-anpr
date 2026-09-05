import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LayoutDashboard,
    Route,
    Camera,
    Siren,
    ScanLine,
    BarChart3,
    ShieldAlert,
    LogOut,
    Radar,
} from "lucide-react";
import { Button } from "./ui/button";

const items = [
    { to: "/dashboard", label: "Live Operations", icon: LayoutDashboard, id: "nav-dashboard" },
    { to: "/trajectory", label: "Trajectory Tracker", icon: Route, id: "nav-trajectory" },
    { to: "/cameras", label: "Camera Network", icon: Camera, id: "nav-cameras" },
    { to: "/detections", label: "Detection Feed", icon: ScanLine, id: "nav-detections" },
    { to: "/alerts", label: "Alerts", icon: Siren, id: "nav-alerts" },
    { to: "/blacklist", label: "Blacklist", icon: ShieldAlert, id: "nav-blacklist" },
    { to: "/analytics", label: "Analytics", icon: BarChart3, id: "nav-analytics" },
];

export default function AppLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const doLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-64 shrink-0 bg-[#0d1322] border-r border-white/5 flex flex-col">
                <div className="h-16 px-5 flex items-center gap-3 border-b border-white/5">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
                        <Radar className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <div className="font-display font-bold text-sm tracking-tight">ANPR.CITY</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Command Grid</div>
                    </div>
                </div>
                <nav className="flex-1 p-3 space-y-1">
                    {items.map((it) => (
                        <NavLink
                            key={it.to}
                            to={it.to}
                            data-testid={it.id}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                                    isActive
                                        ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.08)]"
                                        : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
                                }`
                            }
                        >
                            <it.icon className="w-4 h-4" />
                            <span>{it.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="p-3 border-t border-white/5">
                    <div className="px-3 py-2 rounded-lg bg-white/[0.03] mb-2">
                        <div className="text-xs text-slate-400" data-testid="user-name">{user?.name}</div>
                        <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-mono-anpr" data-testid="user-role">
                            {user?.role}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={doLogout}
                        data-testid="logout-btn"
                        className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-500/5"
                    >
                        <LogOut className="w-4 h-4 mr-2" /> Sign out
                    </Button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-white/5 bg-[#0d1322]/60 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="pulse-dot" />
                        <span className="text-xs uppercase tracking-[0.25em] text-slate-400 font-mono-anpr">
                            System Nominal · Live Ingest
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono-anpr" data-testid="clock">
                        {new Date().toLocaleString()}
                    </div>
                </header>
                <div className="flex-1 p-6 overflow-auto">{children}</div>
            </main>
        </div>
    );
}
