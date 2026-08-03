'use client';

import { Button } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { AppLink } from '@/components/ui/AppLink';
import { usePathname } from '@/i18n/navigation';
import { navRoutes } from '@/lib/site';

export function MobileMenu() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="sm:hidden">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        isIconOnly
        aria-label={open ? t('closeMenu') : t('openMenu')}
        aria-expanded={open}
        aria-controls={panelId}
        onPress={() => setOpen((value) => !value)}
        className="text-ink"
      >
        {open ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
      </Button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-surface shadow-lg"
      >
        <nav aria-label={t('menuLabel')}>
          <ul className="flex flex-col p-2">
            {navRoutes.map((route) => {
              const isActive = pathname === route.path;
              return (
                <li key={route.path}>
                  <AppLink
                    href={route.path}
                    // Closed on click rather than in an effect on `pathname`,
                    // which would cascade an extra render on every navigation.
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                      isActive ? 'bg-surface-2 text-ink' : 'text-ink-muted hover:bg-surface-2'
                    }`}
                  >
                    {t(route.navKey)}
                  </AppLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
