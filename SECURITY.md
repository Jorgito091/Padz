# SECURITY — Padz

Última revisión: 2026-05-27

Resumen
-------
Este documento resume las prácticas de seguridad actuales, riesgos detectados y recomendaciones priorizadas.

Estado actual
------------
- Autenticación: JWT + refresh tokens rotativos con almacenamiento hashed (`RefreshToken` model).
- Helmet y rate-limiter añadidos en `Back/src/server.ts`.
- Contraseñas: bcrypt hashing (bcryptjs).
- CORS: habilitado con `origin: "*"` por defecto (ajustar en producción).

Riesgos detectados (prioridad alta)
---------------------------------
1. Secrets en claro en `docker-compose.yml` (POSTGRES_PASSWORD: password) — mover a Secret Manager.
2. CORS abierto (`*`) — restringir a dominios de frontend en producción.
3. Falta de control y logging de auditoría para acciones críticas (crear/eliminar usuarios, cambios de rol).
4. No hay WAF/IPS ni protección contra bots DDoS en infraestructura (depende del proveedor cloud).

Recomendaciones inmediatas
-------------------------
- Mover secrets a GitHub Secrets y a Secret Manager en producción.
- Ajustar `CORS` en `Back/src/server.ts` a origen del frontend en prod.
- Añadir `httponly` y `secure` flags si se almacenan refresh tokens en cookies (actualmente se devuelven en body).
- Implementar logging estructurado con `pino` y enviar a sistema central (ELK/Datadog/Splunk).
- Añadir SCA (Dependabot + Snyk) y políticas de revisión para vulnerabilidades criticas.

Autenticación y tokens
----------------------
- Access tokens: JWT con expiración corta (configurable `ACCESS_TOKEN_EXPIRY`).
- Refresh tokens: token aleatorio generado y almacenado hashed con `sha256` en `RefreshToken` table, con `revoked` flag y `expiresAt`.
- Rotation: al usar `/refresh` se revoca el token antiguo y se crea uno nuevo — buena práctica anti-replay.

OWASP checklist
----------------
- XSS: sanitize cualquier contenido HTML en comentarios (no implementado actualmente).
- CSRF: si se usan cookies, añadir protección CSRF.
- SQLi: Prisma ORM previene inyección SQL en la mayoría de los casos; revisar queries raw.
- Authentication: fortalecer password policy (ya implementada con Zod), habilitar 2FA si necesario.

Checklist de acciones (urgente)
------------------------------
1. Cambiar `docker-compose.yml` a no exponer secrets en VCS.
2. Configurar GitHub Secrets: `DATABASE_URL`, `JWT_SECRET`, `PG_PASSWORD`.
3. Restringir `CORS` en prod y documentar envs por entorno.
4. Instrumentar logs y enviar a sistema central.

Referencias código
------------------
- Helmet & rate limiter: [Back/src/server.ts](Back/src/server.ts#L1)
- Refresh token logic: [Back/src/controllers/authController.ts](Back/src/controllers/authController.ts#L1)
- Prisma schema: [Back/prisma/schema.prisma](Back/prisma/schema.prisma#L1)

Notas finales
------------
Documenté las inseguridades detectadas automáticamente y las recomendaciones. Marcar las secciones que requieren decisión de seguridad (cookies vs localStorage para refresh tokens, expiraciones, retención de logs, etc.).
