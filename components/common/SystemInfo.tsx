'use client';

import { usePublicSettings } from '@/hooks/useSettings';

interface SystemInfoProps {
  showName?: boolean;
  showDescription?: boolean;
  showTagline?: boolean;
  showContact?: boolean;
  className?: string;
}

export default function SystemInfo({ 
  showName = true, 
  showDescription = true, 
  showTagline = false,
  showContact = false,
  className = '' 
}: SystemInfoProps) {
  const { settings, loading } = usePublicSettings();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        {showTagline && <div className="h-4 bg-gray-200 rounded"></div>}
      </div>
    );
  }

  return (
    <div className={className}>
      {showName && (
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {settings.app_name || 'Suuqsade Marketplace'}
        </h1>
      )}
      
      {showDescription && (
        <p className="text-gray-600 mb-2">
          {settings.app_description || 'A modern e-commerce marketplace platform'}
        </p>
      )}
      
      {showTagline && (
        <p className="text-sm text-gray-500 italic">
          {settings.app_tagline || 'Your trusted marketplace'}
        </p>
      )}
      
      {showContact && (
        <div className="mt-4 space-y-1">
          {settings.contact_email && (
            <p className="text-sm text-gray-600">
              Email: <a href={`mailto:${settings.contact_email}`} className="text-orange-600 hover:text-orange-700">
                {settings.contact_email}
              </a>
            </p>
          )}
          {settings.phone_number && (
            <p className="text-sm text-gray-600">
              Phone: <a href={`tel:${settings.phone_number}`} className="text-orange-600 hover:text-orange-700">
                {settings.phone_number}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Component for displaying contact information
export function ContactInfo({ className = '' }: { className?: string }) {
  const { settings, loading } = usePublicSettings();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
      
      <div className="space-y-2">
        {settings.contact_email && (
          <div className="flex items-center">
            <span className="text-sm text-gray-600 w-16">Email:</span>
            <a 
              href={`mailto:${settings.contact_email}`} 
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              {settings.contact_email}
            </a>
          </div>
        )}
        
        {settings.phone_number && (
          <div className="flex items-center">
            <span className="text-sm text-gray-600 w-16">Phone:</span>
            <a 
              href={`tel:${settings.phone_number}`} 
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              {settings.phone_number}
            </a>
          </div>
        )}
        
        {settings.address && (
          <div className="flex items-start">
            <span className="text-sm text-gray-600 w-16">Address:</span>
            <span className="text-sm text-gray-700">{settings.address}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for displaying social media links
export function SocialLinks({ className = '' }: { className?: string }) {
  const { settings, loading } = usePublicSettings();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex space-x-4">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const socialLinks = [
    { key: 'facebook_url', name: 'Facebook', icon: '📘' },
    { key: 'twitter_url', name: 'Twitter', icon: '🐦' },
    { key: 'instagram_url', name: 'Instagram', icon: '📷' },
    { key: 'linkedin_url', name: 'LinkedIn', icon: '💼' },
    { key: 'youtube_url', name: 'YouTube', icon: '📺' }
  ].filter(link => settings[link.key]);

  if (socialLinks.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Follow Us</h3>
      <div className="flex space-x-4">
        {socialLinks.map((link) => (
          <a
            key={link.key}
            href={settings[link.key]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl hover:scale-110 transition-transform"
            title={link.name}
          >
            {link.icon}
          </a>
        ))}
      </div>
    </div>
  );
}

// Component for displaying legal links
export function LegalLinks({ className = '' }: { className?: string }) {
  const { settings, loading } = usePublicSettings();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const legalLinks = [
    { key: 'terms_of_service_url', name: 'Terms of Service' },
    { key: 'privacy_policy_url', name: 'Privacy Policy' },
    { key: 'refund_policy_url', name: 'Refund Policy' },
    { key: 'shipping_policy_url', name: 'Shipping Policy' }
  ].filter(link => settings[link.key]);

  if (legalLinks.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Legal</h3>
      <div className="space-y-2">
        {legalLinks.map((link) => (
          <a
            key={link.key}
            href={settings[link.key]}
            className="block text-sm text-gray-600 hover:text-orange-600 transition-colors"
          >
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
}
