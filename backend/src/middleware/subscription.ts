import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from './auth';

// Subscription tier limits
export const TIER_LIMITS = {
  free: {
    maxStacks: 3,
    autoAllocation: false,
    bankLinking: false,
    transactionMatching: false,
  },
  pro: {
    maxStacks: Infinity,
    autoAllocation: true,
    bankLinking: true,
    transactionMatching: true,
  },
};

export const checkSubscriptionTier = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Attach subscription info to request
    req.subscriptionTier = user.subscriptionTier as 'free' | 'pro';
    req.subscriptionStatus = user.subscriptionStatus;

    next();
  } catch (error) {
    next(error);
  }
};

export const requireProTier = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.subscriptionTier !== 'pro') {
    return res.status(403).json({
      message: 'This feature requires a Pro subscription',
      upgradeRequired: true,
    });
  }
  next();
};

export const checkStackLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accountId } = req.params;

    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required' });
    }

    // Get current stack count for the account
    const stackCount = await prisma.stack.count({
      where: { accountId },
    });

    const limit = TIER_LIMITS[req.subscriptionTier as 'free' | 'pro'].maxStacks;

    if (stackCount >= limit) {
      return res.status(403).json({
        message: `You've reached the maximum number of stacks (${limit}) for your ${req.subscriptionTier} tier`,
        upgradeRequired: req.subscriptionTier === 'free',
        currentCount: stackCount,
        limit,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const checkAutoAllocationFeature = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { autoAllocate } = req.body;

  if (autoAllocate && req.subscriptionTier === 'free') {
    return res.status(403).json({
      message: 'Auto-allocation is a Pro feature',
      upgradeRequired: true,
    });
  }

  next();
};
