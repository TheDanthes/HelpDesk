import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requirePermission } from "../lib/roles";
import { requireStaffScope, resolveTicketWhere } from "../lib/tenant";
import { prisma } from "../prisma";

export function dataRoutes(fastify: FastifyInstance) {
  // Get total count of all tickets
  fastify.get(
    "/api/v1/data/tickets/all",
    {
      preHandler: requirePermission(["issue::read"]),
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              count: { type: "number" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const where = await resolveTicketWhere(request, reply, { hidden: false });
      if (!where) return;

      const result = await prisma.ticket.count({ where });

      reply.send({ count: result });
    }
  );

  // Get total count of all completed tickets
  fastify.get(
    "/api/v1/data/tickets/completed",
    {
      preHandler: requirePermission(["issue::read"]),
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              count: { type: "number" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const where = await resolveTicketWhere(request, reply, {
        isComplete: true,
        hidden: false,
      });
      if (!where) return;

      const result = await prisma.ticket.count({ where });

      reply.send({ count: result });
    }
  );

  // Get total count of all open tickets
  fastify.get(
    "/api/v1/data/tickets/open",
    {
      preHandler: requirePermission(["issue::read"]),
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              count: { type: "number" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const where = await resolveTicketWhere(request, reply, {
        isComplete: false,
        hidden: false,
      });
      if (!where) return;

      const result = await prisma.ticket.count({ where });

      reply.send({ count: result });
    }
  );

  // Get total of all unsassigned tickets
  fastify.get(
    "/api/v1/data/tickets/unassigned",
    {
      preHandler: requirePermission(["issue::read"]),
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              count: { type: "number" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const where = await resolveTicketWhere(request, reply, {
        userId: null,
        hidden: false,
        isComplete: false,
      });
      if (!where) return;

      const result = await prisma.ticket.count({ where });

      reply.send({ count: result });
    }
  );

  // Get all logs
  fastify.get(
    "/api/v1/data/logs",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              logs: { type: "string" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Los logs del servidor son de OnDesk, no de los clientes.
      const scope = await requireStaffScope(request, reply);
      if (!scope) return;

      const logs = await import("fs/promises").then((fs) =>
        fs.readFile("logs.log", "utf-8")
      );
      reply.send({ logs: logs });
    }
  );
}
