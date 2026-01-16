'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './WardMap.module.css';

// Dynamically import Leaflet map (no SSR)
const LeafletMap = dynamic(() => import('./LeafletMap'), { 
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Loading map...</div>
});

interface WardMapDemoProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sample ward data with coordinates
const sampleWards = [
  {
    id: 1,
    name: 'शित्तूर तर्फे वारुण',
    nameEn: 'Shittur Tarfe Warun',
    taluka: 'शाहूवाडी',
    type: 'ZP',
    lat: 16.8167,
    lng: 73.9833,
    villages: ['शितूर तर्फे वारुण']
  },
  {
    id: 2,
    name: 'कसबा बावडा',
    nameEn: 'Kasba Bawda',
    taluka: 'करवीर',
    type: 'ZP',
    lat: 16.6913,
    lng: 74.2266,
    villages: ['कसबा बावडा', 'गांधीनगर', 'राजारामपुरी']
  }
];

export default function WardMapDemo({ isOpen, onClose }: WardMapDemoProps) {
  const [mapType, setMapType] = useState<'google' | 'osm'>('osm');
  const [selectedWard, setSelectedWard] = useState(sampleWards[0]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        
        <h2 className={styles.title}>🗺️ Ward Map Demo / प्रभाग नकाशा</h2>
        
        {/* Map Type Toggle */}
        <div className={styles.toggleContainer}>
          <button 
            className={`${styles.toggleBtn} ${mapType === 'osm' ? styles.active : ''}`}
            onClick={() => setMapType('osm')}
          >
            Option 2: OpenStreetMap (Leaflet)
          </button>
          <button 
            className={`${styles.toggleBtn} ${mapType === 'google' ? styles.active : ''}`}
            onClick={() => setMapType('google')}
          >
            Option 1: Google Maps Embed
          </button>
        </div>

        {/* Ward Selector */}
        <div className={styles.wardSelector}>
          <label>Select Ward / प्रभाग निवडा:</label>
          <select 
            value={selectedWard.id}
            onChange={(e) => setSelectedWard(sampleWards.find(w => w.id === Number(e.target.value)) || sampleWards[0])}
          >
            {sampleWards.map(ward => (
              <option key={ward.id} value={ward.id}>
                {ward.type} - {ward.name} ({ward.nameEn})
              </option>
            ))}
          </select>
        </div>

        {/* Ward Info */}
        <div className={styles.wardInfo}>
          <span className={styles.wardBadge}>{selectedWard.type}</span>
          <span className={styles.wardName}>{selectedWard.name}</span>
          <span className={styles.wardTaluka}>({selectedWard.taluka})</span>
        </div>

        {/* Map Container */}
        <div className={styles.mapContainer}>
          {mapType === 'osm' ? (
            <LeafletMap 
              lat={selectedWard.lat} 
              lng={selectedWard.lng} 
              name={selectedWard.name}
              villages={selectedWard.villages}
            />
          ) : (
            <iframe
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(selectedWard.nameEn + ' Kolhapur Maharashtra')}&zoom=13`}
              width="100%"
              height="400"
              style={{ border: 0, borderRadius: '8px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </div>

        {/* Comparison Notes */}
        <div className={styles.comparisonNotes}>
          <div className={styles.noteCard}>
            <h4>📍 OpenStreetMap (Leaflet)</h4>
            <ul>
              <li>✅ Completely FREE, no API limits</li>
              <li>✅ Can add custom markers for all villages</li>
              <li>✅ Interactive & customizable</li>
              <li>⚠️ Requires JS library (~40KB)</li>
            </ul>
          </div>
          <div className={styles.noteCard}>
            <h4>🗺️ Google Maps Embed</h4>
            <ul>
              <li>✅ Familiar Google Maps UI</li>
              <li>✅ Better satellite imagery</li>
              <li>⚠️ Needs API key for production</li>
              <li>⚠️ Limited customization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

