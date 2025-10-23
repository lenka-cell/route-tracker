import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Camera, LineLayer, MapView, ShapeSource } from "@maplibre/maplibre-react-native";
import * as Location from 'expo-location';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import React, { useEffect, useMemo, useRef, useState } from "react";
import UserLocationMarker from "./MapUserLocationMarker";




export default function HomeScreen() {

  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);

  // Nouveaux états pour le tracking
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [currentRoute, setCurrentRoute] = useState<[number, number][]>([]);
  const [trackingStats, setTrackingStats] = useState({
    distance: 0,
    duration: 0,
    points: 0,
    startTime: null as Date | null
  });

  // Obtenir la localisation initiale de l'utilisateur
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        const position: [number, number] = [loc.coords.longitude, loc.coords.latitude];
        console.log("User location obtained:", position);
        setUserLocation(position);

        // Centrer la caméra sur la position de l'utilisateur
        if (cameraRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: position,
            zoomLevel: 16,
            animationDuration: 1000,
          });
        }
      } catch (error) {
        console.error("Error getting location:", error);
      }
    })();
  }, []);

  // Fonction pour calculer la distance entre deux points
  const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
    const R = 6371000; // Rayon de la Terre en mètres
    const lat1Rad = point1[1] * Math.PI / 180;
    const lat2Rad = point2[1] * Math.PI / 180;
    const deltaLatRad = (point2[1] - point1[1]) * Math.PI / 180;
    const deltaLngRad = (point2[0] - point1[0]) * Math.PI / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Démarrer le tracking
  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Impossible de suivre votre position');
      return;
    }

    console.log('🚀 Démarrage du tracking...');
    setIsTracking(true);
    setCurrentRoute([]);
    setTrackingStats({
      distance: 0,
      duration: 0,
      points: 0,
      startTime: new Date()
    });

    // Position initiale
    try {
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const initialPoint: [number, number] = [
        initialLocation.coords.longitude,
        initialLocation.coords.latitude
      ];

      setUserLocation(initialPoint);
      setCurrentRoute([initialPoint]);
      setTrackingStats(prev => ({ ...prev, points: 1 }));

      console.log('📍 Point initial enregistré:', initialPoint);

      // Démarrer le suivi en temps réel
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // Toutes les 2 secondes
          distanceInterval: 5, // Tous les 5 mètres
        },
        (location) => {
          const newPoint: [number, number] = [
            location.coords.longitude,
            location.coords.latitude
          ];

          setUserLocation(newPoint);

          // Ajouter le nouveau point au trajet
          setCurrentRoute(prev => {
            const newRoute = [...prev, newPoint];

            // Calculer la distance ajoutée
            if (prev.length > 0) {
              const lastPoint = prev[prev.length - 1];
              const additionalDistance = calculateDistance(lastPoint, newPoint);

              setTrackingStats(prevStats => ({
                ...prevStats,
                distance: prevStats.distance + additionalDistance,
                points: newRoute.length,
                duration: prevStats.startTime ?
                  Math.floor((new Date().getTime() - prevStats.startTime.getTime()) / 1000) : 0
              }));
            }

            console.log(`📍 Nouveau point: ${newPoint}, Total: ${newRoute.length} points`);
            return newRoute;
          });
        }
      );

    } catch (error) {
      console.error('Erreur lors du démarrage du tracking:', error);
      setIsTracking(false);
    }
  };

  // Arrêter le tracking
  const stopTracking = () => {
    console.log('🛑 Arrêt du tracking...');

    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    setIsTracking(false);

    if (currentRoute.length > 1) {
      Alert.alert(
        'Trajet terminé !',
        `📊 Statistiques:
• ${trackingStats.points} points enregistrés
• ${Math.round(trackingStats.distance)} mètres parcourus
• ${Math.floor(trackingStats.duration / 60)}min ${trackingStats.duration % 60}s de durée`,
        [
          { text: 'OK' }
        ]
      );

      console.log('✅ Trajet sauvegardé:', {
        points: currentRoute.length,
        distance: trackingStats.distance,
        duration: trackingStats.duration
      });
    }
  };

  // Créer le GeoJSON du trajet en cours
  const currentRouteGeoJson = useMemo(() => {
    if (currentRoute.length < 2) return null;

    return {
      type: "FeatureCollection" as const,
      features: [{
        type: "Feature" as const,
        properties: {
          name: "Trajet en cours",
          distance: trackingStats.distance,
          points: trackingStats.points
        },
        geometry: {
          type: "LineString" as const,
          coordinates: currentRoute
        }
      }]
    };
  }, [currentRoute, trackingStats]);

  // Obtenir la localisation de l'utilisateur
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        const position: [number, number] = [loc.coords.longitude, loc.coords.latitude];
        console.log("User location obtained:", position);
        setUserLocation(position);
      } catch (error) {
        console.error("Error getting location:", error);
      }
    })();
  }, []);

  //Fetch des données GeoJSON depuis l'API OpenRouteService
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

  return (
    <View style={styles.container}>
      {/* Interface de contrôle */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.trackingButton, isTracking ? styles.stopButton : styles.startButton]}
          onPress={isTracking ? stopTracking : startTracking}
        >
          <Text style={styles.buttonText}>
            {isTracking ? '🛑 ARRÊTER' : '🚀 DÉMARRER'}
          </Text>
        </TouchableOpacity>

        {isTracking && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              📍 {trackingStats.points} pts | 📏 {Math.round(trackingStats.distance)}m | ⏱️ {Math.floor(trackingStats.duration / 60)}:{(trackingStats.duration % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        )}
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
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

        <Camera ref={cameraRef} />
        {userLocation && (
          <UserLocationMarker coordinate={userLocation} />
        )}

        {/* Trajet en cours (rouge) */}
        {currentRouteGeoJson && (
          <ShapeSource
            id="currentRouteSource"
            shape={currentRouteGeoJson}
          >
            <LineLayer
              id="currentRouteLayer"
              style={{
                lineColor: isTracking ? '#ff4444' : '#44ff44',
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </ShapeSource>
        )}

        {/* Route API (bleue) */}
        {geoJsonData && (
          <ShapeSource
            id="geoJsonSource"
            shape={geoJsonData}
          >
            <LineLayer
              id="lineLayer"
              style={{
                lineColor: 'blue',
                lineWidth: 3,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </ShapeSource>
        )}

      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  trackingButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
  },
  statsText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
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
