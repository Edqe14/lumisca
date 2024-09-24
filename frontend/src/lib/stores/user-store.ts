import { proxy } from 'valtio';
import { auth, persistence } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { noop } from '@mantine/core';
import { fetcher } from '../utils';
import { Profile } from '../types';

export const userStore = proxy({
  loading: true,
  user: null as User | null,
  token: null as string | null,
  profile: null as Profile | null,
});

let unsubscribeFetchToken = noop;

const validateToken = async () => {
  const me = await fetcher.get('/user/me');

  if (me.status === 401) {
    return null;
  }

  return me.data as Profile;
};

const autoFetchToken = () => {
  const interval = setInterval(async () => {
    if (userStore.user) {
      userStore.token = await userStore.user.getIdToken(true);
      fetcher.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${userStore.token}`;

      userStore.profile = await validateToken();
    }
  }, 1000 * 60 * 59); // 59 minutes

  return () => clearInterval(interval);
};

onAuthStateChanged(auth, async (user) => {
  await persistence;

  userStore.loading = true;

  if (user) {
    userStore.user = user;
    userStore.token = await user.getIdToken(true);
    console.log(userStore.token);

    fetcher.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${userStore.token}`;

    userStore.profile = await validateToken();

    unsubscribeFetchToken();
    unsubscribeFetchToken = autoFetchToken();
  } else {
    userStore.user = null;
    userStore.token = null;
    userStore.profile = null;

    unsubscribeFetchToken();
  }

  userStore.loading = false;
});
