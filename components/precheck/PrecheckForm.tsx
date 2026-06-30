"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';
import { forwardRef } from 'react';

const Schema = z.object({
  email: z.string().trim().email(),
  productName: z.string().trim().min(2),
  brand: z.string().trim().min(1),
  category: z.string().trim().min(1, 'Kategorie erforderlich'),
  code: z.string().trim().min(2),
  specs: z.string().trim().min(5),
  privacyAccepted: z.boolean().refine((value) => value === true, {
    message: 'Bitte Datenschutzerklärung akzeptieren',
  }),
});

type FormValues = z.infer<typeof Schema>;

export default function PrecheckForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [devClaimUrl, setDevClaimUrl] = useState<string | null>(null);
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === 'en' ? en : de);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { privacyAccepted: false },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setSubmittedEmail(null);
    setDevClaimUrl(null);
    const res = await fetch('/api/precheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (data?.ok && data?.pending) {
      setSubmittedEmail(values.email.trim().toLowerCase());
      setDevClaimUrl(typeof data.claimUrl === 'string' ? data.claimUrl : null);
      setSubmitting(false);
    } else {
      alert('Fehler beim Absenden. Bitte prüfen Sie Ihre Eingaben.');
      setSubmitting(false);
    }
  };

  const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => (
      <input
        ref={ref}
        {...props}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 ${props.className ?? ''}`}
      />
    )
  );
  Input.displayName = 'Input';

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-sm font-medium text-gray-800">{children}</label>
  );

  const Error = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-sm text-red-600">{msg}</p> : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold">{tr('Pre-Check (0 €)', 'Pre-check (0 €)')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="on">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>{tr('E-Mail', 'Email')}</Label>
            <Input {...register('email')} type="email" placeholder="name@domain.tld" autoComplete="email" required />
            <Error msg={errors.email?.message} />
          </div>
          <div className="md:col-span-2">
            <Label>{tr('Kategorie', 'Category')}</Label>
            <select
              {...register('category')}
              defaultValue=""
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800"
            >
              <option value="">{tr('Nichts ausgewählt', 'Nothing selected')}</option>
              <option value="Ausbildung">Ausbildung</option>
              <option value="Auto & Motorrad">Auto &amp; Motorrad</option>
              <option value="Baby">Baby</option>
              <option value="Baumarkt">Baumarkt</option>
              <option value="Beleuchtung">Beleuchtung</option>
              <option value="Bücher">Bücher</option>
              <option value="Bürobedarf & Schreibwaren">Bürobedarf &amp; Schreibwaren</option>
              <option value="Computer & Zubehör">Computer &amp; Zubehör</option>
              <option value="DVD & Blu-ray">DVD &amp; Blu-ray</option>
              <option value="Elektro-Großgeräte">Elektro-Großgeräte</option>
              <option value="Elektronik & Foto">Elektronik &amp; Foto</option>
              <option value="Garten">Garten</option>
              <option value="Gewerbe, Industrie & Wissenschaft">Gewerbe, Industrie &amp; Wissenschaft</option>
              <option value="Handgefertigte Produkte">Handgefertigte Produkte</option>
              <option value="Haustierbedarf">Haustierbedarf</option>
              <option value="Kamera & Foto">Kamera &amp; Foto</option>
              <option value="Kosmetik & Pflege">Kosmetik &amp; Pflege</option>
              <option value="Küche, Haushalt & Wohnen">Küche, Haushalt &amp; Wohnen</option>
              <option value="Lebensmittel & Getränke">Lebensmittel &amp; Getränke</option>
              <option value="Mode">Mode</option>
              <option value="Musikinstrumente & DJ-Equipment">Musikinstrumente &amp; DJ-Equipment</option>
              <option value="Software">Software</option>
              <option value="Spiele & Gaming">Spiele &amp; Gaming</option>
              <option value="Spielzeug">Spielzeug</option>
              <option value="Sport & Freizeit">Sport &amp; Freizeit</option>
            </select>
            <Error msg={errors.category?.message} />
          </div>
          <div>
            <Label>{tr('Produktname', 'Product name')}</Label>
            <Input {...register('productName')} placeholder={tr('Beispiel Produkt', 'Sample product')} required />
            <Error msg={errors.productName?.message} />
          </div>
          <div>
            <Label>{tr('Marke', 'Brand')}</Label>
            <Input {...register('brand')} placeholder={tr('Markenname', 'Brand name')} required />
            <Error msg={errors.brand?.message} />
          </div>
          <div>
            <Label>{tr('Hersteller-/Artikelnummer', 'Manufacturer / SKU')}</Label>
            <Input {...register('code')} placeholder="ABC-123" required />
            <Error msg={errors.code?.message} />
          </div>
          <div className="md:col-span-2">
            <Label>{tr('Produktspezifikationen und Produkt Link', 'Product specifications and link to the product')}</Label>
            <textarea
              {...register('specs')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
              rows={4}
              placeholder={tr('z.B. wasserdicht, schwer entflammbar, energiesparend, mehr hier: link zu Produktseite …', 'e.g. waterproof, flame retardant, energy saving …')}
              required
            />
            <Error msg={errors.specs?.message} />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <input
            id="privacyAccepted"
            type="checkbox"
            {...register('privacyAccepted')}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-800"
            required
          />
          <label htmlFor="privacyAccepted" className="text-xs text-gray-700">
            <span className="font-semibold">{tr('DSGVO', 'GDPR')}</span>
            <span className="text-gray-500"> – </span>
            {tr('Ich akzeptiere die ', 'I accept the ')}
            <Link href="/datenschutz" className="underline underline-offset-2 hover:text-gray-900">
              {tr('Datenschutzerklärung', 'privacy policy')}
            </Link>
            .
          </label>
        </div>
        <Error msg={errors.privacyAccepted?.message} />

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-gray-900 px-5 py-3 font-medium text-white hover:bg-black disabled:opacity-60"
        >
          {submitting ? tr('Wird gesendet…', 'Sending…') : tr('Jetzt starten', 'Start now')}
        </button>

        {submittedEmail && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            {tr(
              `Wir haben eine E-Mail an ${submittedEmail} gesendet. Bitte öffnen Sie den Link, erstellen Sie Ihr Konto und setzen Sie den Pre-Check fort.`,
              `We sent an email to ${submittedEmail}. Open the link, create your account, and continue the pre-check.`
            )}
            {devClaimUrl && (
              <p className="mt-3">
                <a href={devClaimUrl} className="font-semibold underline underline-offset-2">
                  {tr('Lokalen Test-Link öffnen', 'Open local test link')}
                </a>
              </p>
            )}
          </div>
        )}
      </form>

      <p className="mt-6 text-sm text-gray-600">
        {tr('Hinweis: Ihr Kundenkonto wird erst über den Link in der E-Mail erstellt.', 'Note: Your customer account is created through the link in the email.')}
      </p>
    </div>
  );
}
