# Padz - Premium Trello Clone

Padz es un gestor de tableros moderno, elegante y altamente funcional, diseñado para ofrecer una experiencia de usuario premium con un rendimiento ágil. Inspirado en Trello, pero con una estética de "Glassmorphism" vibrante en tonos naranja y micro-animaciones que lo hacen sentir vivo.

## ✨ Características Principales

### 📋 Gestión de Tableros y Tareas
- **Favoritos (Starring)**: Marca tus tableros más importantes para acceso rápido.
- **Buscador en Tiempo Real**: Encuentra cualquier tablero al instante por título.
- **Drag & Drop Inteligente**: Reordena tableros, listas y tarjetas con total fluidez.
- **Etiquetas Personalizadas**: Crea etiquetas por tablero y organízalas visualmente en tus tarjetas.
- **Fechas de Vencimiento**: Controla tus plazos con `dueDate` y marca tareas como completadas (`isDone`).
- **Temas Naranja Premium**: Una interfaz oscura refinada con acentos naranja y efectos de cristal.

### 👥 Colaboración y Seguridad
- **Sistema de Miembros y Roles**: Invita colaboradores con roles específicos (`OWNER`, `MEMBER`, `VIEWER`).
- **Acceso Protegido**: Autenticación robusta con JWT y control granular de permisos sobre cada recurso.
- **Perfil de Usuario**: Personalización de avatares para una identificación visual rápida.

### 💬 Comunicación
- **Comentarios en Tiempo Real**: Mantén la discusión centralizada dentro de cada tarjeta.

---

## 🛠️ Stack Tecnológico

### Backend (Node.js)
- **TypeScript**: Desarrollo robusto y tipado estricto.
- **Express 5**: Framework de alto rendimiento para la API REST.
- **Prisma 7**: ORM de última generación para una gestión de datos eficiente.
- **SQLite**: Persistencia local rápida y optimizada.
- **JWT & Bcryptjs**: Estándares de seguridad para autenticación y cifrado de datos.

### Frontend (React)
- **Vite 7**: El bundle tool más moderno y rápido.
- **React 18**: Biblioteca de UI líder para interfaces dinámicas.
- **Tailwind CSS 3**: Diseño moderno basado en utilidades con un sistema de diseño naranja optimizado.
- **Framer Motion**: Micro-animaciones y transiciones suaves de alta fidelidad.
- **dnd-kit**: Motor potente y accesible para la mejor experiencia de Drag & Drop.
- **Lucide React**: Iconografía elegante y consistente.

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

### ⚙️ Flujo del Backend (Request Lifecycle)

1.  **Seguridad y Contexto**: El middleware `authenticate` procesa el JWT e inyecta el `userId` en la petición (`AuthRequest`).
2.  **Control de Acceso**: Los controladores verifican sistemáticamente si el usuario tiene el rol necesario (Owner o Member) antes de permitir acciones CRUD.
3.  **Modelos de Datos Relacionales**:
    - **Boards**: Contienen listas, etiquetas (`Labels`) y miembros.
    - **Cards**: Gestionan su orden, estado (`isDone`), fechas y etiquetas asociadas (`CardLabel`).
    - **Labels**: Definidas a nivel de tablero para consistencia visual.

### 💻 Flujo del Frontend

1.  **Servicios Centralizados**: Axios gestiona la comunicación con la API, inyectando automáticamente el token desde el `localStorage`.
2.  **Estado Global**: `AuthContext` mantiene la sesión activa y los datos del perfil del usuario.
3.  **Componentes Especializados**: `SortableCard` y `CardDetailModal` encapsulan la lógica compleja de interacción y edición para mantener el código limpio y mantenible.

---

## 👩‍💻 Guía para Continuar el Desarrollo

1.  **Extender la Base de Datos**: Modifica `prisma/schema.prisma`, añade tus campos y corre `npx prisma db push`.
2.  **Nuevos Endpoints**: Sigue el patrón `Routes -> Controller -> Prisma` para mantener la coherencia.
3.  **Estética**: Utiliza las variables CSS definidas en `index.css` (`--accent: #f97316`) para mantener el tema naranja premium.

---
*Developed with the power of boredom and a cup of coffee*

