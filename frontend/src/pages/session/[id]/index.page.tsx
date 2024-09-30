import { Layout } from '@/components/layout';
import { withAuthenticated } from '@/components/authenticated';
import { SessionDataContent } from './content';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import {
  fetchSession,
  Session,
  sessionStore,
} from '@/lib/stores/session-store';
import { useSnapshot } from 'valtio';
import { LoadingOverlay } from '@mantine/core';

function SessionPage() {
  const router = useRouter();
  const sid = router.query.id;
  const { id, session } = useSnapshot(sessionStore);

  useEffect(() => {
    if (!sid) {
      router.push('/app');
      return;
    }

    const abortController = new AbortController();
    let sess: Session | null = null;

    fetchSession(sid as string, abortController)
      .then(async (session) => {
        if (!session) {
          return router.push('/app');
        }

        await session.listen();
        await session.join();
        sessionStore.id = sid as string;
        sessionStore.session = session;
        sess = session;
      })
      .catch(() => {
        router.push('/app');
      });

    return () => {
      abortController.abort();
      sess?.stop();
      sess?.leave();
    };
  }, [sid]);

  return (
    <Layout className="relative px-4 sm:px-12 md:px-24 lg:px-48 xl:px-64 grid grid-cols-3 gap-2">
      {!id && <LoadingOverlay visible loaderProps={{ size: 20 }} />}
      {id && <SessionDataContent />}
    </Layout>
  );
}

export default withAuthenticated(SessionPage);
