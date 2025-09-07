// pages/api/admin/users.js
import { getAllUsers, getUserStats } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  // Простая проверка доступа (в продакшене нужна более серьезная авторизация)
  const adminKey = req.headers.authorization?.replace('Bearer ', '');
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const { action = 'list', limit = 100, offset = 0 } = req.query;

      if (action === 'stats') {
        // Получение статистики
        const stats = await getUserStats();
        return res.status(200).json({ success: true, stats });
      } else if (action === 'list') {
        // Получение списка пользователей
        const users = await getAllUsers(parseInt(limit), parseInt(offset));
        return res.status(200).json({ success: true, users, count: users.length });
      } else {
        return res.status(400).json({ error: 'Invalid action parameter' });
      }
    } else {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}