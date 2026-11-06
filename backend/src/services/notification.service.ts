import { dbAll, dbRun } from '../database/index.js';
import { Notification } from '../types/index.js';

export class NotificationService {
  static createNotification(
    userId: number,
    type: string,
    title: string,
    message: string,
    linkUrl?: string
  ): number {
    const result = dbRun(
      `INSERT INTO notifications (user_id, type, title, message, link_url, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`,
      [userId, type, title, message, linkUrl || null]
    );
    return Number(result.lastInsertRowid);
  }

  static getUserNotifications(userId: number, limit = 50): Notification[] {
    return dbAll<Notification>(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );
  }

  static markAsRead(notificationId: number, userId: number): boolean {
    const result = dbRun(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    return result.changes > 0;
  }

  static markAllAsRead(userId: number): number {
    const result = dbRun(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return result.changes;
  }
}
