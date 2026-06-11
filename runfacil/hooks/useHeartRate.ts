import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { HEART_RATE_SERVICE_UUID, HEART_RATE_CHAR_UUID } from '@/constants/ble';
import { parseHeartRate } from '@/services/bleService';

// Module-level BleManager singleton — never create inside the hook.
let bleManager: any = null;
if (Platform.OS !== 'web') {
  try {
    const { BleManager } = require('react-native-ble-plx');
    bleManager = new BleManager();
  } catch (e) {
    console.warn('[BLE] react-native-ble-plx unavailable', e);
  }
}

function b64ToBytes(b64: string): number[] {
  try {
    const bin = atob(b64);
    return Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return [];
  }
}

export function useHeartRate() {
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const deviceRef = useRef<any>(null);
  const monitorRef = useRef<any>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const results = await PermissionsAndroid.requestMultiple([
        'android.permission.BLUETOOTH_SCAN' as any,
        'android.permission.BLUETOOTH_CONNECT' as any,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(results).every((v) => v === 'granted');
    } catch {
      return false;
    }
  }, []);

  const connectToDevice = useCallback(async (device: any) => {
    try {
      const conn = await device.connect({ requestMTU: 512 });
      await conn.discoverAllServicesAndCharacteristics();
      deviceRef.current = conn;
      setIsConnected(true);

      monitorRef.current = conn.monitorCharacteristicForService(
        HEART_RATE_SERVICE_UUID,
        HEART_RATE_CHAR_UUID,
        (_: any, char: any) => {
          if (!char?.value) return;
          const hr = parseHeartRate(b64ToBytes(char.value));
          // Sanity-check the reading before dispatching.
          if (hr > 30 && hr < 250) setHeartRate(hr);
        }
      );
    } catch (e) {
      console.warn('[BLE] connect error', e);
      setIsConnected(false);
    }
  }, []);

  const startScan = useCallback(async () => {
    if (!bleManager || isConnected) return;
    const ok = await requestPermissions();
    if (!ok) return;

    setIsScanning(true);
    bleManager.startDeviceScan(
      [HEART_RATE_SERVICE_UUID],
      { allowDuplicates: false },
      (error: any, device: any) => {
        if (error) {
          console.warn('[BLE] scan error', error);
          setIsScanning(false);
          return;
        }
        if (device) {
          bleManager.stopDeviceScan();
          setIsScanning(false);
          if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
          connectToDevice(device);
        }
      }
    );

    // Auto-stop scan after 15 s to preserve battery.
    scanTimerRef.current = setTimeout(() => {
      bleManager?.stopDeviceScan();
      setIsScanning(false);
    }, 15000);
  }, [isConnected, requestPermissions, connectToDevice]);

  const stopScan = useCallback(() => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    bleManager?.stopDeviceScan();
    setIsScanning(false);
  }, []);

  const disconnect = useCallback(async () => {
    monitorRef.current?.remove();
    monitorRef.current = null;
    if (deviceRef.current) {
      await deviceRef.current.cancelConnection().catch(() => {});
      deviceRef.current = null;
    }
    setIsConnected(false);
    setHeartRate(null);
  }, []);

  useEffect(
    () => () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      monitorRef.current?.remove();
      deviceRef.current?.cancelConnection().catch(() => {});
    },
    []
  );

  return { heartRate, isConnected, isScanning, startScan, stopScan, disconnect };
}
