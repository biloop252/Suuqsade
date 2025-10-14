'use client';

import { useState, useEffect } from 'react';
import { SystemImage, SystemImageType } from '@/types/database';

interface SystemImageDisplayProps {
  imageType: SystemImageType;
  className?: string;
  alt?: string;
  fallback?: string;
  width?: number;
  height?: number;
}

export default function SystemImageDisplay({ 
  imageType, 
  className = '', 
  alt, 
  fallback,
  width,
  height 
}: SystemImageDisplayProps) {
  const [image, setImage] = useState<SystemImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await fetch(`/api/admin/settings/images?type=${imageType}&active=true`);
        const data = await response.json();
        
        if (data.images && data.images.length > 0) {
          // Get the first active image of this type
          setImage(data.images[0]);
        }
      } catch (err) {
        console.error('Error fetching system image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [imageType]);

  if (loading) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse rounded ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (error || !image) {
    if (fallback) {
      return (
        <img
          src={fallback}
          alt={alt || `${imageType} fallback`}
          className={className}
          width={width}
          height={height}
        />
      );
    }
    return null;
  }

  return (
    <img
      src={image.image_url}
      alt={alt || image.alt_text || `${imageType} image`}
      className={className}
      width={width}
      height={height}
      onError={() => setError(true)}
    />
  );
}

// Specific components for common image types
export function Logo({ className, width, height }: { className?: string; width?: number; height?: number }) {
  return (
    <SystemImageDisplay
      imageType="logo"
      className={className}
      width={width}
      height={height}
      alt="Company Logo"
      fallback="/logo-placeholder.png"
    />
  );
}

export function Favicon({ className, width = 32, height = 32 }: { className?: string; width?: number; height?: number }) {
  return (
    <SystemImageDisplay
      imageType="favicon"
      className={className}
      width={width}
      height={height}
      alt="Favicon"
      fallback="/favicon.ico"
    />
  );
}

export function AppIcon({ className, width = 64, height = 64 }: { className?: string; width?: number; height?: number }) {
  return (
    <SystemImageDisplay
      imageType="icon"
      className={className}
      width={width}
      height={height}
      alt="App Icon"
      fallback="/icon-placeholder.png"
    />
  );
}

export function Banner({ className, width, height }: { className?: string; width?: number; height?: number }) {
  return (
    <SystemImageDisplay
      imageType="banner"
      className={className}
      width={width}
      height={height}
      alt="Banner"
      fallback="/banner-placeholder.png"
    />
  );
}

export function Background({ className, width, height }: { className?: string; width?: number; height?: number }) {
  return (
    <SystemImageDisplay
      imageType="background"
      className={className}
      width={width}
      height={height}
      alt="Background"
      fallback="/background-placeholder.png"
    />
  );
}
