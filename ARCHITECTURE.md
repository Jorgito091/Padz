**ARCHITECTURE — Padz**

Última revisión: 2026-05-27

Resumen
------
- Tipo: Monorepo con Backend monolítico y Frontend SPA
- Backend: TypeScript, Express, Prisma, Socket.io
- Frontend: React, Vite, Tailwind
- DB: PostgreSQL (Prisma)
- Orquestación: Docker Compose (dev) + GitHub Actions (CI)

Diagrama de alto nivel
----------------------

```mermaid
flowchart TB
  A[User Browser] -->|HTTP| F[Frontend (NGINX)]
  A -->|WebSocket| B[Backend (Express + Socket.io)]
  F -->|REST| B
  B -->|SQL| D[(Postgres)]
  subgraph CI
    G[GitHub Actions]
  end
```

Componentes y responsabilidades
--------------------------------
- Front/: UI y cliente (Vite build → Nginx runtime). Consume API REST y WS.
- Back/: API REST, WebSocket server, auth, business logic, Prisma client.
- DB: Postgres, migraciones versionadas en `Back/prisma/migrations`.
- CI: `.github/workflows/ci.yml` — build, generate prisma client, apply migrations, build front.

Flujos críticos
--------------

- Autenticación: login → JWT access token (short) + refresh token (stored hashed in DB). Endpoints: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/register`, `/api/auth/profile`.
- Realtime: Socket.io rooms by board and user. Backend emite eventos desde controladores usando `req.app.get('io')`.

Decisiones de diseño
---------------------
- Monolito backend para simplicidad de desarrollo y despliegue (una única base de código y despliegue). Escalado vertical y, en futuro, separación por bounded contexts si necesidad de microservicios.
- Prisma como ORM por migraciones tipo SQL-first y cliente tipado.
- JWT + refresh token diseñado con rotación y revocación persistida en BD (modelo `RefreshToken`).

Patrones observados
-------------------
- Controllers + Routes: cada endpoint con su controller y rutas.
- Centralized error handling: `AppError` + `errorHandler`.
- Validation layer: Zod schemas + `validate` middleware.
- Async wrapper: `catchAsync` util para callbacks async.

Puntos de integración
---------------------
- `Front/src/services/api.ts` — axios configurado para consumir la API.
- `Back/entrypoint.sh` — aplica migraciones al levantar en contenedor.
- CI ejecuta `npx prisma migrate deploy` para aplicar migraciones en entornos.

Dependencias críticas
---------------------
- Prisma — migraciones y cliente
- PostgreSQL — base de datos principal
- Socket.io — realtime
- express-rate-limit / helmet — seguridad básica

Escalabilidad y límites
----------------------
- Actualmente monolito: escalar backend mediante réplicas y balanceador o migrar a microservicios.
- Socket.io puede requerir sticky sessions o Redis adapter para escalado horizontal.

Notas y riesgos
---------------
- Falta de tests automatizados; CI no valida lógica funcional.
- Observabilidad limitada — no hay pino/sentry/metrics integrados.
- Secrets en CI/compose deben moverse a secret managers.

Referencias a código
--------------------
- Entry point backend: [Back/src/server.ts](Back/src/server.ts#L1)
- Auth controller: [Back/src/controllers/authController.ts](Back/src/controllers/authController.ts#L1)
- Prisma schema: [Back/prisma/schema.prisma](Back/prisma/schema.prisma#L1)

TODO / verificación
-------------------
- Verificar que todas las migraciones en `Back/prisma/migrations` cubren el esquema actual (especialmente `RefreshToken`).
- Añadir diagramas de despliegue (Kubernetes / cloud) si se pretende producción.
