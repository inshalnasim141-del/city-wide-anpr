import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./components/LoginPage";
import AppLayout from "./components/AppLayout";
import LiveDashboard from "./components/LiveDashboard";
import TrajectoryTracker from "./components/TrajectoryTracker";
import CameraNetwork from "./components/CameraNetwork";
import DetectionsPage from "./components/DetectionsPage";
import AlertsPage from "./components/AlertsPage";
import BlacklistPage from "./components/BlacklistPage";
import AnalyticsPage from "./components/AnalyticsPage";
import "./App.css";

function Protected({ children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#090d16]">
                <div className="text-slate-500 text-sm font-mono-anpr uppercase tracking-widest">Booting Command Grid...</div>
            </div>
        );
    }
    if (!user) return <Navigate to="/login" replace />;
    return <AppLayout>{children}</AppLayout>;
}

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <AuthProvider>
                    <Toaster theme="dark" position="top-right" richColors />
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/dashboard" element={<Protected><LiveDashboard /></Protected>} />
                        <Route path="/trajectory" element={<Protected><TrajectoryTracker /></Protected>} />
                        <Route path="/cameras" element={<Protected><CameraNetwork /></Protected>} />
                        <Route path="/detections" element={<Protected><DetectionsPage /></Protected>} />
                        <Route path="/alerts" element={<Protected><AlertsPage /></Protected>} />
                        <Route path="/blacklist" element={<Protected><BlacklistPage /></Protected>} />
                        <Route path="/analytics" element={<Protected><AnalyticsPage /></Protected>} />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
