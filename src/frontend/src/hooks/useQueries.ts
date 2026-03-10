import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Device, GeofenceAlert, GeofenceSettings } from "../backend.d";
import { AlertType } from "../backend.d";
import { useActor } from "./useActor";

// ─── Devices ────────────────────────────────────────────────────────────────

export function useGetAllDevices() {
  const { actor, isFetching } = useActor();
  return useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDevices();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
  });
}

export function useAddOrUpdateDevice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (device: Device) => {
      if (!actor) throw new Error("No actor");
      return actor.addOrUpdateDevice(device);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}

export function useDeleteDevice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteDevice(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export function useGetRecentAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery<GeofenceAlert[]>({
    queryKey: ["alerts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentAlerts();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
  });
}

export function useAddGeofenceAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      deviceId,
      deviceName,
      message,
      alertType,
    }: {
      deviceId: string;
      deviceName: string;
      message: string;
      alertType: AlertType;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addGeofenceAlert(deviceId, deviceName, message, alertType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useClearAlerts() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.clearAlerts();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

// ─── Geofence ────────────────────────────────────────────────────────────────

export function useGetGeofence(deviceId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<GeofenceSettings | null>({
    queryKey: ["geofence", deviceId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getGeofence(deviceId);
    },
    enabled: !!actor && !isFetching && !!deviceId,
  });
}

export function useSaveGeofence() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: GeofenceSettings) => {
      if (!actor) throw new Error("No actor");
      return actor.saveGeofence(settings);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["geofence", variables.deviceId],
      });
    },
  });
}

// ─── Scan interval ───────────────────────────────────────────────────────────

export function useGetScanInterval() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["scanInterval"],
    queryFn: async () => {
      if (!actor) return 5000n;
      return actor.getScanInterval();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Re-exports ──────────────────────────────────────────────────────────────
export { AlertType };
export type { Device, GeofenceAlert, GeofenceSettings };
