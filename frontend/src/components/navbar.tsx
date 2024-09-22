'use client';

import { userStore } from '@/lib/stores/user-store';
import Link from 'next/link';
import { useSnapshot } from 'valtio';

export const Navbar = () => {
  const { profile } = useSnapshot(userStore);

  return (
    <nav className="h-12 flex px-4 sm:px-12 items-center justify-between border-b drop-shadow-sm bg-white">
      <Link href="/app">
        <h1 className="vibrant font-semibold tracking-tighter">Lumisca</h1>
      </Link>

      {profile && (
        <img
          className="h-8 w-8 rounded-full"
          src={
            profile.profilePict ||
            `https://api.dicebear.com/9.x/glass/svg?seed=${profile.name}`
          }
        />
      )}
    </nav>
  );
};
