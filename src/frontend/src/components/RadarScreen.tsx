import { Signal, Wifi } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertType,
  useAddGeofenceAlert,
  useAddOrUpdateDevice,
  useGetAllDevices,
} from "../hooks/useQueries";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rssiToDistance(rssi: number): string {
  // distance = 10^((TxPower - RSSI) / (10 * n)), TxPower=-59, n=2
  const txPower = -59;
  const n = 2;
  const dist = 10 ** ((txPower - rssi) / (10 * n));
  if (dist > 20) return "Out of Range";
  return `~${dist.toFixed(1)}m away`;
}

function signalBars(rssi: number) {
  if (rssi >= -60) return 4;
  if (rssi >= -70) return 3;
  if (rssi >= -80) return 2;
  return 1;
}

// ─── Radar ring component ─────────────────────────────────────────────────

function RadarRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {([0.85, 0.6, 0.35] as const).map((scale) => (
        <div
          key={scale}
          className="absolute rounded-full border"
          style={{
            width: `${scale * 100}%`,
            height: `${scale * 100}%`,
            borderColor: `rgba(91, 200, 245, ${scale === 0.85 ? 0.25 : scale === 0.6 ? 0.37 : 0.49})`,
            background: `rgba(91, 200, 245, ${scale === 0.85 ? 0.04 : scale === 0.6 ? 0.06 : 0.08})`,
          }}
        />
      ))}
      {/* Cross-hair lines */}
      <div
        className="absolute w-full h-px"
        style={{ background: "rgba(91,200,245,0.18)" }}
      />
      <div
        className="absolute h-full w-px"
        style={{ background: "rgba(91,200,245,0.18)" }}
      />
    </div>
  );
}

// ─── Sweep line ──────────────────────────────────────────────────────────────

function SweepLine({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      className="absolute inset-0 rounded-full radar-sweep overflow-hidden"
      style={{ transformOrigin: "center" }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 270deg, rgba(255,64,129,0.08) 300deg, rgba(255,64,129,0.32) 360deg)",
        }}
      />
    </div>
  );
}

// ─── Tracking dot ────────────────────────────────────────────────────────────

function TrackingDot({
  active,
  angle,
  orbitRadius,
}: {
  active: boolean;
  angle: number;
  orbitRadius: number;
}) {
  if (!active) return null;
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * orbitRadius;
  const y = Math.sin(rad) * orbitRadius;

  return (
    <div
      className="absolute"
      style={{
        left: "50%",
        top: "50%",
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        transition: "transform 0.5s ease",
      }}
    >
      {/* Outer glow */}
      <div
        className="absolute rounded-full pulse-ring"
        style={{
          width: 20,
          height: 20,
          top: -4,
          left: -4,
          background: "rgba(255,64,129,0.25)",
          pointerEvents: "none",
        }}
      />
      {/* Core dot */}
      <div
        className="w-3 h-3 rounded-full"
        style={{
          background: "#FF4081",
          boxShadow: "0 0 12px 4px rgba(255,64,129,0.55)",
        }}
      />
    </div>
  );
}

// ─── Signal bar icons ─────────────────────────────────────────────────────────

function SignalBarsIcon({ bars }: { bars: number }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map((b) => (
        <div
          key={b}
          className="w-1 rounded-sm transition-all duration-300"
          style={{
            height: `${(b / 4) * 100}%`,
            background:
              b <= bars
                ? "linear-gradient(to top, #5BC8F5, #FF4081)"
                : "rgba(176,184,193,0.4)",
          }}
        />
      ))}
    </div>
  );
}

// ─── RadarScreen ─────────────────────────────────────────────────────────────

