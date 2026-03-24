import { prisma } from "../../../config/database";
import { AppError } from "../../../utils";

const COMPLETED_PAYMENT_STATUSES = ["completed"];
const EARNING_BOOKING_STATUSES = ["confirmed", "checked_in", "checked_out"];
const SETTLED_BOOKING_STATUSES = ["checked_out"];
const PAYOUT_DEDUCT_STATUSES = ["requested", "processing", "paid"];

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const buildRecentMonthKeys = (months: number) => {
  const now = new Date();
  const keys: string[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(getMonthKey(d));
  }

  return keys;
};

export const hostFinanceService = {
  async getEarningsOverview(hostId: string, months: number = 6) {
    const safeMonths = Math.min(Math.max(months, 1), 24);

    const bookings = await prisma.booking.findMany({
      where: {
        room: { hotel: { ownerId: hostId } },
        status: { in: EARNING_BOOKING_STATUSES },
      },
      include: {
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const paidBookings = bookings.filter((booking) =>
      COMPLETED_PAYMENT_STATUSES.includes(booking.payment?.status ?? ""),
    );

    const totalGross = paidBookings.reduce(
      (sum, booking) => sum + booking.amount,
      0,
    );
    const totalServiceFee = paidBookings.reduce(
      (sum, booking) => sum + (booking.payment?.serviceFee ?? 0),
      0,
    );
    const totalTax = paidBookings.reduce(
      (sum, booking) => sum + (booking.payment?.tax ?? 0),
      0,
    );
    const totalNet = totalGross - totalServiceFee - totalTax;

    const pendingPayoutAmount = bookings
      .filter(
        (booking) =>
          booking.status !== "checked_out" &&
          COMPLETED_PAYMENT_STATUSES.includes(booking.payment?.status ?? ""),
      )
      .reduce((sum, booking) => sum + booking.amount, 0);

    const monthKeys = buildRecentMonthKeys(safeMonths);
    const byMonth = new Map<string, number>(monthKeys.map((key) => [key, 0]));

    for (const booking of paidBookings) {
      const key = getMonthKey(new Date(booking.createdAt));
      if (byMonth.has(key)) {
        byMonth.set(key, (byMonth.get(key) ?? 0) + booking.amount);
      }
    }

    const monthlyGross = monthKeys.map((key) => ({
      month: key,
      gross: byMonth.get(key) ?? 0,
    }));

    return {
      totalGross,
      totalServiceFee,
      totalTax,
      totalNet,
      pendingPayoutAmount,
      paidBookingsCount: paidBookings.length,
      monthlyGross,
    };
  },

  async getTransactions(hostId: string, limit: number = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    const bookings = await prisma.booking.findMany({
      where: {
        room: { hotel: { ownerId: hostId } },
      },
      include: {
        guest: { select: { id: true, name: true, email: true } },
        room: {
          select: {
            id: true,
            roomType: true,
            hotel: { select: { id: true, name: true } },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
    });

    return bookings.map((booking) => ({
      bookingId: booking.id,
      createdAt: booking.createdAt,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      bookingStatus: booking.status,
      grossAmount: booking.amount,
      paymentStatus: booking.payment?.status ?? "pending",
      serviceFee: booking.payment?.serviceFee ?? 0,
      tax: booking.payment?.tax ?? 0,
      netAmount:
        booking.amount -
        (booking.payment?.serviceFee ?? 0) -
        (booking.payment?.tax ?? 0),
      guest: booking.guest,
      hotel: booking.room.hotel,
      room: { id: booking.room.id, roomType: booking.room.roomType },
    }));
  },

  async getPayoutAccount(hostId: string) {
    return prisma.hostPayoutAccount.findUnique({
      where: { userId: hostId },
    });
  },

  async upsertPayoutAccount(
    hostId: string,
    data: {
      accountHolderName: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      payoutMethod?: "bank_transfer" | "upi";
      upiId?: string;
    },
  ) {
    const accountNumberLast4 = data.accountNumber.slice(-4);

    return prisma.hostPayoutAccount.upsert({
      where: { userId: hostId },
      update: {
        accountHolderName: data.accountHolderName,
        bankName: data.bankName,
        accountNumberLast4,
        ifscCode: data.ifscCode.toUpperCase(),
        payoutMethod: data.payoutMethod ?? "bank_transfer",
        upiId: data.upiId,
      },
      create: {
        userId: hostId,
        accountHolderName: data.accountHolderName,
        bankName: data.bankName,
        accountNumberLast4,
        ifscCode: data.ifscCode.toUpperCase(),
        payoutMethod: data.payoutMethod ?? "bank_transfer",
        upiId: data.upiId,
      },
    });
  },

  async getPayoutHistory(hostId: string, limit: number = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const payouts = await prisma.hostPayout.findMany({
      where: { userId: hostId },
      orderBy: { requestedAt: "desc" },
      take: safeLimit,
    });

    const settledBookings = await prisma.booking.findMany({
      where: {
        room: { hotel: { ownerId: hostId } },
        status: { in: SETTLED_BOOKING_STATUSES },
      },
      include: { payment: true },
    });

    const settledAmount = settledBookings
      .filter((booking) =>
        COMPLETED_PAYMENT_STATUSES.includes(booking.payment?.status ?? ""),
      )
      .reduce((sum, booking) => sum + booking.amount, 0);

    const reservedInPayouts = payouts
      .filter((payout) => PAYOUT_DEDUCT_STATUSES.includes(payout.status))
      .reduce((sum, payout) => sum + payout.amount, 0);

    const availableForPayout = Math.max(settledAmount - reservedInPayouts, 0);

    return {
      availableForPayout,
      payouts,
    };
  },

  async requestPayout(hostId: string, amount: number, notes?: string) {
    const account = await prisma.hostPayoutAccount.findUnique({
      where: { userId: hostId },
    });
    if (!account) {
      throw new AppError("Payout account not configured", 400);
    }

    const history = await this.getPayoutHistory(hostId, 100);
    if (amount <= 0) {
      throw new AppError("Payout amount must be greater than 0", 400);
    }
    if (amount > history.availableForPayout) {
      throw new AppError("Requested payout exceeds available balance", 400);
    }

    return prisma.hostPayout.create({
      data: {
        userId: hostId,
        amount,
        status: "requested",
        notes,
      },
    });
  },
};
