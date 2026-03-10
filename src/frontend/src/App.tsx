import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AlertsScreen from "./components/AlertsScreen";
import BottomNav, { type Tab } from "./components/BottomNav";
import DashboardScreen from "./components/DashboardScreen";
import RadarScreen from "./components/RadarScreen";
import SplashScreen from "./components/SplashScreen";
import { useGetRecentAlerts } from "./hooks/useQueries";

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>("radar");
  const { data: alerts = [] } = useGetRecentAlerts();

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <div
      className="arvis-bg flex flex-col"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      {/* Main content area */}
      <main
        className="flex-1 overflow-hidden relative"
        style={{ minHeight: 0 }}
      >
        <div className="h-full overflow-y-auto" style={{ paddingBottom: 0 }}>
          <div className="max-w-sm mx-auto h-full">
            {activeTab === "radar" && <RadarScreen key="radar" />}
            {activeTab === "dashboard" && <DashboardScreen key="dashboard" />}
            {activeTab === "alerts" && <AlertsScreen key="alerts" />}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="max-w-sm mx-auto w-full">
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          alertCount={alerts.length}
        />
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "white",
            border: "1px solid rgba(91,200,245,0.3)",
            color: "#0D1B4B",
            fontFamily: "Figtree, sans-serif",
          },
        }}
      />
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <AppContent />
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
    </>
  );
}
