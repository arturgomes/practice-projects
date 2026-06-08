// Phase 6: BLE heart rate integration via react-native-ble-plx
// Connects to a paired device and streams live heart rate readings.
export function useHeartRate() {
  return {
    heartRate: null as number | null,
    isConnected: false,
    isScanning: false,
    startScan: async () => {},
    stopScan: () => {},
    disconnect: async () => {},
  };
}
