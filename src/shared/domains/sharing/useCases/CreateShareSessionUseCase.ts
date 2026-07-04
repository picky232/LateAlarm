import { ShareSession } from '@/shared/types';
import { IShareRepository, CreateShareParams } from '../repositories/IShareRepository';

export class CreateShareSessionUseCase {
  constructor(private readonly shareRepo: IShareRepository) {}

  async execute(params: CreateShareParams): Promise<ShareSession> {
    return this.shareRepo.createSession(params);
  }
}
