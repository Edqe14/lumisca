import { sessionStore } from '@/lib/stores/session-store';
import { userStore } from '@/lib/stores/user-store';
import { cn, getStatusColor, toDurationTime } from '@/lib/utils';
import { ActionIcon, Card, CardSection } from '@mantine/core';
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
} from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { Roadmaps } from './roadmaps';

export const PomodoroTimer = () => {
  const { profile } = useSnapshot(userStore);
  const { status, timeLeft, timerState, session } = useSnapshot(sessionStore);

  const colors = getStatusColor(status, timerState);

  return (
    <Card
      withBorder
      className={cn(colors.background, 'aspect-video transition-all')}
    >
      <CardSection className="flex flex-col items-center justify-center relative flex-grow">
        <h2 className={cn('text-5xl font-bold', colors.text)}>
          {toDurationTime(timeLeft * 1000)}
        </h2>

        {profile?.id === session?.creator && (
          <>
            {(timerState === 'stopped' || timerState === 'paused') && (
              <ActionIcon
                onClick={() => session?.startTimer()}
                radius="xl"
                variant="light"
                color="white"
                size="lg"
                className="absolute bottom-8"
              >
                <IconPlayerPlayFilled size={16} />
              </ActionIcon>
            )}

            {timerState === 'running' && (
              <ActionIcon
                onClick={() => session?.pauseTimer()}
                radius="xl"
                variant="light"
                color="white"
                size="lg"
                className="absolute bottom-8"
              >
                <IconPlayerPauseFilled size={16} />
              </ActionIcon>
            )}
          </>
        )}
      </CardSection>
    </Card>
  );
};

export const SessionDataContent = () => {
  return (
    <>
      <Card withBorder className="col-span-2">
        jaowhdnuad
      </Card>

      <div className="flex flex-col gap-2">
        <PomodoroTimer />
        <Roadmaps />
      </div>
    </>
  );
};
