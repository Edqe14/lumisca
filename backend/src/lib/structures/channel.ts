import { SignJWT } from 'jose';

const KEY = process.env.VIDEOSDK_API_KEY!;
const SECRET = new TextEncoder().encode(process.env.VIDEOSDK_API_SECRET!);

const ADMIN_TOKEN = await new SignJWT({
  apiKey: KEY,
  permissions: ['allow_join', 'allow_mod'],
})
  .setProtectedHeader({ alg: 'HS256' })
  .setAudience('lumisca-session-u')
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
  isCreated = false;
  isActive = false;

  constructor(id: string) {
    this.id = id;
  }

  public async ensureRoom() {
    // FIXME: skip room for now
    // if (!this.isCreated) {
    //   await this.createRoom();
    // }

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
      throw new Error('Failed to create room');
    }

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
      apiKey: KEY,
      permissions: canJoinImmediately ? ['allow_join'] : ['ask_join'],
      version: 2,
      roomId: this.id,
      participantId: userId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience('lumisca-session-u')
      .setExpirationTime('1d')
      .sign(SECRET);

    return token;
  }
}
