import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

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
        updatedAt: true,
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

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: req.userId },
        },
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        firstName,
        lastName,
        email,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId: req.userId!,
        },
      });
    }

    res.json(preferences);
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      currencyCode,
      currencySymbol,
      dateFormat,
      timeFormat,
      itemsPerPage,
      defaultAccountId,
      emailNotifications,
      negativeBalanceBehavior,
    } = req.body;

    // Check if preferences exist
    const existing = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    let preferences;
    if (existing) {
      preferences = await prisma.userPreferences.update({
        where: { userId: req.userId },
        data: {
          currencyCode,
          currencySymbol,
          dateFormat,
          timeFormat,
          itemsPerPage,
          defaultAccountId,
          emailNotifications,
          negativeBalanceBehavior,
        },
      });
    } else {
      preferences = await prisma.userPreferences.create({
        data: {
          userId: req.userId!,
          currencyCode,
          currencySymbol,
          dateFormat,
          timeFormat,
          itemsPerPage,
          defaultAccountId,
          emailNotifications,
          negativeBalanceBehavior,
        },
      });
    }

    res.json(preferences);
  } catch (error) {
    next(error);
  }
};
