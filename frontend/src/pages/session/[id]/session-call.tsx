import { sessionStore } from '@/lib/stores/session-store';
import { cn } from '@/lib/utils';
import { Card } from '@mantine/core';
import { useSnapshot } from 'valtio';

export const SessionCall = () => {
  const { memberStates } = useSnapshot(sessionStore);

  return (
    <Card withBorder className="col-span-2">
      <section className="flex flex-wrap items-center justify-center flex-grow">
        {Object.values(memberStates).map((member) => (
          <Card
            withBorder
            radius="md"
            key={member.id}
            className="min-w-64 aspect-video relative grid place-items-center group"
          >
            <img
              className={cn(
                'w-20 rounded-full ring-0 transition-all duration-150',
                member.isSpeaking && 'ring-4 ring-green-500/60'
              )}
              src={
                member.profilePict ||
                `https://api.dicebear.com/9.x/glass/svg?seed=${member.name}`
              }
            />

            <p className="text-sm bg-zinc-500/10 text-zinc-700 px-2 py-1 rounded absolute right-1 bottom-1 group-hover:opacity-100 opacity-30 transition-opacity duration-200">
              {member.name}
            </p>
          </Card>
        ))}
      </section>
    </Card>
  );
};
