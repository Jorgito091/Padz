# API_REFERENCE — Padz API

Última revisión: 2026-05-27

Prefacio
-------
Los endpoints listados reflejan las rutas definidas en `Back/src/routes/` y los controladores en `Back/src/controllers/`.

## 📚 Contexto del Proyecto

- **Objetivo**: Padz es una aplicación colaborativa tipo Trello que permite gestionar tableros, listas y tarjetas con notificaciones en tiempo real.
- **Motivación**: Necesidad de una solución auto‑hosteada, segura y extensible sin depender de SaaS externos.
- **Estado actual**: 85 % de funcionalidades completadas, CI/CD configurado, Docker‑Compose funcional. Falta implementar despliegue a staging y tests de integración auth↔socket.
- **Tecnologías clave**: Backend Express 5 + TypeScript + Prisma, Frontend React 18 + Vite + TailwindCSS, PostgreSQL, Socket.io, JWT.
- **Riesgos principales**: desalineación de ramas `dev`/`main`, exposición accidental de secretos, migraciones de base de datos sin backups.

Base URL (desarrollo): http://localhost:3001/api

Autenticación
-------------
- El sistema usa JWT para `accessToken` y refresh tokens rotativos almacenados en la BD.
- Añadir cabecera: `Authorization: Bearer <accessToken>` para endpoints protegidos.

Endpoints principales
---------------------

**Auth**

- POST `/api/auth/register`
  - Body: `{ email, password, name }`
  - Validaciones: `password` mínimo 8 chars, must include upper/lower/digit/special
  - Response: `{ user, accessToken, refreshToken }` (201)

- POST `/api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ user, accessToken, refreshToken }`

- POST `/api/auth/refresh`
  - Body: `{ refreshToken }`
  - Response: `{ accessToken, refreshToken }` (rotación)

- POST `/api/auth/logout`
  - Body: `{ refreshToken }`
  - Response: 204

- PUT `/api/auth/profile`
  - Protected
  - Body: `{ name?, avatar? }`
  - Response: `{ user }`

**Boards** (protected — `authenticate` middleware)

**Advanced Search**

- GET `/api/cards/search` — búsqueda avanzada de tarjetas
  - Query params:
    - `q` (string, optional): texto libre para buscar en `title` o `description` (insensitive).
    - `labelIds` (string, optional): lista de `labelId` separados por comas (ej. `id1,id2`).
    - `assignedTo` (uuid, optional): filtrar tarjetas asignadas a `userId`.
    - `boardId` (uuid, optional): filtrar por `boardId` (se usa para limitar a un tablero).
    - `isDone` (string, optional): `true` o `false` para filtrar estado completado.
    - `page` (int, optional) y `limit` (int, optional): paginación.
  - Response: `{ data: Card[], meta: { total, page, limit } }`.
  - Ejemplo (curl):

```bash
curl -G "http://localhost:3001/api/cards/search" \
  --data-urlencode "q=bug" \
  --data-urlencode "labelIds=1111-2222-3333,4444-5555-6666" \
  --data-urlencode "boardId=aaaa-bbbb-cccc" \
  -H "Authorization: Bearer <accessToken>"
```
- DELETE `/api/boards/:id` — eliminar
- PATCH `/api/boards/:id/star` — toggle star
- PUT `/api/boards/reorder` — reordenar boards

**Lists** (protected)

- GET `/api/lists` — query por `boardId` en query
- POST `/api/lists` — crear list
- PUT `/api/lists/:id` — actualizar
- DELETE `/api/lists/:id` — eliminar

**Cards** (protected)

- POST `/api/cards` — crear carta
- PUT `/api/cards/:id` — actualizar
- DELETE `/api/cards/:id` — eliminar
- POST `/api/cards/assign` — asignar usuario a carta
- DELETE `/api/cards/unassign/:cardId/:userId` — desasignar

**Comments** (protected)

- POST `/api/comments` — crear comment `{ cardId, text }`
- GET `/api/comments/:cardId` — listar
- DELETE `/api/comments/:id` — eliminar

**Labels** (protected)

- GET `/api/labels/board/:boardId` — labels del board
- POST `/api/labels` — crear
- DELETE `/api/labels/:id`
- POST `/api/labels/assign` — asignar label a card
- DELETE `/api/labels/unassign/:cardId/:labelId`

**Members** (protected)

- POST `/api/members` — añadir miembro a board
- GET `/api/members/:boardId` — listar miembros
- PATCH `/api/members/role` — cambiar rol
- DELETE `/api/members/:boardId/:userId` — remover miembro

**Notifications** (protected)

- GET `/api/notifications` — listar
- PUT `/api/notifications/:id/read` — marcar leído
- DELETE `/api/notifications/:id` — eliminar

Errores frecuentes
------------------
- 400 Bad Request — validación Zod fallida
- 401 Unauthorized — token faltante/expirado
- 403 Forbidden — permisos insuficientes (roles aún básicos)
- 404 Not Found — recurso no existe

Ejemplo: login (curl)
---------------------
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Abc!1234"}'
```

Notas
-----
- Validaciones Zod en `Back/src/validation/`.
- Autorización basada en `userId` provisto por `authenticate` middleware.
