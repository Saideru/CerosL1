import React from 'react';

interface CerosLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const CerosLogo: React.FC<CerosLogoProps> = ({
  size = 36,
  className = '',
  showText = false
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="CerosL1 Logo"
        role="img"
      >
        {/* Deep Slate rounded square container with 22% corner radius */}
        <rect
          width="100"
          height="100"
          rx="22"
          ry="22"
          fill="#0F172A"
        />

        {/* Emerald "C" curve (stroke 9.4% = 9.4px, round caps) cradling L and 1, with 25% clear space */}
        <path
          d="M 68 31.5 L 39 31.5 A 8 8 0 0 0 31 39.5 L 31 60.5 A 8 8 0 0 0 39 68.5 L 68 68.5"
          stroke="#059669"
          strokeWidth="9.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Platinum Ice "L" letter (stroke 5% = 5px, round caps) */}
        <path
          d="M 45 42 L 45 58 L 53 58"
          stroke="#F8FAFC"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Platinum Ice "1" numeral (stroke 5% = 5px, round caps) */}
        <path
          d="M 60 45 L 63 42 L 63 58"
          stroke="#F8FAFC"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-[#0F172A] dark:text-[#F8FAFC] leading-none">
            CerosL1
          </span>
          <span className="text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8] tracking-wider uppercase mt-0.5">
            Calculator
          </span>
        </div>
      )}
    </div>
  );
};
