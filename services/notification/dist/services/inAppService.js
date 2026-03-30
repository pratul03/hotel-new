"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBulkInAppNotifications = exports.createInAppNotification = void 0;
const database_1 = require("../config/database");
const createInAppNotification = async (data) => {
    try {
        await database_1.prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                content: data.content,
                link: data.link,
            },
        });
    }
    catch (err) {
        console.error("[InApp] Failed to create notification:", err);
    }
};
exports.createInAppNotification = createInAppNotification;
const createBulkInAppNotifications = async (notifications) => {
    if (!notifications.length)
        return;
    try {
        await database_1.prisma.notification.createMany({
            data: notifications.map((n) => ({
                userId: n.userId,
                type: n.type,
                content: n.content,
                link: n.link,
            })),
        });
    }
    catch (err) {
        console.error("[InApp] Failed to create bulk notifications:", err);
    }
};
exports.createBulkInAppNotifications = createBulkInAppNotifications;
