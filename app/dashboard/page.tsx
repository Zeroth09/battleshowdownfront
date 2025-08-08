'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DashboardPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new lomba page
    router.push('/lomba');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Mengalihkan ke Lomba Battle...</p>
      </div>
    </div>
  );
};

export default DashboardPage; 