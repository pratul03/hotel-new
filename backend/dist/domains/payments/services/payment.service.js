"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const tslib_1 = require("tslib");
const node_crypto_1 = tslib_1.__importDefault(require("node:crypto"));
const razorpay_1 = tslib_1.__importDefault(require("razorpay"));
const database_1 = require("../../../config/database");
const environment_1 = require("../../../config/environment");
const utils_1 = require("../../../utils");
const eventPublisher_1 = require("../../../utils/eventPublisher");
const razorpay = new razorpay_1.default({
    key_id: environment_1.env.RAZORPAY_KEY_ID,
    key_secret: environment_1.env.RAZORPAY_KEY_SECRET,
});
const CHARGEBACK_STATUS_FLOW = {
    submitted: [
        "under_review",
        "evidence_requested",
        "resolved_won",
        "resolved_lost",
    ],
    under_review: ["evidence_requested", "resolved_won", "resolved_lost"],
    evidence_requested: ["under_review", "resolved_won", "resolved_lost"],
    resolved_won: [],
    resolved_lost: [],
};
const queueInvoiceGeneration = (payload) => {
    if (process.env.NODE_ENV === "test")
        return;
    void import("../../invoices/services/invoicing.service.js")
        .then(({ invoicingService }) => invoicingService.createDocument(payload.userId, {
        type: payload.type,
        title: payload.title,
        bookingId: payload.bookingId,
        paymentId: payload.paymentId,
        amount: payload.amount,
        metadata: payload.metadata,
    }))
        .catch(() => { });
};
exports.paymentService = {
    async reprocessStalePayments(actorUserId, options) {
        const actor = await database_1.prisma.user.findUnique({ where: { id: actorUserId } });
        if (!actor || actor.role !== "admin") {
            throw new utils_1.AppError("Only admins can reprocess stale payments", 403);
        }
        const olderThanMinutes = Math.min(180, Math.max(1, options?.olderThanMinutes ?? 10));
        const limit = Math.min(500, Math.max(1, options?.limit ?? 100));
        const staleBefore = new Date(Date.now() - olderThanMinutes * 60 * 1000);
        const candidates = await database_1.prisma.payment.findMany({
            where: {
                status: "processing",
                updatedAt: { lt: staleBefore },
            },
            orderBy: { updatedAt: "asc" },
            take: limit,
            select: {
                id: true,
                bookingId: true,
                amount: true,
                updatedAt: true,
            },
        });
        if (options?.dryRun) {
            return {
                dryRun: true,
                olderThanMinutes,
                scanned: candidates.length,
                candidates: candidates.map((p) => ({
                    paymentId: p.id,
                    bookingId: p.bookingId,
                    updatedAt: p.updatedAt,
                })),
            };
        }
        const processed = [];
        const skipped = [];
        for (const candidate of candidates) {
            try {
                const result = await database_1.prisma.$transaction(async (tx) => {
                    const updated = await tx.payment.updateMany({
                        where: {
                            id: candidate.id,
                            status: "processing",
                            updatedAt: { lt: staleBefore },
                        },
                        data: { status: "failed" },
                    });
                    if (updated.count === 0) {
                        return { transitioned: false };
                    }
                    const booking = await tx.booking.findUnique({
                        where: { id: candidate.bookingId },
                        select: { status: true },
                    });
                    await tx.bookingHistory.create({
                        data: {
                            bookingId: candidate.bookingId,
                            status: booking?.status ?? "pending",
                            updatedBy: `system:payment-reprocessor:${actorUserId}`,
                            notes: `Payment ${candidate.id} auto-marked failed after ${olderThanMinutes}m in processing queue`,
                        },
                    });
                    return { transitioned: true };
                }, { isolationLevel: "Serializable" });
                if (result.transitioned) {
                    processed.push(candidate.id);
                    // Fire-and-forget: emit stale timeout failure for downstream notification/audit.
                    (0, eventPublisher_1.publishEvent)("payment.failed", {
                        paymentId: candidate.id,
                        bookingId: candidate.bookingId,
                        amount: candidate.amount,
                        reason: "stale_processing_timeout",
                        thresholdMinutes: olderThanMinutes,
                    }).catch(() => { });
                }
                else {
                    skipped.push(candidate.id);
                }
            }
            catch {
                skipped.push(candidate.id);
            }
        }
        return {
            dryRun: false,
            olderThanMinutes,
            scanned: candidates.length,
            processedCount: processed.length,
            skippedCount: skipped.length,
            processedPaymentIds: processed,
            skippedPaymentIds: skipped,
        };
    },
    async getPaymentQueueSummary() {
        const grouped = await database_1.prisma.payment.groupBy({
            by: ["status"],
            _count: { _all: true },
        });
        const counts = {
            total: 0,
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            refunded: 0,
        };
        for (const row of grouped) {
            const status = row.status;
            if (status in counts) {
                counts[status] += row._count._all;
            }
            counts.total += row._count._all;
        }
        const staleProcessing = await database_1.prisma.payment.count({
            where: {
                status: "processing",
                updatedAt: {
                    lt: new Date(Date.now() - 10 * 60 * 1000),
                },
            },
        });
        return {
            ...counts,
            queued: counts.pending + counts.processing,
            staleProcessing,
        };
    },
    async listFxRates() {
        return database_1.prisma.fxRate.findMany({
            orderBy: [{ baseCurrency: "asc" }, { quoteCurrency: "asc" }],
        });
    },
    async upsertFxRate(actorUserId, payload) {
        const actor = await database_1.prisma.user.findUnique({ where: { id: actorUserId } });
        if (!actor || actor.role !== "admin") {
            throw new utils_1.AppError("Only admins can manage FX rates", 403);
        }
        const baseCurrency = payload.baseCurrency.toUpperCase();
        const quoteCurrency = payload.quoteCurrency.toUpperCase();
        if (baseCurrency === quoteCurrency) {
            throw new utils_1.AppError("Base and quote currencies must differ", 400);
        }
        return database_1.prisma.fxRate.upsert({
            where: {
                baseCurrency_quoteCurrency: {
                    baseCurrency,
                    quoteCurrency,
                },
            },
            update: {
                rate: payload.rate,
                provider: payload.provider ?? "manual",
                effectiveAt: new Date(),
            },
            create: {
                baseCurrency,
                quoteCurrency,
                rate: payload.rate,
                provider: payload.provider ?? "manual",
            },
        });
    },
    async createOrder(userId, bookingId) {
        return database_1.prisma.$transaction(async (tx) => {
            // Serialize payment-order creation per booking to avoid duplicate external orders.
            await tx.$queryRaw `
          SELECT pg_advisory_xact_lock(hashtext(${bookingId}))
        `;
            const booking = await tx.booking.findUnique({
                where: { id: bookingId },
            });
            if (!booking)
                throw new utils_1.AppError("Booking not found", 404);
            if (booking.userId !== userId)
                throw new utils_1.AppError("Unauthorized", 403);
            if (!["pending", "confirmed"].includes(booking.status)) {
                throw new utils_1.AppError("Booking is not payable in current status", 400);
            }
            const existingPayment = await tx.payment.findUnique({
                where: { bookingId },
            });
            if (existingPayment?.status === "completed") {
                return { order: null, payment: existingPayment, idempotent: true };
            }
            if (existingPayment?.status === "processing" &&
                existingPayment.razorpayOrderId) {
                return {
                    order: {
                        id: existingPayment.razorpayOrderId,
                        amount: Math.round(existingPayment.amount * 100),
                        queued: true,
                    },
                    payment: existingPayment,
                    idempotent: true,
                };
            }
            const amountInPaise = Math.round(booking.amount * 100);
            const order = await razorpay.orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: booking.id,
                notes: { bookingId: booking.id },
            });
            const payment = await tx.payment.upsert({
                where: { bookingId },
                update: {
                    razorpayOrderId: order.id,
                    amount: booking.amount,
                    status: "processing",
                },
                create: {
                    bookingId,
                    razorpayOrderId: order.id,
                    amount: booking.amount,
                    status: "processing",
                },
            });
            queueInvoiceGeneration({
                userId,
                type: "order",
                title: "Order Receipt",
                bookingId,
                paymentId: payment.id,
                amount: booking.amount,
                metadata: {
                    source: "payment.createOrder",
                    razorpayOrderId: order.id,
                },
            });
            return { order, payment };
        }, { isolationLevel: "Serializable" });
    },
    async verifyPayment(userId, payload) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: payload.bookingId },
            include: { room: { include: { hotel: true } } },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        if (booking.userId !== userId) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        const expectedSignature = node_crypto_1.default
            .createHmac("sha256", environment_1.env.RAZORPAY_KEY_SECRET)
            .update(`${payload.razorpayOrderId}|${payload.razorpayPaymentId}`)
            .digest("hex");
        if (expectedSignature !== payload.razorpaySignature) {
            throw new utils_1.AppError("Invalid payment signature", 400);
        }
        const verifiedPayment = await database_1.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({
                where: { bookingId: payload.bookingId },
            });
            if (!payment) {
                throw new utils_1.AppError("Payment not found", 404);
            }
            if (payment.razorpayOrderId !== payload.razorpayOrderId) {
                throw new utils_1.AppError("Order mismatch", 400);
            }
            if (payment.status === "completed") {
                return payment;
            }
            const updated = await tx.payment.update({
                where: { id: payment.id },
                data: {
                    razorpayPaymentId: payload.razorpayPaymentId,
                    status: "completed",
                },
            });
            await tx.booking.update({
                where: { id: payload.bookingId },
                data: { status: "confirmed" },
            });
            return updated;
        });
        queueInvoiceGeneration({
            userId,
            type: "payment",
            title: "Payment Receipt",
            bookingId: payload.bookingId,
            paymentId: verifiedPayment.id,
            amount: verifiedPayment.amount,
            metadata: {
                source: "payment.verifyPayment",
                razorpayPaymentId: payload.razorpayPaymentId,
                razorpayOrderId: payload.razorpayOrderId,
            },
        });
        return verifiedPayment;
    },
    async handleWebhook(signature, body) {
        if (!signature)
            throw new utils_1.AppError("Missing webhook signature", 400);
        const expected = node_crypto_1.default
            .createHmac("sha256", environment_1.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");
        if (expected !== signature) {
            throw new utils_1.AppError("Invalid webhook signature", 400);
        }
        const payload = JSON.parse(body);
        const event = payload.event;
        const entity = payload?.payload?.payment?.entity;
        const orderId = entity?.order_id;
        if (!orderId)
            return { ok: true, ignored: true };
        const payment = await database_1.prisma.payment.findFirst({
            where: { razorpayOrderId: orderId },
        });
        if (!payment)
            return { ok: true, ignored: true };
        if (event === "payment.captured") {
            const transition = await database_1.prisma.$transaction(async (tx) => {
                const current = await tx.payment.findUnique({
                    where: { id: payment.id },
                });
                if (!current)
                    return { ignored: true };
                if (current.status === "completed") {
                    return { idempotent: true };
                }
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        razorpayPaymentId: entity.id,
                        status: "completed",
                    },
                });
                await tx.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: "confirmed" },
                });
                return { updated: true };
            });
            if (transition.idempotent) {
                return { ok: true, idempotent: true };
            }
            if (transition.ignored) {
                return { ok: true, ignored: true };
            }
            // Fire-and-forget: notify guest of payment success + booking confirmed
            database_1.prisma.booking
                .findUnique({
                where: { id: payment.bookingId },
                include: {
                    guest: { select: { id: true, name: true, email: true } },
                    room: { include: { hotel: { select: { name: true } } } },
                },
            })
                .then((b) => {
                if (!b)
                    return;
                (0, eventPublisher_1.publishEvent)("payment.success", {
                    bookingId: b.id,
                    paymentId: entity.id,
                    guest: b.guest,
                    amount: payment.amount,
                    hotel: { name: b.room.hotel.name },
                });
                (0, eventPublisher_1.publishEvent)("booking.confirmed", {
                    bookingId: b.id,
                    guest: b.guest,
                    hotel: { name: b.room.hotel.name },
                    checkIn: b.checkIn,
                    checkOut: b.checkOut,
                    amount: b.amount,
                });
                queueInvoiceGeneration({
                    userId: b.guest.id,
                    type: "payment",
                    title: "Payment Receipt",
                    bookingId: b.id,
                    paymentId: payment.id,
                    amount: payment.amount,
                    metadata: {
                        source: "payment.webhook",
                        event: "payment.captured",
                        razorpayPaymentId: entity.id,
                        razorpayOrderId: orderId,
                    },
                });
            })
                .catch(() => { });
        }
        if (event === "payment.failed") {
            const updated = await database_1.prisma.payment.updateMany({
                where: {
                    id: payment.id,
                    status: { in: ["pending", "processing"] },
                },
                data: { status: "failed" },
            });
            if (updated.count === 0) {
                return { ok: true, ignored: true };
            }
            // Fire-and-forget: notify guest of payment failure
            database_1.prisma.booking
                .findUnique({
                where: { id: payment.bookingId },
                include: { guest: { select: { id: true, name: true, email: true } } },
            })
                .then((b) => {
                if (!b)
                    return;
                (0, eventPublisher_1.publishEvent)("payment.failed", {
                    bookingId: b.id,
                    guest: b.guest,
                    amount: payment.amount,
                });
            })
                .catch(() => { });
        }
        return { ok: true };
    },
    async getById(id) {
        const payment = await database_1.prisma.payment.findUnique({ where: { id } });
        if (!payment)
            throw new utils_1.AppError("Payment not found", 404);
        return payment;
    },
    async getByBooking(userId, bookingId) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { room: { include: { hotel: true } } },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        const canAccess = booking.userId === userId || booking.room.hotel.ownerId === userId;
        if (!canAccess) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        const payment = await database_1.prisma.payment.findUnique({ where: { bookingId } });
        if (!payment)
            throw new utils_1.AppError("Payment not found", 404);
        return payment;
    },
    async createChargebackCase(userId, paymentId, reason, evidenceUrls = []) {
        const payment = await database_1.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                booking: {
                    include: {
                        room: { include: { hotel: true } },
                    },
                },
            },
        });
        if (!payment) {
            throw new utils_1.AppError("Payment not found", 404);
        }
        if (payment.booking.userId !== userId) {
            throw new utils_1.AppError("Only the paying guest can create chargeback case", 403);
        }
        const existingCase = await database_1.prisma.chargebackCase.findFirst({
            where: {
                userId,
                paymentId,
                status: { in: ["submitted", "under_review", "evidence_requested"] },
            },
            orderBy: { createdAt: "desc" },
        });
        if (existingCase) {
            return {
                ...existingCase,
                evidenceUrls: JSON.parse(existingCase.evidenceUrls || "[]"),
                timeline: JSON.parse(existingCase.timeline || "[]"),
                idempotent: true,
            };
        }
        const timeline = [
            {
                at: new Date().toISOString(),
                status: "submitted",
                by: userId,
                note: reason,
            },
        ];
        const created = await database_1.prisma.chargebackCase.create({
            data: {
                userId,
                paymentId,
                reason,
                evidenceUrls: JSON.stringify(evidenceUrls),
                status: "submitted",
                timeline: JSON.stringify(timeline),
            },
            include: {
                payment: { select: { bookingId: true } },
            },
        });
        return {
            id: created.id,
            paymentId,
            bookingId: created.payment.bookingId,
            reason,
            evidenceUrls,
            status: "submitted",
            timeline,
        };
    },
    async listChargebackCases(userId) {
        const records = await database_1.prisma.chargebackCase.findMany({
            where: {
                userId,
            },
            include: {
                payment: { select: { bookingId: true, status: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return records.map((record) => ({
            ...record,
            bookingId: record.payment.bookingId,
            paymentStatus: record.payment.status,
            evidenceUrls: JSON.parse(record.evidenceUrls || "[]"),
            timeline: JSON.parse(record.timeline || "[]"),
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        }));
    },
    async advanceChargebackCase(userId, caseId, status, note) {
        const record = await database_1.prisma.chargebackCase.findUnique({
            where: { id: caseId },
        });
        if (record?.userId !== userId) {
            throw new utils_1.AppError("Chargeback case not found", 404);
        }
        const currentStatus = record.status;
        if (!CHARGEBACK_STATUS_FLOW[currentStatus].includes(status)) {
            throw new utils_1.AppError("Invalid chargeback status transition", 400);
        }
        const currentTimeline = JSON.parse(record.timeline || "[]");
        const timeline = [
            ...currentTimeline,
            {
                at: new Date().toISOString(),
                status,
                by: userId,
                ...(note ? { note } : {}),
            },
        ];
        const updated = await database_1.prisma.chargebackCase.update({
            where: { id: caseId },
            data: {
                status,
                timeline: JSON.stringify(timeline),
            },
        });
        return {
            ...updated,
            evidenceUrls: JSON.parse(updated.evidenceUrls || "[]"),
            timeline,
        };
    },
    async generateTaxInvoice(userId, bookingId) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                room: {
                    include: {
                        hotel: true,
                    },
                },
            },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        const canAccess = booking.userId === userId || booking.room.hotel.ownerId === userId;
        if (!canAccess) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        const payment = await database_1.prisma.payment.findUnique({ where: { bookingId } });
        if (!payment) {
            throw new utils_1.AppError("Payment not found", 404);
        }
        const existingInvoice = await database_1.prisma.taxInvoice.findFirst({
            where: { bookingId, paymentId: payment.id },
            orderBy: { createdAt: "desc" },
        });
        if (existingInvoice) {
            return {
                ...existingInvoice,
                lineItems: JSON.parse(existingInvoice.lineItems),
            };
        }
        const subtotal = Number((booking.amount / 1.18).toFixed(2));
        const taxAmount = Number((booking.amount - subtotal).toFixed(2));
        const taxPercent = Number(((taxAmount / Math.max(1, subtotal)) * 100).toFixed(2));
        const lineItems = [
            {
                code: "stay_charge",
                description: "Accommodation stay charge",
                amount: subtotal,
            },
            {
                code: "tax",
                description: `Applicable taxes (${taxPercent}%)`,
                amount: taxAmount,
            },
        ];
        const invoice = await database_1.prisma.taxInvoice.create({
            data: {
                bookingId,
                paymentId: payment.id,
                invoiceNumber: `INV-${Date.now()}-${booking.id.slice(0, 6).toUpperCase()}`,
                currency: "INR",
                lineItems: JSON.stringify(lineItems),
                subtotal,
                tax: taxAmount,
                total: Number(booking.amount.toFixed(2)),
                regime: "IN_GST",
                placeOfSupply: "India",
            },
        });
        return {
            ...invoice,
            lineItems,
            booking: {
                id: booking.id,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
            },
            payment: {
                id: payment.id,
                status: payment.status,
                razorpayPaymentId: payment.razorpayPaymentId,
            },
        };
    },
    async getSettlementQuote(amountInInr, targetCurrency) {
        const currency = targetCurrency.toUpperCase();
        const rateRecord = await database_1.prisma.fxRate.findUnique({
            where: {
                baseCurrency_quoteCurrency: {
                    baseCurrency: "INR",
                    quoteCurrency: currency,
                },
            },
        });
        if (!rateRecord) {
            throw new utils_1.AppError("Unsupported settlement currency", 400);
        }
        const rate = rateRecord.rate;
        const convertedAmount = Number((amountInInr * rate).toFixed(2));
        const fxFeePercent = 1.25;
        const fxFee = Number((convertedAmount * (fxFeePercent / 100)).toFixed(2));
        return {
            sourceCurrency: "INR",
            targetCurrency: currency,
            exchangeRate: rate,
            sourceAmount: Number(amountInInr.toFixed(2)),
            targetAmount: convertedAmount,
            fxFee,
            settlementAmount: Number((convertedAmount - fxFee).toFixed(2)),
            estimatedArrival: "T+2 business days",
            provider: rateRecord.provider,
        };
    },
    async getSettlementSummary(userId, bookingId, targetCurrency) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                room: {
                    include: {
                        hotel: true,
                    },
                },
            },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        const canAccess = booking.userId === userId || booking.room.hotel.ownerId === userId;
        if (!canAccess) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        const payment = await database_1.prisma.payment.findUnique({ where: { bookingId } });
        if (!payment) {
            throw new utils_1.AppError("Payment not found", 404);
        }
        if (payment.status !== "completed") {
            throw new utils_1.AppError("Settlement is only available for completed payments", 400);
        }
        const quote = await this.getSettlementQuote(booking.amount, targetCurrency);
        const persistedQuote = await database_1.prisma.settlementQuote.create({
            data: {
                bookingId,
                paymentId: payment.id,
                userId,
                sourceCurrency: quote.sourceCurrency,
                targetCurrency: quote.targetCurrency,
                exchangeRate: quote.exchangeRate,
                sourceAmount: quote.sourceAmount,
                targetAmount: quote.targetAmount,
                fxFee: quote.fxFee,
                settlementAmount: quote.settlementAmount,
                estimatedArrival: quote.estimatedArrival,
                provider: quote.provider,
            },
        });
        return {
            bookingId,
            paymentId: payment.id,
            paymentStatus: payment.status,
            settlement: {
                ...quote,
                quoteId: persistedQuote.id,
            },
        };
    },
};
exports.default = exports.paymentService;
