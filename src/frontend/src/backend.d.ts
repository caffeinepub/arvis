import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface GeofenceAlert {
    id: bigint;
    alertType: AlertType;
    message: string;
    deviceId: string;
    timestamp: Time;
    deviceName: string;
}
export interface GeofenceSettings {
    isEnabled: boolean;
    deviceId: string;
    radiusMeters: bigint;
}
export interface UserProfile {
    name: string;
}
export interface Device {
    id: string;
    batteryPercent: bigint;
    name: string;
    rssi: bigint;
    isConnected: boolean;
    lastSeen: Time;
}
export enum AlertType {
    out_of_range = "out_of_range",
    drifting = "drifting",
    returned = "returned"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addGeofenceAlert(deviceId: string, deviceName: string, message: string, alertType: AlertType): Promise<void>;
    addOrUpdateDevice(device: Device): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearAlerts(): Promise<void>;
    deleteDevice(id: string): Promise<void>;
    getAllDevices(): Promise<Array<Device>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDevice(id: string): Promise<Device | null>;
    getGeofence(deviceId: string): Promise<GeofenceSettings | null>;
    getRecentAlerts(): Promise<Array<GeofenceAlert>>;
    getScanInterval(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveGeofence(settings: GeofenceSettings): Promise<void>;
    setScanInterval(interval: bigint): Promise<void>;
}
