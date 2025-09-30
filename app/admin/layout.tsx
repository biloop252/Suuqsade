import type { Metadata } from 'next';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';
import ConditionalAdminLayout from '@/components/admin/ConditionalAdminLayout';

export const metadata: Metadata = {
  title: 'Admin Panel - Suuqsade Marketplace',
  description: 'Admin panel for managing Suuqsade Marketplace',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConditionalAdminLayout>
      {children}
    </ConditionalAdminLayout>
  );
}
