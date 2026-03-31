import { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "../config/environment";
import {
  getGraphQLOperationCatalog,
  getGraphQLOperationMarkdown,
} from "./graphqlOperationCatalog";

const createSwaggerSpec = () => {
  const catalog = getGraphQLOperationCatalog();
  const markdown = getGraphQLOperationMarkdown();
  const allOperations = [...catalog.queries, ...catalog.mutations];

  const requestExamples = Object.fromEntries(
    allOperations.map((operation) => [
      `${operation.kind}_${operation.name}`,
      {
        summary: `${operation.kind.toUpperCase()} ${operation.name}`,
        value: operation.requestExample,
      },
    ]),
  );

  const responseExamples = Object.fromEntries(
    allOperations.map((operation) => [
      `${operation.kind}_${operation.name}`,
      {
        summary: `${operation.kind.toUpperCase()} ${operation.name}`,
        value: operation.responseExample,
      },
    ]),
  );

  return {
    openapi: "3.0.3",
    info: {
      title: "Hotel New API",
      version: "1.0.0",
      description:
        "GraphQL-only API. Execute all operations through POST /api/graphql.",
    },
    servers: [{ url: `http://localhost:${env.PORT}` }],
    tags: [
      {
        name: "GraphQL",
        description: "Primary API transport.",
      },
      {
        name: "Documentation",
        description: "Machine-readable operation catalog.",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        GraphQLRequest: {
          type: "object",
          required: ["query"],
          properties: {
            query: {
              type: "string",
              description: "GraphQL query or mutation string.",
            },
            variables: {
              type: "object",
              additionalProperties: true,
              description: "Variables object for the GraphQL operation.",
            },
            operationName: {
              type: "string",
              description:
                "Optional operation name in a multi-operation document.",
            },
          },
        },
        GraphQLResponse: {
          type: "object",
          properties: {
            data: {
              type: "object",
              additionalProperties: true,
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    paths: {
      "/api/graphql": {
        post: {
          tags: ["GraphQL"],
          summary: "Execute GraphQL operation",
          description: [
            "Send all API operations to this endpoint using a GraphQL request body.",
            "",
            markdown,
          ].join("\n"),
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GraphQLRequest",
                },
                examples: {
                  ...requestExamples,
                },
              },
            },
          },
          responses: {
            "200": {
              description: "GraphQL execution result",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/GraphQLResponse",
                  },
                  examples: {
                    ...responseExamples,
                  },
                },
              },
            },
          },
        },
      },
      "/api/docs/graphql-operations": {
        get: {
          tags: ["Documentation"],
          summary: "List all GraphQL operations",
          description:
            "Returns every query and mutation currently exposed by the GraphQL schema.",
          responses: {
            "200": {
              description: "Operation catalog",
              content: {
                "application/json": {
                  examples: {
                    operationCatalog: {
                      summary: "All operations with request/response examples",
                      value: {
                        success: true,
                        data: {
                          queries: catalog.queries,
                          mutations: catalog.mutations,
                          total:
                            catalog.queries.length + catalog.mutations.length,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/docs.json": {
        get: {
          tags: ["Documentation"],
          summary: "Raw OpenAPI JSON",
          responses: {
            "200": {
              description: "OpenAPI document",
            },
          },
        },
      },
    },
    "x-graphql-operation-count": {
      queries: catalog.queries.length,
      mutations: catalog.mutations.length,
      total: catalog.queries.length + catalog.mutations.length,
    },
  };
};

export const setupSwaggerDocs = (app: Express) => {
  app.get("/api/docs/graphql-operations", (_req: Request, res: Response) => {
    const catalog = getGraphQLOperationCatalog();
    res.json({
      success: true,
      data: {
        queries: catalog.queries,
        mutations: catalog.mutations,
        total: catalog.queries.length + catalog.mutations.length,
      },
    });
  });

  app.get("/api/docs.json", (_req: Request, res: Response) => {
    res.json(createSwaggerSpec());
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(createSwaggerSpec(), {
      explorer: true,
      customSiteTitle: "Hotel New API Docs",
    }),
  );
};

export default setupSwaggerDocs;
