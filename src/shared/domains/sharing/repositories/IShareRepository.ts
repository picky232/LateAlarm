import { ShareSession, Coordinate, TransportOption } from '@/shared/types';

export interface CreateShareParams {
  origin: Coordinate;
  destination: Coordinate;
  currentLocation: Coordinate;
  selectedRoute: TransportOption;
  expiresInMinutes: number;
}

export interface IShareRepository {
  createSession(params: CreateShareParams): Promise<ShareSession>;
  updateLocation(sessionId: string, location: Coordinate): Promise<void>;
  getSession(sessionId: string): Promise<ShareSession | null>;
  subscribeToSession(sessionId: string, callback: (session: ShareSession) => void): () => void;
  markArrived(sessionId: string): Promise<void>;
}
