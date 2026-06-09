import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';
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
    };
  }, [coordinates]);

  const cameraBounds = useMemo(() => {
    if (mode !== 'static' || coordinates.length < 2) return undefined;
    const lats = coordinates.map((c) => c.lat);
    const lngs = coordinates.map((c) => c.lng);
    return {
      ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
      sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
      paddingTop: 64,
      paddingBottom: 64,
      paddingLeft: 48,
      paddingRight: 48,
    };
  }, [mode, coordinates]);

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={OSM_STYLE}
        logoEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        scrollEnabled={mode === 'static'}
        zoomEnabled={mode === 'static'}
        rotateEnabled={false}
        pitchEnabled={false}
        attributionPosition={{ bottom: 8, right: 8 }}
      >
        {mode === 'live' ? (
          <Mapbox.Camera
            followUserLocation
            followZoomLevel={16}
            followUserMode='course'
            animationMode='flyTo'
            animationDuration={500}
          />
        ) : cameraBounds ? (
          <Mapbox.Camera
            bounds={cameraBounds}
            animationMode='none'
            animationDuration={0}
          />
        ) : (
          <Mapbox.Camera zoomLevel={14} animationMode='none' />
        )}

        {/* Live user location puck — only during active run */}
        {mode === 'live' && (
          <Mapbox.UserLocation
            visible
            animated
            renderMode='native'
            showsUserHeadingIndicator
          />
        )}

        {/* Route polyline with drop shadow for contrast on any map style */}
        {lineGeoJSON && (
          <Mapbox.ShapeSource id='route' shape={lineGeoJSON as any}>
            <Mapbox.LineLayer
              id='routeShadow'
              style={{
                lineColor: 'rgba(0,0,0,0.15)',
                lineWidth: 8,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Mapbox.LineLayer
              id='routeLine'
              style={{
                lineColor: '#FF6B35',
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
