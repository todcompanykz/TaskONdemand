-- ============================================
-- SEED DATA for TaskONdemand
-- Run: docker exec tod-postgres psql -U postgres -d tod -f /seed.sql
-- ============================================

-- Extra users (bcrypt hash of "Test1234!")
INSERT INTO users (email, password, "firstName", "lastName", "phoneNumber") VALUES
  ('aibek.dzhaksybekov@mail.ru',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Айбек',     'Джаксыбеков',  '+77011112233'),
  ('dana.seitkali@gmail.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Дана',      'Сейткали',     '+77022223344'),
  ('nursultan.bekov@mail.kz',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Нурсултан', 'Беков',        '+77033334455'),
  ('ainur.mambetova@gmail.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Айнур',     'Мамбетова',    '+77044445566'),
  ('yerlan.abenov@bk.ru',         '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ерлан',     'Абенов',       '+77055556677')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- TASKS — Астана (71.4304°E, 51.1694°N)
-- ============================================
DO $$
DECLARE
  u1 UUID := (SELECT id FROM users WHERE email = 'aibek.dzhaksybekov@mail.ru');
  u2 UUID := (SELECT id FROM users WHERE email = 'dana.seitkali@gmail.com');
  u3 UUID := (SELECT id FROM users WHERE email = 'nursultan.bekov@mail.kz');
  u4 UUID := (SELECT id FROM users WHERE email = 'ainur.mambetova@gmail.com');
  u5 UUID := (SELECT id FROM users WHERE email = 'yerlan.abenov@bk.ru');
  raim UUID := (SELECT id FROM users WHERE email = 'raim@gmail.com');
  saya UUID := (SELECT id FROM users WHERE email = 'saya@gmail.com');
BEGIN

-- CREATED tasks (open)
INSERT INTO tasks ("shortDescription","fullDescription",reward,city,address,"geoPoint",urgency,status,"createdById","expiresAt") VALUES
(
  'Очистка снега у дома',
  'Нужно почистить снег у подъезда и прилегающей территории. Лопата есть. Работа на 1–2 часа.',
  5000,
  'Астана',
  'ул. Достык 14',
  ST_SetSRID(ST_MakePoint(71.4304, 51.1694), 4326),
  'high',
  'created',
  u1,
  NOW() + INTERVAL '12 hours'
),
(
  'Доставка продуктов пожилой соседке',
  'Купить список продуктов в ближайшем Magnum и доставить на 5-й этаж. Список дам лично.',
  3000,
  'Астана',
  'пр. Республики 22',
  ST_SetSRID(ST_MakePoint(71.4412, 51.1801), 4326),
  'medium',
  'created',
  u2,
  NOW() + INTERVAL '6 hours'
),
(
  'Помощь с переездом — вынос мебели',
  'Нужно вынести диван, стол и несколько коробок на 1-й этаж. Лифт есть. 2–3 часа работы.',
  12000,
  'Астана',
  'ул. Кенесары 55',
  ST_SetSRID(ST_MakePoint(71.4198, 51.1602), 4326),
  'high',
  'created',
  u3,
  NOW() + INTERVAL '48 hours'
),
(
  'Ремонт велосипеда',
  'Спустило колесо, нужно заменить камеру. Велосипед взрослый, камера куплена.',
  1500,
  'Астана',
  'ул. Сейфуллина 8',
  ST_SetSRID(ST_MakePoint(71.4350, 51.1720), 4326),
  'low',
  'created',
  u4,
  NOW() + INTERVAL '72 hours'
),
(
  'Выгул собаки (хаски)',
  'Нужно выгулять хаски 1 час. Собака дружелюбная, поводок и намордник есть.',
  2000,
  'Астана',
  'ул. Жубанова 3',
  ST_SetSRID(ST_MakePoint(71.4500, 51.1650), 4326),
  'medium',
  'created',
  u5,
  NOW() + INTERVAL '4 hours'
),

-- CLAIMED tasks (in progress)
(
  'Установка карниза и штор',
  'Повесить 3 карниза в комнатах. Дрель и дюбели есть. Шторы куплены.',
  4000,
  'Астана',
  'ул. Алматы 120',
  ST_SetSRID(ST_MakePoint(71.4600, 51.1900), 4326),
  'medium',
  'claimed',
  raim,
  NOW() + INTERVAL '24 hours'
),
(
  'Репетитор по математике (9 класс)',
  'Подготовка к ЕНТ, алгебра и геометрия. Одно занятие 1.5 часа онлайн или офлайн.',
  8000,
  'Астана',
  'мкр. Левый берег',
  ST_SetSRID(ST_MakePoint(71.4700, 51.1750), 4326),
  'high',
  'claimed',
  saya,
  NOW() + INTERVAL '36 hours'
),

-- COMPLETED tasks
(
  'Перевод документа с русского на казахский',
  'Перевести заявление на 2 страницы. Срочно, нужен нотариально заверенный перевод.',
  6000,
  'Астана',
  'пр. Абая 5',
  ST_SetSRID(ST_MakePoint(71.4280, 51.1680), 4326),
  'high',
  'completed',
  u1,
  NOW() - INTERVAL '1 day'
),
(
  'Сборка мебели IKEA (стеллаж Billy)',
  'Собрать стеллаж Billy из IKEA. Все детали и инструкция есть.',
  3500,
  'Астана',
  'ул. Достык 89',
  ST_SetSRID(ST_MakePoint(71.4310, 51.1710), 4326),
  'low',
  'completed',
  u2,
  NOW() - INTERVAL '2 days'
);

-- ============================================
-- TASKS — Алматы (76.9286°E, 43.2565°N)
-- ============================================
INSERT INTO tasks ("shortDescription","fullDescription",reward,city,address,"geoPoint",urgency,status,"createdById","expiresAt") VALUES
(
  'Фотосессия для портфолио',
  'Нужен фотограф на 2 часа в парке Горького. Уличная и портретная съёмка.',
  15000,
  'Алматы',
  'Центральный парк',
  ST_SetSRID(ST_MakePoint(76.9286, 43.2565), 4326),
  'medium',
  'created',
  u3,
  NOW() + INTERVAL '3 days'
),
(
  'Срочный ремонт смесителя',
  'Течёт кран на кухне. Нужен сантехник. Инструменты можно взять у меня.',
  5000,
  'Алматы',
  'ул. Байзакова 280',
  ST_SetSRID(ST_MakePoint(76.9100, 43.2500), 4326),
  'high',
  'created',
  u4,
  NOW() + INTERVAL '8 hours'
),
(
  'Настройка домашнего роутера',
  'Нужно настроить Wi-Fi роутер TP-Link, создать гостевую сеть и ограничить скорость.',
  2500,
  'Алматы',
  'мкр. Алмагуль',
  ST_SetSRID(ST_MakePoint(76.8900, 43.2400), 4326),
  'low',
  'claimed',
  u5,
  NOW() + INTERVAL '12 hours'
),
(
  'Курьер — доставка документов',
  'Забрать пакет с документами из офиса на Достык и отвезти в ЦОН. Оплата + такси.',
  4000,
  'Алматы',
  'пр. Достык 111',
  ST_SetSRID(ST_MakePoint(76.9500, 43.2600), 4326),
  'high',
  'completed',
  raim,
  NOW() - INTERVAL '3 days'
),

-- ============================================
-- TASKS — Шымкент (69.5952°E, 42.3167°N)
-- ============================================
(
  'Помощь на огороде (посадка)',
  'Посадить рассаду томатов и перца. Работа 3–4 часа. Всё необходимое есть.',
  6000,
  'Шымкент',
  'пос. Арысь',
  ST_SetSRID(ST_MakePoint(69.5952, 42.3167), 4326),
  'medium',
  'created',
  saya,
  NOW() + INTERVAL '5 days'
),
(
  'Малярные работы в 1 комнате',
  'Покраска стен в спальне (15 кв.м). Краска и валики есть. Работа 1 день.',
  20000,
  'Шымкент',
  'ул. Таuke Хана 45',
  ST_SetSRID(ST_MakePoint(69.6100, 42.3200), 4326),
  'low',
  'created',
  u1,
  NOW() + INTERVAL '7 days'
);

-- Update claimed tasks with executors
UPDATE tasks SET
  "claimedById" = u2,
  "updatedAt" = NOW() - INTERVAL '2 hours'
WHERE "shortDescription" = 'Установка карниза и штор';

UPDATE tasks SET
  "claimedById" = u3,
  "updatedAt" = NOW() - INTERVAL '5 hours'
WHERE "shortDescription" = 'Репетитор по математике (9 класс)';

UPDATE tasks SET
  "claimedById" = u4,
  "customerConfirmed" = true,
  "executorConfirmed" = true,
  "updatedAt" = NOW() - INTERVAL '1 day'
WHERE "shortDescription" = 'Перевод документа с русского на казахский';

UPDATE tasks SET
  "claimedById" = u5,
  "customerConfirmed" = true,
  "executorConfirmed" = true,
  "updatedAt" = NOW() - INTERVAL '2 days'
WHERE "shortDescription" = 'Сборка мебели IKEA (стеллаж Billy)';

UPDATE tasks SET
  "claimedById" = u1,
  "customerConfirmed" = true,
  "executorConfirmed" = true,
  "updatedAt" = NOW() - INTERVAL '3 days'
WHERE "shortDescription" = 'Курьер — доставка документов';

UPDATE tasks SET
  "claimedById" = raim,
  "updatedAt" = NOW() - INTERVAL '1 hour'
WHERE "shortDescription" = 'Настройка домашнего роутера';

END $$;

-- Verify
SELECT status, COUNT(*) AS cnt FROM tasks GROUP BY status ORDER BY status;
SELECT city, COUNT(*) AS cnt FROM tasks GROUP BY city ORDER BY city;
