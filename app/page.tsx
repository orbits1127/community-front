'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/feed');
  }, [router]);
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--ig-primary-background)',
      }}
    >
      <div style={{ color: 'var(--ig-secondary-text)' }}>Loading...</div>
    </div>
  );
}
