'use client';

import type { ParticipationType } from '@/lib/supabase/types';

interface ParticipationToggleProps {
  value: ParticipationType | null;
  onChange: (value: ParticipationType) => void;
  primaryColor: string;
}

const OPTIONS: { value: ParticipationType; label: string; hint: string }[] = [
  { value: 'apoiador', label: 'Apoiador', hint: 'Quero acompanhar' },
  { value: 'colaborador', label: 'Colaborador', hint: 'Quero divulgar' },
  { value: 'lideranca', label: 'Liderança', hint: 'Mobilizo o meu grupo' },
];

export function ParticipationToggle({
  value,
  onChange,
  primaryColor,
}: ParticipationToggleProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`rounded-lg border-2 px-3 py-3 text-left transition ${
              active
                ? 'text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
            style={
              active
                ? { backgroundColor: primaryColor, borderColor: primaryColor }
                : undefined
            }
          >
            <span className="block text-sm font-semibold">{opt.label}</span>
            <span
              className={`block text-xs ${
                active ? 'text-white/80' : 'text-gray-500'
              }`}
            >
              {opt.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
