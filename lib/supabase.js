import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase клиента
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Сохранение или обновление пользователя в Supabase
export async function saveUserToSupabase(userProfile) {
  try {
    const {
      id: telegram_id,
      first_name = '',
      last_name = '',
      username = '',
      photo_url = ''
    } = userProfile;

    // Попробуем обновить существующего пользователя
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegram_id)
      .single();

    if (existingUser) {
      // Обновляем существующего пользователя
      const { data, error } = await supabase
        .from('users')
        .update({
          first_name,
          last_name,
          username,
          photo_url,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', telegram_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user in Supabase:', error);
        throw error;
      }

      console.log('User updated in Supabase:', data);
      return data;
    } else {
      // Создаем нового пользователя
      const { data, error } = await supabase
        .from('users')
        .insert([{
          telegram_id,
          first_name,
          last_name,
          username,
          photo_url,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating user in Supabase:', error);
        throw error;
      }

      console.log('New user created in Supabase:', data);
      return data;
    }
  } catch (error) {
    console.error('Error in saveUserToSupabase:', error);
    throw new Error(`Failed to save user to Supabase: ${error.message}`);
  }
}

// Получение пользователя по Telegram ID
export async function getUserByTelegramId(telegramId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = не найдено
      console.error('Error getting user from Supabase:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserByTelegramId:', error);
    return null;
  }
}

// Получение статистики пользователей
export async function getUserStats() {
  try {
    // Общее количество пользователей
    const { count: totalUsers, error: totalError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Пользователи, которые заходили сегодня
    const today = new Date().toISOString().split('T')[0];
    const { count: todayLogins, error: todayError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', `${today}T00:00:00.000Z`)
      .lt('last_login', `${today}T23:59:59.999Z`);

    if (todayError) throw todayError;

    // Новые пользователи сегодня
    const { count: newToday, error: newError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (newError) throw newError;

    return {
      total_users: totalUsers || 0,
      today_logins: todayLogins || 0,
      new_today: newToday || 0
    };
  } catch (error) {
    console.error('Error getting user stats from Supabase:', error);
    return { total_users: 0, today_logins: 0, new_today: 0 };
  }
}

// Получение всех пользователей (для админки)
export async function getAllUsers(limit = 100, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error getting all users from Supabase:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
}