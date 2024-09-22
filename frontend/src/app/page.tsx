'use client';

import { loginWithGoogle, logout } from '@/lib/firebase';
import { useAuthState } from '@/lib/firebase/hooks/useAuthState';
import { Button } from '@mantine/core';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function Home() {
  const user = useAuthState();

  const login = () => {
    loginWithGoogle().then(() => {
      redirect('/dashboard');
    });
  };

  return (
    <main className="flex flex-col items-center justify-center flex-grow">
      <h2 className="pb-2 text-lg font-semibold vibrant tracking-tighter">
        Lumisca
      </h2>
      <h1 className="text-5xl font-bold text-center pb-16 leading-tight">
        Empowering Collaborative Study, <br /> One Session at a Time.
      </h1>

      {user ? (
        <Link href="/app">
          <Button>Continue</Button>
        </Link>
      ) : (
        <Button onClick={login}>Get started</Button>
      )}
    </main>
  );
}
