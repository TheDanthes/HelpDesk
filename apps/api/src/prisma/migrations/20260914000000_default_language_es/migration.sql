-- Los usuarios nuevos nacen en español. El endpoint de registro ahora respeta
-- el idioma que manda el formulario; este default cubre a los que se crean sin
-- indicarlo (por ejemplo desde la semilla o por integraciones).
ALTER TABLE "User" ALTER COLUMN "language" SET DEFAULT 'es';

-- Los usuarios que ya existen con el default viejo pasan a español. Si alguien
-- eligió otro idioma a proposito, no se toca.
UPDATE "User" SET "language" = 'es' WHERE "language" = 'en';
