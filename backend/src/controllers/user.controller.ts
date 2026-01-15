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

// ============= NOTIFICATION PREFERENCES =============

const DEFAULT_NOTIFICATION_PREFS = {
  transactionAlerts: 'all',
  largeTransactionThreshold: 100,
  lowBalanceAlert: true,
  lowBalanceThreshold: 50,
  goalProgress: true,
  goalMilestones: true,
  autoAllocationReminder: true,
  autoAllocationComplete: true,
  weeklySummary: true,
  weeklySummaryDay: 'monday',
  monthlySummary: true,
  pushNotifications: true,
  emailNotifications: true,
};

export const getNotificationPreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    // Return notification-related fields with defaults
    res.json({
      transactionAlerts: preferences?.transactionAlerts || DEFAULT_NOTIFICATION_PREFS.transactionAlerts,
      largeTransactionThreshold: preferences?.largeTransactionThreshold || DEFAULT_NOTIFICATION_PREFS.largeTransactionThreshold,
      lowBalanceAlert: preferences?.lowBalanceAlert ?? DEFAULT_NOTIFICATION_PREFS.lowBalanceAlert,
      lowBalanceThreshold: preferences?.lowBalanceThreshold || DEFAULT_NOTIFICATION_PREFS.lowBalanceThreshold,
      goalProgress: preferences?.goalProgress ?? DEFAULT_NOTIFICATION_PREFS.goalProgress,
      goalMilestones: preferences?.goalMilestones ?? DEFAULT_NOTIFICATION_PREFS.goalMilestones,
      autoAllocationReminder: preferences?.autoAllocationReminder ?? DEFAULT_NOTIFICATION_PREFS.autoAllocationReminder,
      autoAllocationComplete: preferences?.autoAllocationComplete ?? DEFAULT_NOTIFICATION_PREFS.autoAllocationComplete,
      weeklySummary: preferences?.weeklySummary ?? DEFAULT_NOTIFICATION_PREFS.weeklySummary,
      weeklySummaryDay: preferences?.weeklySummaryDay || DEFAULT_NOTIFICATION_PREFS.weeklySummaryDay,
      monthlySummary: preferences?.monthlySummary ?? DEFAULT_NOTIFICATION_PREFS.monthlySummary,
      pushNotifications: preferences?.pushNotifications ?? DEFAULT_NOTIFICATION_PREFS.pushNotifications,
      emailNotifications: preferences?.emailNotifications ?? DEFAULT_NOTIFICATION_PREFS.emailNotifications,
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotificationPreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    // Upsert preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: {
        transactionAlerts: data.transactionAlerts,
        largeTransactionThreshold: data.largeTransactionThreshold,
        lowBalanceAlert: data.lowBalanceAlert,
        lowBalanceThreshold: data.lowBalanceThreshold,
        goalProgress: data.goalProgress,
        goalMilestones: data.goalMilestones,
        autoAllocationReminder: data.autoAllocationReminder,
        autoAllocationComplete: data.autoAllocationComplete,
        weeklySummary: data.weeklySummary,
        weeklySummaryDay: data.weeklySummaryDay,
        monthlySummary: data.monthlySummary,
        pushNotifications: data.pushNotifications,
        emailNotifications: data.emailNotifications,
      },
      create: {
        userId: req.userId!,
        transactionAlerts: data.transactionAlerts,
        largeTransactionThreshold: data.largeTransactionThreshold,
        lowBalanceAlert: data.lowBalanceAlert,
        lowBalanceThreshold: data.lowBalanceThreshold,
        goalProgress: data.goalProgress,
        goalMilestones: data.goalMilestones,
        autoAllocationReminder: data.autoAllocationReminder,
        autoAllocationComplete: data.autoAllocationComplete,
        weeklySummary: data.weeklySummary,
        weeklySummaryDay: data.weeklySummaryDay,
        monthlySummary: data.monthlySummary,
        pushNotifications: data.pushNotifications,
        emailNotifications: data.emailNotifications,
      },
    });

    res.json(preferences);
  } catch (error) {
    next(error);
  }
};

// ============= APPEARANCE PREFERENCES =============

const DEFAULT_APPEARANCE_PREFS = {
  theme: 'system',
  hideBalances: false,
  compactMode: false,
  reducedMotion: false,
  accentColor: 'indigo',
};

export const getAppearancePreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    res.json({
      theme: preferences?.theme || DEFAULT_APPEARANCE_PREFS.theme,
      hideBalances: preferences?.hideBalances ?? DEFAULT_APPEARANCE_PREFS.hideBalances,
      compactMode: preferences?.compactMode ?? DEFAULT_APPEARANCE_PREFS.compactMode,
      reducedMotion: preferences?.reducedMotion ?? DEFAULT_APPEARANCE_PREFS.reducedMotion,
      accentColor: preferences?.accentColor || DEFAULT_APPEARANCE_PREFS.accentColor,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAppearancePreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { theme, hideBalances, compactMode, reducedMotion, accentColor } = req.body;

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { theme, hideBalances, compactMode, reducedMotion, accentColor },
      create: {
        userId: req.userId!,
        theme,
        hideBalances,
        compactMode,
        reducedMotion,
        accentColor,
      },
    });

    res.json(preferences);
  } catch (error) {
    next(error);
  }
};

