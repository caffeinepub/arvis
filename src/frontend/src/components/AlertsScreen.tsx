import { Bell, CheckCircle, Loader2, MapPin, Trash2 } from "lucide-react";
import {
  AlertType,
  type GeofenceAlert,
  useClearAlerts,
  useGetRecentAlerts,
} from "../hooks/useQueries";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(nanos: bigint): string {
  const ms = Number(nanos) / 1_000_000;
  const diff = Date.now() - ms;
  const secs = Math.floor(diff / 1000);
  if (secs < 10) return "Just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function alertColorClass(type: AlertType): string {
  if (type === AlertType.returned) return "alert-back";
  return "alert-drift";
}

function alertIconColor(type: AlertType): string {
  if (type === AlertType.returned) return "#22c55e";
  return "#FF4081";
}

function alertBgColor(type: AlertType): string {
  if (type === AlertType.returned) return "rgba(34,197,94,0.06)";
  return "rgba(255,64,129,0.05)";
}

function AlertIcon({ type }: { type: AlertType }) {
  const color = alertIconColor(type);
  if (type === AlertType.returned) {
    return (
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(34,197,94,0.12)" }}
      >
        <CheckCircle size={18} style={{ color }} />
      </div>
    );
  }
  if (type === AlertType.out_of_range) {
    return (
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(255,64,129,0.12)" }}
      >
        <MapPin size={18} style={{ color }} />
      </div>
    );
  }
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: "rgba(255,64,129,0.12)" }}
    >
      <Bell size={18} style={{ color }} />
    </div>
  );
}

// ─── Alert card ───────────────────────────────────────────────────────────────

function AlertCard({ alert, index }: { alert: GeofenceAlert; index: number }) {
  return (
    <div
      className={[
        "bg-white rounded-2xl px-4 py-3.5 flex items-start gap-3 shadow-card overflow-hidden relative",
        alertColorClass(alert.alertType),
      ].join(" ")}
      style={{ background: `${alertBgColor(alert.alertType)} !important` }}
      data-ocid={`alerts.item.${index}`}
    >
      {/* Subtle tinted bg (override white for light tint) */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{ background: alertBgColor(alert.alertType), zIndex: 0 }}
      />
      <div className="relative z-10 flex items-start gap-3 w-full">
        <AlertIcon type={alert.alertType} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-arvis-navy leading-snug">
            {alert.message}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {alert.deviceName}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(alert.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── AlertsScreen ─────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const { data: alerts = [], isLoading, isError } = useGetRecentAlerts();
  const clearAlerts = useClearAlerts();

  const handleClearAll = () => {
    clearAlerts.mutate();
  };

  return (
    <div className="page-enter flex flex-col h-full pt-8 pb-4 px-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-arvis-navy tracking-tight">
            Alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {alerts.length > 0
              ? `${alerts.length} notification${alerts.length !== 1 ? "s" : ""}`
              : "All quiet"}
          </p>
        </div>
        {alerts.length > 0 && (
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-arvis-navy hover:bg-white transition-all duration-200"
            onClick={handleClearAll}
            disabled={clearAlerts.isPending}
            data-ocid="alerts.clear_button"
          >
            {clearAlerts.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
            Clear all
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <Loader2
            size={28}
            className="animate-spin"
            style={{ color: "#5BC8F5" }}
          />
          <p className="text-sm text-muted-foreground">Loading alerts…</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center"
          data-ocid="alerts.error_state"
        >
          <p className="text-sm text-red-500 font-medium">
            Couldn't load alerts. Please try again.
          </p>
        </div>
      )}

      {/* Alert list */}
      {!isLoading && !isError && (
        <div className="flex-1 overflow-y-auto">
          {alerts.length > 0 ? (
            <div className="flex flex-col gap-2.5" data-ocid="alerts.list">
              {[...alerts]
                .sort((a, b) => Number(b.timestamp - a.timestamp))
                .map((alert, i) => (
                  <AlertCard
                    key={Number(alert.id)}
                    alert={alert}
                    index={i + 1}
                  />
                ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-full gap-4 py-16"
              data-ocid="alerts.empty_state"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(91,200,245,0.1)" }}
              >
                <CheckCircle size={28} style={{ color: "#5BC8F5" }} />
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-arvis-navy text-base">
                  All clear!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your stickers are nearby.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
