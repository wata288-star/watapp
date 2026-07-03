import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function base(props: P): P {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    width: 20,
    height: 20,
    "aria-hidden": true,
    ...props,
  };
}

export const IconGrid = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7" height="7" />
    <rect x="13.5" y="3.5" width="7" height="7" />
    <rect x="3.5" y="13.5" width="7" height="7" />
    <rect x="13.5" y="13.5" width="7" height="7" />
  </svg>
);

export const IconMachine = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 21h18" />
    <path d="M5 21V9h6v12" />
    <path d="M8 9V4h10v5" />
    <path d="M11 13h7a2 2 0 0 1 2 2v6" />
    <path d="M14 9v4" />
  </svg>
);

export const IconRecord = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M15 3v4h4" />
    <path d="M9 11h6" />
    <path d="M9 15h6" />
  </svg>
);

export const IconCert = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
    <circle cx="12" cy="10" r="3" />
    <path d="M8 16h8" strokeWidth="1.2" />
  </svg>
);

export const IconExchange = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h13" />
    <path d="M14 3.5 17.5 7 14 10.5" />
    <path d="M20 17H7" />
    <path d="M10 13.5 6.5 17l3.5 3.5" />
  </svg>
);

export const IconQr = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="6" height="6" />
    <rect x="14" y="4" width="6" height="6" />
    <rect x="4" y="14" width="6" height="6" />
    <path d="M14 14h3v3h-3z" />
    <path d="M20 14v.01" />
    <path d="M14 20h.01" />
    <path d="M17.5 17.5 20 20" />
  </svg>
);

export const IconScan = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8V4h4" />
    <path d="M16 4h4v4" />
    <path d="M20 16v4h-4" />
    <path d="M8 20H4v-4" />
    <path d="M4 12h16" />
  </svg>
);

export const IconCamera = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8h3l2-3h6l2 3h3v12H4z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.4-4.4" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const IconChevronRight = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const IconArrowLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </svg>
);

export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 22 20H2z" />
    <path d="M12 9.5v5" />
    <path d="M12 17.2v.01" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2.5" />
  </svg>
);

export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-6.5-5.5-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.5 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.5" />
  </svg>
);

export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4H5v16h9" />
    <path d="M10 12h10" />
    <path d="m16 8 4 4-4 4" />
  </svg>
);

export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);

export const IconBuilding = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 21V5l8-2v18" />
    <path d="M12 9l8 2v10" />
    <path d="M4 21h16" />
    <path d="M7.5 8.5h.01M7.5 12h.01M7.5 15.5h.01M15.5 14h.01M15.5 17h.01" />
  </svg>
);

export const IconPrint = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 8V3h10v5" />
    <path d="M5 8h14a1.5 1.5 0 0 1 1.5 1.5V17H17" />
    <path d="M7 17H3.5V9.5A1.5 1.5 0 0 1 5 8" />
    <path d="M7 14h10v7H7z" />
  </svg>
);

export const IconGlobe = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5S9.5 5.8 12 3.5z" />
  </svg>
);

export const IconHome = (p: P) => (
  <svg {...base(p)}>
    <path d="m4 11 8-7 8 7" />
    <path d="M6 9.5V20h12V9.5" />
    <path d="M10 20v-6h4v6" />
  </svg>
);

export const IconList = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 6h11" />
    <path d="M9 12h11" />
    <path d="M9 18h11" />
    <path d="M4 6h.01M4 12h.01M4 18h.01" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3 5 5.5v6c0 4.5 3 8 7 9.5 4-1.5 7-5 7-9.5v-6z" />
    <path d="m9 11.5 2.2 2.2L15.5 9.5" />
  </svg>
);

export const IconTag = (p: P) => (
  <svg {...base(p)}>
    <path d="M12.5 3H21v8.5l-9 9L3.5 12z" />
    <path d="M16.5 7.5h.01" />
  </svg>
);

export const IconWrench = (p: P) => (
  <svg {...base(p)}>
    <path d="M14.5 6.5a4.5 4.5 0 0 0 5.7 5.7L14 18.4A2.5 2.5 0 1 1 10.5 15l6.2-6.2a4.5 4.5 0 0 0-5.7-5.7l3 3-1.5 3-3 1.5z" transform="rotate(90 12 12)" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </svg>
);

export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v11" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M4 20h16" />
  </svg>
);
