# Padz - Premium Trello Clone

Padz es un gestor de tableros moderno, elegante y altamente funcional, diseñado para ofrecer una experiencia de usuario premium con un rendimiento ágil. Inspirado en Trello, pero elevado con una estética de **Glassmorphism** vibrante en tonos naranja, micro-animaciones fluidas y una arquitectura robusta en tiempo real.

## ✨ Características Principales

### 📋 Gestión de Tableros y Tareas Pro
- **Favoritos (Starring)**: Organiza tu flujo de trabajo marcando tableros críticos para acceso instantáneo.
- **Buscador Inteligente**: Filtra y encuentra cualquier tablero en milisegundos mediante búsqueda reactiva.
- **Drag & Drop de Alta Fidelidad**: Reordena tableros, listas y tarjetas con total fluidez gracias a `dnd-kit`.
- **Etiquetas Personalizadas**: Crea, edita y elimina etiquetas por tablero con una paleta de colores vibrante.
- **Fechas de Vencimiento y Control**: Gestiona plazos con `dueDate` y marca el progreso con estados de completado (`isDone`).
- **Asignación de Miembros**: Asigna colaboradores específicos a tarjetas para una delegación clara de tareas.

### 👥 Colaboración y Seguridad en Tiempo Real
- **Sincronización Total**: Todos los cambios (movimientos, ediciones, comentarios) se reflejan al instante para todos los usuarios mediante **WebSockets**.
- **Notificaciones Inteligentes**: Sistema integrado de notificaciones para mantenerte al tanto de cambios relevantes y menciones.
- **Gestión de Miembros y Roles**: Invita colaboradores por correo electrónico con roles granulares (`OWNER`, `MEMBER`, `VIEWER`).
- **Acceso Blindado**: Autenticación segura mediante JWT con inyección de contexto de usuario en cada petición.
- **Perfil de Usuario**: Personaliza tu identidad visual con avatares y configuraciones de perfil.

### 💬 Comunicación Centralizada
- **Comentarios en Tiempo Real**: Hilos de discusión fluidos dentro de cada tarjeta con soporte para eliminación y autoría.

---

## 🛠️ Stack Tecnológico

### Backend (Modern Node.js)
- **TypeScript**: Tipado estricto para un desarrollo sin errores y escalable.
- **Express 5**: El motor de API más reciente para una gestión de rutas ultra rápida.
- **Prisma 5**: ORM líder para consultas eficientes y migraciones de base de datos seguras.
- **PostgreSQL**: Base de datos relacional de alto rendimiento para integridad de datos total.
- **Socket.io**: Motor de eventos bidireccionales para una experiencia de usuario viva.
- **JWT & Bcryptjs**: Estándares de la industria para seguridad y cifrado de contraseñas.

### Frontend (Next-Gen React)
- **Vite 7**: El entorno de desarrollo más rápido del ecosistema JS.
- **React 18**: Interfaces reactivas y concurrentes de última generación.
- **Tailwind CSS 3**: Diseño atómico con un sistema de tokens naranja personalizado y efectos de cristal (Glassmorphism).
- **Framer Motion**: Orquestación de micro-animaciones y transiciones de estado de alta gama.
- **dnd-kit**: Motor de arrastrar y soltar optimizado para rendimiento y accesibilidad.
- **Lucide React**: Iconografía minimalista y consistente.

---

## 🚀 Guía de Instalación

### 1. Requisitos Previos
- Node.js (v18+)
- Docker y Docker Compose

### 2. Configuración del Backend
```bash
cd Back
# Instalar dependencias
npm install

# Crear archivo de configuración .env
# Variables necesarias:
# DATABASE_URL="postgresql://padz_user:padz_password@localhost:5432/padz_db?schema=public"
# JWT_SECRET="tu_secreto_aqui"
```

### 3. Base de Datos y Servidor
```bash
# Levantar PostgreSQL (desde la raíz del proyecto)
docker-compose up -d

# Ejecutar migraciones de Prisma
cd Back
npx prisma migrate dev

# Arrancar en modo desarrollo
npm run dev
```

### 4. Configuración del Frontend
```bash
cd Front
npm install
npm run dev
```

---

## 🧠 Arquitectura y Funcionamiento

### ⚙️ Ciclo de Vida del Backend
1.  **Auth Layer**: Middleware `authenticate` valida el JWT e inyecta el `userId`.
2.  **Permission Layer**: Los controladores verifican roles antes de ejecutar acciones críticas (ej: solo `OWNER` puede borrar tableros).
3.  **Real-time Layer**: Integración nativa de Sockets en los servicios para emitir cambios globales al instante.

### 💻 Experiencia de Usuario (Frontend)
1.  **Context Driven**: `AuthContext` gestiona la sesión y persistencia del usuario.
2.  **Optimistic UI**: Las interacciones se sienten instantáneas gracias a la gestión de estado reactiva.
3.  **Glassmorphism Design**: Uso intensivo de `backdrop-blur`, bordes semitransparentes y gradientes naranja para un look premium.

---

## 👩‍💻 Guía de Extensión
- **Nuevos Modelos**: Actualiza `prisma/schema.prisma` y corre `npx prisma migrate dev`.
- **Nuevos Eventos**: Añade listeners en `Back/src/server.ts` y conecta en el frontend vía `socket.io-client`.

---
*Developed with the power of caffeine and a passion for premium design*

