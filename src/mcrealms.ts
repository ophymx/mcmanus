
import fetch from 'node-fetch';
import { Response } from 'node-fetch';


const AUTH_SERVER = 'https://authserver.mojang.com';
const REALMS_SERVER = 'https://pc.realms.minecraft.net';
const CLIENT_TOKEN = 'mcmanus-token';
export const MC_VERSION = '1.16.2';

interface AuthProfile {
  name: string
  id: string
}

export interface AuthResponse {
  accessToken: string
  selectedProfile: AuthProfile
}

export interface ServerInfo {
  id: number
  remoteSubscriptionId: string
  owner: string
  ownerUUID: string
  name: string
  motd: string
  state: "ADMIN_LOCK" | "CLOSED" | "OPEN" | "UNINITIALIZED"
  daysLeft: number
  expired: boolean
  expiredTrial: boolean
  worldType: "NORMAL" | "MINIGAME" | "ADVENTUREMAP" | "EXPERIENCE" | "INSPIRATION"
  players: string[]
  maxPlayers: number
  minigameName?: string
  minigameId?: number
  minigameImage?: string
  activeSlot: number
  member: boolean
}

interface WorldsResponse {
  servers: ServerInfo[]
}

interface JoinResponse {
  address: string
  pendingUpdate: boolean
}

export class RealmsClient {
  public accessToken: string
  private profile: AuthProfile
  private cookie: string

  constructor(accessToken: string, profile: AuthProfile) {
    this.accessToken = accessToken;
    this.profile = profile;
    this.cookie = "sid=token:" + accessToken + ":" + profile.id +
      ";user=" + profile.name +
      ";version=" + MC_VERSION;
  }

  private get(path: string): Promise<Response> {
    return fetch(REALMS_SERVER + path, {
      headers: {
        Cookie: this.cookie,
      },
    });
  }

  private getText(path: string): Promise<string> {
    return this.get(path)
      .then((resp) => {
        if (resp.status != 200) {
          return resp.text().then((body) => Promise.reject(body))
        }
        return resp.text()
      });
  }

  private getJSON<T>(path: string): Promise<T> {
    return this.getText(path)
      .then((resp) => JSON.parse(resp));
  }

  public available(): Promise<boolean> {
    return this.getText('/mco/available')
      .then((body) => body.trim() === 'true');
  }

  public compatible(): Promise<"OUTDATED" | "OTHER" | "COMPATIBLE"> {
    return this.getText('/mco/client/compatible')
      .then((body) => {
        body = body.trim();
        switch (body) {
          case 'OUTDATED':
            return 'OUTDATED';
          case 'OTHER':
            return 'OTHER';
          case 'COMPATIBLE':
            return 'COMPATIBLE';
          default:
            return Promise.reject(body)
        }
      })
  }

  public worlds(): Promise<WorldsResponse> {
    return this.getJSON('/worlds');
  }

  public join(id: number): Promise<JoinResponse> {
    return this.getJSON('/worlds/v1/' + id + '/join/pc');
  }
}

export function login(username: string, password: string): Promise<RealmsClient> {
  const data = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: username,
      password: password,
      clientToken: CLIENT_TOKEN,
      agent: {
        name: 'Minecraft',
        version: 1,
      },
    }),
  }
  return fetch(AUTH_SERVER + '/authenticate', data).then((resp) => {
    if (resp.status != 200) {
      return resp.json().then((body) => Promise.reject(body));
    }
    return resp.json();
  }).then((resp: AuthResponse): RealmsClient => {
    return new RealmsClient(resp.accessToken, resp.selectedProfile);
  });
}