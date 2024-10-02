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
import { userStore } from '@/lib/stores/user-store';
import dynamic from 'next/dynamic';

const MeetingProvider = dynamic(
  () =>
    import('@videosdk.live/react-sdk').then((mod) => ({
      default: mod.MeetingProvider,
    })),
  {
    ssr: false,
  }
);

function SessionPage() {
  const router = useRouter();
  const sid = router.query.id;
  const { profile } = useSnapshot(userStore);
  const { id, callRoomId, callToken } = useSnapshot(sessionStore);

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
        sessionStore.session = session;
        sessionStore.id = sid as string;
        sess = session;
      })
      .catch(() => {
        router.push('/app');
      });

    return () => {
      abortController.abort();
      sess?.reset();
      sess?.leave();
    };
  }, [sid]);

  if (!id || !callRoomId || !callToken || !profile) return null;

  return (
    <Layout className="relative px-4 sm:px-12 md:px-24 lg:px-48 xl:px-64 grid grid-cols-3 gap-2">
      {!id && <LoadingOverlay visible loaderProps={{ size: 20 }} />}
      {id && callRoomId && callToken && (
        <MeetingProvider
          config={{
            meetingId: callRoomId,
            micEnabled: false,
            webcamEnabled: false,
            name: profile.name,
            debugMode: false,
            participantId: profile.id,
          }}
          token={callToken}
        >
          <SessionDataContent />
        </MeetingProvider>
      )}
    </Layout>
  );
}

export default withAuthenticated(SessionPage);
