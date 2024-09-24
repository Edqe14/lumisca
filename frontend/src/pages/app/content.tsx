import { Time } from '@/components/time';
import { userStore } from '@/lib/stores/user-store';
import {
  Avatar,
  Button,
  Card,
  LoadingOverlay,
  Select,
  TextInput,
} from '@mantine/core';
import { useSnapshot } from 'valtio';
import { IconPlus } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { useForm } from '@mantine/form';
import useSWR from 'swr';
import { SessionData } from '@/lib/validators/session';
import { formatRelative } from 'date-fns';

export const NewSessionModal = () => {
  const form = useForm({
    initialValues: {
      name: '',
      visibility: 'private',
    },
  });

  const onSubmit = (values: typeof form.values) => {
    console.log(values);
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
        <Button variant="outline" color="gray">
          Cancel
        </Button>
        <Button>Create</Button>
      </div>
    </form>
  );
};

export const AppDashboardContent = () => {
  const { profile } = useSnapshot(userStore);
  const { data: sessions, isLoading } = useSWR<SessionData[]>('/session');

  console.log(sessions);

  const openNewModal = () => {
    modals.open({
      title: 'Create a new session',
      children: <NewSessionModal />,
      centered: true,
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
            <h1 className="font-bold text-lg text-zinc-700">Your sessions</h1>

            <Button
              size="xs"
              classNames={{ label: 'gap-1' }}
              onClick={openNewModal}
            >
              <IconPlus size={16} /> New
            </Button>
          </section>

          <section className="flex-grow relative">
            {isLoading && <LoadingOverlay visible loaderProps={{ size: 20 }} />}
            {!isLoading && sessions && sessions.length === 0 && (
              <div className="absolute inset-0 grid place-items-center">
                <p className="text-zinc-500">No sessions available</p>
              </div>
            )}
            {!isLoading &&
              sessions &&
              sessions.length > 0 &&
              sessions.map((session) => (
                <Card withBorder key={session.id}>
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-zinc-700 text-lg">
                      {session.name}
                    </h2>

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
                  </div>

                  <p className="text-sm text-zinc-500">
                    {formatRelative(new Date(session.createdAt), new Date())}
                  </p>
                </Card>
              ))}
          </section>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <h1 className="font-bold text-lg text-zinc-700 pb-1">TODO</h1>
        </Card>
      </section>
    </section>
  );
};
