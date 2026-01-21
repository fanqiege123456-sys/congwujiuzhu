import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapViewProps, PetStatus } from '../types';

// Icons using SVG strings for better customization without external assets
const getIcon = (status: PetStatus) => {
  const color = status === PetStatus.NEEDS_RESCUE ? '#ef4444' : '#22c55e'; // Red-500 or Green-500
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10 drop-shadow-md">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3" fill="white"/>
  </svg>`;
  
  return L.divIcon({
    className: 'custom-pin',
    html: svg,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const userIcon = L.divIcon({
    className: 'user-pin',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" class="w-8 h-8 drop-shadow-lg"><circle cx="12" cy="12" r="10"/></svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

const MapView: React.FC<MapViewProps> = ({ userLocation, pets, onPetClick }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const initialLat = userLocation ? userLocation.lat : 34.0522;
      const initialLng = userLocation ? userLocation.lng : -118.2437;

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }
  }, []); // Run once on mount

  // Update View when userLocation changes (initial load)
  useEffect(() => {
    if (mapInstanceRef.current && userLocation) {
        // Fly to user location when first obtained
        mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 14, {
            duration: 1.5
        });
    }
  }, [userLocation]);

  // Update Markers when pets change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add User Marker
    if (userLocation) {
        const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup("您在这里");
        markersRef.current.push(marker);
    }

    // Add Pet Markers
    pets.forEach(pet => {
      const marker = L.marker([pet.location.lat, pet.location.lng], {
        icon: getIcon(pet.status)
      })
      .addTo(mapInstanceRef.current!)
      .on('click', () => onPetClick(pet));
      
      markersRef.current.push(marker);
    });

  }, [pets, userLocation, onPetClick]);

  return <div ref={mapContainerRef} className="w-full h-full z-0" />;
};

export default MapView;