import {Footer} from '@/components/Footer' 
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {Header} from '@/components/Header';
import Providers from './providers';
import { Toaster } from 'react-hot-toast';
import { AppInitializer } from '@/components/AppInitializer';


const inter = Inter({
  subsets:["latin"]
})


export const metadata: Metadata = {
  title: "Nexus Gadgets",
  description: "Nexus Gadgets: Your hub for the latest phones, PS5s, Apple Vision Pro, AirPods, and premium tech. Connect with cutting-edge gear.",
    icons: {
    icon: '/NG.jpg',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
      >
        <Providers>
          <AppInitializer />
          <div className='max-w-[2000px] ml-auto mr-auto'>     
        <Header/>
          <div className='min-h-[600px]'>
          {children}
          </div>
        <Footer/>
        <Toaster position="bottom-center" />
          </div>
        </Providers>
      </body>
    </html>
  );
}
