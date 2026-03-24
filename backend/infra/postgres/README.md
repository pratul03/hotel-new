# PostgreSQL Database Initialization

## Connection Details
- Host: localhost
- Port: 5432
- Database: airbnb_dev
- User: airbnb_user
- Password: airbnb_password

## PgAdmin Access
- URL: http://localhost:5050
- Email: admin@airbnb.local
- Password: admin123

## Connection String
```
postgresql://airbnb_user:airbnb_password@localhost:5432/airbnb_dev
```

## Prisma Migrations

### First Time Setup
```bash
cd apps/api
pnpm prisma migrate dev --name init
```

### Generate Prisma Client
```bash
pnpm prisma generate
```

### View Database in Studio
```bash
pnpm prisma studio
```

## Backup & Restore

### Backup
```bash
pg_dump -U airbnb_user -d airbnb_dev > backup.sql
```

### Restore
```bash
psql -U airbnb_user -d airbnb_dev < backup.sql
```
