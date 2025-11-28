"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/LocaleProvider';

const Schema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  email: z.string().email(),
  addressStreet: z.string().min(2),
  addressNumber: z.string().min(1),
  addressPostal: z.string().min(3),
  addressCity: z.string().min(2),
  addressCountry: z.string().min(2),
  addressLine2: z.string().optional(),
  password: z.string().min(8),
  productName: z.string().min(2),
  brand: z.string().min(1),
  category: z.string().optional(),
  code: z.string().optional(),
  specs: z.string().optional(),
  size: z.string().optional(),
  madeIn: z.string().optional(),
  material: z.string().optional(),
});

type FormValues = z.infer<typeof Schema>;

export default function PrecheckForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === 'en' ? en : de);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(Schema),
  });

  const onSubmit = async (values: FormValues) => {
    const addressParts = [
      `${values.addressStreet} ${values.addressNumber}`.trim(),
      values.addressLine2?.trim(),
      `${values.addressPostal} ${values.addressCity}`.trim(),
      values.addressCountry.trim(),
    ].filter(Boolean);
    const address = addressParts.join(', ');

    setSubmitting(true);
    setRedirecting(false);
    const res = await fetch('/api/precheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        address,
      }),
    });
    const data = await res.json();
    if (data?.error === 'LOGIN_REQUIRED' && data?.redirect) {
      alert(tr('Es existiert bereits ein Konto mit dieser E-Mail. Bitte einloggen.', 'An account with this email already exists. Please sign in.'));
      router.push(data.redirect as string);
      setSubmitting(false);
      return;
    }
    if (data?.ok && data?.redirect) {
      const target = data.redirect || `/precheck${data.productId ? `?productId=${data.productId}` : ''}`;
      setRedirecting(true);
      setTimeout(() => router.push(target), 800);
    } else {
      alert('Fehler beim Absenden. Bitte prüfen Sie Ihre Eingaben.');
      setSubmitting(false);
    }
  };

  const Input = (props: any) => (
    <input
      {...props}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
    />
  );

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-sm font-medium text-gray-800">{children}</label>
  );

  const Error = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-sm text-red-600">{msg}</p> : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold">{tr('Pre-Check (0 €)', 'Pre-check (0 €)')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>{tr('Name', 'Name')}</Label>
            <Input {...register('name')} placeholder={tr('Max Mustermann', 'John Doe')} />
            <Error msg={errors.name?.message} />
          </div>
          <div>
            <Label>{tr('Firma (optional)', 'Company (optional)')}</Label>
            <Input {...register('company')} placeholder={tr('Ihre Firma GmbH', 'Your company LLC')} />
          </div>
          <div>
            <Label>{tr('E-Mail', 'Email')}</Label>
            <Input {...register('email')} type="email" placeholder="name@domain.tld" />
            <Error msg={errors.email?.message} />
          </div>
          <div>
            <Label>{tr('Passwort', 'Password')}</Label>
            <Input {...register('password')} type="password" placeholder="••••••••" />
            <Error msg={errors.password?.message} />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>{tr('Straße', 'Street')}</Label>
              <Input {...register('addressStreet')} placeholder={tr('Musterstraße', 'Example Street')} />
              <Error msg={errors.addressStreet?.message} />
            </div>
            <div>
              <Label>{tr('Hausnummer', 'House number')}</Label>
              <Input {...register('addressNumber')} placeholder="12a" />
              <Error msg={errors.addressNumber?.message} />
            </div>
            <div>
              <Label>{tr('PLZ', 'ZIP')}</Label>
              <Input {...register('addressPostal')} placeholder="12345" />
              <Error msg={errors.addressPostal?.message} />
            </div>
            <div>
              <Label>{tr('Ort', 'City')}</Label>
              <Input {...register('addressCity')} placeholder={tr('Berlin', 'City')} />
              <Error msg={errors.addressCity?.message} />
            </div>
            <div>
              <Label>{tr('Land', 'Country')}</Label>
              <Input {...register('addressCountry')} placeholder={tr('Deutschland', 'Country')} />
              <Error msg={errors.addressCountry?.message} />
            </div>
            <div>
              <Label>{tr('Adresszusatz (optional)', 'Address line 2 (optional)')}</Label>
              <Input {...register('addressLine2')} placeholder={tr('c/o, Etage, etc.', 'c/o, floor, etc.')} />
              <Error msg={errors.addressLine2?.message} />
            </div>
          </div>
        </div>

        <hr className="my-2" />

        <h2 className="text-xl font-semibold">{tr('Produktdaten', 'Product data')}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>{tr('Kategorie', 'Category')}</Label>
            <select
              {...register('category')}
              defaultValue=""
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
          </div>
          <div>
            <Label>{tr('Produktname', 'Product name')}</Label>
            <Input {...register('productName')} placeholder={tr('Beispiel Produkt', 'Sample product')} />
            <Error msg={errors.productName?.message} />
          </div>
          <div>
            <Label>{tr('Marke', 'Brand')}</Label>
            <Input {...register('brand')} placeholder={tr('Markenname', 'Brand name')} />
            <Error msg={errors.brand?.message} />
          </div>
          <div>
            <Label>{tr('Hersteller-/Artikelnummer', 'Manufacturer / SKU')}</Label>
            <Input {...register('code')} placeholder="ABC-123" />
          </div>
          <div>
            <Label>{tr('Verpackungsgröße / Maße', 'Package size / dimensions')}</Label>
            <Input {...register('size')} placeholder={tr('z.B. 30×20×10 cm', 'e.g. 30×20×10 cm')} />
          </div>
          <div>
            <Label>{tr('Wo gefertigt', 'Manufactured in')}</Label>
            <Input {...register('madeIn')} placeholder={tr('Land', 'Country')} />
          </div>
          <div>
            <Label>{tr('Material (hauptsächlich)', 'Material (primary)')}</Label>
            <Input {...register('material')} placeholder={tr('z.B. Edelstahl', 'e.g. stainless steel')} />
          </div>
          <div className="md:col-span-2">
            <Label>{tr('Produktspezifikationen', 'Product specifications')}</Label>
            <textarea
              {...register('specs')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
              rows={4}
              placeholder={tr('z.B. wasserdicht, schwer entflammbar, energiesparend …', 'e.g. waterproof, flame retardant, energy saving …')}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-gray-900 px-5 py-3 font-medium text-white hover:bg-black disabled:opacity-60"
        >
          {submitting ? tr('Wird gesendet…', 'Sending…') : tr('Jetzt starten', 'Start now')}
        </button>

        {redirecting && (
          <p className="text-sm text-gray-700">
            {tr('Weiterleitung zum Precheck-Portal …', 'Redirecting to the Precheck portal …')}
          </p>
        )}
      </form>

      <p className="mt-6 text-sm text-gray-600">
        {tr('Hinweis: Nach dem Absenden wird automatisch ein Kundenkonto erstellt.', 'Note: After submitting, a customer account is created automatically.')}
      </p>
    </div>
  );
}