export default function RadarScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [rssi, setRssi] = useState<number | null>(null);
  const [dotAngle, setDotAngle] = useState(45);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanCountRef = useRef(0);
  const prevRssiRef = useRef<number | null>(null);

  const addOrUpdateDevice = useAddOrUpdateDevice();
  const addGeofenceAlert = useAddGeofenceAlert();
  const { refetch: refetchDevices } = useGetAllDevices();

  const stopScan = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
    scanCountRef.current = 0;
  }, []);

  const startScan = useCallback(() => {
    setIsScanning(true);
    scanCountRef.current = 0;

    const runScanStep = async () => {
      const newRssi = randomBetween(-45, -85);
      const newBattery = randomBetween(20, 95);
      const now = BigInt(Date.now()) * 1_000_000n;

      const device = {
        id: "arvis-001",
        name: "Arvis Solar Sticker",
        rssi: BigInt(newRssi),
        batteryPercent: BigInt(newBattery),
        lastSeen: now,
        isConnected: true,
      };

      setRssi(newRssi);
      setDeviceName(device.name);
      setDotAngle((prev) => prev + randomBetween(40, 90));

      try {
        await addOrUpdateDevice.mutateAsync(device);

        // Geofence logic
        const prev = prevRssiRef.current;
        if (newRssi < -75) {
          await addGeofenceAlert.mutateAsync({
            deviceId: "arvis-001",
            deviceName: "Arvis Solar Sticker",
            message: "Arvis is drifting away",
            alertType: AlertType.drifting,
          });
        } else if (prev !== null && prev < -65 && newRssi >= -65) {
          await addGeofenceAlert.mutateAsync({
            deviceId: "arvis-001",
            deviceName: "Arvis Solar Sticker",
            message: "Arvis is back in range",
            alertType: AlertType.returned,
          });
        }
        prevRssiRef.current = newRssi;
        refetchDevices();
      } catch {
        // Fail silently — simulation continues
      }

      scanCountRef.current += 1;
      if (scanCountRef.current >= 3) {
        stopScan();
      }
    };

    runScanStep();
    scanIntervalRef.current = setInterval(runScanStep, 2000);
  }, [addOrUpdateDevice, addGeofenceAlert, refetchDevices, stopScan]);

  const toggleScan = () => {
    if (isScanning) {
      stopScan();
    } else {
      startScan();
    }
  };

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const bars = rssi !== null ? signalBars(rssi) : 0;
  const distance = rssi !== null ? rssiToDistance(rssi) : null;
  const RADAR_SIZE = 288;
  const ORBIT_R = 82;

  return (
    <div className="page-enter flex flex-col items-center justify-between h-full pt-8 pb-4 px-6">
      {/* Header */}
      <div className="w-full text-center">
        <h1 className="font-display text-2xl font-bold text-arvis-navy tracking-tight">
          Arvis
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">BLE Tracker</p>
      </div>

      {/* Radar */}
      <div className="flex flex-col items-center gap-5 flex-1 justify-center">
        <div
          className="relative rounded-full radar-glass shadow-sky-glow"
          style={{ width: RADAR_SIZE, height: RADAR_SIZE }}
          data-ocid="radar.canvas_target"
        >
          <RadarRings />
          <SweepLine active={isScanning} />
          <TrackingDot
            active={isScanning || rssi !== null}
            angle={dotAngle}
            orbitRadius={ORBIT_R}
          />

          {/* RSSI label in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {rssi !== null ? (
              <>
                <span
                  className="text-xs font-medium"
                  style={{ color: "rgba(13,27,75,0.5)" }}
                  data-ocid="radar.rssi_card"
                >
                  {rssi} dBm
                </span>
                {distance && (
                  <span
                    className="text-xs mt-0.5"
                    style={{ color: "rgba(13,27,75,0.35)" }}
                  >
                    {distance}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs" style={{ color: "rgba(13,27,75,0.3)" }}>
                {isScanning ? "Scanning…" : "No signal"}
              </span>
            )}
          </div>
        </div>

        {/* Device info */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="font-display font-semibold text-arvis-navy text-base">
            {deviceName ?? "Arvis Solar Sticker"}
          </p>
          {rssi !== null ? (
            <div className="flex items-center gap-2">
              <SignalBarsIcon bars={bars} />
              <span className="text-xs text-muted-foreground font-medium">
                {rssi} dBm
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Wifi size={13} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Tap SCAN to detect
              </span>
            </div>
          )}
          {rssi !== null && distance && (
            <span className="text-xs text-muted-foreground">{distance}</span>
          )}
        </div>

        {/* Scan button */}
        <div className="relative flex items-center justify-center mt-2">
          {isScanning && (
            <div
              className="absolute rounded-full pulse-ring"
              style={{
                width: 80,
                height: 80,
                background: "rgba(255,64,129,0.2)",
                zIndex: 0,
              }}
            />
          )}
          <button
            type="button"
            className={[
              "relative z-10 px-10 py-4 rounded-full font-display font-semibold text-arvis-navy text-base",
              "bg-white shadow-soft transition-all duration-200",
              "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arvis-pink",
              isScanning ? "scan-pulsing" : "",
            ].join(" ")}
            onClick={toggleScan}
            data-ocid="radar.scan_button"
          >
            {isScanning ? (
              <span className="flex items-center gap-2">
                <Signal
                  size={16}
                  className="animate-pulse"
                  style={{ color: "#FF4081" }}
                />
                SCANNING…
              </span>
            ) : (
              "SCAN"
            )}
          </button>
        </div>
      </div>

      {/* Status strip */}
      <div className="w-full rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-3 flex items-center gap-3 shadow-card">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: isScanning ? "#FF4081" : "#22c55e",
            boxShadow: isScanning
              ? "0 0 6px 2px rgba(255,64,129,0.5)"
              : "0 0 6px 2px rgba(34,197,94,0.4)",
          }}
        />
        <span className="text-xs text-arvis-navy font-medium">
          {isScanning
            ? "BLE scan in progress…"
            : rssi !== null
              ? "Device found · Idle"
              : "Ready to scan"}
        </span>
      </div>
    </div>
  );
}
