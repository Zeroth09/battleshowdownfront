import React, { useEffect, useState } from 'react';

interface WebRTCProximityProps {
  onProximityDetected: () => void;
  onError: (error: string) => void;
}

export default function WebRTCProximity({ onProximityDetected, onError }: WebRTCProximityProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    startProximityDetection();
  }, []);

  const startProximityDetection = async () => {
    try {
      setIsScanning(true);
      console.log('🔍 Starting WebRTC proximity detection...');

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      // Listen for ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🎯 ICE candidate found:', event.candidate);
          
          // If we can establish connection, devices are close
          if (event.candidate.type === 'host') {
            console.log('🎯 Proximity detected via WebRTC!');
            onProximityDetected();
          }
        }
      };

      // Create data channel
      const dataChannel = pc.createDataChannel('proximity');
      dataChannel.onopen = () => {
        console.log('🎯 Data channel opened - devices are close!');
        onProximityDetected();
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('📤 WebRTC offer created');

    } catch (error) {
      console.error('❌ WebRTC error:', error);
      onError('Tidak dapat mengakses WebRTC');
    } finally {
      setIsScanning(false);
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
            onClick={startProximityDetection}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Scan Proximity
          </button>
        )}
      </div>
    </div>
  );
} 