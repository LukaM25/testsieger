// app/precheck/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const Schema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  email: z.string().email(),
  address: z.string().min(5),
  password: z.string().min(8),
  productName: z.string().min(2),
  brand: z.string().min(1),
  code: z.string().optional(),
  specs: z.string().optional(),
  size: z.string().optional(),
  madeIn: z.string().optional(),
  material: z.string().optional(),
});
type FormValues = z.infer<typeof Schema>;

export default function PrecheckPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(Schema),
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    const res = await fetch('/api/precheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data?.ok && data?.redirect) {
      router.push(data.redirect);
    } else {
      alert('Fehler beim Absenden. Bitte prüfen Sie Ihre Eingaben.');
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
      <h1 className="mb-6 text-3xl font-semibold">Pre-Check (0 €)</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input {...register('name')} placeholder="Max Mustermann" />
            <Error msg={errors.name?.message} />
          </div>
          <div>
            <Label>Firma (optional)</Label>
            <Input {...register('company')} placeholder="Ihre Firma GmbH" />
          </div>
          <div>
            <Label>E-Mail</Label>
            <Input {...register('email')} type="email" placeholder="name@domain.tld" />
            <Error msg={errors.email?.message} />
          </div>
          <div>
            <Label>Passwort</Label>
            <Input {...register('password')} type="password" placeholder="••••••••" />
            <Error msg={errors.password?.message} />
          </div>
          <div className="md:col-span-2">
            <Label>Adresse</Label>
            <Input {...register('address')} placeholder="Straße Nr, PLZ Ort, Land" />
            <Error msg={errors.address?.message} />
          </div>
        </div>

        <hr className="my-2" />

        <h2 className="text-xl font-semibold">Produktdaten</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Produktname</Label>
            <Input {...register('productName')} placeholder="Beispiel Produkt" />
            <Error msg={errors.productName?.message} />
          </div>
          <div>
            <Label>Marke</Label>
            <Input {...register('brand')} placeholder="Markenname" />
            <Error msg={errors.brand?.message} />
          </div>
          <div>
            <Label>Hersteller-/Artikelnummer</Label>
            <Input {...register('code')} placeholder="ABC-123" />
          </div>
          <div>
            <Label>Verpackungsgröße / Maße</Label>
            <Input {...register('size')} placeholder="z.B. 30×20×10 cm" />
          </div>
          <div>
            <Label>Wo gefertigt</Label>
            <Input {...register('madeIn')} placeholder="Land" />
          </div>
          <div>
            <Label>Material (hauptsächlich)</Label>
            <Input {...register('material')} placeholder="z.B. Edelstahl" />
          </div>
          <div className="md:col-span-2">
            <Label>Produktspezifikationen</Label>
            <textarea
              {...register('specs')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
              rows={4}
              placeholder="z.B. wasserdicht, schwer entflammbar, energiesparend …"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-gray-900 px-5 py-3 font-medium text-white hover:bg-black disabled:opacity-60"
        >
          {submitting ? 'Wird gesendet…' : 'Jetzt starten'}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-600">
        Hinweis: Nach dem Absenden wird automatisch ein Kundenkonto erstellt.
      </p>
    </div>
  );
}
