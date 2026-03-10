import { Switch } from "@/components/ui/switch";
import { Clock, Loader2, MapPin, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  type Device,
  useDeleteDevice,
  useGetAllDevices,
  useGetGeofence,
  useSaveGeofence,
} from "../hooks/useQueries";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rssiToDistance(rssi: number): string {
  const txPower = -59;
  const n = 2;
  const dist = 10 ** ((txPower - rssi) / (10 * n));
  if (dist > 20) return "Out of Range";
  return `~${dist.toFixed(1)}m away`;
}

function formatLastSeen(nanos: bigint): string {
  const ms = Number(nanos) / 1_000_000;
  const diff = Date.now() - ms;
  const secs = Math.floor(diff / 1000);
  if (secs < 10) return "Just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

// ─── Geofence row ─────────────────────────────────────────────────────────────

function GeofenceToggle({
  deviceId,
  index,
}: {
  deviceId: string;
  index: number;
}) {
  const { data: geofence, isLoading } = useGetGeofence(deviceId);
  const saveGeofence = useSaveGeofence();

  const isEnabled = geofence?.isEnabled ?? false;

  const handleToggle = async (enabled: boolean) => {
    await saveGeofence.mutateAsync({
      deviceId,
      isEnabled: enabled,
      radiusMeters: geofence?.radiusMeters ?? 50n,
    });
  };

  if (isLoading)
    return <Loader2 size={14} className="animate-spin text-muted-foreground" />;

  return (
    <div className="flex items-center gap-2">
      <MapPin size={12} style={{ color: isEnabled ? "#FF4081" : "#B0B8C1" }} />
      <span
        className="text-xs font-medium"
        style={{ color: isEnabled ? "#FF4081" : "#B0B8C1" }}
      >
        Geofence
      </span>
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        data-ocid={`dashboard.geofence.toggle.${index}`}
        style={
          isEnabled
            ? ({
                "--switch-thumb": "white",
                "--switch-track": "#FF4081",
              } as React.CSSProperties)
            : {}
        }
        className={isEnabled ? "[&>[data-state=checked]]:bg-[#FF4081]" : ""}
      />
    </div>
  );
}

// ─── Device card ─────────────────────────────────────────────────────────────

function DeviceCard({
  device,
  index,
}: {
  device: Device;
  index: number;
}) {
  const deleteDevice = useDeleteDevice();
  const rssi = Number(device.rssi);
  const battery = Number(device.batteryPercent);
  const distance = rssiToDistance(rssi);
  const lastSeen = formatLastSeen(device.lastSeen);

  return (
    <div
      className="bg-white rounded-3xl p-5 shadow-card border border-white/80 transition-all duration-200 hover:shadow-soft"
      data-ocid={`dashboard.item.${index}`}
    >
      {/* Row 1: name + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              background: device.isConnected ? "#22c55e" : "#FF4081",
              boxShadow: device.isConnected
                ? "0 0 6px rgba(34,197,94,0.5)"
                : "0 0 6px rgba(255,64,129,0.5)",
            }}
          />
          <span className="font-display font-bold text-arvis-navy text-sm">
            {device.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{
              background: device.isConnected
                ? "rgba(34,197,94,0.1)"
                : "rgba(255,64,129,0.1)",
              color: device.isConnected ? "#16a34a" : "#FF4081",
            }}
          >
            {device.isConnected ? "Connected" : "Offline"}
          </span>
          <button
            type="button"
            className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
            onClick={() => deleteDevice.mutate(device.id)}
            data-ocid={`dashboard.item.${index}`}
            aria-label="Remove device"
          >
            <Trash2
              size={13}
              className="text-muted-foreground hover:text-red-400 transition-colors"
            />
          </button>
        </div>
      </div>

      {/* Row 2: Distance */}
      <div className="flex items-center gap-1.5 mb-3">
        <MapPin size={13} style={{ color: "#5BC8F5" }} />
        <span className="text-sm text-arvis-navy font-medium">{distance}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {rssi} dBm
        </span>
      </div>

      {/* Row 3: Solar Battery */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Sun size={13} style={{ color: "#FF4081" }} />
            <span className="text-xs text-muted-foreground font-medium">
              Solar Battery
            </span>
          </div>
          <span
            className="text-xs font-semibold"
            style={{
              color:
                battery > 50 ? "#5BC8F5" : battery > 20 ? "#FF4081" : "#ef4444",
            }}
          >
            {battery}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full battery-bar transition-all duration-500"
            style={{ width: `${battery}%` }}
          />
        </div>
      </div>

      {/* Row 4: Last seen + Geofence */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{lastSeen}</span>
        </div>
        <GeofenceToggle deviceId={device.id} index={index} />
      </div>
    </div>
  );
}

// ─── DashboardScreen ─────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { data: devices = [], isLoading, isError } = useGetAllDevices();
  const [_filter, _setFilter] = useState<"all" | "connected">("all");

  const filtered = devices;

  return (
    <div className="page-enter flex flex-col h-full pt-8 pb-4 px-5">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-arvis-navy tracking-tight">
          My Stickers
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {devices.length} device{devices.length !== 1 ? "s" : ""} tracked
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          className="flex flex-col items-center justify-center flex-1 gap-3"
          data-ocid="dashboard.loading_state"
        >
          <Loader2
            size={28}
            className="animate-spin"
            style={{ color: "#5BC8F5" }}
          />
          <p className="text-sm text-muted-foreground">Loading devices…</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center"
          data-ocid="dashboard.error_state"
        >
          <p className="text-sm text-red-500 font-medium">
            Couldn't load devices. Please try again.
          </p>
        </div>
      )}

      {/* Device list */}
      {!isLoading && !isError && (
        <div className="flex-1 overflow-y-auto">
          {filtered.length > 0 ? (
            <div className="flex flex-col gap-3" data-ocid="dashboard.list">
              {filtered.map((device, i) => (
                <DeviceCard key={device.id} device={device} index={i + 1} />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center flex-1 h-full gap-4 py-16"
              data-ocid="dashboard.empty_state"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(91,200,245,0.12)" }}
              >
                <Sun size={28} style={{ color: "#5BC8F5" }} />
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-arvis-navy text-base">
                  No stickers found
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tap SCAN on the Radar tab to start.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
