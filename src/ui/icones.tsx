// Jeu d'icônes en trait fin (line icons), sobres, sans aplat ni smiley.
// stroke = currentColor pour hériter de la couleur du contexte.
import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

/** Horloge : urgence J-7. */
export const IconHorloge = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

/** Triangle d'alerte : retard. */
export const IconAlerte = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3.5 21 19H3z" />
    <path d="M12 10v4" />
    <path d="M12 17h.01" />
  </svg>
);

/** Radar / veille : à surveiller. */
export const IconVeille = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 12 18 6" />
  </svg>
);

/** Boîte de réception : non affectées. */
export const IconInbox = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 13l2.2-7.2A2 2 0 0 1 8.1 4.5h7.8a2 2 0 0 1 1.9 1.3L20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M4 13h4l1.5 2.5h5L16 13h4" />
  </svg>
);

/** Coche cerclée : réalisées. */
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.2l2.4 2.4 4.6-5" />
  </svg>
);

/** Calendrier. */
export const IconCalendrier = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
  </svg>
);

/** Frise / activité. */
export const IconFrise = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 12h4l2.5-6 4 13 2.5-7H21" />
  </svg>
);
