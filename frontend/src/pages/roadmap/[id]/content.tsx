import { Roadmap, roadmapStore } from '@/lib/stores/roadmap-store';
import { cn, fetcher } from '@/lib/utils';
import { createTaskValidator } from '@/lib/validators/task';
import { ActionIcon, Button, Card, Checkbox, TextInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { formatRelative } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { mutate } from 'swr';
import { useSnapshot } from 'valtio';

export const NewTaskModal = ({ roadmap }: { roadmap: Roadmap }) => {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
    },
    validate: zodResolver(createTaskValidator.pick({ name: true })),
  });

  const onSubmit = async (values: typeof form.values) => {
    setLoading(true);

    const newTask = await roadmap.createTask(values);

    if (!newTask) {
      setLoading(false);
      return notifications.show({
        color: 'red',
        title: 'Oops',
        message: 'An error occurred while creating the task',
      });
    }

    notifications.show({
      color: 'teal',
      title: 'Success',
      message: 'Task created successfully',
    });

    await roadmap!.pull();
    modals.close('create-task');

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

export const RoadmapDataContent = () => {
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
      <div className="w-full 2xl:w-2/4">
        <Link href="/app">
          <Button variant="outline" className="mb-4" color="gray">
            Back
          </Button>
        </Link>
      </div>

      <Card withBorder className="w-full 2xl:w-2/4 flex-grow flex flex-col">
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
            <ActionIcon size="lg" color="red" onClick={confirmDeleteModal}>
              <IconTrash size={20} />
            </ActionIcon>

            <Button onClick={openNewModal} leftSection={<IconPlus size={20} />}>
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
                  <p className="text-zinc-400 text-sm">
                    Completed{' '}
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
