import { coreTypeDefs } from "./typedefs/core";
import { accountTypeDefs } from "./typedefs/account";
import { wishlistTypeDefs } from "./typedefs/wishlist";
import { supportReportsTypeDefs } from "./typedefs/supportReports";
import { hostTypeDefs } from "./typedefs/host";
import { commerceTypeDefs } from "./typedefs/commerce";
import { operationsTypeDefs } from "./typedefs/operations";

export const graphQLTypeDefs = [
  coreTypeDefs,
  accountTypeDefs,
  wishlistTypeDefs,
  supportReportsTypeDefs,
  hostTypeDefs,
  commerceTypeDefs,
  operationsTypeDefs,
].join("\n");
