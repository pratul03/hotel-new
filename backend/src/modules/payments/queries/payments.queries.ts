import { prisma } from "../../../config/database";

export const paymentsQueries = {
  findById(id: string) {
    return prisma.payment.findUnique({ where: { id } });
  },

  findByBooking(bookingId: string) {
    return prisma.payment.findUnique({ where: { bookingId } });
  },
};

export default paymentsQueries;
