# Padz - Trello Clone Project

Un gestor de tareas tipo Trello desarrollado con un stack moderno y escalable.

## 🚀 Estado Actual
El proyecto se encuentra en la fase inicial del desarrollo del **Backend**. Se ha implementado la infraestructura base necesaria para gestionar tableros, listas y tarjetas.

## 🛠️ Stack Tecnológico (Backend)
- **Lenguaje:** TypeScript
- **Framework:** Express.js
- **Base de Datos:** SQLite (Local)
- **ORM:** Prisma 7 (con Driver Adapters)
- **Entorno de ejecución:** Node.js

## 📂 Estructura del Proyecto
- `/Back`: Servidor API y lógica de negocio.
- `/Back/prisma`: Esquema de base de datos y migraciones.
- `/Back/src/controllers`: Lógica de manejo de datos.
- `/Back/src/routes`: Definición de endpoints de la API.

## 🛠️ Cómo empezar (Backend)
1. Navega a la carpeta del backend:
   ```bash
   cd Back
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Genera el cliente de Prisma:
   ```bash
   npx prisma generate
   ```
4. Levanta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

## 📋 Endpoints Principales
- `GET /health`: Verifica que el servidor esté funcionando.
- `GET /api/boards`: Obtiene todos los tableros.
- `GET /api/boards/:id`: Obtiene un tablero detallado (con sus listas y tarjetas).
- `POST /api/boards`: Crea un nuevo tablero.
