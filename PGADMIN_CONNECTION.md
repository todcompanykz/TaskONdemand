# Инструкция по подключению к PostgreSQL в pgAdmin

## Текущие настройки подключения

- **Host:** `localhost` (или `127.0.0.1`)
- **Port:** `5432`
- **Database:** `tod` (для работы с приложением) или `postgres` (системная БД)
- **Username:** `postgres`
- **Password:** `postgres` (по умолчанию)

## Пошаговая инструкция

### 1. Создание нового сервера в pgAdmin

1. Откройте pgAdmin 4
2. В левой панели найдите "Servers"
3. Правой кнопкой мыши на "Servers" → "Create" → "Server..."

### 2. Настройка подключения

#### Вкладка "General"
- **Name:** `PostgreSQL 18` (или любое удобное имя)

#### Вкладка "Connection"
- **Host name/address:** `localhost`
- **Port:** `5432`
- **Maintenance database:** `postgres` (для первого подключения)
- **Username:** `postgres`
- **Password:** `postgres`
- ✅ **Save password:** включите галочку

#### Вкладка "Advanced" (опционально)
- Можно оставить по умолчанию

#### Вкладка "SSL" (опционально)
- Можно оставить по умолчанию

### 3. Сохранение и подключение

1. Нажмите кнопку **"Save"**
2. Если подключение успешно, сервер появится в списке с зеленым индикатором

### 4. Просмотр таблиц

После подключения:

1. Разверните сервер → **"Databases"**
2. Найдите базу данных **`tod`** (не `postgres`!)
3. Разверните `tod` → **"Schemas"** → **"public"** → **"Tables"**
4. Вы увидите таблицы:
   - `users` - пользователи приложения
   - `tasks` - задачи
   - `spatial_ref_sys` - системная таблица PostGIS

### 5. Проверка подключения

Для проверки можно выполнить простой запрос:

```sql
SELECT COUNT(*) FROM users;
```

Должен вернуться результат (сейчас в базе 1 пользователь).

## Устранение проблем

### Проблема: "Connection refused" или "Could not connect to server"

**Решение:**
1. Проверьте, что контейнер PostgreSQL запущен:
   ```bash
   docker compose ps postgres
   ```
2. Проверьте, что порт 5432 открыт:
   ```bash
   docker compose port postgres 5432
   ```
3. Убедитесь, что используете `localhost`, а не IP контейнера

### Проблема: "Password authentication failed"

**Решение:**
1. Проверьте пароль в `.env` файле (если используется)
2. По умолчанию пароль: `postgres`
3. Можно сбросить пароль через:
   ```bash
   docker compose exec postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"
   ```

### Проблема: Не вижу базу данных `tod`

**Решение:**
1. Обновите список баз данных: правой кнопкой на сервере → "Refresh"
2. Убедитесь, что подключены к правильному серверу
3. Проверьте, что база существует:
   ```bash
   docker compose exec postgres psql -U postgres -l
   ```

### Проблема: Не вижу таблицы в базе `tod`

**Решение:**
1. Убедитесь, что смотрите в правильной схеме: `tod` → `Schemas` → `public` → `Tables`
2. Обновите список таблиц: правой кнопкой на "Tables" → "Refresh"
3. Проверьте, что таблицы существуют:
   ```bash
   docker compose exec postgres psql -U postgres -d tod -c "\dt"
   ```

## Альтернативный способ: строка подключения

Можно использовать строку подключения в pgAdmin:

```
postgresql://postgres:postgres@localhost:5432/tod
```

## Текущее состояние базы данных

- **PostgreSQL версия:** 18.1
- **База данных:** `tod`
- **Пользователей в базе:** 1 (testtest@gmail.com)
- **Таблицы:** users, tasks, spatial_ref_sys
- **Views:** active_tasks, task_stats

## Полезные команды для проверки

```bash
# Проверить статус контейнера
docker compose ps postgres

# Проверить логи
docker compose logs postgres --tail 20

# Подключиться к базе через psql
docker compose exec postgres psql -U postgres -d tod

# Список всех баз данных
docker compose exec postgres psql -U postgres -l

# Список таблиц в базе tod
docker compose exec postgres psql -U postgres -d tod -c "\dt"
```
