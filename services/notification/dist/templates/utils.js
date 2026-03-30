"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = exports.formatDate = void 0;
const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};
exports.formatDate = formatDate;
const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
exports.formatCurrency = formatCurrency;
