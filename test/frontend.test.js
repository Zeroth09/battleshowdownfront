/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Socket.IO
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('Frontend Components Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Homepage Tests', () => {
    test('should render homepage with correct content', async () => {
      const HomePage = require('../app/page').default;
      render(<HomePage />);

      // Check main heading
      expect(screen.getByText(/Battle Showdown/i)).toBeInTheDocument();
      
      // Check description
      expect(screen.getByText(/Pertempuran real-time/i)).toBeInTheDocument();
      
      // Check CTA button
      expect(screen.getByText(/Mulai Bertempur/i)).toBeInTheDocument();
    });

    test('should have correct features section', () => {
      const HomePage = require('../app/page').default;
      render(<HomePage />);

      // Check features
      expect(screen.getByText(/Deteksi Lokasi Akurat/i)).toBeInTheDocument();
      expect(screen.getByText(/Battle Real-time/i)).toBeInTheDocument();
      expect(screen.getByText(/Tim Merah vs Putih/i)).toBeInTheDocument();
    });

    test('should have how to play section', () => {
      const HomePage = require('../app/page').default;
      render(<HomePage />);

      // Check steps
      expect(screen.getByText(/Daftar & Pilih Tim/i)).toBeInTheDocument();
      expect(screen.getByText(/Jelajahi & Cari Lawan/i)).toBeInTheDocument();
      expect(screen.getByText(/Bertempur & Menang/i)).toBeInTheDocument();
    });
  });

  describe('Dashboard Tests', () => {
    test('should render dashboard with user info', async () => {
      const DashboardPage = require('../app/dashboard/page').default;
      render(<DashboardPage />);

      // Wait for user to be set
      await waitFor(() => {
        expect(screen.getByText(/Pemain/i)).toBeInTheDocument();
      });
    });

    test('should show map section', () => {
      const DashboardPage = require('../app/dashboard/page').default;
      render(<DashboardPage />);

      expect(screen.getByText(/Peta Pertempuran/i)).toBeInTheDocument();
    });

    test('should show status cards', () => {
      const DashboardPage = require('../app/dashboard/page').default;
      render(<DashboardPage />);

      expect(screen.getByText(/Status Pertempuran/i)).toBeInTheDocument();
      expect(screen.getByText(/Statistik/i)).toBeInTheDocument();
      expect(screen.getByText(/Instruksi/i)).toBeInTheDocument();
    });
  });

  describe('Geolocation Tests', () => {
    test('should handle geolocation success', async () => {
      const mockPosition = {
        coords: {
          latitude: -6.2088,
          longitude: 106.8456,
          accuracy: 10,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const DashboardPage = require('../app/dashboard/page').default;
      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });

    test('should handle geolocation error', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(new Error('Geolocation error'));
      });

      const DashboardPage = require('../app/dashboard/page').default;
      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });
  });

  describe('Socket.IO Tests', () => {
    test('should connect to Socket.IO server', () => {
      const io = require('socket.io-client');
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      io.mockReturnValue(mockSocket);

      // Test SocketManager component
      const SocketManager = require('../components/SocketManager').default;
      const mockUser = {
        pemainId: 'test123',
        nama: 'Test User',
        tim: 'merah',
      };

      const mockCallbacks = {
        onBattleStart: jest.fn(),
        onBattleEnd: jest.fn(),
        onNearbyPlayers: jest.fn(),
      };

      render(<SocketManager user={mockUser} {...mockCallbacks} />);

      expect(io).toHaveBeenCalled();
    });
  });

  describe('Map Component Tests', () => {
    test('should render map with user location', () => {
      const MapComponent = require('../components/MapComponent').default;
      const mockProps = {
        userLocation: { latitude: -6.2088, longitude: 106.8456 },
        userTeam: 'merah',
        nearbyPlayers: [],
      };

      render(<MapComponent {...mockProps} />);
      
      // Map should be rendered
      expect(document.querySelector('.leaflet-container')).toBeInTheDocument();
    });
  });
}); 