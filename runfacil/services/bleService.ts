import { HEART_RATE_SERVICE_UUID, HEART_RATE_CHAR_UUID } from '@/constants/ble';

export { HEART_RATE_SERVICE_UUID, HEART_RATE_CHAR_UUID };

// Parse heart rate value from BLE characteristic (array of bytes).
// Flags byte bit-0: 0 = 8-bit HR, 1 = 16-bit HR (little-endian).
export function parseHeartRate(value: number[]): number {
  const flags = value[0];
  return flags & 0x01 ? (value[2] << 8) | value[1] : value[1];
}
