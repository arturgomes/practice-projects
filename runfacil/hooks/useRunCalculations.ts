import { useCallback, useRef } from 'react';
import { Coordinate } from '@/store/RunContext';
import { haversineDistance } from '@/constants/units';

export function useRunCalculations() {
  const paceWindowRef = useRef<{ distance: number; timestamp: number }[]>([]);

  const calculateDistance = useCallback((coordinates: Coordinate[]): number => {
    if (coordinates.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const prev = coordinates[i - 1];
      const curr = coordinates[i];
      if ((curr.accuracy ?? 0) > 30) continue;
      total += haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    }
    return total;
  }, []);

  // Rolling 500m window for a stable pace reading.
  const calculatePace = useCallback(
    (totalDistance: number): number => {
      if (totalDistance < 100) return 0;
      const window = paceWindowRef.current;
      window.push({ distance: totalDistance, timestamp: Date.now() });
      while (window.length > 1 && totalDistance - window[0].distance > 500) {
        window.shift();
      }
      if (window.length < 2) return 0;
      const distDelta = window[window.length - 1].distance - window[0].distance;
      const timeDelta =
        (window[window.length - 1].timestamp - window[0].timestamp) / 1000;
      if (distDelta < 10) return 0;
      return (timeDelta / distDelta) * 1000;
    },
    []
  );

  const resetPaceWindow = useCallback(() => {
    paceWindowRef.current = [];
  }, []);

  return { calculateDistance, calculatePace, resetPaceWindow };
}
