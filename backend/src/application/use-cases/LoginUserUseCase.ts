import { AuthService } from '../../domain/services/AuthService';

export interface LoginUserRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginUserResponse {
  user: {
    id: string;
    email: string;
    tier: string;
    creditsUsed: number;
    creditLimit: number;
  };
  token: string; // Only used internally for httpOnly cookie
}

export class LoginUserUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    const { user, token } = await this.authService.login(
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