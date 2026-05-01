'use client';

import { motion } from 'framer-motion';

// Caminhos gerados uma vez fora do componente → sem hydration mismatch
const PATHS = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  d: `M-${380 - i * 5} -${189 + i * 6}C-${380 - i * 5} -${189 + i * 6} -${312 - i * 5} ${216 - i * 6} ${152 - i * 5} ${343 - i * 6}C${616 - i * 5} ${470 - i * 6} ${684 - i * 5} ${875 - i * 6} ${684 - i * 5} ${875 - i * 6}`,
  width: 0.5 + i * 0.03,
  opacity: 0.1 + i * 0.03,
  // Duração determinística — sem Math.random() para evitar hydration mismatch
  duration: 20 + (i % 10),
}));

/** Camada de caminhos flutuantes animados — posicionar dentro de `relative overflow-hidden` */
export function BackgroundPaths() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Dois grupos espelhados preenchem toda a tela */}
      <FloatingLayer direction={1} />
      <FloatingLayer direction={-1} />
    </div>
  );
}

function FloatingLayer({ direction }: { direction: 1 | -1 }) {
  return (
    <div
      className="absolute inset-0"
      style={{ transform: direction === -1 ? 'scaleX(-1)' : undefined }}
    >
      <svg
        className="h-full w-full text-white"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {PATHS.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={path.opacity}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: path.duration,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}
