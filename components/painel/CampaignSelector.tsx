'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Campaign } from '@/lib/supabase/types';

interface Props {
  campaigns: Pick<Campaign, 'id' | 'name' | 'slug'>[];
  activeCampaignId: string;
}

export function CampaignSelector({ campaigns, activeCampaignId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(campaignId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('campanha', campaignId);
    // Reset page param when switching campaigns
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  if (campaigns.length <= 1) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
      <svg className="h-4 w-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
      </svg>
      <label htmlFor="campaign-selector" className="text-sm font-medium text-blue-800">
        Campanha:
      </label>
      <select
        id="campaign-selector"
        value={activeCampaignId}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
