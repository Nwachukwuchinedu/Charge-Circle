import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { SignupDto, LoginDto } from '../dto/auth.dto.js';

const router = Router();

router.post('/signup', validate(SignupDto), AuthController.signup);
router.post('/login', validate(LoginDto), AuthController.login);

export default router;