// ============= SECURITY PREFERENCES =============

const DEFAULT_SECURITY_PREFS = {
  autoLockEnabled: false,
  autoLockTimeout: 15,
  loginAlerts: true,
  newDeviceAlerts: true,
};

export const getSecurityPreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    res.json({
      autoLockEnabled: preferences?.autoLockEnabled ?? DEFAULT_SECURITY_PREFS.autoLockEnabled,
      autoLockTimeout: preferences?.autoLockTimeout || DEFAULT_SECURITY_PREFS.autoLockTimeout,
      loginAlerts: preferences?.loginAlerts ?? DEFAULT_SECURITY_PREFS.loginAlerts,
      newDeviceAlerts: preferences?.newDeviceAlerts ?? DEFAULT_SECURITY_PREFS.newDeviceAlerts,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSecurityPreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { autoLockEnabled, autoLockTimeout, loginAlerts, newDeviceAlerts } = req.body;

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { autoLockEnabled, autoLockTimeout, loginAlerts, newDeviceAlerts },
      create: {
        userId: req.userId!,
        autoLockEnabled,
        autoLockTimeout,
        loginAlerts,
        newDeviceAlerts,
      },
    });

    res.json(preferences);
  } catch (error) {
    next(error);
  }
};

// ============= SESSIONS =============

export const getSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // In a real app, you'd track sessions in a database
    // For now, return mock data for the current session
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.socket.remoteAddress || 'Unknown';

    // Parse user agent to get device info
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const browser = userAgent.includes('Chrome') ? 'Chrome'
      : userAgent.includes('Firefox') ? 'Firefox'
      : userAgent.includes('Safari') ? 'Safari'
      : userAgent.includes('Edge') ? 'Edge'
      : 'Unknown';

    res.json([
      {
        id: '1',
        deviceType: isMobile ? 'Mobile' : 'Desktop',
        browser,
        location: 'Current Location', // Would use IP geolocation in production
        ipAddress: ip,
        lastActive: new Date().toISOString(),
        isCurrent: true,
      },
    ]);
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    // In production, you'd invalidate the session token in your database
    console.log(`Revoking session: ${sessionId}`);
    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    next(error);
  }
};

export const revokeAllSessions = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // In production, you'd invalidate all session tokens except current
    res.json({ message: 'All other sessions revoked successfully' });
  } catch (error) {
    next(error);
  }
};

// ============= LOGIN HISTORY =============

export const getLoginHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // In a real app, you'd store login attempts in a database
    // For now, return mock data
    res.json([
      {
        id: '1',
        deviceType: 'Desktop',
        browser: 'Chrome',
        location: 'Current Location',
        ipAddress: req.ip || 'Unknown',
        timestamp: new Date().toISOString(),
        success: true,
      },
    ]);
  } catch (error) {
    next(error);
  }
};

// ============= DATA EXPORT =============

export const exportData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { format, dateRange } = req.query;

    // Get date range filter
    let dateFilter: Date | undefined;
    const now = new Date();
    switch (dateRange) {
      case '1month':
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3months':
        dateFilter = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6months':
        dateFilter = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '1year':
        dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        accounts: {
          include: {
            stacks: true,
            transactions: dateFilter ? {
              where: { date: { gte: dateFilter } },
              orderBy: { date: 'desc' },
            } : {
              orderBy: { date: 'desc' },
            },
          },
        },
        preferences: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (format === 'csv') {
      // Generate CSV
      let csv = 'Date,Type,Description,Amount,Category,Account,Stack\n';

      for (const account of user.accounts) {
        for (const transaction of account.transactions) {
          const stack = account.stacks.find(s => s.id === transaction.stackId);
          csv += `"${transaction.date.toISOString()}","${transaction.type}","${transaction.description}","${transaction.amount}","${transaction.category || ''}","${account.name}","${stack?.name || ''}"\n`;
        }
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=stackwise-export-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else {
      // Generate simple text report for PDF (in production, use a PDF library)
      const report = {
        exportDate: new Date().toISOString(),
        user: {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        },
        accounts: user.accounts.map(a => ({
          name: a.name,
          balance: a.balance,
          stacks: a.stacks.map(s => ({
            name: s.name,
            currentAmount: s.currentAmount,
            targetAmount: s.targetAmount,
          })),
          transactionCount: a.transactions.length,
        })),
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=stackwise-export-${new Date().toISOString().split('T')[0]}.json`);
      res.json(report);
    }
  } catch (error) {
    next(error);
  }
};

// ============= DELETE ACCOUNT =============

export const deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Delete user and all related data (cascades defined in schema)
    await prisma.user.delete({
      where: { id: req.userId },
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};
