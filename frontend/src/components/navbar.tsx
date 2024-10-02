'use client';

import { fetchProfile, userStore } from '@/lib/stores/user-store';
import Link from 'next/link';
import { useSnapshot } from 'valtio';
import { Layout } from './layout';
import { InputLabel, Menu, Progress } from '@mantine/core';
import { calculateXP } from '@/lib/utils';
import { IconCoinFilled, IconDoorExit } from '@tabler/icons-react';
import { logout } from '@/lib/firebase';

export const Navbar = () => {
  const { profile } = useSnapshot(userStore);

  return (
    <nav className="h-12 border-b drop-shadow-sm bg-white">
      <Layout className="flex-row py-0 h-full items-center justify-between">
        <Link href="/app">
          <h1 className="vibrant font-semibold tracking-tighter">Lumisca</h1>
        </Link>

        {profile && (
          <Menu
            offset={12}
            width={250}
            position="bottom-end"
            onOpen={() => fetchProfile()}
          >
            <Menu.Target>
              <img
                className="h-8 w-8 rounded-full cursor-pointer"
                src={
                  profile.profilePict ||
                  `https://api.dicebear.com/9.x/glass/svg?seed=${profile.name}`
                }
              />
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label className="flex flex-col gap-1 mb-2">
                <p className="text-sm text-zinc-600 flex justify-between items-center">
                  <span>
                    Level <span className="font-semibold">{profile.level}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    {profile.points}{' '}
                    <IconCoinFilled size={20} className="text-yellow-500" />
                  </span>
                </p>
                <Progress.Root size={20} className="mb-1">
                  <Progress.Section
                    value={
                      (profile.experience / calculateXP(profile.level)) * 100
                    }
                    animated
                  >
                    <Progress.Label>
                      {(
                        (profile.experience / calculateXP(profile.level)) *
                        100
                      ).toFixed(0)}
                      %
                    </Progress.Label>
                  </Progress.Section>
                </Progress.Root>
              </Menu.Label>

              <Menu.Divider />

              <Menu.Item
                rightSection={<IconDoorExit size={16} />}
                color="red"
                onClick={logout}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Layout>
    </nav>
  );
};
