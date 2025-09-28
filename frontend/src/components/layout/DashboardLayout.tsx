'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface DashboardLayoutProps {
  children: ReactNode;
  variant?: 'operator' | 'admin';
  requiredRole?: 'admin' | 'operator';
}

export function DashboardLayout({ 
  children, 
  variant = 'operator', 
  requiredRole 
}: DashboardLayoutProps) {
  const allowedRoles = requiredRole ? [requiredRole] : ['admin', 'operator'];
  
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header variant={variant} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
