import { fetchRoadmap, roadmapStore } from '@/lib/stores/roadmap-store';
import { cn, fetcher } from '@/lib/utils';
import { createTaskGroupValidator, TaskGroup } from '@/lib/validators/task';
import { NewTaskModal } from '@/pages/roadmap/[id]/content';
import {
  TextInput,
  Textarea,
  Button,
  Card,
  LoadingOverlay,
  ActionIcon,
  Checkbox,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconChevronLeft, IconPlus, IconTrash } from '@tabler/icons-react';
import { formatRelative } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { useSnapshot } from 'valtio';
import { z } from 'zod';

export const NewRoadmapModal = ({
  setRoadmap,
}: {
  setRoadmap: (id: string | null) => void;
}) => {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      prompt: '',
    },
    validate: zodResolver(
      createTaskGroupValidator
        .pick({ name: true })
        .extend({ prompt: z.string().max(256).optional() })
    ),
  });

  const onSubmit = async (values: typeof form.values) => {
    setLoading(true);

    const newSession = await fetcher('/task-groups', {
      method: 'POST',
      data: values,
    });

    if (newSession.status !== 200) {
      setLoading(false);
      return notifications.show({
        color: 'red',
        title: 'Oops',
        message: 'An error occurred while creating the roadmap',
      });
    }

    notifications.show({
      color: 'teal',
      title: 'Success',
      message: 'Roadmap created successfully',
    });

    setRoadmap(newSession.data.id);
    await mutate('/task-groups');
    modals.close('create-roadmap');

    setLoading(false);
  };

  return (
    <form onSubmit={form.onSubmit(onSubmit)} className="space-y-3">
      <TextInput
        withAsterisk
        label="Name"
        key={form.key('name')}
        {...form.getInputProps('name')}
      />

      <Textarea
        label="Prompt"
        description="Leave empty if you don't want to bootstrap with AI"
        key={form.key('prompt')}
        {...form.getInputProps('prompt')}
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" color="gray" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Create
        </Button>
      </div>
    </form>
  );
};

const RoadmapDataContent = ({
  setRoadmap,
}: {
  setRoadmap: (id: string | null) => void;
}) => {
  const router = useRouter();
  const { roadmap, tasks } = useSnapshot(roadmapStore);

  const openNewModal = () => {
    modals.open({
      modalId: 'create-task',
      title: 'Create a new task',
      children: <NewTaskModal roadmap={roadmap!} />,
      centered: true,
    });
  };

  const confirmDeleteModal = () => {
    modals.openConfirmModal({
      modalId: 'confirm-delete-roadmap',
      title: 'Delete roadmap',
      children: 'Are you sure you want to delete this roadmap?',
      centered: true,
      labels: { confirm: 'Confirm', cancel: 'Nevermind' },
      onConfirm: async () => {
        await roadmap!.delete();
        router.push('/app');
        mutate('/task-groups');
      },
    });
  };

  return (
    <>
      <Card withBorder className="flex-grow flex flex-col">
        <a
          className="text-xs mb-2 text-zinc-400 flex gap-1 cursor-pointer"
          onClick={() => setRoadmap(null)}
        >
          <IconChevronLeft size={14} /> Go back to list
        </a>

        <div className="flex justify-between pb-6">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-700">
              {roadmap?.name}
            </h2>

            <p className="text-zinc-500">
              {roadmap?.totalCompletedTasks} / {roadmap?.totalTasks} completed
            </p>
          </div>

          <div className="flex gap-1 items-center">
            <Button
              onClick={openNewModal}
              variant="outline"
              size="xs"
              leftSection={<IconPlus size={20} />}
            >
              Create
            </Button>
          </div>
        </div>

        <div className="relative flex-grow flex flex-col gap-2">
          {tasks.length === 0 && (
            <div className="absolute inset-0 grid place-items-center">
              <p className="text-zinc-500">No task available</p>
            </div>
          )}

          {!!tasks.length &&
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-8"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    defaultChecked={!!task.completedAt}
                    onChange={async (ev) => {
                      await task.updateCompleted(ev.target.checked);
                      await roadmap!.pull();
                    }}
                  />
                  <p
                    className={cn(
                      !task.completedAt && 'text-zinc-700',
                      task.completedAt && 'text-zinc-400 line-through'
                    )}
                  >
                    {task.name}
                  </p>
                </div>

                {task.completedAt && (
                  <p className="text-zinc-400 text-xs">
                    {formatRelative(new Date(task.completedAt), new Date())}
                  </p>
                )}
              </div>
            ))}
        </div>
      </Card>
    </>
  );
};

export const RoadmapSelector = ({
  setRoadmap,
}: {
  setRoadmap: (id: string | null) => void;
}) => {
  const { data: groups, isLoading } = useSWR<TaskGroup[]>('/task-groups');

  const openNewModal = () => {
    modals.open({
      modalId: 'create-roadmap',
      title: 'Create a new roadmap',
      children: <NewRoadmapModal setRoadmap={setRoadmap} />,
      centered: true,
    });
  };

  return (
    <Card withBorder className="col-span-2 gap-4 flex-grow">
      <section className="flex justify-between">
        <h1 className="font-semibold text-lg text-zinc-700">
          Your task roadmaps
        </h1>

        <Button
          size="xs"
          classNames={{ label: 'gap-1' }}
          onClick={openNewModal}
        >
          <IconPlus size={16} /> New
        </Button>
      </section>

      <section className="flex-grow relative flex flex-col gap-2">
        {isLoading && <LoadingOverlay visible loaderProps={{ size: 20 }} />}
        {!isLoading && groups && groups.length === 0 && (
          <div className="absolute inset-0 grid place-items-center">
            <p className="text-zinc-500">No roadmap available</p>
          </div>
        )}
        {!isLoading &&
          groups &&
          groups.length > 0 &&
          groups.map((group) => {
            const perc = group.totalCompletedTasks / (group.totalTasks || 1);

            return (
              <Card
                withBorder
                className="cursor-pointer"
                onClick={() => setRoadmap(group.id)}
              >
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-zinc-700 text-lg">
                    {group.name}
                  </h2>

                  <Button
                    size="compact-xs"
                    color={perc === 0 ? 'red' : perc !== 1 ? 'yellow' : 'green'}
                  >
                    {(perc * 100).toFixed(0)}%
                  </Button>
                </div>

                <p className="text-sm text-zinc-500">
                  {formatRelative(new Date(group.createdAt), new Date())}
                </p>
              </Card>
            );
          })}
      </section>
    </Card>
  );
};

export const Roadmaps = () => {
  const [selectedRoadmap, setSelectedRoadmap] = useState<string | null>(null);
  const { roadmap } = useSnapshot(roadmapStore);

  useEffect(() => {
    if (!selectedRoadmap) {
      return;
    }

    const abortController = new AbortController();
    fetchRoadmap(selectedRoadmap, abortController).then(async (roadmap) => {
      if (!roadmap) {
        roadmapStore.roadmap = null;
        roadmapStore.id = null;

        return;
      }

      roadmapStore.roadmap = roadmap;
      roadmapStore.id = selectedRoadmap as string;

      await roadmap.fetchTasks();
    });

    return () => {
      abortController.abort();
    };
  }, [selectedRoadmap]);

  if (!selectedRoadmap)
    return <RoadmapSelector setRoadmap={setSelectedRoadmap} />;

  if (roadmap) return <RoadmapDataContent setRoadmap={setSelectedRoadmap} />;

  return (
    <Card withBorder className="flex-grow relative">
      <LoadingOverlay visible loaderProps={{ size: 20 }} />
    </Card>
  );
};
