# BACKUP STRATEGY

- Postgres backups: nightly snapshots + WAL archiving (production).
- For Docker Compose dev: use `pg_dump` to export DB before major changes.
- Retention: keep 30 days by default; configurable per environment.

Example manual dump:
```bash
PGPASSWORD=password pg_dump -h localhost -U postgres padz > padz-$(date +%F).sql
```
