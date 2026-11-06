import { Router, Request, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../database/index.js';
import { CommunitySubmission } from '../types/index.js';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { NotificationService } from '../services/notification.service.js';

export const communityRouter = Router();

// Submit a destination suggestion (public or logged-in)
communityRouter.post('/suggest', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      contributor_name,
      contributor_email,
      destination_name,
      region_code = 'KA',
      district,
      locality,
      category_slug,
      description,
      best_time,
      latitude,
      longitude,
      image_url,
      image_attribution,
    } = req.body;

    if (!contributor_name || !contributor_email || !destination_name || !district || !category_slug || !description) {
      return res.status(400).json({ error: 'Please provide all required fields including your contact and destination details.' });
    }

    const userId = req.user ? req.user.id : null;

    const result = dbRun(
      `INSERT INTO community_submissions (
        contributor_name, contributor_email, user_id, destination_name,
        region_code, district, locality, category_slug, description,
        best_time, latitude, longitude, image_url, image_attribution,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
      [
        contributor_name.trim(),
        contributor_email.trim(),
        userId,
        destination_name.trim(),
        region_code,
        district.trim(),
        locality ? locality.trim() : district.trim(),
        category_slug,
        description.trim(),
        best_time || null,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        image_url || 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80',
        image_attribution || 'Community Contributor',
      ]
    );

    const submissionId = Number(result.lastInsertRowid);

    if (userId) {
      NotificationService.createNotification(
        userId,
        'community_submitted',
        'Place Suggestion Received',
        `Thank you! Your suggestion for "${destination_name}" has been received and is queued for community editorial review.`,
        `/discover-hidden-gems`
      );
    }

    return res.status(201).json({
      message: 'Suggestion submitted successfully. Our editorial team will review it before publishing.',
      submissionId,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Public: View curated hidden gems that have been approved or recent submissions showcase
communityRouter.get('/hidden-gems', (_req: Request, res: Response) => {
  const hiddenGems = dbAll(
    `SELECT d.*, c.name as category_name
     FROM destinations d
     JOIN categories c ON d.category_slug = c.slug
     WHERE d.is_featured = 0 AND d.is_verified = 1
     ORDER BY d.id DESC
     LIMIT 24`
  );

  return res.json({ hiddenGems });
});
