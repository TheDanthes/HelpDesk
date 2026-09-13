# OnDesk

Mesa de ayuda multiempresa de [OnDesk](https://www.ondesk.com.ar).

Repositorio: https://github.com/TheDanthes/HelpDesk
Imagenes: `ghcr.io/thedanthes/ondesk-api` y `ghcr.io/thedanthes/ondesk-client`

Construida sobre [Pepperminto](https://github.com/nulldoubt/pepperminto)
(a su vez un fork de
[Peppermint](https://github.com/Peppermint-Lab/peppermint)).

Un solo login. Cada usuario pertenece a una o varias **empresas** y solo ve los
tickets de esas empresas.

## Como funciona el aislamiento

Hay una sola regla, y vive en `apps/api/src/lib/tenant.ts`:

| Tipo de usuario | Que ve |
|---|---|
| Personal de OnDesk (`external_user = false`) | Todos los tickets, de todas las empresas |
| Usuario de cliente, membresia con `viewAll` | Todos los tickets de esa empresa |
| Usuario de cliente, membresia sin `viewAll` | Solo los tickets que abrio, que tiene asignados, o que entraron por su mail |

El permiso `viewAll` es **por membresia**, no por usuario: alguien puede ser
responsable en la Empresa A y usuario comun en la Empresa B.

Un usuario de cliente sin ninguna empresa asignada no ve **nada**. Es a
proposito: el sistema falla cerrado.

Dentro de un ticket que si puede ver, el usuario de cliente **no** ve los
comentarios internos (`Comment.public = false`, que es el default), ni la nota
interna del agente, ni el tiempo trabajado.

Ningun endpoint arma su propio filtro. Los listados usan `resolveTicketWhere()`
y todo lo que llega por id de ticket pasa por `assertTicketAccess()`, que
responde 404 (no 403) para no delatar que el ticket existe en otra empresa.

La empresa activa del selector viaja en la cookie `ondesk_client`, que el proxy
de Next reenvia a la API. Si alguien la manipula a mano, la API responde 403:
la cookie elige entre las empresas permitidas, no las otorga.

Aparte, `isAdminOnlyRoute` en `tenant.ts` cierra toda la superficie de
administracion a los usuarios de cliente desde `main.ts`. Esto es a proposito y
no hay que sacarlo: el `requirePermission` que trae Pepperminto **deja pasar a
todo el mundo** mientras `config.roles_active` este apagado, que es el default.

Los tickets anonimos (`/api/v1/ticket/public/create`) y los que entran por IMAP
nacen sin empresa, asi que solo los ve OnDesk hasta que alguien los reasigna.

## Estructura

```
apps/
  api/      API Fastify + Prisma + Postgres
  client/   Dashboard Next.js (personal de OnDesk y portal de clientes)
deploy/
  zimaos/   Compose e instrucciones para desplegar en ZimaOS
```

## Desarrollo

```bash
cp .env.example .env
docker compose up -d      # solo postgres
pnpm install
pnpm dev
```

- API: http://localhost:3001 (documentacion en `/docs`)
- Dashboard: http://localhost:3002

## Despliegue

Ver [`deploy/zimaos/README.md`](deploy/zimaos/README.md).

## Administracion

- **Admin → Clients**: alta de empresas.
- **Admin → Users**: alta de usuarios. El switch *Usuario de cliente* define si
  la persona queda acotada a sus empresas o es personal de OnDesk.
- **Admin → Empresas por usuario**: asignar o quitar empresas y activar el
  permiso de ver todos los tickets de cada una.

## Licencia

Ver `LICENSE`.
