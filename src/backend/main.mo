import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Iter "mo:core/Iter";

actor {
  type Device = {
    id : Text;
    name : Text;
    rssi : Int;
    batteryPercent : Nat;
    lastSeen : Time.Time;
    isConnected : Bool;
  };

  type GeofenceSettings = {
    deviceId : Text;
    radiusMeters : Nat;
    isEnabled : Bool;
  };

  type GeofenceAlert = {
    id : Nat;
    deviceId : Text;
    deviceName : Text;
    message : Text;
    timestamp : Time.Time;
    alertType : AlertType;
  };

  type AlertType = {
    #drifting;
    #out_of_range;
    #returned;
  };

  public type UserProfile = {
    name : Text;
  };

  let devices = Map.empty<Text, Device>();
  let geofences = Map.empty<Text, GeofenceSettings>();
  let alerts = Map.empty<Nat, GeofenceAlert>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var scanInterval : Nat = 15;
  var alertCounter = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addOrUpdateDevice(device : Device) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add devices");
    };
    devices.add(device.id, device);
  };

  public query ({ caller }) func getDevice(id : Text) : async ?Device {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view devices");
    };
    devices.get(id);
  };

  public query ({ caller }) func getAllDevices() : async [Device] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view devices");
    };
    devices.values().toArray();
  };

  public shared ({ caller }) func deleteDevice(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete devices");
    };
    devices.remove(id);
  };

  public shared ({ caller }) func saveGeofence(settings : GeofenceSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save device settings");
    };
    geofences.add(settings.deviceId, settings);
  };

  public query ({ caller }) func getGeofence(deviceId : Text) : async ?GeofenceSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view geofence settings");
    };
    geofences.get(deviceId);
  };

  public shared ({ caller }) func addGeofenceAlert(deviceId : Text, deviceName : Text, message : Text, alertType : AlertType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create device events");
    };
    let alert = {
      id = alertCounter;
      deviceId;
      deviceName;
      message;
      timestamp = Time.now();
      alertType;
    };
    alerts.add(alertCounter, alert);
    alertCounter += 1;
  };

  public query ({ caller }) func getRecentAlerts() : async [GeofenceAlert] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view alerts");
    };
    let allAlerts = alerts.values().toArray();
    Array.tabulate<GeofenceAlert>(if (allAlerts.size() < 50) { allAlerts.size() } else { 50 }, func(i) { allAlerts[i] });
  };

  public shared ({ caller }) func clearAlerts() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can clear device events");
    };
    alerts.clear();
    alertCounter := 0;
  };

  public shared ({ caller }) func setScanInterval(interval : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update scan intervals");
    };
    scanInterval := interval;
  };

  public query ({ caller }) func getScanInterval() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view scan interval");
    };
    scanInterval;
  };
};
