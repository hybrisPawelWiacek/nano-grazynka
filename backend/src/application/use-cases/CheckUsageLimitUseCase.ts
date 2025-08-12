import { UsageService } from '../../domain/services/UsageService';

export interface CheckUsageLimitRequest {
  userId: string;
}

export interface CheckUsageLimitResponse {
  allowed: boolean;
  creditsUsed: number;
  creditLimit: number;
  remainingCredits: number;
  tier: string;
}

export class CheckUsageLimitUseCase {
  constructor(private readonly usageService: UsageService) {}

  async execute(request: CheckUsageLimitRequest): Promise<CheckUsageLimitResponse> {
    const { allowed, user } = await this.usageService.checkAndIncrementUsage(request.userId);
    
    return {
      allowed,
      creditsUsed: user.creditsUsed,
      creditLimit: user.creditLimit,
      remainingCredits: user.remainingCredits,
      tier: user.tier,
    };
  }
}