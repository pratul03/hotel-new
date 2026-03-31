const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../src/graphql/schema");

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

const extractResolverBody = (src, exportName) => {
  const token = `export const ${exportName} = {`;
  const start = src.indexOf(token);
  if (start === -1) throw new Error(`Missing ${token}`);

  const header = src.slice(0, start);
  const bodyStart = start + token.length;
  const bodyEnd = src.lastIndexOf("\n};");
  if (bodyEnd === -1)
    throw new Error(`Missing resolver closing in ${exportName}`);

  const body = src.slice(bodyStart, bodyEnd);
  return { header, body };
};

const extractSegment = (body, startKey, endKey) => {
  const startNeedle = `\n  ${startKey}:`;
  const start = body.indexOf(startNeedle);
  if (start === -1) throw new Error(`Missing start key ${startKey}`);

  let end = body.length;
  if (endKey) {
    const endNeedle = `\n  ${endKey}:`;
    end = body.indexOf(endNeedle, start + startNeedle.length);
    if (end === -1) throw new Error(`Missing end key ${endKey}`);
  }

  return body.slice(start, end).trim();
};

const buildResolverDomainFiles = ({
  fileName,
  exportName,
  outDirName,
  domains,
}) => {
  const filePath = path.join(root, "resolvers", fileName);
  const src = fs.readFileSync(filePath, "utf8");
  const { header, body } = extractResolverBody(src, exportName);

  const outDir = path.join(root, "resolvers", outDirName);
  ensureDir(outDir);

  for (const domain of domains) {
    const segment = extractSegment(body, domain.startKey, domain.endKey);
    const content = `${header}export const ${domain.exportConst} = {\n  ${segment.replace(/^\s{2}/, "")}\n};\n`;
    fs.writeFileSync(path.join(outDir, `${domain.file}.ts`), content);
  }

  const importLines = domains
    .map((d) => `import { ${d.exportConst} } from "./${outDirName}/${d.file}";`)
    .join("\n");
  const spreadLines = domains.map((d) => `  ...${d.exportConst},`).join("\n");
  const composed = `${importLines}\n\nexport const ${exportName} = {\n${spreadLines}\n};\n`;

  fs.writeFileSync(filePath, composed);
};

buildResolverDomainFiles({
  fileName: "query.ts",
  exportName: "queryResolvers",
  outDirName: "query",
  domains: [
    {
      file: "core",
      exportConst: "coreQueryResolvers",
      startKey: "me",
      endKey: "authSessions",
    },
    {
      file: "account",
      exportConst: "accountQueryResolvers",
      startKey: "authSessions",
      endKey: "wishlist",
    },
    {
      file: "wishlist",
      exportConst: "wishlistQueryResolvers",
      startKey: "wishlist",
      endKey: "supportTickets",
    },
    {
      file: "supportReports",
      exportConst: "supportReportsQueryResolvers",
      startKey: "supportTickets",
      endKey: "hostProfile",
    },
    {
      file: "host",
      exportConst: "hostQueryResolvers",
      startKey: "hostProfile",
      endKey: "promotions",
    },
    {
      file: "commerce",
      exportConst: "commerceQueryResolvers",
      startKey: "promotions",
      endKey: "reviews",
    },
    {
      file: "reviews",
      exportConst: "reviewQueryResolvers",
      startKey: "reviews",
      endKey: null,
    },
  ],
});

buildResolverDomainFiles({
  fileName: "mutation.ts",
  exportName: "mutationResolvers",
  outDirName: "mutation",
  domains: [
    {
      file: "core",
      exportConst: "coreMutationResolvers",
      startKey: "register",
      endKey: "logout",
    },
    {
      file: "account",
      exportConst: "accountMutationResolvers",
      startKey: "logout",
      endKey: "wishlistAdd",
    },
    {
      file: "wishlist",
      exportConst: "wishlistMutationResolvers",
      startKey: "wishlistAdd",
      endKey: "supportCreateTicket",
    },
    {
      file: "supportReports",
      exportConst: "supportReportsMutationResolvers",
      startKey: "supportCreateTicket",
      endKey: "createHostProfile",
    },
    {
      file: "host",
      exportConst: "hostMutationResolvers",
      startKey: "createHostProfile",
      endKey: "validatePromotion",
    },
    {
      file: "commerce",
      exportConst: "commerceMutationResolvers",
      startKey: "validatePromotion",
      endKey: "createReview",
    },
    {
      file: "reviews",
      exportConst: "reviewMutationResolvers",
      startKey: "createReview",
      endKey: null,
    },
  ],
});

const typedefPath = path.join(root, "typedefs.ts");
const typedefSrc = fs.readFileSync(typedefPath, "utf8");
const sdlStart = typedefSrc.indexOf("`#graphql");
const sdlEnd = typedefSrc.lastIndexOf("`;");
if (sdlStart === -1 || sdlEnd === -1) {
  throw new Error("Could not parse graphQLTypeDefs template");
}

const sdl = typedefSrc.slice(sdlStart + 1, sdlEnd);

const markers = {
  account: "\n  type SessionRecord",
  wishlist: "\n  type WishlistItem",
  supportReports: "\n  type SupportTicket",
  host: "\n  type HostProfile",
  commerce: "\n  type Promotion",
  operations: "\n  type Query",
};

const iAccount = sdl.indexOf(markers.account);
const iWishlist = sdl.indexOf(markers.wishlist);
const iSupport = sdl.indexOf(markers.supportReports);
const iHost = sdl.indexOf(markers.host);
const iCommerce = sdl.indexOf(markers.commerce);
const iOperations = sdl.indexOf(markers.operations);

if (
  [iAccount, iWishlist, iSupport, iHost, iCommerce, iOperations].some(
    (i) => i === -1,
  )
) {
  throw new Error("Missing one or more typedef boundary markers");
}

const sections = {
  core: sdl.slice(0, iAccount).trimEnd(),
  account: sdl.slice(iAccount, iWishlist).trimEnd(),
  wishlist: sdl.slice(iWishlist, iSupport).trimEnd(),
  supportReports: sdl.slice(iSupport, iHost).trimEnd(),
  host: sdl.slice(iHost, iCommerce).trimEnd(),
  commerce: sdl.slice(iCommerce, iOperations).trimEnd(),
  operations: sdl.slice(iOperations).trimEnd(),
};

const typedefDir = path.join(root, "typedefs");
ensureDir(typedefDir);

for (const [name, content] of Object.entries(sections)) {
  const out = `export const ${name}TypeDefs = \`${content}\`;\n`;
  fs.writeFileSync(path.join(typedefDir, `${name}.ts`), out);
}

const typedefComposer = `import { coreTypeDefs } from "./typedefs/core";\nimport { accountTypeDefs } from "./typedefs/account";\nimport { wishlistTypeDefs } from "./typedefs/wishlist";\nimport { supportReportsTypeDefs } from "./typedefs/supportReports";\nimport { hostTypeDefs } from "./typedefs/host";\nimport { commerceTypeDefs } from "./typedefs/commerce";\nimport { operationsTypeDefs } from "./typedefs/operations";\n\nexport const graphQLTypeDefs = [\n  coreTypeDefs,\n  accountTypeDefs,\n  wishlistTypeDefs,\n  supportReportsTypeDefs,\n  hostTypeDefs,\n  commerceTypeDefs,\n  operationsTypeDefs,\n].join("\\n");\n`;

fs.writeFileSync(typedefPath, typedefComposer);
console.log("GraphQL schema split completed.");
