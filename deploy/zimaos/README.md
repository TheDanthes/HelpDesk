# Desplegar OnDesk en ZimaOS

Las imagenes las construye GitHub Actions y quedan publicadas en GHCR. El NAS
no compila nada: solo baja las imagenes e instala el stack desde la interfaz web.

El stack son tres contenedores: `postgres`, `api` y `client`. No usa Redis.

---

## De donde salen las imagenes

Repositorio: https://github.com/TheDanthes/HelpDesk

Cada push a `main` dispara `.github/workflows/build.yml`, que construye las dos
imagenes y las publica en GHCR. Se sigue desde la pestaña **Actions** del repo.
La primera vuelta tarda cerca de diez minutos (el `next build` del cliente es lo
lento); las siguientes reusan cache y bajan a pocos minutos.

Imagenes publicadas:

```
ghcr.io/thedanthes/ondesk-api:beta
ghcr.io/thedanthes/ondesk-client:beta
```

Ademas de `:beta`, cada build publica una etiqueta con el sha del commit, por si
hace falta volver a una version anterior.

Los dos paquetes estan en **publico**, asi que el NAS los baja sin credenciales.
La visibilidad del paquete es independiente de la del repositorio: se cambia en
Packages -> el paquete -> Package settings -> Change package visibility.

Si algun dia pasan a privados, el NAS necesita un token con `read:packages`:

```bash
sudo docker login ghcr.io -u TheDanthes
# pegar el token cuando pida la contraseña
```

Se usa `sudo` porque ZimaOS instala las apps como root, y las credenciales
tienen que quedar en la config de root, no en la del usuario de la sesion.

## Instalar

1. Bajar las imagenes a mano en el NAS. Asi el import no depende de como
   resuelve la descarga el instalador, y un fallo se ve con un error claro:

```bash
sudo docker pull ghcr.io/thedanthes/ondesk-api:beta
sudo docker pull ghcr.io/thedanthes/ondesk-client:beta
sudo docker images | grep ondesk
```

2. Abrir `docker-compose.yml` de esta carpeta y cambiar `POSTGRES_PASSWORD`, la
   misma contraseña dentro de `DATABASE_URL`, y `SECRET`
   (`openssl rand -base64 32`). Los valores del archivo son placeholders: las
   claves reales no se versionan.
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

Cuando el workflow termine (pestaña Actions del repo), en el NAS:

```bash
sudo docker pull ghcr.io/thedanthes/ondesk-api:beta
sudo docker pull ghcr.io/thedanthes/ondesk-client:beta
```

Y despues hay que **recrear** los contenedores desde ZimaOS, no reiniciarlos:
`docker restart` reusa el contenedor existente, que quedo atado al ID de la
imagen vieja, asi que sigue corriendo la version anterior aunque el pull haya
bajado la nueva. En ZimaOS se usa la opcion de actualizar la app; si no
aparece, desinstalar y volver a instalar con el mismo YAML (los datos viven en
`/media/ZimaOS-HD/AppData/ondesk/`, fuera de los contenedores, y sobreviven —
si la desinstalacion ofrece borrar los datos, hay que decirle que no).

Las migraciones de base de datos corren solas al arrancar la API.

Para comprobar que quedo bien antes de probar el login, abrir
`http://<ip-del-zima>:3002/api/v1/auth/check`. Si responde JSON (incluido un
`Unauthorized`, que es lo esperado sin token) el camino dashboard -> API esta
cerrado. Si responde `Bad Gateway`, el proxy no llega a la API y el problema no
son las credenciales.

## Puertos

| Puerto | Servicio | Hace falta exponerlo |
|---|---|---|
| 3002 | Dashboard (client) | Si, es por donde se entra |
| 3101 | API (escucha en 3001 dentro del contenedor) | Solo si vas a consumirla desde afuera |
| 5432 | Postgres | No, queda en la red interna del stack |

Si no necesitas la API desde afuera, borra el bloque `ports` del servicio `api`:
el dashboard le habla por la red interna del stack.

## Notas

- `API_URL` se hornea en el bundle del dashboard **en tiempo de build**, no de
  arranque. Lo pasa el workflow como build-arg. Si cambias el nombre del
  servicio `api` en el compose, hay que cambiarlo tambien en el workflow.
- Esa variable ademas tiene que estar declarada en el `env` de la tarea `build`
  de `turbo.json`. Turbo 2 corre en modo de entorno estricto: a cada tarea solo
  le pasa las variables declaradas, y filtra el resto antes de invocar el
  comando. Si falta ahi, el `ENV API_URL` del Dockerfile se pierde antes de
  llegar a `next build`, el proxy queda apuntando a `localhost:3001` y el
  dashboard responde `Bad Gateway` — sin que el build falle ni avise nada.
  Lo mismo vale para cualquier variable nueva que se lea en `next.config.js`.
- `turbo.json` se valida de forma estricta: una clave que Turbo no reconoce
  (por ejemplo un falso comentario `"// algo"`) hace fallar `turbo prune` y
  rompe los dos builds. JSON no admite comentarios.
- El workflow compila para `linux/amd64`. Si tu Zima fuera ARM, hay que agregar
  `linux/arm64` en `platforms`.
- Si Actions no esta disponible, se puede construir a mano en cualquier maquina
  con Docker y BuildKit, desde la raiz del repo:
  `docker build -f apps/api/Dockerfile -t ondesk/api:beta .` y
  `docker build -f apps/client/Dockerfile --build-arg API_URL=http://api:3001 -t ondesk/client:beta .`
  (en ese caso hay que apuntar el compose a esos nombres locales).
- Los usuarios de cliente no ven nada hasta que tengan al menos una empresa
  asignada (Admin -> Empresas por usuario). Es a proposito: falla cerrado.
