'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import Footer from './Footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Check if current route is an admin route
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Always render all components, but conditionally show them
  return (
    <>
      {!isAdminRoute && <Navigation />}
      <main className="min-h-screen bg-white">
        {children}
      </main>
      {!isAdminRoute && <Footer />}
    </>
  );
}







