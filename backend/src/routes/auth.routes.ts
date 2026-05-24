import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { SignupDto, LoginDto } from '../dto/auth.dto.js';

const router = Router();

/**
 * POST /api/auth/signup
 * Registers a new operator account.
 * Body: { nickname: string, email: string, password: string }
 */
router.post('/signup', validate(SignupDto), AuthController.signup);

/**
 * POST /api/auth/login
 * Authenticates an existing operator.
 * Body: { email: string, password: string }
 */
router.post('/login', validate(LoginDto), AuthController.login);

export default router;
