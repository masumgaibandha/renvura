'use client';

import { Button, Modal, type useOverlayState } from '@heroui/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

type OverlayState = ReturnType<typeof useOverlayState>;

export type ConfirmModalProps = {
  /** From HeroUI's `useOverlayState()`. */
  state: OverlayState;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
};

/**
 * The single confirmation dialog primitive — Project Specification v1.8 §5.10,
 * which specifies HeroUI Modal so no extra dialog dependency is added.
 *
 * Phase 1 has no destructive action to confirm; this is the primitive the
 * later phases build on (cancel order, remove from cart, delete address,
 * admin destructive actions).
 */
export function ConfirmModal({
  state,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isDestructive = false,
  isPending = false,
  onConfirm,
}: ConfirmModalProps) {
  const t = useTranslations('common');

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            {description ? (
              <Modal.Body>
                <p className="text-sm text-ink-muted">{description}</p>
              </Modal.Body>
            ) : null}
            <Modal.Footer>
              <Button variant="outline" isDisabled={isPending} onPress={state.close}>
                {cancelLabel ?? t('cancel')}
              </Button>
              <Button
                variant={isDestructive ? 'danger' : 'primary'}
                isDisabled={isPending}
                onPress={() => void onConfirm()}
              >
                {confirmLabel ?? t('confirm')}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
