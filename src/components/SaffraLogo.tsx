import React from "react";

interface SaffraLogoProps {
  showTagline?: boolean;
  size?: number;
}

export function SaffraLogo({ showTagline = false, size = 38 }: SaffraLogoProps) {
  return (
    <div className="inline-flex items-center gap-2.5 shrink-0">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M32 9L6 21L32 33L58 21L32 9Z"
          fill="#171717"
          stroke="#171717"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M17 28V43C17 43 23 49 32 49C41 49 47 43 47 43V28L32 35L17 28Z"
          fill="#FFC928"
          stroke="#171717"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M54 23V39"
          stroke="#FFC928"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="54" cy="41.5" r="2.75" fill="#171717" />
        <path
          d="M26.5 20.5L30.5 24.5L38.5 16.5"
          stroke="#FFC928"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="leading-none">
        <span className="font-heading text-[1.45rem] font-extrabold tracking-tight text-[#171717] whitespace-nowrap block">
          Saffra
        </span>
        {showTagline && (
          <span className="text-[0.72rem] font-medium text-[#77736B] whitespace-nowrap block mt-0.5">
            Vote. Transparently.
          </span>
        )}
      </div>
    </div>
  );
}
