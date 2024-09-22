'use client';

import { loginWithGoogle } from '@/lib/firebase';
import { useAuthState } from '@/lib/firebase/hooks/useAuthState';
import { Button } from '@mantine/core';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const Navbar = () => {
  const { user } = useAuthState();

  const login = () => {
    loginWithGoogle().then(() => {
      redirect('/dashboard');
    });
  };

  return (
    <nav className="h-12 flex px-12 items-center justify-between border-b">
      <Link href="/app">
        <h1 className="vibrant font-semibold tracking-tighter">Lumisca</h1>
      </Link>
    </nav>
  );
};
