'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  campaignName: string;
  managerName: string | null;
  managerEmail: string;
}

const NAV = [
  { href: '/painel', label: 'Dashboard' },
  { href: '/painel/leads', label: 'Leads' },
  { href: '/painel/materiais', label: 'Materiais' },
  { href: '/painel/disparar', label: 'Disparar' },
  { href: '/painel/historico', label: 'Histórico' },
  { href: '/painel/configuracoes', label: 'Configurações' },
];

export function Sidebar({ campaignName, managerName, managerEmail }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-shrink-0 flex-col bg-brand-dark text-white">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-xs uppercase tracking-wider text-white/50">
          Campanha
        </p>
        <p className="mt-1 truncate text-lg font-bold">{campaignName}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
        {NAV.map((item) => {
          const isActive =
            item.href === '/painel'
              ? pathname === '/painel'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-md px-3 py-2 transition ${
                isActive
                  ? 'bg-white/15 font-semibold text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="truncate text-sm font-medium">
          {managerName || managerEmail}
        </p>
        {managerName && (
          <p className="truncate text-xs text-white/60">{managerEmail}</p>
        )}
        <form action="/api/auth/logout" method="POST" className="mt-3">
          <button
            type="submit"
            className="w-full rounded-md border border-white/20 px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10"
          >
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
