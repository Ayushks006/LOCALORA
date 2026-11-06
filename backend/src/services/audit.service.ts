import { dbAll, dbRun } from '../database/index.js';
import { AuditLog } from '../types/index.js';

export class AuditService {
  static log(
    userId: number,
    action: string,
    targetType: string,
    targetId?: number | null,
    details?: string
  ): void {
    dbRun(
      `INSERT INTO audit_logs (user_id, action, target_type, target_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [userId, action, targetType, targetId || null, details || null]
    );
  }

  static getLogs(limit = 100, offset = 0): AuditLog[] {
    return dbAll<AuditLog>(
      `SELECT a.*, u.full_name as user_name 
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }
}
