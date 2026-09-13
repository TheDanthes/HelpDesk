# Desplegar OnDesk en ZimaOS

Las imagenes las construye GitHub Actions y quedan publicadas en GHCR. El NAS
no compila nada: solo baja las imagenes e instala el stack desde la interfaz web.

El stack son tres contenedores: `postgres`, `api` y `client`. No usa Redis.

---

## Preparacion, una sola vez

### 1. Repositorio privado en GitHub

```bash
gh repo create ondesk --private --source=. --push
```

O crear el repo vacio desde la web y despues:

```bash
git remote add origin git@github.com:TU-USUARIO/ondesk.git
git push -u origin main
```

El push dispara `.github/workflows/build.yml`, que construye las dos imagenes
y las publica. Se sigue desde la pestaña **Actions** del repo. La primera vuelta
tarda bastante; las siguientes reusan cache y son mucho mas rapidas.

Al terminar quedan publicadas, en el **Packages** de tu perfil:

```
ghcr.io/<tu-usuario>/ondesk-api:beta
ghcr.io/<tu-usuario>/ondesk-client:beta
```

Ademas de `:beta`, cada build publica una etiqueta con el sha del commit, por si
hace falta volver a una version anterior.

### 2. Acceso del NAS a las imagenes

Un repositorio privado publica paquetes privados, asi que el NAS necesita
credenciales. Hay dos caminos.

**Paquetes privados** (el codigo compilado no queda expuesto):

Generar un token en GitHub con permiso `read:packages`
(Settings -> Developer settings -> Personal access tokens) y en el NAS:

```bash
sudo docker login ghcr.io -u TU-USUARIO
# pega el token cuando pida la contraseña
sudo docker pull ghcr.io/TU-USUARIO/ondesk-api:beta
sudo docker pull ghcr.io/TU-USUARIO/ondesk-client:beta
```

Se usa `sudo` a proposito: ZimaOS instala las apps como root, y las credenciales
tienen que quedar en la config de root, no en la de tu usuario. Bajar las
imagenes a mano antes de importar el YAML evita depender de como resuelve la
autenticacion el instalador de ZimaOS.

**Paquetes publicos** (mas simple, sin login en el NAS):

En GitHub, Packages -> cada paquete -> Package settings -> Change visibility ->
Public. El repositorio sigue siendo privado; lo que queda publico es la imagen
compilada. Con esto el NAS baja sin credenciales y no hay tokens que rotar.

## Instalar

1. Abrir `docker-compose.yml` de esta carpeta y reemplazar `TU-USUARIO-GITHUB`
   por tu usuario de GitHub **en minusculas** (aparece dos veces).
2. Cambiar `POSTGRES_PASSWORD`, la misma contraseña dentro de `DATABASE_URL`,
   y `SECRET` (`openssl rand -base64 32`).
3. En ZimaOS: **Apps -> + -> Custom Install -> Import**, pegar el YAML, instalar.

Los datos quedan fuera de los contenedores:

- `/media/ZimaOS-HD/AppData/ondesk/postgres` — base de datos
- `/media/ZimaOS-HD/AppData/ondesk/uploads` — adjuntos de los tickets

Respaldar esas dos carpetas es respaldar OnDesk entero.

## Primer arranque

El dashboard queda en `http://<ip-del-zima>:3002`.

En el primer arranque la API corre sola las migraciones y la semilla; puede
tardar entre 30 y 60 segundos en responder. Si algo no levanta:

```bash
sudo docker logs -f ondesk-api
```

Usuario inicial: `admin@admin.com` / `1234`. Es el que crea la semilla y esa
contraseña es publica en el repo de Pepperminto: cambiarla apenas se entra.

---

## Actualizar

```bash
git push
```

Cuando Actions termine, en el NAS:

```bash
sudo docker pull ghcr.io/TU-USUARIO/ondesk-api:beta
sudo docker pull ghcr.io/TU-USUARIO/ondesk-client:beta
```

y reiniciar la app desde ZimaOS. Las migraciones de base de datos corren solas
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
  arranque. Lo pasa el workflow como build-arg. Si cambias el nombre del
  servicio `api` en el compose, hay que cambiarlo tambien en el workflow.
- El workflow compila para `linux/amd64`. Si tu Zima fuera ARM, hay que agregar
  `linux/arm64` en `platforms`.
- Si Actions no esta disponible, queda `docker-compose.build.yml` como salida de
  emergencia para construir a mano en cualquier maquina con Docker.
- Los usuarios de cliente no ven nada hasta que tengan al menos una empresa
  asignada (Admin -> Empresas por usuario). Es a proposito: falla cerrado.
