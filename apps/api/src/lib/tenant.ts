import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../prisma";
import { checkSession } from "./session";

/**
 * Multi-tenant por empresa cliente.
 *
 * Regla unica del sistema:
 *  - Un usuario con `external_user = false` es personal de OnDesk (agente o admin)
 *    y ve todos los tickets de todas las empresas.
 *  - Un usuario con `external_user = true` es usuario de cliente: solo ve tickets
 *    de las empresas donde tiene membresia (`UserClient`), y dentro de cada una
 *    ve todos los tickets solo si esa membresia tiene `viewAll = true`.
 *
 * Todo endpoint que toque tickets debe construir su `where` con `scopedTicketWhere`
 * o validar el acceso con `assertTicketAccess`. Sin membresias, un usuario de
 * cliente no ve nada (falla cerrado).
 */

export type Membership = {
  clientId: string;
  name: string;
  viewAll: boolean;
};

export type TenantScope =
  | { kind: "staff"; userId: string; email: string }
  | {
      kind: "client";
      userId: string;
      email: string;
      memberships: Membership[];
    };

export class TenantAccessError extends Error {
  constructor(message: string = "No tenes acceso a esa empresa") {
    super(message);
    this.name = "TenantAccessError";
  }
}

/** Devuelve el alcance del usuario de la request, o null si no hay sesion valida. */
export async function getTenantScope(
  request: FastifyRequest
): Promise<TenantScope | null> {
  const user = await checkSession(request);

  if (!user) {
    return null;
  }

  if (!user.external_user) {
    return { kind: "staff", userId: user.id, email: user.email };
  }

  const memberships = await prisma.userClient.findMany({
    where: { userId: user.id, client: { active: true } },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { client: { name: "asc" } },
  });

  return {
    kind: "client",
    userId: user.id,
    email: user.email,
    memberships: memberships.map((m) => ({
      clientId: m.clientId,
      name: m.client.name,
      viewAll: m.viewAll,
    })),
  };
}

/**
 * Igual que `getTenantScope` pero responde 401 y devuelve null si no hay sesion.
 * El handler debe cortar cuando esto devuelve null.
 */
