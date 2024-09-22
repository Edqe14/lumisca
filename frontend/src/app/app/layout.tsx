import { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <main className="py-4 px-12">{children}</main>;
}
