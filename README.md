# Beauty Hours — учёт рабочих часов

Telegram Mini App для учёта рабочего времени сотрудников бьюти-сферы.
Сотрудники отмечают смены (дата + время с–до). Админ видит сводку по
неделям/месяцам и выгружает Excel/PDF.

## Стек
- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4 (тёплая палитра — кремовый, пудровый, какао)
- Prisma + Postgres
- Авторизация через Telegram `initData` (HMAC) + JWT в httpOnly cookie
- ExcelJS, pdfkit — для экспорта

## Локальный запуск

```bash
cp .env.example .env
# заполните DATABASE_URL, TELEGRAM_BOT_TOKEN, ADMIN_TELEGRAM_IDS, SESSION_SECRET
npm install
npx prisma migrate dev --name init
npm run dev
```

Открыть напрямую в браузере приложение **не получится** — для авторизации
нужен `initData` от Telegram. Тестировать через бота (см. ниже).

## Деплой на Railway

1. Создайте новый проект на [railway.app](https://railway.app).
2. Подключите этот репозиторий или загрузите код.
3. Добавьте **Postgres plugin** — Railway автоматически выставит `DATABASE_URL`.
4. В переменных окружения сервиса добавьте:
   - `TELEGRAM_BOT_TOKEN` — токен бота из @BotFather
   - `ADMIN_TELEGRAM_IDS` — ваш Telegram ID (узнать у @userinfobot). Можно
     несколько через запятую.
   - `SESSION_SECRET` — случайная строка ≥32 символов (`openssl rand -hex 32`)
   - `NEXT_PUBLIC_APP_URL` — публичный URL сервиса на Railway
5. Build команда из `railway.json` сам запустит миграции Prisma и сборку.

## Подключение Telegram-бота

1. В @BotFather:
   - `/newbot` → получите токен → в `TELEGRAM_BOT_TOKEN`
   - `/newapp` → выберите бота → задайте URL сервиса на Railway
     (`https://your-app.up.railway.app`) → получите ссылку `t.me/YourBot/yourApp`
2. (Опционально) `/setmenubutton` → задайте URL мини-приложения.
3. Откройте ссылку в Telegram — приложение залогинит вас автоматически.

## Модель данных

```
User:  id, telegramId, firstName, lastName, username, photoUrl, role, createdAt
Shift: id, userId, date, startMin, endMin, note, createdAt, updatedAt
```

Время хранится в минутах от начала суток. Если `endMin <= startMin`
смена считается переходящей через полночь.

## API

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| POST | `/api/auth` | public | Проверка initData, выдача cookie |
| GET | `/api/shifts?from&to&userId?` | user / admin | Смены за период |
| POST | `/api/shifts` | user / admin | Создать смену |
| PATCH | `/api/shifts/:id` | owner / admin | Изменить |
| DELETE | `/api/shifts/:id` | owner / admin | Удалить |
| GET | `/api/users` | admin | Сотрудники + итоги месяца |
| GET | `/api/reports/summary?userId&from&to` | user / admin | Сводка часов |
| GET | `/api/reports/export?format=xlsx\|pdf&userId&from&to` | admin | Экспорт |

## Экраны

- `/home` — главная сотрудника: текущая неделя, итог часов, плитки дней.
- `/shift?date=…` — добавить/редактировать смены за день.
- `/stats` — статистика за неделю или месяц.
- `/admin` — список сотрудников (только админ).
- `/admin/[userId]` — карточка сотрудника + экспорт Excel/PDF.

## Дизайн

Палитра: `#FBF6F1` фон, `#D4A29C` пудровый акцент, `#7A4B43` какао,
`#E8C9B9` персик, `#A8B89A` шалфей. Заголовки — *Cormorant Garamond*,
основной UI — Inter. Скругления 16–20 px, мягкие тени.
