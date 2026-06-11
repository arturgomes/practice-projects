import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Map,
  Camera,
  UserLocation,
  GeoJSONSource,
  Layer,
  type LngLatBounds,
} from '@maplibre/maplibre-react-native';
import { Coordinate } from '@/store/RunContext';

// Free OpenStreetMap-based style via OpenFreeMap — no API key required.
const OSM_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

type Props = {
  coordinates: Coordinate[];
  mode?: 'live' | 'static';
};

export function RunMap({ coordinates, mode = 'live' }: Props) {
  const lineGeoJSON = useMemo(() => {
    if (coordinates.length < 2) return null;
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates.map((c) => [c.lng, c.lat]),
      },
      properties: {},
    } as GeoJSON.Feature;
  }, [coordinates]);

  // LngLatBounds = [west, south, east, north]
  const cameraBounds = useMemo<LngLatBounds | undefined>(() => {
    if (mode !== 'static' || coordinates.length < 2) return undefined;
    const lats = coordinates.map((c) => c.lat);
    const lngs = coordinates.map((c) => c.lng);
    return [
      Math.min(...lngs),
      Math.min(...lats),
      Math.max(...lngs),
      Math.max(...lats),
    ];
  }, [mode, coordinates]);

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={OSM_STYLE}
        logo={false}
        compass={false}
        scaleBar={false}
        dragPan={mode === 'static'}
        touchZoom={mode === 'static'}
        touchRotate={false}
        touchPitch={false}
        attributionPosition={{ bottom: 8, right: 8 }}
      >
        {mode === 'live' ? (
          <Camera trackUserLocation='course' zoom={16} />
        ) : cameraBounds ? (
          <Camera
            bounds={cameraBounds}
            padding={{ top: 64, bottom: 64, left: 48, right: 48 }}
          />
        ) : (
          <Camera zoom={14} />
        )}

        {/* Live user location puck — only during active run */}
        {mode === 'live' && <UserLocation animated heading />}

        {/* Route polyline with drop shadow for contrast on any map style */}
        {lineGeoJSON && (
          <GeoJSONSource id='route' data={lineGeoJSON}>
            <Layer
              type='line'
              id='routeShadow'
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': 'rgba(0,0,0,0.15)', 'line-width': 8 }}
            />
            <Layer
              type='line'
              id='routeLine'
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': '#FF6B35', 'line-width': 5 }}
            />
          </GeoJSONSource>
        )}
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
