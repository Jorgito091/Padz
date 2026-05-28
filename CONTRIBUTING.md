# CONTRIBUTING — Padz

Última revisión: 2026-05-27

Onboarding rápido
-----------------
1. Clonar repo
```bash
git clone <repo-url>
cd Padz
```
2. Instalar dependencias
```bash
cd Back && npm install
cd ../Front && npm install
```
3. Levantar base (opcional):
```bash
docker-compose up -d
```

Convenciones Git
----------------
- Branches: `main` (producción), `develop` (integración), feature branches `feature/<desc>`.
- Commits: usar Conventional Commits (feat, fix, docs, chore, refactor, perf, test).
- PRs: describir cambios, link a issue, incluir steps para reproducir.

Code style y linters
--------------------
- Añadir ESLint y Prettier al proyecto si no existen.
- Ejecutar `npm run lint` en cada PR (CI corre `lint --if-present`).

Testing
-------
- Añadir pruebas unitarias para controllers y servicios.
- Integrations tests: endpoints críticos (auth, create board, realtime flows).

Review checklist (PR)
---------------------
- Código compilable (`npm run build`).
- No secrets ni credenciales en el PR.
- Documentación de cambios en `CHANGELOG.md`.
- Tests añadidos o motivo por el que no aplica.

Cómo ejecutar localmente
------------------------
- Backend dev:
```bash
cd Back
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```
- Frontend dev:
```bash
cd Front
npm install
npm run dev
```
