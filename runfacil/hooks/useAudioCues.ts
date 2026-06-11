import { useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';
import { formatPace } from '@/constants/units';

// Announces each km milestone during a run using text-to-speech.
export function useAudioCues(enabled: boolean) {
  const lastKmRef = useRef(0);

  const checkMilestone = useCallback(
    (distanceMeters: number, paceSecPerKm: number) => {
      if (!enabled || distanceMeters < 100) return;
      const km = Math.floor(distanceMeters / 1000);
      if (km > lastKmRef.current) {
        lastKmRef.current = km;
        const pace = formatPace(paceSecPerKm);
        Speech.speak(`${km} quilômetro. Pace ${pace} por quilômetro.`, {
          language: 'pt-BR',
          rate: 0.9,
          pitch: 1.0,
        });
      }
    },
    [enabled]
  );

  const reset = useCallback(() => {
    lastKmRef.current = 0;
    Speech.stop();
  }, []);

  return { checkMilestone, reset };
}
