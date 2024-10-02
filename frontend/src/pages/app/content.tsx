import { Time } from '@/components/time';
import { userStore } from '@/lib/stores/user-store';
import {
  Avatar,
  Button,
  Card,
  InputLabel,
  LoadingOverlay,
  PinInput,
  Select,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useSnapshot } from 'valtio';
import { IconPlus } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { useForm, zodResolver } from '@mantine/form';
import useSWR from 'swr';
import {
  createTaskGroupValidator,
  type TaskGroup,
} from '@/lib/validators/task';

import { differenceInMilliseconds, formatRelative } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';
import { cn, fetcher, getStatusColor, toDurationReadable } from '@/lib/utils';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/router';
import { z } from 'zod';
import {
  createSessionValidator,
  type SessionData,
} from '@/lib/validators/session';
import { Achivements } from './achivements';

export const NewSessionModal = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      visibility: 'private',
    },
    validate: zodResolver(createSessionValidator),
  });

  const onSubmit = async (values: typeof form.values) => {
    setLoading(true);

    const newSession = await fetcher('/session', {
      method: 'POST',
      data: values,
    });

    if (newSession.status !== 200) {
      setLoading(false);
      return notifications.show({
        color: 'red',
        title: 'Oops',
        message: 'An error occurred while creating the session',
      });
    }

    notifications.show({
      color: 'teal',
      title: 'Success',
      message: 'Session created successfully',
    });

    router.push(`/session/${newSession.data.id}`);
    modals.close('create-session');

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

      <Select
        label="Visibility"
        withAsterisk
        data={[
          { value: 'public', label: 'Public' },
          { value: 'private', label: 'Private' },
        ]}
        key={form.key('visibility')}
        {...form.getInputProps('visibility')}
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

export const NewRoadmapModal = () => {
  const router = useRouter();
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

    router.push(`/roadmap/${newSession.data.id}`);
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

export const JoinSessionModal = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      pin: '',
    },
    validate: zodResolver(
      z.object({
        pin: z.string().min(6).max(6),
      })
    ),
  });

  const onSubmit = async (values: typeof form.values) => {
    const res = await fetcher('/session/resolve', {
      params: { pin: values.pin },
    }).catch(() => null);

    if (!res || res.status !== 200) {
      return notifications.show({
        color: 'red',
        title: 'Oops',
        message: "Can't find the session with the provided code",
      });
    }

    const id = res.data.id;

    modals.close('join-session');
    router.push(`/session/${id}`);
  };

  return (
    <form onSubmit={form.onSubmit(onSubmit)} className="space-y-3">
      <div className="pb-4">
        <InputLabel className="mb-2" required>
          Join code
        </InputLabel>
        <PinInput
          className="justify-center"
          length={6}
          type="number"
          key={form.key('pin')}
          {...form.getInputProps('pin')}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" color="gray" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Join
        </Button>
      </div>
    </form>
  );
};

export const AppDashboardContent = () => {
  const router = useRouter();
  const { profile } = useSnapshot(userStore);
  const { data: groups, isLoading } = useSWR<TaskGroup[]>('/task-groups');
  const { data: sessions, isLoading: isLoadingSessions } =
    useSWR<SessionData[]>('/session');

  const session = sessions?.[0];
  const statusColor = session ? getStatusColor(session.status) : null;

  const openNewModal = () => {
    modals.open({
      modalId: 'create-roadmap',
      title: 'Create a new roadmap',
      children: <NewRoadmapModal />,
      centered: true,
    });
  };

  const openCreateSessionModal = () => {
    modals.open({
      modalId: 'create-session',
      title: 'Create a new session',
      children: <NewSessionModal />,
      centered: true,
    });
  };

  const openJoinSessionModal = () => {
    modals.open({
      modalId: 'join-session',
      title: 'Join a session',
      children: <JoinSessionModal />,
      centered: true,
      size: 'sm',
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
          <h1
            className="font-bold text-2xl text-zinc-700"
            suppressHydrationWarning
          >
            <Time />
          </h1>
        </Card>
      </section>

      <section className="grid grid-cols-3 gap-2 flex-grow">
        <Card padding="lg" radius="md" withBorder className="col-span-2 gap-4">
          <section className="flex justify-between">
            <h1 className="font-bold text-lg text-zinc-700">
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
                const perc =
                  group.totalCompletedTasks / (group.totalTasks || 1);

                return (
                  <Link href={`/roadmap/${group.id}`} key={group.id}>
                    <Card withBorder>
                      <div className="flex justify-between items-center">
                        <h2 className="font-semibold text-zinc-700 text-lg">
                          {group.name}
                        </h2>

                        <Button
                          size="compact-xs"
                          color={
                            perc === 0 ? 'red' : perc !== 1 ? 'yellow' : 'green'
                          }
                        >
                          {(perc * 100).toFixed(0)}%
                        </Button>
                      </div>

                      <p className="text-sm text-zinc-500">
                        {formatRelative(new Date(group.createdAt), new Date())}
                      </p>
                    </Card>
                  </Link>
                );
              })}
          </section>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <Card.Section>
            <div className="aspect-video relative w-full border-b">
              {isLoadingSessions && (
                <LoadingOverlay visible loaderProps={{ size: 20 }} />
              )}

              {!isLoadingSessions && !session && (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-zinc-500">No active session</p>

                  <div className="mt-1 flex items-center">
                    <Button variant="subtle" onClick={openCreateSessionModal}>
                      Create
                    </Button>

                    <p className="text-zinc-400 text-sm">or</p>

                    <Button variant="subtle" onClick={openJoinSessionModal}>
                      Join
                    </Button>
                  </div>
                </div>
              )}

              {!isLoadingSessions && session && (
                <div
                  className={cn(
                    'flex flex-col items-center justify-center h-full',
                    statusColor?.background
                  )}
                >
                  <h1
                    className={cn(
                      'font-bold text-2xl',
                      statusColor?.text ?? 'text-zinc-700'
                    )}
                  >
                    {session.name}
                  </h1>

                  <Avatar.Group spacing="sm">
                    {Object.values(session.members).map((member) => (
                      <Avatar
                        key={member.id}
                        size="xs"
                        src={member.profilePict}
                        alt={member.name}
                      />
                    ))}
                  </Avatar.Group>

                  <p
                    className={cn(
                      'text-sm',
                      statusColor?.text ?? 'text-zinc-500'
                    )}
                  >
                    {session.status === 'active'
                      ? 'In progress for ' +
                        toDurationReadable(
                          differenceInMilliseconds(
                            new Date(),
                            new Date(session.createdAt)
                          )
                        )
                      : 'Finished'}
                  </p>

                  {session.status === 'active' && (
                    <Button
                      onClick={() => router.push(`/session/${session.id}`)}
                      size="xs"
                      variant="subtle"
                      className="mt-4"
                      color="white"
                    >
                      Join
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card.Section>

          <Achivements />
        </Card>
      </section>
    </section>
  );
};
