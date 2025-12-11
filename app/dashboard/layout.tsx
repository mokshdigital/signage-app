'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log('[Dashboard] Auth state:', { user: user?.email, loading, authCheckComplete });

    // Wait for loading to complete before making any decisions
    if (loading) {
      console.log('[Dashboard] Still loading auth...');
      return;
    }

    // Mark auth check as complete
    setAuthCheckComplete(true);

    if (!user) {
      console.log('[Dashboard] No user found, redirecting to login');
      window.location.href = '/login';
    } else {
      console.log('[Dashboard] User authenticated:', user.email);
    }
  }, [user, loading]);


  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Technicians', href: '/dashboard/technicians', icon: '👷' },
    { name: 'Equipment', href: '/dashboard/equipment', icon: '🔧' },
    { name: 'Vehicles', href: '/dashboard/vehicles', icon: '🚗' },
    { name: 'Work Orders', href: '/dashboard/work-orders', icon: '📋' },
    { name: 'Account', href: '/dashboard/account', icon: '👤' },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  // Show loading while auth is being checked
  if (loading || !authCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                TL
              </div>
              <span className="text-xl font-semibold text-gray-900">
                Tops Lighting
              </span>
            </Link>
          </div>

          {/* Dashboard Title, User Info & Logout */}
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-gray-600">
              {user?.email || 'Dashboard'}
            </span>
            <Link
              href="/dashboard/account"
              className="hidden sm:inline px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Account
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } fixed lg:static lg:translate-x-0 left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-20`}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-10"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
