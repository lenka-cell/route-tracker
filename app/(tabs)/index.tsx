import { Image } from 'expo-image';
import { Platform, StyleSheet, ActivityIndicator, FlatList, Text, View } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { MapView } from "@maplibre/maplibre-react-native";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { Camera, Images, LineLayer, ShapeSource, SymbolLayer } from "@maplibre/maplibre-react-native";
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import UserLocationMarker from "./MapUserLocationMarker";



export default function HomeScreen() {

  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);

  /*useEffect(() => {
    // Charger depuis assets
    const loadGeoJSON = async () => {
      try {
        const data = require(gesoJsonDataSource);
        setGeoJsonData(data);
      } catch (error) {
        console.error('Erreur chargement GeoJSON:', error);
      }
    };
    loadGeoJSON();
  }, []);*/

  useEffect(() => {
    const getGeoJsonData = async () => {
      try {
        const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car?api_key=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjJhMjRiOWU5MmVjMjQxZDc5Mzc3NTZkMDljMDE5NzRmIiwiaCI6Im11cm11cjY0In0=&start=5.914968252182008,45.68240098798441&end=2.624444961547852,47.99379893501824');
        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
        
        // L'API OpenRouteService retourne le GeoJSON dans data.features[0].geometry
        // Il faut créer une FeatureCollection valide
        const featureCollection: FeatureCollection = {
          type: "FeatureCollection",
          features: data.features || []
        };
        
        setGeoJsonData(featureCollection);
      } catch (error) {
        console.error('Erreur fetching GeoJSON:', error);
      }
    };

    getGeoJsonData();
  }, []);


  /*const GeoJsonData = {
    "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": [
          [
            5.914150446301022,
            45.681770232663354
          ],
          [
            5.916607200643142,
            45.684030283631614
          ],
          [
            5.916775053423919,
            45.68487244908579
          ],
          [
            5.916729275393578,
            45.68520291561069
          ],
          [
            5.916563153588385,
            45.686948012820864
          ],
          [
            5.916405340984653,
            45.68749889451567
          ],
          [
            5.91577237805916,
            45.68820733680087
          ],
          [
            5.915504078316701,
            45.68826503407914
          ],
          [
            5.915271054657666,
            45.68811519802543
          ],
          [
            5.913132707727641,
            45.687840079448364
          ]
        ],
        "type": "LineString"
      }
    }
  ]
  
};*/

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      //onPress={handleMapPress}
      mapStyle={useMemo(() => ({
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors"
          }
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19
          }
        ]
      }), [])}
      logoEnabled={false}
      attributionEnabled={false}
    >

      {/* Camera persistante */}
      <Camera ref={cameraRef} />
      {userLocation && (
        <UserLocationMarker coordinate={userLocation} />
      )}

      {/* Source de données GeoJSON - avec gestion d'état améliorée */}
      {geoJsonData && (
        <ShapeSource
          id="geoJsonSource"
          shape={geoJsonData}
        //onPress={handleFeaturePress}
        >
          {/* Couche pour les lignes */}
          <LineLayer 
          id="lineLayer" 
          style={{ 
              lineColor: 'blue', 
              lineWidth: 3, 
              lineCap: 'round', 
              lineJoin: 'round' 
            }
          } />




        </ShapeSource>
      )}

    </MapView>
    /*<ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Bonjour à toi jeune entrepreneur</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>*/
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  map: {
    flex: 1,
  }
});
