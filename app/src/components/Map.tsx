import React, { useRef, useEffect } from 'react';
import { GoogleMap, MarkerF, Polyline, useJsApiLoader } from '@react-google-maps/api';

import { ZipMarker } from '../types';


interface MapProps {
  zips: ZipMarker[];
  onGuess: (zip: string) => void;
  guessedZip: string | null;
  correctZip: string;
  homeLat?: number;
  homeLng?: number;
  selectedZip?: string | null;
  disabled?: boolean;
  zoomToFit?: boolean | null;
}

// Helper to get ZipMarker by zip
function getZipMarker(zips: ZipMarker[], zip: string | null): ZipMarker | undefined {
  if (!zip) return undefined;
  return zips.find(z => z.zip === zip);
}

const containerStyle = {
  width: '100%',
  height: '400px',
};

const usaBounds = {
  north: 49.384358,
  south: 24.396308,
  west: -125.0,
  east: -66.93457,
};

const center = { lat: 39.8283, lng: -98.5795 };

const Map: React.FC<MapProps & { darkMode?: boolean }> = ({ zips, onGuess, guessedZip, correctZip, darkMode, selectedZip, disabled, zoomToFit }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });
  const mapRef = useRef<google.maps.Map | null>(null);

  // We'll need a zip-to-lat/lng lookup for all zips. If zips don't have lat/lng, just don't render the marker.
  // Hide the home pin; only show all zip pins.
  // Find guessed and correct markers
  const guessedMarker = getZipMarker(zips, guessedZip);
  const correctMarker = getZipMarker(zips, correctZip);
  const showLine = guessedZip && guessedZip !== correctZip && guessedMarker && correctMarker;

  // Zoom to fit both points after guess
  useEffect(() => {
    if (!mapRef.current) return;
    if (zoomToFit && guessedMarker && correctMarker) {
      if (
        guessedMarker.lat === correctMarker.lat &&
        guessedMarker.lng === correctMarker.lng
      ) {
        // If same point, just center and zoom in
        mapRef.current.setCenter({ lat: guessedMarker.lat, lng: guessedMarker.lng });
        mapRef.current.setZoom(10);
      } else {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: guessedMarker.lat, lng: guessedMarker.lng });
        bounds.extend({ lat: correctMarker.lat, lng: correctMarker.lng });
        mapRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
      }
    } else if (!zoomToFit) {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(3);
    }
  }, [zoomToFit, guessedMarker, correctMarker]);

  if (!isLoaded) return <div className="bg-gray-800 text-white p-4 rounded">Loading map...</div>;

  return (
    <div className={
      `w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border mt-6 ` +
      (darkMode ? 'border-gray-800 bg-gray-900/90' : 'border-gray-200 bg-white/90')
    }>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={3}
        options={{
          restriction: { latLngBounds: usaBounds, strictBounds: false },
          minZoom: 2,
          maxZoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          scrollwheel: true
        }}
        onLoad={map => { mapRef.current = map; }}
      >
        {zips.map(({ zip, lat, lng }) => {
          let icon = undefined;
          if (guessedZip === zip) {
            icon = {
              url: zip === correctZip ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: { width: 40, height: 40 } as google.maps.Size
            };
          } else if (selectedZip === zip) {
            // Always create a new object to force update
            icon = {
              url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
              scaledSize: { width: 40, height: 40 } as google.maps.Size
            };
          }
          return (
            <MarkerF
              key={zip + (selectedZip === zip ? '-selected' : '')}
              position={{ lat, lng }}
              onClick={() => { if (!disabled) onGuess(zip); }}
              label={guessedZip === zip ? (zip === correctZip ? '✔' : '✖') : undefined}
              icon={icon}
            />
          );
        })}
        {showLine && (
          <Polyline
            path={[
              { lat: guessedMarker.lat, lng: guessedMarker.lng },
              { lat: correctMarker.lat, lng: correctMarker.lng }
            ]}
            options={{
              strokeColor: '#ff0000',
              strokeOpacity: 0.9,
              strokeWeight: 4,
              zIndex: 1000,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default Map;
