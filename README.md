# POS-System

Monorepo parent for POS Admin (back-office) and POS Dev / pos-app (cashier app).

## Structure

```
POS-System/
  docker-compose.yml
  pos-admin/   (Next.js 16 + Prisma, admin API under app/api/admin/*)
  pos-app/     (Next.js 16 + Zustand, cashier/dev app)
```

Both apps share ONE Postgres database (`pos`) — their `prisma/schema.prisma`
files are byte-identical and both `.env` files pointed to
`postgresql://postgres:@localhost:5432/pos`. They do not depend on each other
code-wise; they only share tables.

## Services (docker-compose.yml)

| Service    | Container    | Host URL            | Internal |
|------------|--------------|---------------------|----------|
| postgres   | pos-postgres | localhost:5432      | postgres:5432 |
| pos-admin  | pos-admin    | http://localhost:3001 | :3000 |
| pos-app    | pos-app      | http://localhost:3002 | :3000 |

DB credentials: user `postgres` / password `postgres` / db `pos`.
App containers use `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pos?schema=public`.
Local (non-Docker) dev keeps the old `.env` (`postgresql://postgres:@localhost:5432/pos`);
originals backed up as `pos-admin/.env.backup` and `pos-app/.env.backup`.

## Commands

```bash
cd "C:\Users\Apri Laksono\POS-System"
docker compose up -d --build   # build + start all
docker compose ps              # status
docker compose logs -f         # all logs
docker compose logs -f pos-admin
docker compose logs -f pos-app
docker compose stop            # stop (keep data)
docker compose start           # start again
docker compose down            # stop + remove containers (keeps pos-pgdata volume)
docker compose down -v         # ⚠ also deletes database data
docker compose build --no-cache pos-admin   # rebuild one service
```

Requires Docker Desktop (Docker Engine + Compose v2). Not currently installed
on this machine — install it, then run the commands above. No `docker` binary
was found, so containers could not be built/verified here.
