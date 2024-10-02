import { userStore } from '@/lib/stores/user-store';
import { cn } from '@/lib/utils';
import { Profile } from '@/lib/validators/user';
import { Card, LoadingOverlay, Tooltip } from '@mantine/core';
import {
  IconListCheck,
  IconPlug,
  IconRoad,
  IconRoute,
  IconUserPlus,
} from '@tabler/icons-react';
import { formatDate } from 'date-fns';
import React, { useMemo } from 'react';
import useSWR from 'swr';
import { useSnapshot } from 'valtio';

type AchivementMap = {
  icon: React.ReactNode;
  name: string;
  description: string;
};

const ACHIEVEMENT_MAPS: Record<string, AchivementMap> = {
  NEWCOMER: {
    icon: <IconUserPlus size={32} />,
    name: 'Newcomer',
    description: 'You have just joined the platform, welcome!',
  },
  ROAD_PLANNER: {
    icon: <IconRoad size={32} />,
    name: 'Road Planner',
    description: 'Create a roadmap.',
  },
  ROAD_MASTER: {
    icon: <IconRoute size={32} />,
    name: 'Road Master',
    description: 'Create 10 roadmaps.',
  },
  TASK_ADDICT: {
    icon: <IconListCheck size={32} />,
    name: 'Task Addict',
    description: 'Complete 3 tasks.',
  },
  SESSION_STARTER: {
    icon: <IconPlug size={32} />,
    name: 'Session Starter',
    description: 'Create a session.',
  },
  STUDY_GROUP: {
    icon: <IconUserPlus size={32} />,
    name: 'Study Group',
    description: 'Join a session with more than 1 member.',
  },
};

const GRADIENTS = [
  'from-blue-500 to-teal-400',
  'from-red-500 to-pink-400',
  'from-yellow-500 to-orange-400',
  'from-green-500 to-emerald-400',
  'from-purple-500 to-violet-400',
];

const getGradient = (name: string) => {
  const bytes = name
    .split('')
    .map((char) => char.charCodeAt(0))
    .reduce((a, b) => a + b, 0);
  return GRADIENTS[bytes % GRADIENTS.length];
};

export const Achivements = () => {
  const { data, isLoading } = useSWR<Profile>('/user/me');
  const achivements = useMemo(() => {
    return Object.entries(data?.achivements ?? {}).map(([name, date]) => ({
      ...ACHIEVEMENT_MAPS[name],
      id: name,
      date,
      color: getGradient(name),
    }));
  }, [data]);

  return (
    <section className="py-4">
      <h2 className="text-lg font-semibold mb-3">Achivements</h2>

      <section className="grid lg:grid-cols-2 relative gap-2">
        {isLoading && <LoadingOverlay visible loaderProps={{ size: 20 }} />}
        {!isLoading && achivements.length === 0 && (
          <div className="relative inset-0">
            <p>You don't have any achivements yet.</p>
          </div>
        )}
        {!isLoading &&
          achivements.map((achive) => (
            <Card
              withBorder
              className="flex flex-col items-center gap-2"
              key={achive.id}
            >
              <Tooltip label={achive.description} offset={16}>
                <span
                  className={cn(
                    'bg-gradient-to-tr w-20 h-20 rounded-full drop-shadow-sm grid place-items-center text-white',
                    achive.color
                  )}
                >
                  {achive.icon}
                </span>
              </Tooltip>

              <div className="flex flex-col items-center text-center">
                <h4
                  className="font-medium text-zinc-700 text-lg"
                  key={achive.id}
                >
                  {achive.name}
                </h4>
                <p className="text-sm text-zinc-400">
                  {formatDate(new Date(achive.date), 'dd MMMM yyyy')}
                </p>
              </div>
            </Card>
          ))}
      </section>
    </section>
  );
};
