import { prisma } from '../../../config/database';

export const searchHistoryService = {
  async add(
    userId: string,
    payload: { queryLocation: string; checkIn?: Date; checkOut?: Date; guests?: number }
  ) {
    return prisma.searchHistory.create({
      data: {
        userId,
        queryLocation: payload.queryLocation,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
        guests: payload.guests || 1,
      },
    });
  },

  async list(userId: string) {
    return prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async clear(userId: string) {
    await prisma.searchHistory.deleteMany({ where: { userId } });
    return { cleared: true };
  },
};

export default searchHistoryService;
