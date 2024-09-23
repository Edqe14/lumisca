import { userStore } from '@/lib/stores/user-store';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import { ReactNode, useEffect } from 'react';
import { useSnapshot } from 'valtio';

export const Layout = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const router = useRouter();
  const { profile, loading } = useSnapshot(userStore);

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/');
    }
  }, [loading, profile, router]);

  if (loading) return null;
  if (!profile) return null;

  return (
    <main
      className={cn(
        'py-4 px-4 sm:px-12 md:px-32 lg:px-64 xl:px-80 flex-grow flex flex-col',
        className
      )}
    >
      {children}
    </main>
  );
};
