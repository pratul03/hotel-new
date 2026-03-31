import { mutationResolvers } from "./resolvers/mutation";
import { queryResolvers } from "./resolvers/query";
import { typeResolvers } from "./resolvers/typeResolvers";

export const graphQLResolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers,
  ...typeResolvers,
};
