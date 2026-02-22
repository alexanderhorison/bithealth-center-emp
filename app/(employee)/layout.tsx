import { AppFooter } from '@/components/layout/app-footer';

export default function EmployeeAreaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-100">
      <div className="flex-1">{children}</div>
      <AppFooter />
    </div>
  );
}
