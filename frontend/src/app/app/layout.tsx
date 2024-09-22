import { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <main className="py-4 px-4 sm:px-12 md:px-32 lg:px-64 xl:px-80 flex-grow flex flex-col">
      {children}
    </main>
  );
}
