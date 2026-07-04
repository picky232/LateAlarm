import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
} from 'firebase/database';
import { getFirebaseDb } from './FirebaseClient';
import { ShareSession, Coordinate, TransportOption } from '@/shared/types';
import {
  IShareRepository,
  CreateShareParams,
} from '@/shared/domains/sharing/repositories/IShareRepository';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function calcRemainingMinutes(estimatedArrival: Date): number {
  return Math.max(0, Math.ceil((estimatedArrival.getTime() - Date.now()) / 60000));
}

export class FirebaseShareRepository implements IShareRepository {
  async createSession(params: CreateShareParams): Promise<ShareSession> {
    const db = getFirebaseDb();
    const id = generateId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + params.expiresInMinutes * 60000);

    const session: ShareSession = {
      id,
      origin: params.origin,
      destination: params.destination,
      currentLocation: params.currentLocation,
      selectedRoute: params.selectedRoute,
      estimatedArrival: params.selectedRoute.arrivalTime,
      remainingMinutes: calcRemainingMinutes(params.selectedRoute.arrivalTime),
      lastUpdated: now,
      expiresAt,
      isArrived: false,
    };

    await set(ref(db, `sessions/${id}`), {
      ...session,
      estimatedArrival: session.estimatedArrival.toISOString(),
      lastUpdated: session.lastUpdated.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    });

    return session;
  }

  async updateLocation(sessionId: string, location: Coordinate): Promise<void> {
    const db = getFirebaseDb();
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const snap = await get(sessionRef);
    if (!snap.exists()) throw new Error('세션을 찾을 수 없습니다.');

    const data = snap.val();
    const estimatedArrival = new Date(data.estimatedArrival);

    await update(sessionRef, {
      currentLocation: location,
      remainingMinutes: calcRemainingMinutes(estimatedArrival),
      lastUpdated: new Date().toISOString(),
    });
  }

  async getSession(sessionId: string): Promise<ShareSession | null> {
    const db = getFirebaseDb();
    const snap = await get(ref(db, `sessions/${sessionId}`));
    if (!snap.exists()) return null;
    return this.deserialize(snap.val());
  }

  subscribeToSession(sessionId: string, callback: (session: ShareSession) => void): () => void {
    const db = getFirebaseDb();
    const sessionRef = ref(db, `sessions/${sessionId}`);

    const handler = (snap: { val: () => unknown; exists: () => boolean }) => {
      if (snap.exists()) {
        callback(this.deserialize(snap.val() as Record<string, unknown>));
      }
    };

    onValue(sessionRef, handler as Parameters<typeof onValue>[1]);
    return () => off(sessionRef, 'value', handler as Parameters<typeof off>[2]);
  }

  async markArrived(sessionId: string): Promise<void> {
    const db = getFirebaseDb();
    await update(ref(db, `sessions/${sessionId}`), {
      isArrived: true,
      remainingMinutes: 0,
    });
  }

  private deserialize(data: Record<string, unknown>): ShareSession {
    return {
      ...(data as unknown as ShareSession),
      estimatedArrival: new Date(data.estimatedArrival as string),
      lastUpdated: new Date(data.lastUpdated as string),
      expiresAt: new Date(data.expiresAt as string),
    };
  }
}
