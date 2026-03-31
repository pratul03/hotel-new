import { coreMutationResolvers } from "./mutation/core";
import { accountMutationResolvers } from "./mutation/account";
import { wishlistMutationResolvers } from "./mutation/wishlist";
import { supportReportsMutationResolvers } from "./mutation/supportReports";
import { hostMutationResolvers } from "./mutation/host";
import { commerceMutationResolvers } from "./mutation/commerce";
import { reviewMutationResolvers } from "./mutation/reviews";

export const mutationResolvers = {
  ...coreMutationResolvers,
  ...accountMutationResolvers,
  ...wishlistMutationResolvers,
  ...supportReportsMutationResolvers,
  ...hostMutationResolvers,
  ...commerceMutationResolvers,
  ...reviewMutationResolvers,
};
