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

## Recomendaciones y mejoras sugeridas

- Tests automatizados: Añadir suites de pruebas unitarias e integración (Jest/ Vitest + supertest) para controlar regresiones en la API y lógica crítica.
- CI: Pipeline (GitHub Actions) que ejecute lint, build y tests; y que despliegue migraciones en entornos de staging.
- Secrets: Añadir ejemplo `env.example` y no subir `.env`. Considerar `dotenv-flow` o `vault` en producción.
- Types & runtime: Migrar `type: commonjs` a ESM si se planea aprovechar módulos modernos y mejoras en tree-shaking.
- Seguridad: Implementar rate-limiting, validación intensiva de inputs (zod/yup) y escapar/filtrar datos en consultas.
- Escalabilidad Socket: Revisar estrategia de pub/sub (Redis adapter) si hay múltiples instancias del backend.
- Observabilidad: Añadir logs estructurados (pino/winston) y métricas básicas (Prometheus) para monitoreo.

## Tareas recomendadas a corto plazo

1. Añadir `env.example` con todas las variables esperadas.
2. Añadir scripts de tests y un `Dockerfile` para el backend si se va a desplegar en contenedores.
3. Añadir una tarea de seed idempotente para entornos de desarrollo.
4. Añadir validaciones con `zod` en las rutas públicas.

## Qué hice en este cambio

- Documenté la estructura y los comandos básicos para desarrollo.
- Listé mejoras priorizadas y tareas a corto plazo.

---

Si quieres, puedo:

- Añadir `env.example` automáticamente.
- Crear un archivo `CONTRIBUTING.md` con flujo de trabajo y reglas.
- Crear un `Dockerfile` para el backend y añadir servicio en `docker-compose`.

Dime cuál de estas acciones quieres que haga a continuación.

