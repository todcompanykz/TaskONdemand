import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'your-secret-key'),
    });
  }

  async validate(payload: any) {
    // #region agent log
    try {
      fetch(
        'http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'jwt.strategy.ts:20',
            message: 'JWT validate entry',
            data: {
              payloadSub: payload.sub,
              payloadRole: payload.role,
              payloadPermissions: payload.permissions,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'D',
          }),
        },
      ).catch(() => {});
    } catch (e) {}
    // #endregion

    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    // Return user with role and permissions from database
    // This ensures that role/permission changes take effect immediately
    // even if JWT token still contains old values
    const result = {
      ...user,
      role: user.role,
      permissions: user.permissions || [],
    };

    // #region agent log
    try {
      fetch(
        'http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'jwt.strategy.ts:35',
            message: 'JWT validate returning',
            data: {
              userId: result.id,
              email: result.email,
              role: result.role,
              permissions: result.permissions,
              roleType: typeof result.role,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'D',
          }),
        },
      ).catch(() => {});
    } catch (e) {}
    // #endregion

    return result;
  }
}
