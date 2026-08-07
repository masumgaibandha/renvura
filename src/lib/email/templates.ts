export type ContactNotification = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  receivedAt: Date;
};

export type RenderedEmail = {
  to: string;
  subject: string;
  text: string;
};

export function renderContactNotification(
  notification: ContactNotification,
  to: string,
): RenderedEmail {
  const lines = [
    `New contact enquiry — Renvura`,
    ``,
    `Name:     ${notification.name}`,
    `Phone:    ${notification.phone}`,
    `Email:    ${notification.email ?? '—'}`,
    `Received: ${notification.receivedAt.toISOString()}`,
    `Ref:      ${notification.id}`,
    ``,
    `Subject: ${notification.subject}`,
    ``,
    notification.message,
  ];

  return {
    to,
    subject: `[Renvura] ${notification.subject}`,
    text: lines.join('\n'),
  };
}
