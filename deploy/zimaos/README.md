# Desplegar OnDesk en ZimaOS

ZimaOS instala aplicaciones desde un `docker-compose.yml`, pero **no compila
codigo**: espera imagenes ya construidas. Por eso el despliegue son dos pasos:
primero se construyen las imagenes por SSH, despues se instala la app desde la
interfaz web.

El stack son tres contenedores: `postgres`, `api` y `client`. No usa Redis.

---

## 1. Subir el proyecto al ZimaOS

Copiar la carpeta del proyecto al NAS, por ejemplo a `/DATA/Projects/ondesk`
(por Samba, por la app Files de ZimaOS o con `scp`). Tiene que quedar el
proyecto completo, no solo la carpeta `deploy`: el build necesita el codigo.

## 2. Construir las imagenes (una vez por version)

Por SSH al ZimaOS:

```bash
cd /DATA/Projects/ondesk
docker compose -f deploy/zimaos/docker-compose.build.yml build
```

Tarda varios minutos la primera vez. Al terminar:

```bash
docker images | grep ondesk
# ondesk/api      beta   ...
# ondesk/client   beta   ...
```

Si no aparecen las dos, no sigas: la instalacion del paso 4 va a fallar.

## 3. Poner las claves

Abrir `deploy/zimaos/docker-compose.yml` y cambiar **antes de instalar**:

- `POSTGRES_PASSWORD` y la misma contrasena dentro de `DATABASE_URL`
- `SECRET`, que firma las sesiones. Generar una propia con:

```bash
openssl rand -base64 32
```

Cambiar el `SECRET` mas adelante invalida todas las sesiones abiertas.

## 4. Instalar desde la interfaz web

En ZimaOS: **Apps → + → Custom Install → Import**, pegar el contenido de
`deploy/zimaos/docker-compose.yml` e instalar.

Los datos quedan fuera de los contenedores, en:

- `/DATA/AppData/ondesk/postgres` — base de datos
- `/DATA/AppData/ondesk/uploads` — adjuntos de los tickets

Respaldar esas dos carpetas es respaldar OnDesk entero.

## 5. Primer arranque

El dashboard queda en `http://<ip-del-zima>:3002`.

En el primer arranque la API corre sola las migraciones y la semilla; puede
tardar entre 30 y 60 segundos en responder. Si algo no levanta:

```bash
docker logs -f ondesk-api
```

El primer arranque necesita salida a internet: Prisma puede completar la
descarga de sus binarios si no quedaron cacheados en la imagen.

---

## Actualizar a una version nueva

```bash
cd /DATA/Projects/ondesk
git pull                # o volver a subir los archivos
docker compose -f deploy/zimaos/docker-compose.build.yml build
```

Y desde ZimaOS, reiniciar la app. Las migraciones de base de datos corren solas
al arrancar la API.

## Puertos

| Puerto | Servicio | Hace falta exponerlo |
|---|---|---|
| 3002 | Dashboard (client) | Si, es por donde se entra |
| 3001 | API | Solo si vas a consumirla desde afuera |
| 5432 | Postgres | No, queda en la red interna del stack |

Si no necesitas la API desde afuera, borra el bloque `ports` del servicio `api`:
el dashboard le habla por la red interna del stack.

## Notas

- `API_URL` se hornea en el bundle del dashboard **en tiempo de build**, no de
  arranque. Si cambias el nombre del servicio `api` en el compose, hay que
  volver a construir la imagen del cliente.
- Los usuarios de cliente no ven nada hasta que tengan al menos una empresa
  asignada (Admin → Empresas por usuario). Es a proposito: falla cerrado.
