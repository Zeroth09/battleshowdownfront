'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix untuk icon marker Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  userLocation: { latitude: number; longitude: number };
  userTeam: 'merah' | 'putih';
  nearbyPlayers: any[];
}

const MapComponent: React.FC<MapComponentProps> = ({ userLocation, userTeam, nearbyPlayers }) => {
  const mapRef = useRef<L.Map | null>(null);

  // Custom icon untuk pemain
  const createPlayerIcon = (team: 'merah' | 'putih') => {
    return L.divIcon({
      className: 'custom-player-icon',
      html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-lg ${
        team === 'merah' ? 'bg-red-500' : 'bg-gray-300'
      }"></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Custom icon untuk user
  const createUserIcon = () => {
    return L.divIcon({
      className: 'custom-user-icon',
      html: `<div class="w-10 h-10 rounded-full border-3 border-white shadow-lg bg-blue-500 flex items-center justify-center">
        <div class="w-6 h-6 rounded-full ${userTeam === 'merah' ? 'bg-red-500' : 'bg-gray-300'}"></div>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.latitude, userLocation.longitude], 16);
    }
  }, [userLocation]);

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[userLocation.latitude, userLocation.longitude]}
        zoom={16}
        className="w-full h-full"
        ref={mapRef}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User marker */}
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={createUserIcon()}
        >
          <Popup>
            <div className="text-center">
              <h3 className="font-semibold">Kamu</h3>
              <p className="text-sm text-gray-600">Tim {userTeam}</p>
            </div>
          </Popup>
        </Marker>

        {/* Detection radius (1 meter = ~0.00001 degrees) */}
        <Circle
          center={[userLocation.latitude, userLocation.longitude]}
          radius={1}
          pathOptions={{
            color: 'red',
            fillColor: 'red',
            fillOpacity: 0.1,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-center">
              <h3 className="font-semibold">Area Deteksi</h3>
              <p className="text-sm text-gray-600">Jarak 1 meter</p>
            </div>
          </Popup>
        </Circle>

        {/* Nearby players */}
        {nearbyPlayers.map((player, index) => (
          <Marker
            key={player.id || index}
            position={[player.latitude, player.longitude]}
            icon={createPlayerIcon(player.tim)}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold">{player.nama}</h3>
                <p className="text-sm text-gray-600">Tim {player.tim}</p>
                <p className="text-xs text-gray-500">
                  Jarak: {player.distance ? `${player.distance.toFixed(1)}m` : 'Dekat'}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style jsx global>{`
        .custom-player-icon {
          background: transparent !important;
          border: none !important;
        }
        
        .custom-user-icon {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
        
        .leaflet-popup-content {
          margin: 8px 12px;
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default MapComponent; 