export async function requireTenantScope(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<TenantScope | null> {
  const scope = await getTenantScope(request);

  if (!scope) {
    reply.code(401).send({ message: "Unauthorized", success: false });
    return null;
  }

  return scope;
}

export function isStaff(
  scope: TenantScope
): scope is { kind: "staff"; userId: string; email: string } {
  return scope.kind === "staff";
}

/**
 * Para acciones reservadas al personal de OnDesk (mover un ticket de empresa,
 * asignar agentes, borrar). Responde 403 y devuelve null si es usuario de cliente.
 */
export async function requireStaffScope(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<TenantScope | null> {
  const scope = await requireTenantScope(request, reply);

  if (!scope) {
    return null;
  }

  if (scope.kind !== "staff") {
    reply.code(403).send({
      message: "Solo el personal de OnDesk puede realizar esta accion",
      success: false,
    });
    return null;
  }

  return scope;
}

/** Ids de las empresas visibles para el usuario. Vacio = staff (todas). */
export function visibleClientIds(scope: TenantScope): string[] | null {
  return scope.kind === "staff" ? null : scope.memberships.map((m) => m.clientId);
}

/**
 * Fragmento `where` de Prisma que limita los tickets al alcance del usuario.
 * `clientId` opcional acota a una empresa concreta (el selector de empresa activa).
 */
export function tenantTicketWhere(scope: TenantScope, clientId?: string): any {
  if (scope.kind === "staff") {
    return clientId ? { clientId } : {};
  }

  let memberships = scope.memberships;

  if (clientId) {
    memberships = memberships.filter((m) => m.clientId === clientId);

    if (memberships.length === 0) {
      throw new TenantAccessError();
    }
  }

  const clientIds = memberships.map((m) => m.clientId);
  const viewAllIds = memberships.filter((m) => m.viewAll).map((m) => m.clientId);

  return {
    AND: [
      { clientId: { in: clientIds } },
      {
        OR: [
          // empresas donde la membresia le permite ver todo
          ...(viewAllIds.length ? [{ clientId: { in: viewAllIds } }] : []),
          // y en el resto, solo lo propio: creado por el, asignado a el,
          // o entrado por mail desde su casilla
          { createdById: scope.userId },
          { userId: scope.userId },
          { email: scope.email },
        ],
      },
    ],
  };
}

/** Combina el `where` propio del endpoint con el del tenant, sin pisarse. */
export function scopedTicketWhere(
  base: any,
  scope: TenantScope,
  clientId?: string
): any {
  return { AND: [base ?? {}, tenantTicketWhere(scope, clientId)] };
}

/**
 * Atajo para los endpoints de listado: resuelve sesion, empresa activa y scope
 * en un solo paso. Devuelve el `where` listo para Prisma, o null si ya se
 * respondio 401/403 (en ese caso el handler tiene que cortar).
 */
export async function resolveTicketWhere(
  request: FastifyRequest,
  reply: FastifyReply,
  base: any = {}
): Promise<any | null> {
  const scope = await requireTenantScope(request, reply);

  if (!scope) {
    return null;
  }

  try {
    return scopedTicketWhere(base, scope, readClientFilter(request));
  } catch (error) {
    if (handleTenantError(error, reply)) {
      return null;
    }

    throw error;
  }
}

/**
 * Superficie de administracion: cerrada para usuarios de cliente.
 *
 * Ojo: `requirePermission` de lib/roles.ts deja pasar a todos mientras
 * `config.roles_active` este apagado, que es el default. Sin esta lista, un
 * usuario de cliente logueado podria leer la configuracion SMTP, los roles, las
 * colas de correo o los logs del servidor. Esto no depende de esa config.
 *
 * `methods` vacio = todos los metodos.
 */
const ADMIN_ONLY_ROUTES: { prefix: string; methods?: string[] }[] = [
  { prefix: "/api/v1/config/" },
  { prefix: "/api/v1/role" }, // /role/... y /roles/...
  { prefix: "/api/v1/webhook" },
  { prefix: "/api/v1/admin/" },
  { prefix: "/api/v1/email-queue" },
  { prefix: "/api/v1/users/all" },
  { prefix: "/api/v1/user/reset-password" },
  { prefix: "/api/v1/data/logs" },
  { prefix: "/api/v1/time/" },
  { prefix: "/api/v1/auth/user/role" },
  // Las plantillas de email son globales: quien las edita escribe los mails
  // que la plataforma le manda a TODAS las empresas.
  { prefix: "/api/v1/ticket/templates" },
  { prefix: "/api/v1/ticket/template/" },
  // La base de conocimiento se lee, pero solo OnDesk la escribe.
  {
    prefix: "/api/v1/knowledge-base",
    methods: ["POST", "PUT", "DELETE", "PATCH"],
  },
];

export function isAdminOnlyRoute(url: string, method: string): boolean {
  const path = url.split("?")[0];

  return ADMIN_ONLY_ROUTES.some(
    (route) =>
      path.startsWith(route.prefix) &&
      (!route.methods || route.methods.includes(method.toUpperCase()))
  );
}

/** Nombre de la cookie donde el dashboard guarda la empresa activa. */
export const ACTIVE_CLIENT_COOKIE = "ondesk_client";

function readCookie(request: FastifyRequest, name: string): string | undefined {
  const header = request.headers.cookie;

  if (!header) {
    return undefined;
  }

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");

    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return undefined;
}

/**
 * Lee la empresa activa. Primero query o body (llamadas explicitas), y si no,
 * la cookie que deja el selector del dashboard: asi todo el front queda acotado
 * sin tener que tocar cada fetch.
 *
 * No hace falta validar el valor aca: si el usuario no pertenece a esa empresa,
 * `tenantTicketWhere` lanza TenantAccessError y la request termina en 403.
 */
export function readClientFilter(request: FastifyRequest): string | undefined {
  const fromQuery = (request.query as any)?.clientId;
  const fromBody = (request.body as any)?.clientId;
  const value =
    fromQuery ?? fromBody ?? readCookie(request, ACTIVE_CLIENT_COOKIE);

  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** true si el usuario puede ver ese ticket. Usar antes de comentar, adjuntar, etc. */
export async function canAccessTicket(
  scope: TenantScope,
  ticketId: string
): Promise<boolean> {
  if (scope.kind === "staff") {
    return true;
  }

  const ticket = await prisma.ticket.findFirst({
    where: scopedTicketWhere({ id: ticketId }, scope),
    select: { id: true },
  });

  return Boolean(ticket);
}

/**
 * Corta la request con 404 si el ticket no es visible para el usuario.
 * Devuelve true cuando el handler puede seguir.
 * Se responde 404 y no 403 para no revelar que el ticket existe en otra empresa.
 */
export async function assertTicketAccess(
  scope: TenantScope,
  ticketId: string,
  reply: FastifyReply
): Promise<boolean> {
  const allowed = await canAccessTicket(scope, ticketId);

  if (!allowed) {
    reply.code(404).send({ message: "Ticket no encontrado", success: false });
    return false;
  }

  return true;
}

/**
 * Resuelve a que empresa pertenece un ticket que se esta creando.
 * El staff puede elegir cualquiera; un usuario de cliente solo las suyas y,
 * si tiene una sola, no hace falta que la mande.
 */
export function resolveClientForCreate(
  scope: TenantScope,
  requestedClientId?: string
): string | null {
  if (scope.kind === "staff") {
    return requestedClientId ?? null;
  }

  if (scope.memberships.length === 0) {
    throw new TenantAccessError("El usuario no pertenece a ninguna empresa");
  }

  if (!requestedClientId) {
    if (scope.memberships.length === 1) {
      return scope.memberships[0].clientId;
    }

    throw new TenantAccessError("Tenes que indicar la empresa del ticket");
  }

  const membership = scope.memberships.find(
    (m) => m.clientId === requestedClientId
  );

  if (!membership) {
    throw new TenantAccessError();
  }

  return membership.clientId;
}

/** Traduce un TenantAccessError en 403 y cualquier otro error lo re-lanza. */
export function handleTenantError(error: unknown, reply: FastifyReply): boolean {
  if (error instanceof TenantAccessError) {
    reply.code(403).send({ message: error.message, success: false });
    return true;
  }

  return false;
}
