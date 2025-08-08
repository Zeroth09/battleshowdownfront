import React, { useState } from 'react';

interface ManualProximityProps {
  onProximityDetected: () => void;
}

export default function ManualProximity({ onProximityDetected }: ManualProximityProps) {
  const [isTriggered, setIsTriggered] = useState(false);

  const handleManualTrigger = () => {
    console.log('🎯 Manual proximity trigger activated!');
    setIsTriggered(true);
    onProximityDetected();
    
    // Reset after 3 seconds
    setTimeout(() => {
      setIsTriggered(false);
    }, 3000);
  };

  return (
    <div className="text-center p-4">
      <div className="text-white">
        <button
          onClick={handleManualTrigger}
          disabled={isTriggered}
          className={`px-6 py-3 rounded-lg font-bold text-lg transition-all ${
            isTriggered 
              ? 'bg-gray-500 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700 active:scale-95'
          }`}
        >
          {isTriggered ? '🎯 BATTLE TRIGGERED!' : '⚔️ TRIGGER BATTLE'}
        </button>
        
        {isTriggered && (
          <p className="text-yellow-400 mt-2 text-sm">
            Battle akan dimulai dalam 3 detik...
          </p>
        )}
        
        <p className="text-gray-400 mt-4 text-xs">
          Gunakan untuk testing ketika devices berdekatan
        </p>
      </div>
    </div>
  );
} 