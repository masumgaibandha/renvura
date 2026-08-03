import { serverEnv } from '@/lib/env';
import { renderContactNotification, type ContactNotification } from './templates';

/**
 * Email sits behind an adapter so that no provider decision is baked into the
 * request path. Phase 1 ships the `log` adapter only: notifications are written
 * to the server log, and the enquiry itself is already persisted, so nothing is
 * lost. Adding a real provider means adding one branch here — no caller changes.
 */

export type EmailResult = {
  delivered: boolean;
  provider: string;
  error?: string;
};

export async function sendContactNotification(
  notification: ContactNotification,
): Promise<EmailResult> {
  const env = serverEnv();
  const rendered = renderContactNotification(notification, env.CONTACT_EMAIL_TO);

  switch (env.EMAIL_PROVIDER) {
    case 'log': {
      console.info(
        `[email:log] Contact notification not sent — no provider configured.\n` +
          `to: ${rendered.to}\nsubject: ${rendered.subject}\n\n${rendered.text}`,
      );
      return { delivered: false, provider: 'log' };
    }
    default: {
      // `EMAIL_PROVIDER` is a closed enum, so this is unreachable; it exists so
      // that adding a provider without an adapter fails loudly rather than
      // silently dropping mail.
      const provider: never = env.EMAIL_PROVIDER;
      return {
        delivered: false,
        provider: String(provider),
        error: 'No adapter registered for this email provider',
      };
    }
  }
}

export type { ContactNotification };
