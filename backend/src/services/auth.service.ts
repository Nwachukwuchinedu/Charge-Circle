import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma.js';
import { signToken } from '../utils/jwt.js';
import { SignupDto, LoginDto } from '../dto/auth.dto.js';

export class AuthService {
  static async signup(data: SignupDto) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email already exists');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        nickname: data.nickname,
        passwordHash,
      },
    });

    const token = signToken(user.id, user.nickname);
    return { token, user: { id: user.id, email: user.email, nickname: user.nickname } };
  }

  static async login(data: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new Error('Invalid credentials');

    const token = signToken(user.id, user.nickname);
    return { token, user: { id: user.id, email: user.email, nickname: user.nickname } };
  }
}
