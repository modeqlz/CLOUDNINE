# CLOUDNINE

Telegram App - мобильный маркет скинов

Готовый экран входа «Заходи через Telegram» + валидация WebApp initData на сервере и страница профиля.
Оптимизировано под Vercel.

## Быстрый старт локально
```bash
cp .env.example .env.local   # укажи BOT_TOKEN от BotFather
npm i
npm run dev
```
Открой http://localhost:3000 — увидишь точный экран логина.
Кнопка **Continue** в браузере без Telegram ведёт в `/profile?demo=1` (демо-превью).

## Переменные окружения
- `BOT_TOKEN` — токен бота (обязателен для реальной валидации на сервере).

## Деплой на Vercel
1. Залей в GitHub, импортируй репо в Vercel.
2. В Project Settings → **Environment Variables** добавь `BOT_TOKEN` (Production/Preview).
3. Деплой. Укажи продакшен-URL в настройках бота как WebApp.

## Страницы
- `/` — экран логина (как в макете).
- `/profile` — карточка профиля (берёт данные из sessionStorage после успешной проверки initData; есть режим `?demo=1`).

## Как работает авторизация
Клиент отправляет `window.Telegram.WebApp.initData` в `/api/auth/telegram`,
сервер валидирует подпись по правилам Mini Apps и отдаёт профиль (id, имя, username, фото).

## Кастомизация
Правки дизайна — в `styles/globals.css`.
Иконка самолётика — `/public/plane.svg`.