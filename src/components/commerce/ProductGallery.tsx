'use client';

import Image from 'next/image';
import { useState } from 'react';
import { FiPlay } from 'react-icons/fi';
import type { ProductCardImage, ProductVideo } from '@/lib/content/storefront';

/**
 * Product media gallery — design direction §8.4.
 *
 * The only client component on the detail page: selecting a thumbnail is real
 * interaction, everything else stays a server component.
 *
 * Deliberately no carousel library (D-04, D-14). One main frame plus a
 * thumbnail strip covers the whole requirement in ~100 lines and ships no
 * dependency, no animation runtime and no layout shift.
 *
 * Accessibility:
 *  - thumbnails are real `<button>`s, so Tab reaches them and Enter/Space works
 *  - the selected one carries `aria-current` **and** a visible ring **and** an
 *    sr-only "selected" — never colour alone (§3.4)
 *  - the main frame is a live region label so a screen reader is told what
 *    changed when a thumbnail is chosen
 *  - every image keeps the alt text authored in Phase 2B
 *
 * Video never autoplays and is `preload="none"`, so it costs nothing until a
 * parent chooses to watch it. The product's primary image stands in as the
 * poster frame.
 */

type GalleryItem =
  | { kind: 'image'; image: ProductCardImage }
  | { kind: 'video'; video: ProductVideo };

export function ProductGallery({
  images,
  video,
  productName,
}: {
  images: ProductCardImage[];
  video?: ProductVideo;
  productName: string;
}) {
  const items: GalleryItem[] = [
    ...images.map((image) => ({ kind: 'image' as const, image })),
    ...(video ? [{ kind: 'video' as const, video }] : []),
  ];

  const [selected, setSelected] = useState(0);

  if (items.length === 0) return null;

  const current = items[Math.min(selected, items.length - 1)]!;

  return (
    <div>
      <div
        className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface"
        aria-live="polite"
      >
        {current.kind === 'image' ? (
          <Image
            src={current.image.url}
            alt={current.image.alt}
            width={current.image.width}
            height={current.image.height}
            // Exactly one priority image per page (D-14): the first frame.
            priority={selected === 0}
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="size-full object-contain object-center"
          />
        ) : (
          <video
            key={current.video.url}
            src={current.video.url}
            poster={current.video.posterUrl}
            controls
            playsInline
            preload="none"
            aria-label={current.video.title ?? `Video: ${productName}`}
            className="size-full object-contain"
          />
        )}
      </div>

      {items.length > 1 ? (
        <ul aria-label="Product media" className="mt-3 flex flex-wrap gap-2">
          {items.map((item, index) => {
            const isSelected = index === selected;
            const isVideo = item.kind === 'video';
            const thumbSrc = isVideo ? item.video.posterUrl : item.image.url;
            // The video thumbnail always announces what activating it does,
            // then what the clip shows — "Play video:" first, because the
            // caption alone reads as another still image.
            const label = isVideo
              ? `Play video: ${item.video.title ?? productName}`
              : item.image.alt;

            return (
              <li key={isVideo ? item.video.url : item.image.url}>
                <button
                  type="button"
                  onClick={() => setSelected(index)}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`relative flex size-16 items-center justify-center overflow-hidden rounded-xl border-2 bg-surface transition-colors sm:size-20 ${
                    isSelected ? 'border-brand-navy' : 'border-line hover:border-ink-muted'
                  }`}
                >
                  {thumbSrc ? (
                    <Image
                      src={thumbSrc}
                      alt=""
                      aria-hidden="true"
                      width={80}
                      height={80}
                      className="size-full object-contain"
                    />
                  ) : null}

                  {isVideo ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-brand-navy/45">
                      <FiPlay aria-hidden="true" className="size-5 text-brand-cream" />
                    </span>
                  ) : null}

                  <span className="sr-only">
                    {label}
                    {isSelected ? ' (selected)' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
