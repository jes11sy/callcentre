'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;
    
    if (user) {
      // Redirect to telephony page for authenticated users
      router.push('/telephony');
    } else {
      // Redirect to login page for unauthenticated users
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Перенаправление...</p>
      </div>
    </div>
  );
}