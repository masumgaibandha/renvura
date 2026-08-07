import Image from 'next/image';

/**
 * The storefront ships light/cream only at launch (D-07), so the light brand
 * mark is the one that renders. The dark variants stay in `public/brand/` for
 * possible post-launch work; nothing here depends on a theme switch existing.
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
    <Image
      src="/brand/logo-light.png"
      alt="Renvura"
      width={width}
      height={height}
      priority={priority}
      className={`block h-auto ${className}`}
      style={{ width, height: 'auto' }}
    />
  );
}

export function Monogram({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/appicon-light.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`block rounded-lg ${className}`}
    />
  );
}
