import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { NotificationService } from '../services/notification.service.js';

export const notificationsRouter = Router();

// Get notifications for current user
notificationsRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const notifications = NotificationService.getUserNotifications(req.user!.id);
  const unreadCount = notifications.filter((n) => n.is_read === 0).length;
  return res.json({ notifications, unreadCount });
});

// Mark single notification as read
notificationsRouter.put('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = NotificationService.markAsRead(Number(id), req.user!.id);
  return res.json({ success });
});

// Mark all as read
notificationsRouter.put('/read-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const count = NotificationService.markAllAsRead(req.user!.id);
  return res.json({ count });
});
