#!/bin/sh
set -e

echo "▶️  Ejecutando migraciones Prisma..."
npx prisma migrate deploy

echo "▶️  Lanzando la aplicación..."
exec node dist/server.js
