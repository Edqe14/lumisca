import { SignJWT } from 'jose';

const KEY = process.env.VIDEOSDK_API_KEY!;
const SECRET = new TextEncoder().encode(process.env.VIDEOSDK_API_SECRET!);

const ADMIN_TOKEN = await new SignJWT({
  apikey: KEY,
  permissions: ['allow_join', 'allow_mod'],
  version: 2,
})
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('1y')
  .sign(SECRET);

const BASE_URL = 'https://api.videosdk.live/v2';
const headers = {
  Authorization: ADMIN_TOKEN,
  'Content-Type': 'application/json',
};

// videosdk
export class Channel {
  id: string;
  roomId: string | null = null;
  isCreated = false;
  isActive = false;

  constructor(id: string) {
    this.id = id;
  }

  public async ensureRoom() {
    if (!this.isCreated) {
      await this.createRoom();
    }

    return this;
  }

  public async createRoom() {
    const res = await fetch(`${BASE_URL}/rooms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customRoomId: this.id,
        autoCloseConfig: {
          type: 'session-end-and-deactivate',
          duration: 60 * 5, // 5 minutes
        },
      }),
    });

    if (!res.ok) {
      console.error(
        await res.text(),
        `${BASE_URL}/rooms`,
        headers,
        JSON.stringify({
          customRoomId: this.id,
          autoCloseConfig: {
            type: 'session-end-and-deactivate',
            duration: 60 * 5, // 5 minutes
          },
        })
      );
      throw new Error('Failed to create room');
    }

    const json = await res.json();

    this.roomId = json.roomId;
    this.isCreated = true;
    this.isActive = true;

    return this;
  }

  public async deactivate() {
    if (!this.isActive) {
      return this;
    }

    const res = await fetch(`${BASE_URL}/rooms/deactivate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ roomId: this.id }),
    });

    if (!res.ok) {
      throw new Error('Failed to deactivate room');
    }

    this.isActive = false;

    return this;
  }

  public async generateUserToken(userId: string, canJoinImmediately = false) {
    const token = await new SignJWT({
      apikey: KEY,
      permissions: ['allow_join'],
      version: 2,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1d')
      .sign(SECRET);

    return token;
  }
}
