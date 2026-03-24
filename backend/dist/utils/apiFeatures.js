"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIFeatures = void 0;
const SENSITIVE_FIELDS = new Set(['password', 'token', 'refreshToken', 'secret', 'hash', 'salt']);
class APIFeatures {
    query;
    args = {};
    searchableFields;
    defaultLimit;
    maxLimit;
    constructor(query, options = {}) {
        this.query = { ...query };
        this.searchableFields = options.searchableFields || [];
        this.defaultLimit = options.defaultLimit || 10;
        this.maxLimit = options.maxLimit || 100;
        if (options.include) {
            this.args.include = options.include;
        }
    }
    filter() {
        const reserved = ['search', 'sort', 'fields', 'page', 'limit'];
        const filters = {};
        for (const [key, value] of Object.entries(this.query)) {
            if (reserved.includes(key))
                continue;
            if (SENSITIVE_FIELDS.has(key.toLowerCase()))
                continue;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const prismaOps = {};
                const operatorMap = {
                    gte: 'gte',
                    gt: 'gt',
                    lte: 'lte',
                    lt: 'lt',
                    not: 'not',
                };
                for (const [op, val] of Object.entries(value)) {
                    if (!operatorMap[op])
                        continue;
                    const numVal = Number(val);
                    prismaOps[operatorMap[op]] = Number.isNaN(numVal) ? val : numVal;
                }
                if (Object.keys(prismaOps).length > 0) {
                    filters[key] = prismaOps;
                }
            }
            else if (typeof value === 'string') {
                const numVal = Number(value);
                filters[key] = Number.isNaN(numVal) ? value : numVal;
            }
        }
        this.args.where = { ...(this.args.where || {}), ...filters };
        return this;
    }
    search() {
        if (!this.query.search || this.searchableFields.length === 0)
            return this;
        const searchTerm = this.query.search;
        const orConditions = this.searchableFields.map((field) => ({
            [field]: { contains: searchTerm, mode: 'insensitive' },
        }));
        this.args.where = {
            ...(this.args.where || {}),
            OR: orConditions,
        };
        return this;
    }
    sort() {
        if (!this.query.sort) {
            this.args.orderBy = [{ createdAt: 'desc' }];
            return this;
        }
        const sortFields = this.query.sort.split(',').map((field) => {
            const trimmed = field.trim();
            const isDesc = trimmed.startsWith('-');
            const fieldName = isDesc ? trimmed.substring(1) : trimmed;
            if (!fieldName || SENSITIVE_FIELDS.has(fieldName.toLowerCase()))
                return null;
            return { [fieldName]: isDesc ? 'desc' : 'asc' };
        });
        const safeSort = sortFields.filter((item) => item !== null);
        this.args.orderBy = safeSort.length > 0 ? safeSort : [{ createdAt: 'desc' }];
        return this;
    }
    limitFields() {
        if (!this.query.fields)
            return this;
        const fields = this.query.fields.split(',');
        const select = {};
        for (const field of fields) {
            const trimmed = field.trim();
            if (!trimmed)
                continue;
            if (SENSITIVE_FIELDS.has(trimmed.toLowerCase()))
                continue;
            select[trimmed] = true;
        }
        if (Object.keys(select).length > 0) {
            this.args.select = select;
            delete this.args.include;
        }
        return this;
    }
    paginate() {
        const page = Math.max(1, parseInt(this.query.page || '1', 10));
        const limit = Math.min(this.maxLimit, Math.max(1, parseInt(this.query.limit || String(this.defaultLimit), 10)));
        this.args.skip = (page - 1) * limit;
        this.args.take = limit;
        return this;
    }
    getArgs() {
        return this.args;
    }
    getWhereClause() {
        return (this.args.where || {});
    }
    getPaginationMeta(totalResults) {
        const page = Math.max(1, parseInt(this.query.page || '1', 10));
        const limit = Math.min(this.maxLimit, Math.max(1, parseInt(this.query.limit || String(this.defaultLimit), 10)));
        const totalPages = Math.ceil(totalResults / limit);
        return {
            page,
            limit,
            totalResults,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }
}
exports.APIFeatures = APIFeatures;
