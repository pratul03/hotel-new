import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { Express, Request, Response } from "express";
import { createGraphQLContext, GraphQLContext } from "./context";
import { graphQLResolvers, graphQLTypeDefs } from "./schema";

let apolloServer: ApolloServer<GraphQLContext> | undefined;

const getApolloServer = async (): Promise<ApolloServer<GraphQLContext>> => {
  if (apolloServer) {
    return apolloServer;
  }

  apolloServer = new ApolloServer<GraphQLContext>({
    typeDefs: graphQLTypeDefs,
    resolvers: graphQLResolvers,
  });

  await apolloServer.start();
  return apolloServer;
};

export const setupGraphQL = async (app: Express) => {
  const server = await getApolloServer();

  app.use(
    "/api/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }) =>
        createGraphQLContext(req as Request, res as Response),
    }),
  );
};

export default setupGraphQL;
