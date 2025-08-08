import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bluetooth, X, Wifi, AlertCircle } from 'lucide-react';

interface BluetoothModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScan: () => void;
  onError: (error: string) => void;
}

export default function BluetoothModal({ 
  isOpen, 
  onClose, 
  onStartScan, 
  onError 
}: BluetoothModalProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkBluetoothSupport();
    }
  }, [isOpen]);

  const checkBluetoothSupport = () => {
    setIsChecking(true);
    
    if (!navigator.bluetooth) {
      setIsSupported(false);
      onError('Bluetooth tidak didukung di browser ini. Gunakan Chrome/Edge.');
      setIsChecking(false);
      return;
    }
    
    setIsSupported(true);
    setIsChecking(false);
  };

  const handleStartScan = async () => {
    try {
      onStartScan();
      onClose();
    } catch (error: any) {
      onError(`Error memulai scan: ${error.message}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-6 max-w-md w-full text-white shadow-2xl border border-blue-500/30"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bluetooth className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Bluetooth Proximity</h2>
                  <p className="text-blue-200 text-sm">Deteksi devices terdekat</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {isChecking ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-blue-200">Memeriksa dukungan Bluetooth...</p>
                </div>
              ) : isSupported ? (
                <div className="space-y-4">
                  {/* Success Status */}
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-green-300 font-medium">Bluetooth Tersedia</span>
                    </div>
                    <p className="text-green-200 text-sm">
                      Browser Anda mendukung Bluetooth. Klik tombol di bawah untuk memulai scanning.
                    </p>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-blue-300 font-medium mb-2">📋 Cara Kerja:</h4>
                    <ul className="text-blue-200 text-xs space-y-1">
                      <li>• Klik "Mulai Scan" untuk mencari devices</li>
                      <li>• Izinkan Bluetooth saat browser minta izin</li>
                      <li>• Dekatkan device lain dalam jarak ≤2m</li>
                      <li>• Battle akan dimulai otomatis</li>
                    </ul>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={handleStartScan}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Bluetooth className="w-5 h-5" />
                      <span>🔍 Mulai Bluetooth Scan</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Error Status */}
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-300 font-medium">Bluetooth Tidak Didukung</span>
                    </div>
                    <p className="text-red-200 text-sm">
                      Browser Anda tidak mendukung Bluetooth. Gunakan Chrome atau Edge dengan koneksi HTTPS.
                    </p>
                  </div>

                  {/* Alternative */}
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wifi className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-300 font-medium">Alternatif</span>
                    </div>
                    <p className="text-yellow-200 text-sm">
                      Anda masih bisa bermain menggunakan GPS untuk deteksi proximity.
                    </p>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={onClose}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all"
                  >
                    Lanjutkan Tanpa Bluetooth
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-blue-500/30">
              <p className="text-blue-300 text-xs text-center">
                Bluetooth diperlukan untuk deteksi proximity yang akurat
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 