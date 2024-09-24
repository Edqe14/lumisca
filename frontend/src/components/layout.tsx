import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export const Layout = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
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
