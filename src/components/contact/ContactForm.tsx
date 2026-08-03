'use client';

import { Button, FieldError, Input, Label, Spinner, TextArea, TextField } from '@heroui/react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import type { Locale } from '@/i18n/routing';
import {
  HONEYPOT_FIELD,
  contactFormSchema,
  fieldErrorsFrom,
} from '@/lib/validation/contact';

type FieldName = 'name' | 'phone' | 'email' | 'subject' | 'message';

const emptyValues: Record<FieldName, string> = {
  name: '',
  phone: '',
  email: '',
  subject: '',
  message: '',
};

type ApiResponse = {
  ok: boolean;
  id?: string;
  code?: 'validation' | 'rejected' | 'rateLimit' | 'server';
  fieldErrors?: Record<string, string>;
};

export function ContactForm() {
  const t = useTranslations('contact');
  const locale = useLocale() as Locale;

  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Set on mount, not during render: `Date.now()` is impure and would give an
  // unstable value if the component re-rendered.
  const startedAt = useRef<number>(0);
  const successRef = useRef<HTMLDivElement>(null);

  // The clock starts when the form is actually shown to a person.
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  function setField(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const parsed = contactFormSchema.safeParse({ ...values, locale });
    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error));
      return;
    }

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...parsed.data,
          [HONEYPOT_FIELD]: formData.get(HONEYPOT_FIELD) ?? '',
          startedAt: startedAt.current,
        }),
      });

      const result = (await response.json().catch(() => ({ ok: false }))) as ApiResponse;

      if (response.ok && result.ok) {
        setValues(emptyValues);
        setSubmitted(true);
        toast.success(t('successToast'));
        return;
      }

      if (response.status === 429) {
        toast.error(t('rateLimitToast'));
        return;
      }

      if (result.code === 'validation' && result.fieldErrors) {
        setErrors(result.fieldErrors as Partial<Record<FieldName, string>>);
        toast.error(t('errorToast'));
        return;
      }

      toast.error(t('errorToast'));
    } catch {
      toast.error(t('errorToast'));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className="rounded-2xl border border-line bg-surface p-6 outline-none"
      >
        <h2 className="font-display text-xl text-ink">{t('successTitle')}</h2>
        <p className="mt-2 text-sm text-ink-muted">{t('successBody')}</p>
        <Button
          variant="outline"
          className="mt-5"
          onPress={() => {
            setSubmitted(false);
            startedAt.current = Date.now();
          }}
        >
          {t('sendAnother')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Honeypot: hidden from people, offered to bots. */}
      <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0">
        <label htmlFor="website-field">Website</label>
        <input
          id="website-field"
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <TextField
        name="name"
        value={values.name}
        onChange={(value) => setField('name', value)}
        isRequired
        isInvalid={Boolean(errors.name)}
        autoComplete="name"
        className="w-full"
      >
        <Label>{t('nameLabel')}</Label>
        <Input placeholder={t('namePlaceholder')} />
        {errors.name ? <FieldError>{t(`errors.${errors.name}`)}</FieldError> : null}
      </TextField>

      <TextField
        name="phone"
        type="tel"
        value={values.phone}
        onChange={(value) => setField('phone', value)}
        isRequired
        isInvalid={Boolean(errors.phone)}
        autoComplete="tel"
        className="w-full"
      >
        <Label>{t('phoneLabelField')}</Label>
        <Input inputMode="tel" placeholder={t('phonePlaceholder')} className="latin" />
        {errors.phone ? <FieldError>{t(`errors.${errors.phone}`)}</FieldError> : null}
      </TextField>

      <TextField
        name="email"
        type="email"
        value={values.email}
        onChange={(value) => setField('email', value)}
        isInvalid={Boolean(errors.email)}
        autoComplete="email"
        className="w-full"
      >
        <Label>{t('emailLabelField')}</Label>
        <Input inputMode="email" placeholder={t('emailPlaceholder')} className="latin" />
        {errors.email ? <FieldError>{t(`errors.${errors.email}`)}</FieldError> : null}
      </TextField>

      <TextField
        name="subject"
        value={values.subject}
        onChange={(value) => setField('subject', value)}
        isRequired
        isInvalid={Boolean(errors.subject)}
        className="w-full"
      >
        <Label>{t('subjectLabel')}</Label>
        <Input placeholder={t('subjectPlaceholder')} />
        {errors.subject ? <FieldError>{t(`errors.${errors.subject}`)}</FieldError> : null}
      </TextField>

      <TextField
        name="message"
        value={values.message}
        onChange={(value) => setField('message', value)}
        isRequired
        isInvalid={Boolean(errors.message)}
        className="w-full"
      >
        <Label>{t('messageLabel')}</Label>
        <TextArea rows={6} placeholder={t('messagePlaceholder')} />
        {errors.message ? <FieldError>{t(`errors.${errors.message}`)}</FieldError> : null}
      </TextField>

      <Button type="submit" variant="primary" size="lg" fullWidth isDisabled={submitting}>
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <Spinner size="sm" aria-hidden="true" />
            {t('submitting')}
          </span>
        ) : (
          t('submit')
        )}
      </Button>
    </form>
  );
}
