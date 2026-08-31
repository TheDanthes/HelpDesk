-- Multi-tenant por empresa cliente.
-- Un usuario puede pertenecer a varias empresas (UserClient) y, por membresia,
-- tener o no permiso para ver todos los tickets de esa empresa (viewAll).

-- CreateTable
CREATE TABLE "UserClient" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewAll" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "UserClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserClient_clientId_idx" ON "UserClient"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "UserClient_userId_clientId_key" ON "UserClient"("userId", "clientId");

-- AddForeignKey
ALTER TABLE "UserClient" ADD CONSTRAINT "UserClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserClient" ADD CONSTRAINT "UserClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: autor real del ticket como FK (antes solo vivia en el JSON createdBy)
ALTER TABLE "Ticket" ADD COLUMN "createdById" TEXT;

-- CreateIndex
CREATE INDEX "Ticket_clientId_idx" ON "Ticket"("clientId");

-- CreateIndex
CREATE INDEX "Ticket_createdById_idx" ON "Ticket"("createdById");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill del autor a partir del JSON existente
UPDATE "Ticket"
SET "createdById" = ("createdBy" ->> 'id')
WHERE "createdBy" IS NOT NULL
  AND ("createdBy" ->> 'id') IN (SELECT "id" FROM "User");
