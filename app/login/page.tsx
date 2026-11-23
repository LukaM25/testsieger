import { Suspense } from 'react';
import { arbeitssicherheitEnabled } from '@/lib/arbeitssicherheit/gate';
import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient asEnabled={arbeitssicherheitEnabled()} />
    </Suspense>
  );
}
