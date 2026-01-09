import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

// Manual subscription override for testing (friends/family)
export const setUserSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, tier, expiresInDays } = req.body;

    if (!email || !tier) {
      return res.status(400).json({ message: 'Email and tier are required' });
    }

    if (tier !== 'free' && tier !== 'pro') {
      return res.status(400).json({ message: 'Tier must be "free" or "pro"' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate expiration date if provided
    let expiresAt = null;
    if (tier === 'pro' && expiresInDays) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + parseInt(expiresInDays));
      expiresAt = expireDate;
    }

    // Update user subscription
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: tier === 'pro' ? 'active' : 'active',
        subscriptionExpiresAt: expiresAt,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
      },
    });

    res.json({
      message: `Successfully set ${email} to ${tier} tier${expiresAt ? ` (expires ${expiresAt.toLocaleDateString()})` : ''}`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Get all users with their subscription status (for admin panel)
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Reset user password (for beta testing - admin only)
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and newPassword are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({
      message: `Password successfully reset for ${email}`,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

// Delete user account (for cleaning up test accounts)
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user (cascades to accounts, stacks, transactions, etc.)
    await prisma.user.delete({
      where: { id: user.id },
    });

    res.json({
      message: `User ${email} and all associated data deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
