import { AuthService } from '../../domain/services/AuthService';

export interface RegisterUserRequest {
  email: string;
  password: string;
}

export interface RegisterUserResponse {
  user: {
    id: string;
    email: string;
    tier: string;
    creditsUsed: number;
    creditLimit: number;
  };
  token: string; // Only used internally for httpOnly cookie
}

export class RegisterUserUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    const { user, token } = await this.authService.register(
      request.email,
      request.password
    );

    return {
      user: {
        id: user.id!,
        email: user.email,
        tier: user.tier,
        creditsUsed: user.creditsUsed,
        creditLimit: user.creditLimit,
      },
      token, // Only used internally for httpOnly cookie
    };
  }
}