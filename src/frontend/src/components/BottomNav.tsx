import { Bell, Home, LayoutGrid } from "lucide-react";

type Tab = "radar" | "dashboard" | "alerts";

interface NavItem {
  id: Tab;
  label: string;
  icon: React.FC<{ size: number; strokeWidth: number }>;
  ocid: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "radar", label: "Radar", icon: Home, ocid: "nav.radar.link" },
  {
    id: "dashboard",
    label: "Devices",
    icon: LayoutGrid,
    ocid: "nav.dashboard.link",
  },
  { id: "alerts", label: "Alerts", icon: Bell, ocid: "nav.alerts.link" },
];

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  alertCount?: number;
}

export default function BottomNav({
  activeTab,
  onTabChange,
  alertCount = 0,
}: BottomNavProps) {
  return (
    <nav
      className="flex items-center justify-around bg-white border-t border-gray-100 shadow-soft safe-area-bottom"
      style={{ height: 68, flexShrink: 0 }}
    >
      {NAV_ITEMS.map((item) => {
        const active = activeTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className="relative flex flex-col items-center justify-center gap-1 min-w-[68px] h-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arvis-pink rounded-xl"
            onClick={() => onTabChange(item.id)}
            data-ocid={item.ocid}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
          >
            {/* Active indicator dot */}
            {active && (
              <div
                className="absolute top-2 w-1 h-1 rounded-full"
                style={{ background: "#FF4081" }}
              />
            )}

            {/* Badge for alerts */}
            {item.id === "alerts" && alertCount > 0 && (
              <div
                className="absolute top-2.5 right-3.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
                style={{ background: "#FF4081", fontSize: 9, fontWeight: 700 }}
              >
                {alertCount > 9 ? "9+" : alertCount}
              </div>
            )}

            <div
              style={{
                marginTop: active ? 2 : 0,
                transition: "margin 0.2s ease",
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            </div>
            <span
              className="text-[10px] font-semibold tracking-wide transition-all duration-200"
              style={{
                color: active ? "#0D1B4B" : "#B0B8C1",
                // Override for Icon color via parent
              }}
            >
              {item.label}
            </span>

            {/* Hidden icon wrapper used for coloring */}
            <style>{`
              button[data-ocid="${item.ocid}"] svg {
                color: ${active ? "#0D1B4B" : "#B0B8C1"};
                transition: color 0.2s ease;
              }
            `}</style>
          </button>
        );
      })}
    </nav>
  );
}

export type { Tab };
