import React, { useEffect, useState, useRef } from 'react';

interface BluetoothProximityProps {
  onProximityDetected: (distance: number) => void;
  onError: (error: string) => void;
  onStatusChange: (status: string) => void;
}

interface BluetoothDevice {
  id: string;
  name: string;
  rssi: number;
  distance: number;
  lastSeen: number;
}

export default function BluetoothProximity({ 
  onProximityDetected, 
  onError, 
  onStatusChange 
}: BluetoothProximityProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkBluetoothSupport();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Auto-start scanning after 2 seconds
    const autoStartTimer = setTimeout(() => {
      if (isSupported) {
        startScanning();
      }
    }, 2000);
    
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      clearTimeout(autoStartTimer);
    };
  }, [isSupported]);

  const checkBluetoothSupport = () => {
    if (!navigator.bluetooth) {
      setIsSupported(false);
      onError('Bluetooth tidak didukung di browser ini. Gunakan Chrome/Edge.');
      return;
    }
    setIsSupported(true);
    onStatusChange('Bluetooth tersedia');
  };

  const requestBluetoothPermission = async () => {
    try {
      onStatusChange('Meminta izin Bluetooth...');
      
      // Check if Bluetooth is available
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth tidak tersedia');
      }
      
      // Request Bluetooth device to trigger permission
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service']
      });

      setPermissionGranted(true);
      onStatusChange('Izin Bluetooth diberikan');
      console.log('✅ Bluetooth permission granted');
      
      return true;
    } catch (error: any) {
      console.error('❌ Bluetooth permission error:', error);
      
      if (error.name === 'NotFoundError') {
        onError('Tidak ada device Bluetooth ditemukan');
      } else if (error.name === 'NotAllowedError') {
        onError('Izin Bluetooth ditolak');
      } else {
        onError(`Error Bluetooth: ${error.message}`);
      }
      
      return false;
    }
  };

  const startScanning = async () => {
    if (!isSupported) {
      onError('Bluetooth tidak didukung');
      return;
    }

    try {
      setIsScanning(true);
      onStatusChange('Memulai scan Bluetooth...');
      console.log('🔍 Starting Bluetooth scan...');

      // Request permission first
      const hasPermission = await requestBluetoothPermission();
      if (!hasPermission) {
        setIsScanning(false);
        return;
      }

      // Start continuous scanning
      scanIntervalRef.current = setInterval(async () => {
        await scanForDevices();
      }, 2000); // Scan every 2 seconds

      onStatusChange('Scanning aktif - mencari devices terdekat...');

    } catch (error: any) {
      console.error('❌ Bluetooth scan error:', error);
      onError(`Error scanning: ${error.message}`);
      setIsScanning(false);
    }
  };

  const scanForDevices = async () => {
    try {
      // Check if Bluetooth is available
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth tidak tersedia');
      }
      
      // Request device with specific filters
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      console.log('📱 Found device:', device.name);
      
      // Simulate RSSI (in real implementation, you'd get this from device)
      const rssi = Math.random() * -30 - 50; // -50 to -80 dBm
      const distance = calculateDistanceFromRSSI(rssi);
      
      const newDevice: BluetoothDevice = {
        id: device.id || 'unknown',
        name: device.name || 'Unknown Device',
        rssi,
        distance,
        lastSeen: Date.now()
      };

      // Update devices list
      setDevices(prev => {
        const existing = prev.find(d => d.id === newDevice.id);
        if (existing) {
          return prev.map(d => d.id === newDevice.id ? newDevice : d);
        } else {
          return [...prev, newDevice];
        }
      });

      // Check if device is close enough
      if (distance <= 2) {
        console.log(`🎯 Proximity detected! Device: ${device.name}, Distance: ${distance.toFixed(2)}m`);
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⚔️ Battle Dimulai!', {
            body: `Device terdeteksi dalam jarak ${distance.toFixed(2)}m`,
            icon: '/favicon.ico'
          });
        }
        
        onProximityDetected(distance);
      }

    } catch (error: any) {
      if (error.name !== 'NotFoundError') {
        console.error('❌ Device scan error:', error);
      }
    }
  };

  const calculateDistanceFromRSSI = (rssi: number): number => {
    // Improved distance calculation from RSSI
    // Based on log-distance path loss model
    
    const txPower = -69; // Calibrated transmission power (dBm)
    const n = 2.0; // Path loss exponent (2 for free space, 2-4 for indoor)
    
    if (rssi === 0) return -1; // Invalid RSSI
    
    const ratio = rssi * 1.0 / txPower;
    
    if (ratio < 1.0) {
      return Math.pow(ratio, 10);
    } else {
      return 0.89976 * Math.pow(ratio, 7.7095) + 0.111;
    }
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
    onStatusChange('Scanning dihentikan');
  };

  const clearDevices = () => {
    setDevices([]);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        📱 Auto Proximity Detection
      </h3>
      
      {/* Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${
            isSupported ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-white">
            {isSupported ? 'Bluetooth Tersedia' : 'Bluetooth Tidak Didukung'}
          </span>
        </div>
        
        {permissionGranted && (
          <div className="flex items-center gap-2 text-sm mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-green-400">Izin Diberikan</span>
          </div>
        )}
        
        {isScanning && (
          <div className="flex items-center gap-2 text-sm mt-1">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-blue-400">Auto Scanning Aktif</span>
          </div>
        )}
      </div>

      {/* Auto Status */}
      <div className="mb-4 p-3 bg-blue-500/20 rounded border border-blue-500/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-blue-300 text-sm font-medium">Auto Mode</span>
        </div>
        <p className="text-blue-200 text-xs">
          Scanning otomatis aktif. Dekatkan device lain untuk memulai battle!
        </p>
      </div>

      {/* Devices List */}
      {devices.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white text-sm font-medium">Devices Terdeteksi:</h4>
          {devices.map((device) => (
            <div key={device.id} className="bg-white/5 rounded p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium">{device.name}</p>
                  <p className="text-gray-300 text-xs">ID: {device.id}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    device.distance <= 2 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {device.distance.toFixed(2)}m
                  </p>
                  <p className="text-gray-400 text-xs">
                    RSSI: {device.rssi.toFixed(1)} dBm
                  </p>
                </div>
              </div>
              
              {device.distance <= 2 && (
                <div className="mt-2 p-2 bg-green-500/20 rounded border border-green-500/30">
                  <p className="text-green-400 text-xs font-medium">
                    🎯 PROXIMITY DETECTED! Battle akan dimulai...
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-green-500/20 rounded border border-green-500/30">
        <h4 className="text-green-300 text-sm font-medium mb-2">🎯 Cara Kerja Otomatis:</h4>
        <ul className="text-green-200 text-xs space-y-1">
          <li>• Scanning otomatis aktif setelah 2 detik</li>
          <li>• Dekatkan device lain dalam jarak ≤2m</li>
          <li>• Battle akan dimulai otomatis</li>
          <li>• Notifikasi akan muncul saat battle dimulai</li>
          <li>• Hanya bekerja di Chrome/Edge dengan HTTPS</li>
        </ul>
      </div>
    </div>
  );
} 