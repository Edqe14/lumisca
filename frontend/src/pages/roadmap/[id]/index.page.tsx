import { Layout } from '@/components/layout';
import { fetchRoadmap, roadmapStore } from '@/lib/stores/roadmap-store';
import { LoadingOverlay } from '@mantine/core';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { RoadmapDataContent } from './content';
import { withAuthenticated } from '@/components/authenticated';

function RoadmapDetail() {
  const router = useRouter();
  const sid = router.query.id;
  const { id } = useSnapshot(roadmapStore);

  useEffect(() => {
    if (!sid) {
      router.push('/app');
      return;
    }

    const abortController = new AbortController();
    fetchRoadmap(sid as string, abortController).then(async (roadmap) => {
      if (!roadmap) {
        return router.push('/app');
      }

      roadmapStore.roadmap = roadmap;
      roadmapStore.id = sid as string;

      await roadmap.fetchTasks();
    });

    return () => {
      abortController.abort();
    };
  }, [sid]);

  return (
    <Layout className="relative items-center">
      {!id && <LoadingOverlay visible loaderProps={{ size: 20 }} />}
      {id && <RoadmapDataContent />}
    </Layout>
  );
}

export default withAuthenticated(RoadmapDetail);
