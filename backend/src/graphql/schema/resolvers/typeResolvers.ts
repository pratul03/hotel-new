import { accountTypeResolvers } from "./type/account";
import { commerceTypeResolvers } from "./type/commerce";
import { coreTypeResolvers } from "./type/core";
import { hostTypeResolvers } from "./type/host";
import { supportReportsTypeResolvers } from "./type/supportReports";
import { wishlistTypeResolvers } from "./type/wishlist";

export const typeResolvers = {
  ...coreTypeResolvers,
  ...accountTypeResolvers,
  ...wishlistTypeResolvers,
  ...supportReportsTypeResolvers,
  ...hostTypeResolvers,
  ...commerceTypeResolvers,
};
