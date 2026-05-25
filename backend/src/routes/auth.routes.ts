import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { SignupDto, LoginDto, RefreshDto, LogoutDto } from '../dto/auth.dto.js';

const router = Router();

/**
 * POST /api/auth/signup
 * Registers a new operator account.
 */
router.post('/signup', validate(SignupDto), AuthController.signup);

/**
 * POST /api/auth/login
 * Authenticates an existing operator.
 */
router.post('/login', validate(LoginDto), AuthController.login);

/**
 * POST /api/auth/refresh
 * Exchanges a valid refresh token for a new token pair.
 */
router.post('/refresh', validate(RefreshDto), AuthController.refresh);

/**
 * POST /api/auth/logout
 * Revokes a single refresh token (one-device logout).
 */
router.post('/logout', validate(LogoutDto), AuthController.logout);

/**
 * POST /api/auth/logout-all
 * Revokes all refresh tokens for the authenticated user.
 * Requires a valid access token.
 */
router.post('/logout-all', requireAuth, AuthController.logoutAll);

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile including totalScore.
 */
router.get('/me', requireAuth, AuthController.me);

export default router;
