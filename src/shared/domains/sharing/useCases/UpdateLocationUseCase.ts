import { Coordinate } from '@/shared/types';
import { IShareRepository } from '../repositories/IShareRepository';

export class UpdateLocationUseCase {
  constructor(private readonly shareRepo: IShareRepository) {}

  async execute(sessionId: string, location: Coordinate): Promise<void> {
    return this.shareRepo.updateLocation(sessionId, location);
  }
}
