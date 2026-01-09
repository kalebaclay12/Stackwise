import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // BETA MODE: Auto-upgrade all new users to Pro
    // Set BETA_MODE=false in production to disable this
    const isBetaMode = process.env.BETA_MODE !== 'false';

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        subscriptionTier: isBetaMode ? 'pro' : 'free',
        subscriptionStatus: 'active',
      },
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'checking',
        name: 'Main Checking',
        balance: 0,
        availableBalance: 0,
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};
