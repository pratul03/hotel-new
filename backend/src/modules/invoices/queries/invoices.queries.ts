import { prisma } from "../../../config/database";

export const invoicesQueries = {
  findById(id: string) {
    return prisma.invoiceDocument.findUnique({ where: { id } });
  },

  listRecent(limit = 200) {
    return prisma.invoiceDocument.findMany({
      orderBy: { issuedAt: "desc" },
      take: limit,
    });
  },
};

export default invoicesQueries;
