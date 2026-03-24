"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCrudHandlers = exports.CrudFactory = void 0;
const tslib_1 = require("tslib");
const database_1 = tslib_1.__importDefault(require("../config/database"));
const apiFeatures_1 = require("./apiFeatures");
const appError_1 = require("./appError");
const catchAsync_1 = require("./catchAsync");
const IMMUTABLE_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'password']);
const sanitizeBody = (body) => {
    const result = {};
    for (const [key, value] of Object.entries(body)) {
        if (!IMMUTABLE_FIELDS.has(key)) {
            result[key] = value;
        }
    }
    return result;
};
class CrudFactory {
    modelName;
    model;
    options;
    constructor(modelName, options = {}) {
        this.modelName = modelName;
        this.model = database_1.default[modelName];
        this.options = options;
        if (!this.model) {
            throw new Error(`Prisma model "${modelName}" not found`);
        }
    }
    getAll = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const features = new apiFeatures_1.APIFeatures(req.query, {
            searchableFields: this.options.searchableFields,
            defaultLimit: this.options.defaultLimit,
            maxLimit: this.options.maxLimit,
            include: this.options.includeOnGetAll,
        })
            .filter()
            .search()
            .sort()
            .limitFields()
            .paginate();
        const [data, totalResults] = await Promise.all([
            this.model.findMany(features.getArgs()),
            this.model.count({ where: features.getWhereClause() }),
        ]);
        const pagination = features.getPaginationMeta(totalResults);
        res.status(200).json({
            success: true,
            results: data.length,
            pagination,
            data,
        });
    });
    getOne = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const record = await this.model.findUnique({
            where: { id: req.params.id },
            ...(this.options.includeOnGetOne && {
                include: this.options.includeOnGetOne,
            }),
        });
        if (!record) {
            throw new appError_1.AppError(`No ${this.modelName} found with id: ${req.params.id}`, 404);
        }
        res.status(200).json({
            success: true,
            data: record,
        });
    });
    createOne = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const record = await this.model.create({
            data: sanitizeBody(req.body),
        });
        res.status(201).json({
            success: true,
            data: record,
        });
    });
    updateOne = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const record = await this.model.update({
            where: { id: req.params.id },
            data: sanitizeBody(req.body),
        });
        res.status(200).json({
            success: true,
            data: record,
        });
    });
    replaceOne = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const record = await this.model.update({
            where: { id: req.params.id },
            data: sanitizeBody(req.body),
        });
        res.status(200).json({
            success: true,
            data: record,
        });
    });
    deleteOne = (0, catchAsync_1.catchAsync)(async (req, res) => {
        await this.model.delete({
            where: { id: req.params.id },
        });
        res.status(204).json({
            success: true,
            data: null,
        });
    });
}
exports.CrudFactory = CrudFactory;
const createCrudHandlers = (modelName, options = {}) => {
    const factory = new CrudFactory(modelName, options);
    return {
        getAll: factory.getAll,
        getOne: factory.getOne,
        createOne: factory.createOne,
        updateOne: factory.updateOne,
        replaceOne: factory.replaceOne,
        deleteOne: factory.deleteOne,
    };
};
exports.createCrudHandlers = createCrudHandlers;
