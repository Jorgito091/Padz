# TROUBLESHOOTING

Problemas comunes y soluciones rápidas.

- Error: Can't reach database server at `localhost:5432`
  - Asegúrate de que `docker-compose up -d` está corriendo y `db` está healthy.
  - Verifica `DATABASE_URL` en `.env`.

- Error: Prisma table does not exist
  - Ejecuta `npx prisma migrate deploy` o `npx prisma db push` según flujo.

- Error: Invalid credentials (login)
  - Si estás usando seed_test_user.js, vuelve a ejecutar el seed o elimina el usuario y regístrate de nuevo.
