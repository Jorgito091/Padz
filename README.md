# Padz

Proyecto Padz — tablero colaborativo (estilo Trello). Repositorio monorepo con `Back/` (API) y `Front/` (cliente SPA).

## Estado rápido
- Backend: TypeScript + Express + Prisma + Socket.io (`Back/`).
- Frontend: React + Vite + Tailwind (`Front/`).
- DB: PostgreSQL con migraciones gestionadas por Prisma (`Back/prisma/`).
- CI: GitHub Actions (`.github/workflows/ci.yml`).

## Badges
![build](https://img.shields.io/badge/build-pending-yellow)
![license](https://img.shields.io/badge/license-MIT-blue)

## Índice
- Instalación
- Ejecución local
- Migraciones y DB
- Variables de entorno
- Uso básico / API
  - Búsqueda avanzada: se añadió un endpoint `GET /api/cards/search` para filtrar tarjetas por texto, etiquetas (`labelIds` CSV), asignado, tablero y estado. También existe una UI en el cliente en la ruta `/search`.
- Arquitectura
- Despliegue
- Seguridad
- Tests
- Contribuir
- Roadmap
- Contacto

## Instalación
Requisitos:
- Node.js 18+ (o 22 en CI/producción)
- npm o pnpm
- Docker & Docker Compose (recomendado para Postgres)

Pasos rápidos:

```bash
# levantar servicios (Postgres)
docker-compose up -d

# backend
cd Back
npm install
# crear .env (ver sección Variables de entorno)
npx prisma migrate dev
npm run dev

# frontend (en otra terminal)
cd Front
npm install
npm run dev
```

## Variables de entorno mínimas
En `Back/.env` (ejemplo):

- `DATABASE_URL=postgresql://postgres:password@localhost:5432/padz?schema=public`
- `JWT_SECRET=your_jwt_secret`
- `ACCESS_TOKEN_EXPIRES_IN=15m`
- `REFRESH_TOKEN_EXPIRES_IN=7d`

No incluyas secretos en VCS; usa GitHub Secrets para CI/producción.

## Migraciones y base de datos
- Esquema: `Back/prisma/schema.prisma`.
- Migraciones: `Back/prisma/migrations/` (versionadas). Si añades un modelo nuevo en Prisma, ejecuta:

```bash
cd Back
npx prisma migrate dev --name describe_change
git add prisma/migrations
git commit -m "chore(prisma): add migration for X"
```

En producción y CI usamos `npx prisma migrate deploy`.

## Uso básico / API
Autenticación principal:
- `POST /api/auth/register` — registro
- `POST /api/auth/login` — login (access + refresh token)
- `POST /api/auth/refresh` — intercambia refresh token por nuevo access token
- `POST /api/auth/logout` — invalidar refresh token

Ejemplo de login (curl):

```bash
curl -X POST -H "Content-Type: application/json" http://localhost:3000/api/auth/login \
  -d '{"email":"test@example.com","password":"P4ssw0rd!"}'
```

Para detalles completos de endpoints, ver [API_REFERENCE.md](API_REFERENCE.md).

Documentación adicional:

- [API Reference](API_REFERENCE.md)
- [Architecture](ARCHITECTURE.md)

## Arquitectura
- Monolito con separación Front/Back.
- Backend expone REST API y Socket.io para eventos en tiempo real.
- ORM: Prisma con Postgres.

Diagrama de alto nivel (mermaid):

```mermaid
graph LR
  Front -->|HTTP| Back[Backend API]
  Front -->|Socket.io| Back
  Back --> Postgres[(Postgres)]
```

## Seguridad
- Se aplicaron medidas básicas: `helmet` y `express-rate-limit` en `Back/src/server.ts`.
- Sistema de refresh tokens con rotación y revocación (ver `Back/src/controllers/authController.ts`).
- Recomendaciones: habilitar HTTPS en producción, restringir CORS y usar GitHub Secrets.

## Despliegue
- CI ejecuta lint, build y despliegue.
- Dockerfiles en `Back/Dockerfile` y `Front/Dockerfile`.
- Entrypoint de `Back` ejecuta `npx prisma migrate deploy` antes de arrancar.

## Tests y lint
- Ejecuta en `Back`:

```bash
cd Back
npm run lint
npm run build
npm run test --if-present
```

## Contribuir
- Lee `CONTRIBUTING.md` para guía de PRs, convenciones de commit y revisión.

## Roadmap (resumen)
- Añadir logging estructurado y auditoría.
- Completar validaciones Zod para recursos.
- Añadir tests de integración/E2E para flujos críticos.



