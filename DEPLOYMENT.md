# DEPLOYMENT — Padz

Última revisión: 2026-05-27

Despliegue local (development)
-------------------------------
Requisitos: Docker, Docker Compose

```bash
# Desde la raíz del repo
docker-compose up -d

# Backend (dev sin contenedor)
cd Back
npm install
# crear .env con DATABASE_URL y JWT_SECRET
npx prisma migrate dev
npm run dev

# Frontend (dev)
cd Front
npm install
npm run dev
```

Despliegue de producción (sugerido)
---------------------------------
Se recomienda usar infraestructura gestionada (ECS / EKS / GKE / Azure AKS) y servicios gestionados para Postgres.

Opciones:
- Contenedores + Load Balancer + Autoscaling
- Usar RDS / Cloud SQL para Postgres con backups automáticos
- Usar Secret Manager para `JWT_SECRET` y DB credentials

Dockerfile notas
-----------------
- `Back/Dockerfile` es multi-stage: build en node:22, runtime node:22 y ejecuta `entrypoint.sh`.
- `entrypoint.sh` ejecuta `npx prisma migrate deploy` antes de arrancar.

CI/CD
-----
- `.github/workflows/ci.yml` construye Back y Front, genera cliente Prisma y ejecuta `npx prisma migrate deploy` en runner.
- Recomendación: separar pipeline de build/canary/deploy y usar `migrate deploy` solo en entorno controlado con backups.

Rollback
--------
- Mantener snapshots/backups de la DB antes de aplicar migraciones en producción.
- Strategy: blue/green o canary deploy para backend, asegurando compatibilidad con schema previo (backward compatible migrations).

Checklist pre-deploy (resumen)
-----------------------------
- Backup DB
- Ejecutar `prisma migrate status` contra target
- Verificar secrets en Secret Manager
- Ejecutar smoke tests

Referencias
----------
- Docker Compose: `docker-compose.yml`
- Backend Dockerfile: `Back/Dockerfile`
- Entrypoint: `Back/entrypoint.sh`
