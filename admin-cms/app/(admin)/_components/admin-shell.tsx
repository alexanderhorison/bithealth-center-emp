'use client';

import type { ComponentType, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, LayoutDashboard, Menu, PanelLeftClose, PanelLeftOpen, ShieldCheck, Users, X } from 'lucide-react';

import { UserMenu } from '@/components/auth/user-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AdminShellProps = {
  user: {
    email: string;
    fullName: string | null;
  };
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    href: '/access-requests',
    label: 'Account Requests',
    icon: ClipboardList
  },
  {
    href: '/employees',
    label: 'Employee Management',
    icon: Users
  },
  {
    href: '/roles',
    label: 'Role Management',
    icon: ShieldCheck
  },
  {
    href: '/presences',
    label: 'Presence Management',
    icon: ClipboardList
  }
];

const sidebarCollapsedStorageKey = 'admin-cms-sidebar-collapsed';

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const rawValue = window.localStorage.getItem(sidebarCollapsedStorageKey);
    setSidebarCollapsed(rawValue === 'true');
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(sidebarCollapsedStorageKey, String(sidebarCollapsed));
  }, [sidebarCollapsed, isReady]);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const onToggleSidebar = () => {
    if (isDesktop) {
      setSidebarCollapsed((current) => !current);
      return;
    }

    setMobileSidebarOpen((current) => !current);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {!isDesktop && mobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-zinc-900/25"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <div className="flex min-h-screen">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 h-screen border-r border-stone-300 bg-[#f1ece2] shadow-sm transition-transform duration-200 md:shadow-none',
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
            sidebarCollapsed ? 'w-72 md:w-20' : 'w-72 md:w-64'
          )}
        >
          <div className="flex h-full flex-col">
            <div className={cn('flex h-16 items-center', sidebarCollapsed ? 'px-3 justify-center' : 'px-5')}>
              <p className="text-base font-semibold text-stone-900">Bithealth Center</p>
            </div>

            <nav className={cn('space-y-1 py-4', sidebarCollapsed ? 'px-2' : 'px-3')}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex h-10 items-center rounded-lg border border-transparent text-sm font-medium text-stone-700 transition',
                      isActive
                        ? 'border-stone-300 bg-stone-50 text-stone-900'
                        : 'hover:border-stone-200 hover:bg-stone-50',
                      sidebarCollapsed ? 'justify-center px-0' : 'gap-2 px-3'
                    )}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className={cn(sidebarCollapsed && 'hidden')}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className={cn('mt-auto pb-4 text-xs text-stone-600', sidebarCollapsed ? 'px-3 text-center' : 'px-5')}>
              v1.0
            </div>
          </div>
        </aside>

        <div
          className={cn(
            'flex min-h-screen min-w-0 flex-1 flex-col',
            isDesktop ? (sidebarCollapsed ? 'md:ml-20' : 'md:ml-64') : 'ml-0'
          )}
        >
          <header className="sticky top-0 z-20 border-b border-stone-300 bg-stone-100/95 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 md:px-6">
              <Button
                variant="outline"
                className="h-10 w-10 rounded-full bg-stone-50 px-0"
                onClick={onToggleSidebar}
                aria-label={isDesktop ? 'Toggle sidebar collapse' : 'Toggle sidebar menu'}
              >
                {isDesktop ? (
                  sidebarCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                  )
                ) : mobileSidebarOpen ? (
                  <X className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Menu className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>

              <div className="shrink-0">
                <UserMenu fullName={user.fullName} email={user.email} />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
