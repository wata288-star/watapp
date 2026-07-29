type IconProps = { size?: number; className?: string };

function base(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

export const IconHome = ({ size = 24, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 10v10h14V10" />
  </svg>
);

export const IconRecord = ({ size = 24, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
);

export const IconBook = ({ size = 24, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M3 5a2 2 0 0 1 2-2h5v18H5a2 2 0 0 1-2-2z" />
    <path d="M21 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2z" />
  </svg>
);

export const IconMenu = ({ size = 24, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const IconBell = ({ size = 24, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10.5 20a2 2 0 0 0 3 0" />
  </svg>
);

/** 歯車＋虫めがね＋「!」。確定デザインのトラブルシューティングのアイコン。 */
export const IconWrench = ({ size = 24, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M10.2 2.6h3.6l.5 2.1 1.9.8 1.8-1.2 2.6 2.6-1.2 1.8.8 1.9 2.1.5v3.6l-2.1.5-.8 1.9 1.2 1.8-2.6 2.6-1.8-1.2-1.9.8-.5 2.1h-3.6l-.5-2.1-1.9-.8-1.8 1.2-2.6-2.6 1.2-1.8-.8-1.9-2.1-.5v-3.6l2.1-.5.8-1.9-1.2-1.8 2.6-2.6 1.8 1.2 1.9-.8z" />
    <circle cx="11.4" cy="11.4" r="4.1" />
    <path d="m14.6 14.6 3.1 3.1" />
    <path d="M11.4 9.2v2.6M11.4 13.5h.01" />
  </svg>
);

/** 再生枠＋歯車。確定デザインの動画マニュアルのアイコン。 */
export const IconPlaySquare = ({ size = 24, className }: IconProps) => (
  <svg {...base(size, className)}>
    <rect x="2.2" y="5" width="15.6" height="12" rx="3.2" />
    <path d="m8.6 9 4.4 2.6-4.4 2.6z" />
    <circle cx="18.2" cy="17.4" r="2.4" />
    <path d="M18.2 13.6v1.2M18.2 20v1.2M14.4 17.4h1.2M20.8 17.4H22M15.5 14.7l.9.9M20 19.2l.9.9M20.9 14.7l-.9.9M16.4 19.2l-.9.9" />
  </svg>
);

export const IconPlay = ({ size = 24, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M7 4.5 19 12 7 19.5z" fill="currentColor" />
  </svg>
);

export const IconChevronLeft = ({ size = 22, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="m14.5 5-7 7 7 7" />
  </svg>
);

export const IconChevronRight = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="m9.5 5 7 7-7 7" />
  </svg>
);

export const IconCheck = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="m4 12.5 5 5L20 6.5" />
  </svg>
);

export const IconClose = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="m5 5 14 14M19 5 5 19" />
  </svg>
);

export const IconSearch = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const IconCamera = ({ size = 22, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M3 8.5a2 2 0 0 1 2-2h2.2l1.3-2h6l1.3 2H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="13" r="3.4" />
  </svg>
);

export const IconMic = ({ size = 22, className }: IconProps) => (
  <svg {...base(size, className)}>
    <rect x="9" y="2.5" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" />
  </svg>
);

export const IconSparkle = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
    <path d="M18.5 3v3M20 4.5h-3" />
  </svg>
);

export const IconQr = ({ size = 22, className }: IconProps) => (
  <svg {...base(size, className)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <path d="M14 14h3v3h-3zM20 14v3M17 20h4M14 20h.01" />
  </svg>
);

export const IconAlert = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M12 3.5 22 20H2z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
);

export const IconStar = ({ size = 22, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="m12 3.8 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 10l5.9-.9z" />
  </svg>
);

export const IconStarFill = ({ size = 22, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path
      d="m12 3.8 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 10l5.9-.9z"
      fill="currentColor"
    />
  </svg>
);

export const IconClock = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconOffline = ({ size = 18, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M3 3l18 18" />
    <path d="M6.5 11.5a7 7 0 0 1 3-2.2M2.5 8.5a12 12 0 0 1 4-2.7M17.5 11.5a7 7 0 0 0-2.4-1.9M21.5 8.5a12 12 0 0 0-5.8-3.2M9.5 15a4 4 0 0 1 5 0M12 19h.01" />
  </svg>
);

export const IconDownload = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4 19.5h16" />
  </svg>
);

export const IconPdf = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M8.5 17v-3.5h1.2a1.2 1.2 0 0 1 0 2.4H8.5M13 17v-3.5h1.4a1.7 1.7 0 0 1 0 3.5z" />
  </svg>
);

export const IconShare = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M12 15V3.5M8 7l4-3.5L16 7" />
    <path d="M5 13v6.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V13" />
  </svg>
);

export const IconLink = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 1 0-5-5l-1.2 1.2" />
    <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 1 0 5 5l1.2-1.2" />
  </svg>
);

export const IconPlus = ({ size = 22, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconGauge = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M4 18a8 8 0 1 1 16 0" />
    <path d="M12 18l4-5" />
  </svg>
);

export const IconUser = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="8" r="3.8" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);

export const IconChevronDown = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="m5 9 7 7 7-7" />
  </svg>
);
