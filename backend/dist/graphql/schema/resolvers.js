"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphQLResolvers = void 0;
const mutation_1 = require("./resolvers/mutation");
const query_1 = require("./resolvers/query");
const typeResolvers_1 = require("./resolvers/typeResolvers");
exports.graphQLResolvers = {
    Query: query_1.queryResolvers,
    Mutation: mutation_1.mutationResolvers,
    ...typeResolvers_1.typeResolvers,
};
