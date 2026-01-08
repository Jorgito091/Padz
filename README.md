# Padz - Trello Clone Project

Un gestor de tareas tipo Trello moderno y elegante, diseñado con un enfoque en estética premium y seguridad robusta.

## 🚀 Estado Actual
El proyecto ha evolucionado a una aplicación **Full Stack** completa.
- **Backend:** API robusta con autenticación JWT y validación de propiedad (Ownership).
- **Frontend:** Interfaz moderna desarrollada con React, utilizando efectos de Glassmorphism y micro-animaciones.

## 🛠️ Stack Tecnológico

### Backend
- **Lenguaje:** TypeScript
- **Framework:** Express.js
- **Seguridad:** JWT (JSON Web Tokens) & Bcrypt para hashing de contraseñas.
- **Base de Datos:** SQLite (Local)
- **ORM:** Prisma 7 (con Driver Adapters)
- **Entorno:** Node.js

### Frontend
- **Framework:** React 18 + Vite
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Animaciones:** Framer Motion
- **Iconos:** Lucide React

## 📂 Estructura del Proyecto
- 📁 `/Back`: Servidor API, lógica de negocio y seguridad.
- 📁 `/Front`: Aplicación cliente React con diseño moderno.
- 📁 `/Back/prisma`: Esquema de base de datos y configuración del ORM.

## 🔐 Seguridad y Autenticación
El sistema utiliza un flujo de autenticación basado en **Tokens JWT**:
1. Los usuarios se registran/inician sesión para obtener un token.
2. Todas las rutas de Tableros, Listas y Tarjetas están protegidas por el middleware de autenticación.
3. Se aplica un control de **Propiedad (Ownership)**: los usuarios solo pueden ver y modificar recursos (tableros, listas, tarjetas) de los cuales son dueños.

## 📋 API Endpoints Principales

### Autenticación
- `POST /api/auth/register`: Registro de nuevos usuarios.
- `POST /api/auth/login`: Inicio de sesión y obtención de token.

### Gestión (Requieren Token Bearer)
- `GET /api/boards`: Obtiene los tableros del usuario autenticado.
- `POST /api/boards`: Crea un nuevo tablero.
- `GET /api/boards/:id`: Detalle completo de un tablero (listas y tarjetas).
- `GET /api/lists?boardId=ID`: Listas de un tablero específico.
- `POST /api/cards`: Crea una tarjeta en una lista.

## 🛠️ Cómo empezar

El proyecto tiene dos carpetas principales que deben ejecutarse por separado.

### 1. Backend (API)
Asegúrate de tener instalado Node.js y SQLite.
1. `cd Back`
2. `npm install`
3. `npx prisma db push` (Si es la primera vez o cambiaste el esquema)
4. `npm run dev` (El servidor correrá en `http://localhost:3001`)

### 2. Frontend (React)
1. Abrir **otra terminal** (sin cerrar la del backend).
2. `cd Front`
3. `npm install`
4. `npm run dev` (La aplicación correrá en `http://localhost:3000` por defecto, o la que indique Vite)

---
*Nota: He actualizado el frontend a **Vite 6** para asegurar compatibilidad con React 18 y ofrecer un desarrollo más rápido.*
