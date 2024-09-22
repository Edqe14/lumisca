import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '..';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        const token = await user.getIdToken();
        setToken(token);
      }
    });

    return unsub;
  }, []);

  return { user, token };
};
