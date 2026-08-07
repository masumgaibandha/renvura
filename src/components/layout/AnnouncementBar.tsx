import { FiPhone } from 'react-icons/fi';
import { Container } from '@/components/ui/Container';
import { siteConfig } from '@/lib/site';

/**
 * Announcement and delivery bar — design direction §5.1.
 *
 * Navy, one line, cream text. The content is restricted to **founder-supplied
 * fact**: the published support number. No invented free-delivery threshold, no
 * invented delivery time, no countdown, no marquee (D-12).
 *
 * When real delivery copy exists it replaces the support line here.
 */
export function AnnouncementBar() {
  return (
    <div className="bg-brand-navy text-brand-cream">
      <Container className="flex flex-wrap items-center justify-center gap-x-3 text-center sm:justify-between sm:text-left">
        <p className="text-xs sm:text-[0.8125rem]">
          Questions before you order? Talk to us directly.
        </p>
        {/* 44px tall so the tap target meets the accessibility minimum; the bar
            itself stays visually light because the type is small. */}
        <a
          href={siteConfig.phoneHref}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs font-semibold transition-colors hover:text-brand-gold sm:min-h-9 sm:text-[0.8125rem]"
        >
          <FiPhone aria-hidden="true" className="size-3.5" />
          <span className="latin">{siteConfig.phone}</span>
        </a>
      </Container>
    </div>
  );
}
