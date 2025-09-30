'use client';

import { usePathname } from 'next/navigation';
import AdminLayoutWrapper from './AdminLayoutWrapper';

interface ConditionalAdminLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalAdminLayout({ children }: ConditionalAdminLayoutProps) {
  const pathname = usePathname();
  
  // Check if current route is the admin login page
  const isLoginPage = pathname === '/admin/login';
  
  // For login page, don't show admin layout (no sidebar/header)
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }
  
  // For all other admin pages, show full admin layout with sidebar and header
  return (
    <AdminLayoutWrapper>
      {children}
    </AdminLayoutWrapper>
  );
}







