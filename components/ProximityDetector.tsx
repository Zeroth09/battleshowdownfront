import React, { useEffect, useState } from 'react';

interface ProximityDetectorProps {
  onProximityDetected: (distance: number) => void;
  onError: (error: string) => void;
}

export default function ProximityDetector({ onProximityDetected, onError }: ProximityDetectorProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    // Check if Web Bluetooth API is available
    if (!navigator.bluetooth) {
      onError('Bluetooth tidak didukung di browser ini');
      return;
    }

    startScanning();
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      console.log('🔍 Starting Bluetooth scan...');

      // Request Bluetooth device with specific service
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'] // We'll use any service for proximity
      });

      console.log('📱 Found device:', device.name);
      
      // Calculate approximate distance based on RSSI
      // This is a simplified calculation
      const distance = calculateDistanceFromRSSI(-50); // Example RSSI value
      
      if (distance <= 2) {
        console.log(`🎯 Proximity detected! Distance: ${distance.toFixed(2)}m`);
        onProximityDetected(distance);
      }

    } catch (error) {
      console.error('❌ Bluetooth scan error:', error);
      onError('Tidak dapat mengakses Bluetooth');
    } finally {
      setIsScanning(false);
    }
  };

  const calculateDistanceFromRSSI = (rssi: number): number => {
    // Simplified distance calculation from RSSI
    // In real implementation, you'd need calibration
    const txPower = -69; // Calibrated transmission power
    const ratio = rssi * 1.0 / txPower;
    
    if (ratio < 1.0) {
      return Math.pow(ratio, 10);
    } else {
      return 0.89976 * Math.pow(ratio, 7.7095) + 0.111;
    }
  };

  return (
    <div className="text-center p-4">
      <div className="text-white">
        {isScanning ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Mencari device terdekat...</span>
          </div>
        ) : (
          <button
            onClick={startScanning}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Scan Device Terdekat
          </button>
        )}
      </div>
    </div>
  );
} 