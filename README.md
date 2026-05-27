# Padz — Documentación del proyecto

Este repositorio contiene la aplicación Padz (clone tipo Trello). A continuación se documenta la estructura del proyecto, cómo ejecutar el backend y frontend, la configuración de la base de datos y recomendaciones de mejora.

## Resumen rápido
- Backend: [Back](Back/) — API en TypeScript con Express + Prisma + Socket.io.
- Frontend: [Front](Front/) — SPA con React, Vite y Tailwind.
- Orquestación: `docker-compose.yml` en raíz para levantar servicios (Postgres principalmente).

## Estructura del repositorio

- `Back/` — Código del servidor
	- `src/` — Código TypeScript (controladores, rutas, middleware, utils)
	- `prisma/` — Esquema y migraciones de Prisma
	- `seed_test_user.js` — Script de seed para pruebas
	- `package.json` — scripts: `dev`, `build`, `start`

- `Front/` — Aplicación cliente (Vite + React)
	- `src/` — componentes, páginas, hooks, context
	- `package.json` — scripts: `dev`, `build`

- `docker-compose.yml` — Configuración para servicios (Postgres)
- `README.md` — Este fichero

## Requisitos

- Node.js v18+ (recomendado)
- npm o pnpm
- Docker & Docker Compose (para la base de datos en desarrollo/CI)

## Cómo ejecutar en desarrollo

1) Levantar dependencias (desde la raíz):

```bash
docker-compose up -d
```

2) Backend

```bash
cd Back
npm install
# crear .env con al menos:
# DATABASE_URL=postgresql://<user>:<pass>@localhost:5432/<db>?schema=public
# JWT_SECRET=alguna_clave

# correr migraciones
npx prisma migrate dev

# iniciar en desarrollo (recarga automática)
npm run dev
```

3) Frontend

```bash
cd Front
npm install
npm run dev
```

4) Seeds / pruebas

```bash
cd Back
node seed_test_user.js
```

## Scripts principales

- Backend (`Back/package.json`):
	- `dev`: `ts-node-dev --respawn --transpile-only src/server.ts`
	- `build`: `tsc`
	- `start`: `node dist/server.ts`

- Frontend (`Front/package.json`):
	- `dev`: `vite`
	- `build`: `tsc && vite build`

## Base de datos y Prisma

- Esquema en `Back/prisma/schema.prisma` y migraciones en `Back/prisma/migrations/`.
- Para desarrollar: usar `npx prisma migrate dev` que aplicará migraciones y actualizará `prisma/client`.

## Desarrollo en contenedores (opcional)

- El `docker-compose.yml` permite levantar una instancia de Postgres para desarrollo. Asegúrate de ajustar `DATABASE_URL` acorde al servicio levantado.

## Notas de arquitectura

- Autenticación: JWT (revisar `Back/src/controllers/authController.ts` y `Back/src/middleware/authMiddleware.ts`).
- Realtime: Socket.io integrado en backend y cliente (`socket.io-client`).
- ORM: Prisma 5 con migraciones versionadas.

Tereas proximas 
Rate-limiting + helmet: alta, esfuerzo medio. Añadir helmet y un rate-limiter (express-rate-limit) en server.ts.
Refresh tokens y política de contraseñas: alta, esfuerzo medio‑alto. Implementar refresh tokens seguros y checks de fuerza / expiración y revocación.
CI: tests y scan: alta, esfuerzo medio. Pipeline (GitHub Actions) que ejecute lint, build, tests y escanee dependencias (Dependabot/Snyk).
Logs y auditoría: media, esfuerzo medio. Añadir logging estructurado (pino/winston) y auditoría de acciones críticas.
Validaciones adicionales: media, esfuerzo medio. Añadir zod para list, member, comment,

