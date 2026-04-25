'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ManagerRole } from '@/lib/supabase/types';

interface SidebarProps {
  campaignName: string | null;
  managerName: string | null;
  managerEmail: string;
  role: ManagerRole;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const DashboardIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
  </svg>
);

const LeadsIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const MateriaisIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
  </svg>
);

const DispararIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
);

const HistoricoIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const UsuariosIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const CampanhasIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
  </svg>
);

function buildNav(role: ManagerRole, hasCampaign: boolean): NavItem[] {
  const items: NavItem[] = [];

  if (hasCampaign) {
    items.push(
      { href: '/painel', label: 'Dashboard', icon: <DashboardIcon /> },
      { href: '/painel/leads', label: 'Leads', icon: <LeadsIcon /> },
      { href: '/painel/materiais', label: 'Materiais', icon: <MateriaisIcon /> },
      { href: '/painel/disparar', label: 'Disparar', icon: <DispararIcon /> },
      { href: '/painel/historico', label: 'Histórico', icon: <HistoricoIcon /> },
    );
  }

  if (role === 'master' || role === 'gestor') {
    items.push(
      { href: '/painel/usuarios', label: 'Usuários', icon: <UsuariosIcon /> },
      { href: '/painel/campanhas', label: 'Campanhas', icon: <CampanhasIcon /> },
    );
  }

  return items;
}

export function Sidebar({ campaignName, managerName, managerEmail, role }: SidebarProps) {
  const pathname = usePathname();
  const nav = buildNav(role, !!campaignName);

  return (
    <aside className="flex w-64 flex-shrink-0 flex-col bg-brand-dark text-white">
      {/* Brand */}
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-lg font-bold tracking-tight">
          Divulga<span className="text-[#E84C22]">cam</span>
        </p>
        {campaignName && (
          <p className="mt-1 truncate text-xs text-white/50">{campaignName}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
        {nav.map((item) => {
          const isActive =
            item.href === '/painel'
              ? pathname === '/painel'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition ${
                isActive
                  ? 'bg-white/15 font-semibold text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#E84C22]/20 text-xs font-bold text-[#E84C22]">
            {(managerName || managerEmail).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {managerName || managerEmail}
            </p>
            {managerName && (
              <p className="truncate text-xs text-white/50">{managerEmail}</p>
            )}
            {(role === 'master' || role === 'gestor') && (
              <span className="mt-0.5 inline-block rounded bg-[#E84C22]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#E84C22]">
                {role}
              </span>
            )}
          </div>
        </div>
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
