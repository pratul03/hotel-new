"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGraphQL = void 0;
const server_1 = require("@apollo/server");
const express5_1 = require("@as-integrations/express5");
const context_1 = require("./context");
const schema_1 = require("./schema");
let apolloServer;
const getApolloServer = async () => {
    if (apolloServer) {
        return apolloServer;
    }
    apolloServer = new server_1.ApolloServer({
        typeDefs: schema_1.graphQLTypeDefs,
        resolvers: schema_1.graphQLResolvers,
    });
    await apolloServer.start();
    return apolloServer;
};
const setupGraphQL = async (app) => {
    const server = await getApolloServer();
    app.use("/api/graphql", (0, express5_1.expressMiddleware)(server, {
        context: async ({ req, res }) => (0, context_1.createGraphQLContext)(req, res),
    }));
};
exports.setupGraphQL = setupGraphQL;
exports.default = exports.setupGraphQL;
