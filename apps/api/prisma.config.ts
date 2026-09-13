import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./src/prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  // Prisma 7 ya no lee el bloque "prisma" de package.json: si la semilla no se
  // declara aca, `prisma db seed` no hace nada y la base queda migrada pero
  // vacia, sin usuario admin y sin la fila de Config que espera /auth/profile.
  migrations: {
    seed: "node ./src/prisma/seed.js",
  },
});
