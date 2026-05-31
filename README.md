# Padz

[![](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT) [![](https://img.shields.io/badge/Node-20%2B-green.svg)](https://nodejs.org/) [![](https://img.shields.io/badge/PRISMA-5.22%2B-orange.svg)](https://www.prisma.io/) [![](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg)](https://reactjs.org/) 

---

## 📖 Descripción

**Padz** es una aplicación tipo *Trello* para gestión de tableros y tarjetas. Permite crear tableros, listas y tarjetas, asignar usuarios, etiquetar, comentar y recibir notificaciones en tiempo real mediante WebSockets.

---

## ✨ Características principales

- **Autenticación segura con JWT** y refresco de tokens.
- **Roles y permisos** a nivel de tablero (propietario, miembro, visor).
- **WebSocket** para notificaciones instantáneas.
- **Arrastrar y soltar** tarjetas con `@dnd-kit`.
- **Diseño premium**: modo oscuro, glassmorphism, animaciones con Framer Motion y iconos de Lucide.
- **API REST** documentada con Swagger.
- **Pruebas unitarias** y **e2e** con Jest y Cypress.
- **CI/CD** con GitHub Actions y despliegue Docker‑Compose.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|------|--------------|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, Framer Motion, Lucide‑React, socket.io‑client |
| **Backend** | Express, TypeScript, Prisma, PostgreSQL, socket.io, Zod, Helmet, Rate‑limit |
| **Base de datos** | PostgreSQL (Docker) |
| **Infraestructura** | Docker, Docker‑Compose |
| **CI/CD** | GitHub Actions (lint, test, build) |

---

## 📐 Arquitectura

![Architecture Diagram](/Users/podz/.gemini/antigravity-ide/brain/f97df5c0-83bf-4dfd-8db4-dacfb705581b/architecture_diagram_1780209280996.png)

---

## 🚀 Inicio rápido

### Prerrequisitos

- Node.js 20+ (se recomienda usar `nvm`)
- Docker y Docker‑Compose
- **Opcional**: PostgreSQL local si no usas Docker

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Jorgito091/Padz.git
cd Padz

# Instalar dependencias del backend y frontend
tnpm install   # o pnpm i / yarn install
```

### Desarrollo con Docker‑Compose

```bash
# Levanta la base de datos, backend y frontend
docker compose up -d

# El backend corre en http://localhost:3001
# El frontend corre en http://localhost:5173
```

#### Sin Docker (modo local)

1. **Base de datos**
   ```bash
   # Inicia PostgreSQL (puedes usar la imagen oficial)
   docker run --name padz-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=padz -p 5432:5432 -d postgres:15
   ```
2. **Backend**
   ```bash
   cd Back
   cp .env.example .env   # Configura DATABASE_URL
   npx prisma db push   # Crea tablas
   npm run dev          # http://localhost:3001
   ```
3. **Frontend**
   ```bash
   cd Front
   cp .env.example .env   # Ajusta REACT_APP_API_URL si es necesario
   npm run dev          # http://localhost:5173
   ```

---

## ✅ Tests

```bash
# Backend
cd Back
npm test           # Jest + coverage

# Frontend
cd Front
npm test           # Jest + React Testing Library

# End‑to‑end
npx cypress open   # o `npm run cypress` para modo headless
```

---

## 🧹 Lint y Formato

```bash
# Ejecuta ESLint + Prettier
npm run lint
npm run format   # usa prettier para formatear
```

> **Nota**: El proyecto incluye `husky` y `lint‑staged` para ejecutar lint antes de cada commit.

---

## 📚 Documentación API

Swagger UI está disponible en **/api/docs** una vez que el backend está corriendo.

```bash
# Acceder a la documentación
http://localhost:3001/api/docs
```

---

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama `dev` para tus cambios
3. Abre un Pull Request contra `dev`
4. Asegúrate de que CI pase (lint, tests, build)

# Consolidated Project Summary

## 📖 Proyecto Padz
Proyecto Padz — tablero colaborativo (estilo Trello). Repositorio monorepo con `Back/` (API) y `Front/` (cliente SPA).

### Badges
![build](https://img.shields.io/badge/build-passing-brightgreen)
![license](https://img.shields.io/badge/license-MIT-blue)

---

## 📄 Licencia
Este proyecto está bajo la licencia **MIT**. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🙋‍♂️ Contacto
- **Autor**: Jorgito091
- **GitHub**: https://github.com/Jorgito091
- **Issues**: Abre un *issue* para reportar bugs o solicitar mejoras.
- **Version**: 1.0.0

---

## Contexto del Proyecto

- **¿Qué estamos construyendo?** Padz, una aplicación tipo Trello con gestión de tableros, listas y tarjetas, autenticación JWT, notificaciones en tiempo real vía WebSocket y una UI premium (modo oscuro, glassmorphism, animaciones).
- **¿Por qué lo construimos?** Necesitamos una herramienta auto‑hosteada, segura y extensible para la gestión colaborativa de tareas, sin depender de SaaS externos.
- **¿Qué ya funciona?** Autenticación, CRUD completo de tableros/listas/tarjetas, sockets de notificación, Docker‑Compose local, CI (lint, test, build), README y Swagger.
- **¿Qué falta?** Tests de integración auth ↔ socket, pipeline de despliegue a staging (Docker + Nginx + HTTPS), logging estructurado con pino, métricas Prometheus, documentación de contribución, versionado automático y Storybook.
- **Problemas conocidos**: conflictos de merge previos, falta de pruebas de integración, manejo manual de git push (refspecs erróneos).
- **Próxima tarea recomendada**: crear pipeline de despliegue a staging y añadir tests de integración de autenticación y sockets.

---

## 📋 Mejoras pendientes

- **Tests de integración** (auth ↔ socket) – alta prioridad.
- **Pipeline de despliegue a staging** (Docker + Nginx + HTTPS).
- **Logging estructurado** con `pino` y exportar logs en formato JSON.
- **Métricas y monitoreo** con Prometheus + Grafana.
- **Documentación de contribución** (`CONTRIBUTING.md`).
- **Versionado automático** con `semantic-release`.
- **Storybook** para componentes UI.
- **Exportar datos** (CSV/JSON) de tableros y tarjetas.
- **Gestión de backups** de base de datos.
- **Mejorar accesibilidad** (ARIA, contraste).

---

## 🔬 Tests de integración (auth ↔ socket)

**Objetivo:** Verificar que el flujo completo de autenticación y la capa de WebSocket funciona de forma correcta e íntegra, combinando varios componentes que en pruebas unitarias se evalúan por separado.

**Qué cubre:**
- Login → generación de `accessToken`/`refreshToken`.
- Handshake del socket con `auth.token`.
- Validación del token por el middleware del servidor.
- Autorización para eventos `join-board`, `join-user`.
- Recepción de notificaciones emitidas por el servidor.

**Beneficios:** Detecta regresiones de seguridad, asegura que solo usuarios autenticados pueden abrir sockets, previene errores de sincronización entre backend y frontend y da confianza para refactorings.

**Ejemplo de test (Jest + socket.io‑client):**
```ts
import { io } from 'socket.io-client';
import request from 'supertest';
import { app } from '../src/server';

it('login → socket handshake → receive notification', async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'test@example.com', password: 'Abc!1234' })
    .expect(200);
  const { accessToken } = loginRes.body;

  const socket = io('http://localhost:3001', {
    auth: { token: accessToken },
    transports: ['websocket'],
  });

  await new Promise((resolve, reject) => {
    socket.on('connect', () => {
      socket.emit('join-board', { boardId: 'some-board-id' });
      resolve(undefined);
    });
    socket.on('connect_error', reject);
  });

  const notifPayload = { message: 'Card moved', boardId: 'some-board-id' };
  // Simular notificación en backend (pseudo‑código)
  // await server.emitNotification(notifPayload);

  const received = await new Promise(res =>
    socket.once('notification', data => res(data))
  );
  expect(received).toMatchObject(notifPayload);
  socket.disconnect();
});
```

**Cuándo ejecutarlo:** En cada CI pipeline, después de cambios en autenticación o en la configuración de `socket.io`. Si falla, el despliegue se bloquea.

---


## 📚 Índice
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