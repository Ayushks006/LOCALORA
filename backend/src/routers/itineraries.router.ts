import { Router, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../database/index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const itinerariesRouter = Router();

// Saved Destinations: List
itinerariesRouter.get('/saved', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const saved = dbAll(
    `SELECT d.*, c.name as category_name, s.created_at as saved_at
     FROM saved_destinations s
     JOIN destinations d ON s.destination_id = d.id
     JOIN categories c ON d.category_slug = c.slug
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC`,
    [req.user!.id]
  );
  return res.json({ savedDestinations: saved });
});

// Saved Destinations: Toggle save/unsave
itinerariesRouter.post('/saved/toggle', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { destination_id } = req.body;
  if (!destination_id) {
    return res.status(400).json({ error: 'destination_id is required.' });
  }

  const existing = dbGet('SELECT id FROM saved_destinations WHERE user_id = ? AND destination_id = ?', [
    req.user!.id,
    destination_id,
  ]);

  if (existing) {
    dbRun('DELETE FROM saved_destinations WHERE id = ?', [(existing as any).id]);
    return res.json({ isSaved: false, message: 'Removed from saved destinations.' });
  } else {
    dbRun('INSERT INTO saved_destinations (user_id, destination_id) VALUES (?, ?)', [
      req.user!.id,
      destination_id,
    ]);
    return res.json({ isSaved: true, message: 'Destination saved to your collection.' });
  }
});

// Itineraries: List user itineraries
itinerariesRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const itineraries = dbAll(
    `SELECT i.*, COUNT(it.id) as items_count 
     FROM itineraries i
     LEFT JOIN itinerary_items it ON i.id = it.itinerary_id
     WHERE i.user_id = ?
     GROUP BY i.id
     ORDER BY i.created_at DESC`,
    [req.user!.id]
  );
  return res.json({ itineraries });
});

// Itineraries: Get single itinerary with items and destination coordinates
itinerariesRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const itinerary = dbGet('SELECT * FROM itineraries WHERE id = ? AND user_id = ?', [id, req.user!.id]);
  if (!itinerary) {
    return res.status(404).json({ error: 'Itinerary not found.' });
  }

  const items = dbAll(
    `SELECT it.*, d.name as destination_name, d.slug as destination_slug,
            d.district, d.category_slug, d.primary_image, d.latitude, d.longitude
     FROM itinerary_items it
     JOIN destinations d ON it.destination_id = d.id
     WHERE it.itinerary_id = ?
     ORDER BY it.day_number ASC, it.order_index ASC`,
    [id]
  );

  return res.json({ itinerary: { ...(itinerary as any), items } });
});

// Itineraries: Create
itinerariesRouter.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, description, start_date, end_date } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Itinerary title is required.' });
  }

  const result = dbRun(
    `INSERT INTO itineraries (user_id, title, description, start_date, end_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [req.user!.id, title.trim(), description || '', start_date || null, end_date || null]
  );

  return res.status(201).json({
    message: 'Itinerary created.',
    itineraryId: Number(result.lastInsertRowid),
  });
});

// Itineraries: Add Item
itinerariesRouter.post('/:id/items', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { destination_id, day_number = 1, notes } = req.body;

  const itinerary = dbGet('SELECT id FROM itineraries WHERE id = ? AND user_id = ?', [id, req.user!.id]);
  if (!itinerary) {
    return res.status(404).json({ error: 'Itinerary not found.' });
  }

  const maxOrder = dbGet<{ max_order: number }>(
    'SELECT MAX(order_index) as max_order FROM itinerary_items WHERE itinerary_id = ? AND day_number = ?',
    [id, day_number]
  );
  const nextOrder = maxOrder && maxOrder.max_order !== null ? maxOrder.max_order + 1 : 0;

  dbRun(
    `INSERT INTO itinerary_items (itinerary_id, destination_id, day_number, order_index, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [id, destination_id, day_number, nextOrder, notes || '']
  );

  return res.status(201).json({ message: 'Destination added to itinerary.' });
});

// Itineraries: Remove Item
itinerariesRouter.delete('/:id/items/:itemId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id, itemId } = req.params;
  const itinerary = dbGet('SELECT id FROM itineraries WHERE id = ? AND user_id = ?', [id, req.user!.id]);
  if (!itinerary) {
    return res.status(404).json({ error: 'Itinerary not found.' });
  }

  dbRun('DELETE FROM itinerary_items WHERE id = ? AND itinerary_id = ?', [itemId, id]);
  return res.json({ message: 'Item removed from itinerary.' });
});

// Itineraries: Delete Itinerary
itinerariesRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  dbRun('DELETE FROM itineraries WHERE id = ? AND user_id = ?', [id, req.user!.id]);
  return res.json({ message: 'Itinerary deleted successfully.' });
});
