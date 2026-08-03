import Image from 'next/image';

/**
 * The brand ships as light/dark pairs, so the swap is pure CSS — no JS, no
 * hydration flash, and never a filtered approximation of the mark.
 */
export function Logo({
  className = '',
  width = 150,
  height = 45,
  priority = false,
}: {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  return (
    <span className={`inline-flex ${className}`}>
      <Image
        src="/brand/logo-light.png"
        alt="Renvura"
        width={width}
        height={height}
        priority={priority}
        className="block h-auto dark:hidden"
        style={{ width, height: 'auto' }}
      />
      <Image
        src="/brand/logo-dark.png"
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        priority={priority}
        className="hidden h-auto dark:block"
        style={{ width, height: 'auto' }}
      />
    </span>
  );
}

export function Monogram({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex ${className}`}>
      <Image
        src="/brand/appicon-light.png"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="block rounded-lg dark:hidden"
      />
      <Image
        src="/brand/appicon-dark.png"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="hidden rounded-lg dark:block"
      />
    </span>
  );
}
