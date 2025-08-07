import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import React from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Battle Showdown Games - Pertempuran Real-time',
  description: 'Games battle showdown dengan sistem deteksi pemain real-time. Bergabung dengan tim merah atau putih dan bertempur dalam pertanyaan seru!',
  keywords: 'games, battle, showdown, real-time, multiplayer, trivia, indonesia',
  authors: [{ name: 'Battle Showdown Team' }],
  creator: 'Battle Showdown Team',
  publisher: 'Battle Showdown Games',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://battle-showdown.vercel.app'),
  openGraph: {
    title: 'Battle Showdown Games - Pertempuran Real-time',
    description: 'Games battle showdown dengan sistem deteksi pemain real-time. Bergabung dengan tim merah atau putih dan bertempur dalam pertanyaan seru!',
    url: 'https://battle-showdown.vercel.app',
    siteName: 'Battle Showdown Games',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
        width: 1200,
        height: 630,
        alt: 'Battle Showdown Games',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Battle Showdown Games - Pertempuran Real-time',
    description: 'Games battle showdown dengan sistem deteksi pemain real-time. Bergabung dengan tim merah atau putih dan bertempur dalam pertanyaan seru!',
    images: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#dc2626" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
} 