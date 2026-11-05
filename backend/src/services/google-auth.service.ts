import { OAuth2Client, CodeChallengeMethod } from 'google-auth-library';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { UnauthorizedError, BadRequestError, ConflictError } from '../utils/errors';
import { UserRole } from '@prisma/client';
import { logger } from '../utils/logger';

export interface OAuthStateData {
  state: string;
  codeVerifier: string;
  role?: string;
  returnTo?: string;
  signature: string;
}

export class GoogleAuthService {
  private getOAuthClient(): OAuth2Client {
    return new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_CALLBACK_URL
    );
  }

  /**
   * Generates cryptographic state and PKCE parameters,
   * returning the Google Authorization URL and state metadata to store in an HTTP-only cookie.
   */
  generateAuthUrl(params: { role?: string; returnTo?: string }): {
    url: string;
    stateData: OAuthStateData;
  } {
    const oauth2Client = this.getOAuthClient();

    // 1. Generate 32 bytes cryptographically secure random state
    const state = crypto.randomBytes(32).toString('hex');

    // 2. Implement PKCE with S256
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    // 3. Create HMAC signature to prevent state tampering
    const signature = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(`${state}:${codeVerifier}:${params.role || ''}`)
      .digest('hex');

    const stateData: OAuthStateData = {
      state,
      codeVerifier,
      role: params.role,
      returnTo: params.returnTo,
      signature,
    };

    // 4. Scopes: minimal necessary (openid, email, profile)
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      state,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
      prompt: 'select_account',
    });

    return { url, stateData };
  }

  /**
   * Validates state & PKCE, exchanges authorization code on server,
   * verifies ID token, resolves/creates user, and issues authenticated JWT session.
   */
  async handleCallback(params: {
    code: string;
    state: string;
    cookieStateData?: OAuthStateData;
  }) {
    const { code, state, cookieStateData } = params;

    // 1. State & CSRF Validation
    if (!cookieStateData || !cookieStateData.state || !cookieStateData.codeVerifier) {
      throw new BadRequestError('OAuth state session expired or missing. Please try signing in again.');
    }

    if (cookieStateData.state !== state) {
      throw new BadRequestError('Invalid OAuth state. Potential CSRF attack detected.');
    }

    // Verify HMAC signature
    const expectedSig = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(`${cookieStateData.state}:${cookieStateData.codeVerifier}:${cookieStateData.role || ''}`)
      .digest('hex');

    if (expectedSig !== cookieStateData.signature) {
      throw new BadRequestError('Tampered OAuth state signature.');
    }

    // 2. Exchange authorization code securely on server with PKCE verifier
    const oauth2Client = this.getOAuthClient();
    let tokens: any;

    try {
      const res = await oauth2Client.getToken({
        code,
        codeVerifier: cookieStateData.codeVerifier,
      });
      tokens = res.tokens;
    } catch (err: any) {
      logger.error('Failed to exchange Google OAuth code for tokens:', err.message);
      throw new BadRequestError('Failed to exchange authorization code with Google. Please retry.');
    }

    if (!tokens.id_token) {
      throw new UnauthorizedError('Google did not return a valid ID token.');
    }

    // 3. Verify Google ID token signature, issuer, audience, expiration
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedError('Failed to extract claims from Google ID token.');
    }

    const {
      sub,
      email,
      email_verified,
      name,
      picture,
    } = payload;

    // Validate stable subject identifier (sub)
    if (!sub) {
      throw new UnauthorizedError('Google ID token is missing the subject identifier (sub).');
    }

    // Validate email verification status
    if (!email || !email_verified) {
      throw new BadRequestError(
        'Your Google account does not have a verified email address. Please verify your Google email first.'
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 4. Check if Google account is already linked
    const existingOAuth = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: sub,
        },
      },
      include: { user: true },
    });

    // SCENARIO B: Existing Google user
    if (existingOAuth) {
      const user = existingOAuth.user;

      if (user.status === 'SUSPENDED') {
        throw new UnauthorizedError('This account is suspended. Please contact support.');
      }

      // Update avatar or name if missing
      if (!user.avatarUrl && picture) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: picture },
        });
      }

      const token = this.generateToken(user.id, user.role, user.tokenVersion);

      return {
        user: this.sanitizeUser(user),
        token,
        isNewUser: false,
      };
    }

    // Check if an account already exists with the same email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // SCENARIO C: Existing account with the same email
    if (existingUserByEmail) {
      // If the existing user has a password set, enforce secure linking policy:
      // Do not silently link; require logging in with password first.
      if (existingUserByEmail.passwordHash) {
        logger.warn(
          `Google OAuth linking blocked: Account ${normalizedEmail} has a password. Requires authenticated linking.`
        );
        const err: any = new ConflictError(
          'An account with this email address already exists with a password. Please sign in using your password, then link your Google account in settings.'
        );
        err.code = 'ACCOUNT_EXISTS_WITH_PASSWORD';
        err.email = normalizedEmail;
        throw err;
      }

      // If existing user has no password (e.g. created through an invitation or another social provider), link safely
      const linkedUser = await prisma.$transaction(async (tx) => {
        await tx.oAuthAccount.create({
          data: {
            userId: existingUserByEmail.id,
            provider: 'google',
            providerAccountId: sub,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: existingUserByEmail.id,
            action: 'LINK_GOOGLE_OAUTH',
            entityType: 'User',
            entityId: existingUserByEmail.id,
            details: { provider: 'google', providerAccountId: sub },
          },
        });

        return tx.user.update({
          where: { id: existingUserByEmail.id },
          data: {
            isEmailVerified: true,
            avatarUrl: existingUserByEmail.avatarUrl || picture,
          },
        });
      });

      const token = this.generateToken(linkedUser.id, linkedUser.role, linkedUser.tokenVersion);

      return {
        user: this.sanitizeUser(linkedUser),
        token,
        isNewUser: false,
      };
    }

    // SCENARIO A: New Google user
    const requestedRole = cookieStateData.role === 'EXPERT' ? UserRole.EXPERT : UserRole.TRAVELER;

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: name || 'Traveler',
          avatarUrl: picture || null,
          role: requestedRole,
          isEmailVerified: true,
          // passwordHash is omitted for OAuth users (stored as NULL in DB)
        },
      });

      await tx.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerAccountId: sub,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGISTER_GOOGLE_OAUTH',
          entityType: 'User',
          entityId: user.id,
          details: { email: normalizedEmail, provider: 'google', providerAccountId: sub },
        },
      });

      return user;
    });

    const token = this.generateToken(newUser.id, newUser.role, newUser.tokenVersion);

    return {
      user: this.sanitizeUser(newUser),
      token,
      isNewUser: true,
    };
  }

  /**
   * Allows an authenticated user to link their Google account
   */
  async linkAccount(userId: string, idToken: string) {
    const oauth2Client = this.getOAuthClient();
    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      throw new UnauthorizedError('Invalid Google ID token.');
    }

    if (!payload.email_verified) {
      throw new BadRequestError('Google email must be verified to link.');
    }

    const existing = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: payload.sub,
        },
      },
    });

    if (existing) {
      if (existing.userId === userId) {
        return { message: 'Google account is already linked.' };
      }
      throw new ConflictError('This Google account is already linked to another WayRivo user.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.oAuthAccount.create({
        data: {
          userId,
          provider: 'google',
          providerAccountId: payload.sub,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'LINK_GOOGLE_OAUTH_EXPLICIT',
          entityType: 'User',
          entityId: userId,
          details: { providerAccountId: payload.sub },
        },
      });
    });

    return { success: true, message: 'Google account successfully linked.' };
  }

  /**
   * Unlinks Google account if user has a password or another auth method
   */
  async unlinkAccount(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { oauthAccounts: true },
    });

    if (!user) {
      throw new BadRequestError('User not found.');
    }

    if (!user.passwordHash && user.oauthAccounts.length <= 1) {
      throw new BadRequestError(
        'Cannot unlink Google account without first setting a password. Use Account Settings to set a password.'
      );
    }

    await prisma.oAuthAccount.deleteMany({
      where: {
        userId,
        provider: 'google',
      },
    });

    return { success: true, message: 'Google account unlinked successfully.' };
  }

  private generateToken(userId: string, role: UserRole, tokenVersion: number = 0): string {
    return jwt.sign({ userId, role, tokenVersion }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  private sanitizeUser(user: any) {
    const { passwordHash, passwordResetToken, passwordResetExpires, emailVerificationToken, ...safeUser } = user;
    return safeUser;
  }
}

export const googleAuthService = new GoogleAuthService();
