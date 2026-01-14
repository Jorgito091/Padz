# Padz - Premium Trello Clone

Padz es un gestor de tableros moderno, elegante y altamente funcional, diseñado para ofrecer una experiencia de usuario premium con un rendimiento ágil. Inspirado en Trello, pero con una estética de "Glassmorphism" y micro-animaciones que lo hacen sentir vivo.

## ✨ Características Principales

### 📋 Gestión de Tableros
- **Favoritos (Starring)**: Marca tus tableros más importantes para que aparezcan siempre arriba.
- **Buscador en Tiempo Real**: Encuentra cualquier tablero al instante por su título.
- **Drag & Drop Reordering**: Organiza tus tableros y tarjetas simplemente arrastrándolos.
- **Temas Dinámicos**: Fondos degradados elegantes y modernos.

### 👥 Colaboración y Seguridad
- **Sistema de Miembros**: Invita a otros usuarios a tus tableros compartiendo su email.
- **Roles Claros**: Diferenciación entre Propietario (Owner) y Miembro (Member).
- **Acceso Protegido**: Autenticación robusta con JWT y control de acceso por recurso.

### 💬 Comunicación
- **Comentarios en Tarjetas**: Discusiones integradas en cada tarea para mantener el flujo de trabajo en un solo lugar.
- **Avatares Personalizados**: Identificación visual rápida de los miembros y tu propio perfil.

---

## 🛠️ Stack Tecnológico

### Backend (Node.js)
- **TypeScript**: Para un desarrollo robusto y tipado.
- **Express.js**: Framework ágil para la API REST.
- **Prisma 7**: ORM de última generación para la gestión de datos.
- **SQLite**: Base de datos local rápida y sin configuración externa.
- **JWT & Bcrypt**: Estándares de seguridad para autenticación y cifrado.

### Frontend (React)
- **Vite 6**: El bundle tool más rápido para desarrollo moderno.
- **Tailwind CSS**: Diseño moderno basado en utilidades.
- **Framer Motion**: Micro-animaciones y transiciones suaves.
- **dnd-kit**: Motor potente y accesible para el Drag & Drop.
- **Lucide Icons**: Set de iconos elegantes y consistentes.

---

## 🚀 Guía de Instalación

### 1. Backend (API)
```bash
cd Back
npm install
npx prisma db push
npm run dev
```

### 2. Frontend (React)
```bash
cd Front
npm install
npm run dev
```

---

## 🧠 Arquitectura Técnica y Funcionamiento

Para continuar el desarrollo, es fundamental entender cómo fluyen los datos en la aplicación:

### ⚙️ Flujo del Backend (Request Lifecycle)

1.  **Definición de Rutas (`src/routes`)**:
    Los archivos en `routes/` (ej. `boardRoutes.ts`) definen los endpoints. Casi todas las rutas están protegidas por `authenticate`.
2.  **Middleware de Seguridad (`src/middleware/authMiddleware.ts`)**:
    - El middleware `authenticate` verifica el JWT del header `Authorization`.
    - Si es válido, inyecta el `userId` en el objeto de la petición (`req.userId`), transformándola en una `AuthRequest`.
3.  **Controladores (`src/controllers`)**:
    - Residen en `src/controllers/`. Son los encargados de la lógica de negocio.
    - **Conexión**: Reciben el `req` (con el `userId`) y usan el cliente de **Prisma** (`src/prisma.ts`) para consultar la DB.
    - **Validación**: Siempre verifican si el `userId` es el `ownerId` del recurso o si pertenece a la lista de `members` antes de permitir ediciones o eliminaciones.
4.  **Base de Datos (`prisma/schema.prisma`)**:
    Define los modelos (`Board`, `List`, `Card`, `Member`, `Comment`). Para cualquier cambio en los datos, se debe modificar este archivo y ejecutar `npx prisma db push`.

### 💻 Flujo del Frontend

1.  **Servicios de API (`src/services/api.ts`)**:
    Centraliza las peticiones usando **Axios**. Automáticamente adjunta el token JWT desde el `localStorage` en cada petición.
2.  **Gestión de Estado (`src/context/AuthContext.tsx`)**:
    Maneja el estado global del usuario autenticado y su perfil (incluyendo el avatar).
3.  **Componentes y Páginas**:
    - Las páginas (`src/pages/DashboardPage.tsx`) consumen los servicios para cargar datos.
    - Se utilizan componentes especializados como `SortableBoard` o `SortableCard` para manejar la interactividad compleja sin sobrecargar el código de la página.

---

## 👩‍💻 Guía para Continuar el Desarrollo

1.  **Añadir una nueva funcionalidad**:
    - Define el modelo en `schema.prisma`.
    - Crea el controlador en `src/controllers/`.
    - Registra la ruta en `src/routes/` y asóciala al controlador.
    - Crea el servicio y la UI en el `Front/`.
2.  **Mantenimiento**:
    - El proyecto usa TypeScript estricto; asegúrate de tipar correctamente todas las respuestas de la API.
    - El diseño premium se mantiene usando clases de Tailwind específicas definidas en los componentes.

---
*Desarrollado con ❤️ para ser el gestor de tareas más bonito del vecindario.*
