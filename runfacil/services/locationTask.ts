import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { DeviceEventEmitter } from 'react-native';

export const LOCATION_TASK_NAME = 'runfacil-background-location';
export const LOCATION_UPDATE_EVENT = 'RUNFACIL_LOCATION_UPDATE';

type LocationTaskData = { locations: Location.LocationObject[] };

// Must be defined at module top-level; imported once in app/_layout.tsx.
TaskManager.defineTask<LocationTaskData>(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('[LocationTask]', error.message);
    return;
  }
  if (data?.locations?.length) {
    for (const loc of data.locations) {
      DeviceEventEmitter.emit(LOCATION_UPDATE_EVENT, {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        timestamp: loc.timestamp,
        accuracy: loc.coords.accuracy ?? undefined,
      });
    }
  }
});
