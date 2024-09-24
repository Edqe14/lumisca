import { userStore } from '@/lib/stores/user-store';
import { useRouter } from 'next/router';
import { Component, type ReactNode, useEffect } from 'react';
import { useSnapshot } from 'valtio';

export const Authenticated = <T extends JSX.IntrinsicAttributes>(
  Component: () => ReactNode,
  pageProps: T
) => {
  const router = useRouter();
  const { profile, loading } = useSnapshot(userStore);

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/');
    }
  }, [loading, profile, router]);

  if (loading) return null;
  if (!profile) return null;

  return <Component {...pageProps} />;
};

export const withAuthenticated = (Component: () => ReactNode) =>
  Authenticated.bind(null, Component);
