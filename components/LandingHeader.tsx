import Image from 'next/image';

interface LandingHeaderProps {
  candidateName: string | null;
  campaignName: string;
  logoUrl: string | null;
}

export function LandingHeader({
  candidateName,
  campaignName,
  logoUrl,
}: LandingHeaderProps) {
  return (
    <header className="bg-brand-dark">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-5">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={campaignName}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full bg-white object-contain p-1"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-white">
            {(candidateName || campaignName).charAt(0).toUpperCase()}
          </div>
        )}
        <div className="leading-tight text-white">
          <p className="text-lg font-bold">{candidateName || campaignName}</p>
          {candidateName && (
            <p className="text-sm text-white/70">{campaignName}</p>
          )}
        </div>
      </div>
    </header>
  );
}
