'use client';

import { Time } from '@/components/time';
import { userStore } from '@/lib/stores/user-store';
import { Button, Card } from '@mantine/core';
import { useSnapshot } from 'valtio';
import { IconPlus } from '@tabler/icons-react';
import { modals } from '@mantine/modals';

export default function AppDashboard() {
  const { profile } = useSnapshot(userStore);

  const openNewModal = () => {
    modals.openConfirmModal({
      title: 'Create a new session',
      children: <h1>awjidoj</h1>,
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      centered: true,
      onCancel: () => console.log('Cancel'),
      onConfirm: () => console.log('Confirmed'),
    });
  };

  return (
    <section className="flex flex-col gap-2 flex-grow">
      <section className="grid grid-cols-3 gap-2">
        <Card
          padding="lg"
          radius="md"
          withBorder
          className="col-span-2 justify-center"
        >
          <h1 className="font-bold text-xl text-zinc-700 pb-1">
            Welcome back, <span className="vibrant">{profile?.name}</span>
          </h1>
          <p className="text-zinc-500 text-sm">Ready to learn today?</p>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <p className="text-zinc-500 text-sm pb-1">Your current time</p>
          <h1 className="font-bold text-2xl text-zinc-700">
            <Time />
          </h1>
        </Card>
      </section>

      <section className="grid grid-cols-3 gap-2 flex-grow">
        <Card padding="lg" radius="md" withBorder className="col-span-2 gap-3">
          <section className="flex justify-between">
            <h1 className="font-bold text-lg text-zinc-700">Your sessions</h1>

            <Button
              size="xs"
              classNames={{ label: 'gap-1' }}
              onClick={openNewModal}
            >
              <IconPlus size={16} /> New
            </Button>
          </section>

          <section className="flex-grow">
            <div className="h-full grid place-items-center">
              <p className="text-zinc-500 text-sm pb-1">
                You have no sessions yet
              </p>
            </div>
          </section>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <h1 className="font-bold text-lg text-zinc-700 pb-1">TODO</h1>
        </Card>
      </section>
    </section>
  );
}
