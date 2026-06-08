import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

export const LOCATION_TASK_NAME = 'runfacil-background-location';

type LocationTaskData = { locations: Location.LocationObject[] };

// Must be defined at module top-level and imported in app/_layout.tsx.
TaskManager.defineTask<LocationTaskData>(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('[LocationTask]', error.message);
    return;
  }
  if (data?.locations?.length) {
    // Phase 1: forward coordinates to RunContext via a global event emitter.
    // Coordinates: data.locations.map(l => ({ lat: l.coords.latitude, lng: l.coords.longitude, ... }))
  }
});
