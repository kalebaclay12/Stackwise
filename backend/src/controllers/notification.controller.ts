import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = '10', unreadOnly = 'false' } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.userId,
        ...(unreadOnly === 'true' ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.userId,
        read: false,
      },
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.userId,
        read: false,
      },
      data: { read: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// Helper function to create notifications with auto-cleanup (can be called from other services)
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any,
  actionUrl?: string
) => {
  // Create the new notification
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null,
      actionUrl,
    },
  });

  // Auto-cleanup: Keep only the 10 most recent notifications per user
  const allUserNotifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // If user has more than 10 notifications, delete the oldest ones
  if (allUserNotifications.length > 10) {
    const notificationsToDelete = allUserNotifications.slice(10);
    const idsToDelete = notificationsToDelete.map(n => n.id);

    await prisma.notification.deleteMany({
      where: {
        id: { in: idsToDelete },
      },
    });
  }

  return notification;
};
