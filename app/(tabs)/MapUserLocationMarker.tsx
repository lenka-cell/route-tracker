import { PointAnnotation } from "@maplibre/maplibre-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

interface UserLocationMarkerProps {
  coordinate: [number, number];
}

export default function UserLocationMarker({ coordinate }: UserLocationMarkerProps) {
  console.log("Rendering UserLocationMarker at:", coordinate);
  
  return (
    <PointAnnotation
      id="userLocation"
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.container}>
        <View style={styles.pulse} />
        <View style={styles.innerCircle} />
      </View>
    </PointAnnotation>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#2196F3',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 5,
  },
  pulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.5)',
  },
});
