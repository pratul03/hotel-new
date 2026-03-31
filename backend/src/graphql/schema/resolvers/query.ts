import { coreQueryResolvers } from "./query/core";
import { accountQueryResolvers } from "./query/account";
import { wishlistQueryResolvers } from "./query/wishlist";
import { supportReportsQueryResolvers } from "./query/supportReports";
import { hostQueryResolvers } from "./query/host";
import { commerceQueryResolvers } from "./query/commerce";
import { reviewQueryResolvers } from "./query/reviews";

export const queryResolvers = {
  ...coreQueryResolvers,
  ...accountQueryResolvers,
  ...wishlistQueryResolvers,
  ...supportReportsQueryResolvers,
  ...hostQueryResolvers,
  ...commerceQueryResolvers,
  ...reviewQueryResolvers,
};
