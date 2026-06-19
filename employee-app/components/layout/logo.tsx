import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  variant?: 'light' | 'dark';
};

export function Logo({ className, variant = 'dark' }: LogoProps) {
  // Light variant: "Bit" is navy-200 or white, "Health" is orange or white.
  // In the auth sidebar (navy-600 background), we want the logo icon to be orange + white (or light blue), and text to be white/orange.
  const navyColor = variant === 'light' ? '#FFFFFF' : '#122A67';
  const orangeColor = '#F34B1F';
  const textColorNavy = variant === 'light' ? '#FFFFFF' : '#122A67';

  return (
    <svg
      className={cn('h-8 w-auto', className)}
      viewBox="0 0 240 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Icon Group */}
      <g transform="translate(5, 5)">
        {/* Top-left Orange Bracket */}
        <path
          d="M 10 36 L 10 24 L 24 10 H 62 V 36 H 50 V 22 H 22 V 36 Z"
          fill={orangeColor}
        />
        {/* Bottom-right Navy/White Bracket */}
        <path
          d="M 62 24 V 36 L 48 50 H 10 V 24 H 22 V 38 H 50 V 24 Z"
          fill={navyColor}
        />
      </g>

      {/* Text Group */}
      <text
        x="85"
        y="41"
        fill={textColorNavy}
        fontFamily="var(--font-sans), sans-serif"
        fontWeight="700"
        fontSize="34"
        letterSpacing="-0.03em"
      >
        Bit
      </text>
      <text
        x="132"
        y="41"
        fill={orangeColor}
        fontFamily="var(--font-sans), sans-serif"
        fontWeight="700"
        fontSize="34"
        letterSpacing="-0.03em"
      >
        Health
      </text>
    </svg>
  );
}
