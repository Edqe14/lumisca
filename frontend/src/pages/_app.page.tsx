import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';

import { MantineProvider } from '@mantine/core';
import { Navbar } from '@/components/navbar';
import { ModalsProvider } from '@mantine/modals';
import type { AppProps } from 'next/app';
import { SWRConfig } from 'swr';
import Head from 'next/head';
import { fetcher } from '@/lib/utils';
import { Notifications } from '@mantine/notifications';
import React from 'react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Lumisca</title>
      </Head>

      <main className={`min-h-svh flex flex-col`} suppressHydrationWarning>
        <SWRConfig
          value={{
            fetcher: (resource, init) =>
              fetcher({
                ...init,
                url: resource,
              }).then((r) => r.data),
          }}
        >
          <MantineProvider>
            <ModalsProvider
              modalProps={{
                classNames: {
                  title: 'text-zinc-700 font-semibold',
                },
              }}
            >
              <Notifications />
              <Navbar />

              <Component {...pageProps} />
            </ModalsProvider>
          </MantineProvider>
        </SWRConfig>
      </main>
    </>
  );
}
