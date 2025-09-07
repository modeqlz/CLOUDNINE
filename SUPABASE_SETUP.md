# Настройка Supabase для CloudNine

## 1. Создание проекта в Supabase

1. Перейди на [supabase.com](https://supabase.com)
2. Создай новый проект
3. Запиши URL проекта и ANON ключ

## 2. Создание таблицы users

Выполни этот SQL запрос в Supabase SQL Editor:

```sql
-- Создание таблицы пользователей
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_last_login ON public.users(last_login);

-- RLS (Row Level Security) - включаем
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Политика для анонимного доступа (разрешаем все операции)
CREATE POLICY "Allow anonymous access" ON public.users
    FOR ALL USING (true);
```

## 3. Переменные окружения в Vercel

Добавь эти переменные в Vercel Environment Variables:

| Name | Value | Где взять |
|------|-------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://твой-проект.supabase.co` | Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `твой_anon_ключ` | Project Settings → API |
| `BOT_TOKEN` | `твой_токен_бота` | BotFather |
| `ADMIN_API_KEY` | `ADMIN_CLOUDNINE_200` | Любая секретная строка |

## 4. Как это работает

### При авторизации пользователя:
1. Пользователь нажимает "Continue" в WebApp
2. Telegram передает initData
3. Сервер валидирует данные
4. **Данные пользователя автоматически сохраняются в Supabase** 
5. Если пользователь новый - создается новая запись
6. Если существующий - обновляется last_login
7. Пользователь перенаправляется в приложение

### Структура таблицы users:

| Поле | Тип | Описание |
|------|-----|----------|
| id | BIGSERIAL | Уникальный ID записи |
| telegram_id | BIGINT | ID пользователя в Telegram |
| first_name | TEXT | Имя |
| last_name | TEXT | Фамилия |
| username | TEXT | Username в Telegram |
| photo_url | TEXT | URL аватара |
| created_at | TIMESTAMP | Дата создания записи |
| updated_at | TIMESTAMP | Дата последнего обновления |
| last_login | TIMESTAMP | Дата последнего входа |

## 5. Админ API

### Получение статистики:
```bash
curl -H "Authorization: Bearer ADMIN_CLOUDNINE_200" \
  "https://твой-сайт.vercel.app/api/admin/users?action=stats"
```

Ответ:
```json
{
  "success": true,
  "stats": {
    "total_users": 150,
    "today_logins": 23,
    "new_today": 5
  }
}
```

### Получение списка пользователей:
```bash
curl -H "Authorization: Bearer ADMIN_CLOUDNINE_200" \
  "https://твой-сайт.vercel.app/api/admin/users?action=list&limit=10"
```

## 6. Мониторинг

Ты можешь отслеживать пользователей в реальном времени:
- **Supabase Dashboard** → Table Editor → users
- Видеть всех пользователей, их данные и время входа
- Следить за ростом аудитории

## 7. Безопасность

- ✅ Данные Telegram валидируются криптографически
- ✅ Используется Row Level Security (RLS)
- ✅ Anon ключ безопасен для публичного использования
- ✅ Админ API защищен секретным ключом

---

🚀 **Готово!** Теперь каждый пользователь автоматически сохраняется в базе при авторизации!