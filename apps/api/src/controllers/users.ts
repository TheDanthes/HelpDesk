import bcrypt from "bcrypt";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { track } from "../lib/hog";
import { requirePermission } from "../lib/roles";
import { checkSession } from "../lib/session";
import { requireStaffScope } from "../lib/tenant";
import { prisma } from "../prisma";

export function userRoutes(fastify: FastifyInstance) {
  // All users
  fastify.get(
    "/api/v1/users/all",
    {
      preHandler: requirePermission(["user::read"]),
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              users: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
              success: { type: "boolean" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const scope = await requireStaffScope(request, reply);
      if (!scope) return;

      const { includeExternal }: any = request.query ?? {};

      const users = await prisma.user.findMany({
        where:
          includeExternal === "true" || includeExternal === true
            ? {}
            : { external_user: false },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          external_user: true,
          createdAt: true,
          updatedAt: true,
          language: true,
          clients: {
            select: {
              clientId: true,
              viewAll: true,
              client: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      });

      reply.send({
        users,
        success: true,
      });
    }
  );

  // New user
  fastify.post(
    "/api/v1/user/new",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            email: { type: "string" },
            password: { type: "string" },
            name: { type: "string" },
            admin: { type: "boolean" },
            external_user: { type: "boolean" },
            clients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  clientId: { type: "string" },
                  viewAll: { type: "boolean" },
                },
                required: ["clientId"],
              },
            },
          },
          required: ["email", "password", "name", "admin"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              failed: { type: "boolean" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await checkSession(request);

      if (session!.isAdmin) {
        const {
          email,
          password,
          name,
          admin,
          external_user,
          clients,
        }: any = request.body;

        const e = email.toLowerCase();

        const hash = await bcrypt.hash(password, 10);

        // Un usuario de cliente (external_user) nace con sus membresias:
        // sin al menos una no ve ningun ticket.
        const memberships: { clientId: string; viewAll: boolean }[] =
          Array.isArray(clients)
            ? clients
                .filter((c: any) => c && typeof c.clientId === "string")
                .map((c: any) => ({
                  clientId: c.clientId,
                  viewAll: Boolean(c.viewAll),
                }))
            : [];

        await prisma.user.create({
          data: {
            name,
            email: e,
            password: hash,
            isAdmin: admin,
            external_user: Boolean(external_user),
            clients: memberships.length
              ? { create: memberships }
              : undefined,
          },
        });

        const client = track();

        client.capture({
          event: "user_created",
          distinctId: "uuid",
        });

        client.shutdown();

        reply.send({
          success: true,
        });
      } else {
        reply.status(403).send({ message: "Unauthorized", failed: true });
      }
    }
  );

  // (ADMIN) Reset password
  fastify.put(
    "/api/v1/user/reset-password",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            password: { type: "string" },
            id: { type: "string" },
          },
          required: ["password", "id"],
        },
        response: {
          201: {
            type: "object",
            properties: {
              message: { type: "string" },
              failed: { type: "boolean" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { password, id }: any = request.body;

      const session = await checkSession(request);

      if (session!.isAdmin) {
        const hashedPass = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: id },
          data: {
            password: hashedPass,
          },
        });
        reply
          .status(201)
          .send({ message: "password updated success", failed: false });
      } else {
        reply.status(403).send({ message: "Unauthorized", failed: true });
      }
    }
  );

  // Mark Notification as read
  fastify.get(
    "/api/v1/user/notifcation/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id }: any = request.params;
      const session = await checkSession(request);
      
      if (!session) {
        return reply.code(401).send({
          message: "Unauthorized",
          success: false,
        });
      }

      // Get the notification and verify it belongs to the user
      const notification = await prisma.notifications.findUnique({
        where: { id: id }
      });
      
      if (!notification) {
        return reply.code(404).send({
          message: "Notification not found",
          success: false,
        });
      }
      
      if (notification.userId !== session.id) {
        return reply.code(403).send({
          message: "Access denied. You can only manage your own notifications.",
          success: false,
        });
      }

      await prisma.notifications.update({
        where: { id: id },
        data: {
          read: true,
        },
      });

      reply.send({
        success: true,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // Membresias: que empresas ve cada usuario y con que alcance.
  // Solo el personal de OnDesk administra esto.
  // ---------------------------------------------------------------------------

  // Empresas asignadas a un usuario
  fastify.get(
    "/api/v1/user/:id/clients",
    {
      preHandler: requirePermission(["user::read"]),
      schema: {
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              clients: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const scope = await requireStaffScope(request, reply);
      if (!scope) return;

      const { id }: any = request.params;

      const memberships = await prisma.userClient.findMany({
        where: { userId: id },
        include: { client: { select: { id: true, name: true, active: true } } },
        orderBy: { client: { name: "asc" } },
      });

      reply.send({
        success: true,
        clients: memberships.map((m) => ({
          clientId: m.clientId,
          name: m.client.name,
          active: m.client.active,
          viewAll: m.viewAll,
        })),
      });
    }
  );

  // Asignar una empresa a un usuario (o actualizar el permiso si ya la tenia)
  fastify.post(
    "/api/v1/user/:id/clients",
    {
      preHandler: requirePermission(["user::manage"]),
      schema: {
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            clientId: { type: "string" },
            viewAll: { type: "boolean" },
          },
          required: ["clientId"],
        },
        response: {
          200: {
            type: "object",
            properties: { success: { type: "boolean" } },
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const scope = await requireStaffScope(request, reply);
      if (!scope) return;

      const { id }: any = request.params;
      const { clientId, viewAll }: any = request.body;

      const [user, client] = await Promise.all([
        prisma.user.findUnique({ where: { id }, select: { id: true } }),
        prisma.client.findUnique({
          where: { id: clientId },
          select: { id: true },
        }),
      ]);

      if (!user || !client) {
        return reply.code(404).send({
          message: "Usuario o empresa inexistente",
          success: false,
        });
      }

      await prisma.userClient.upsert({
        where: { userId_clientId: { userId: id, clientId } },
        update: { viewAll: Boolean(viewAll), updatedAt: new Date() },
        create: { userId: id, clientId, viewAll: Boolean(viewAll) },
      });

      reply.send({ success: true });
    }
  );

  // Cambiar el permiso de ver todos los tickets de esa empresa
  fastify.put(
    "/api/v1/user/:id/clients/:clientId",
    {
      preHandler: requirePermission(["user::manage"]),
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
            clientId: { type: "string" },
          },
          required: ["id", "clientId"],
        },
        body: {
          type: "object",
          properties: { viewAll: { type: "boolean" } },
          required: ["viewAll"],
        },
        response: {
          200: {
            type: "object",
            properties: { success: { type: "boolean" } },
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const scope = await requireStaffScope(request, reply);
      if (!scope) return;

      const { id, clientId }: any = request.params;
      const { viewAll }: any = request.body;

      const membership = await prisma.userClient.findUnique({
        where: { userId_clientId: { userId: id, clientId } },
      });

      if (!membership) {
        return reply
          .code(404)
          .send({ message: "El usuario no pertenece a esa empresa", success: false });
      }

      await prisma.userClient.update({
        where: { userId_clientId: { userId: id, clientId } },
        data: { viewAll: Boolean(viewAll), updatedAt: new Date() },
      });

      reply.send({ success: true });
    }
  );

  // Quitarle una empresa a un usuario
  fastify.delete(
    "/api/v1/user/:id/clients/:clientId",
    {
      preHandler: requirePermission(["user::manage"]),
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
            clientId: { type: "string" },
          },
          required: ["id", "clientId"],
        },
        response: {
          200: {
            type: "object",
            properties: { success: { type: "boolean" } },
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const scope = await requireStaffScope(request, reply);
      if (!scope) return;

      const { id, clientId }: any = request.params;

      await prisma.userClient.deleteMany({
        where: { userId: id, clientId },
      });

      reply.send({ success: true });
    }
  );
}
