# ROADMAP — Padz (Técnico)

Última revisión: 2026-05-27

Visión general
--------------
Roadmap técnico dividido en corto, medio y largo plazo con prioridades y entregables.

Corto plazo (0-3 meses)
- Añadir logging estructurado (`pino`) y enviar a sistema central.
- Añadir tests básicos: auth unit + integration (login/refresh).
- Documentación completa (este paquete).
- Mover secrets a GitHub Secrets y actualizar CI.

Mediano plazo (3-9 meses)
- Implementar observabilidad: métricas (Prometheus), tracing (OpenTelemetry) y errores (Sentry).
- Introducir Redis adapter para Socket.io y plan de escalado horizontal.
- Añadir CI/CD de despliegue (staging/prod) con migraciones controladas y backups.

Largo plazo (9-24 meses)
- Revisar separación por bounded contexts / microservicios si carga lo demanda.
- Migración a infraestructura IaC (Terraform) y despliegue en Kubernetes con autoscaling.
- Harden security posture: WAF, CSP, DLP.

KPIs
- Tiempo medio de despliegue
- Cobertura de tests
- Time to detect (tracing/monitoring)
