import { Request, Response } from 'express';
import prisma from '../config/database';
import { APIFeatures } from './apiFeatures';
import { AppError } from './appError';
import { catchAsync } from './catchAsync';

type PrismaModelName = keyof typeof prisma & string;

const IMMUTABLE_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'password']);

const sanitizeBody = (body: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (!IMMUTABLE_FIELDS.has(key)) {
      result[key] = value;
    }
  }

  return result;
};

interface CrudOptions {
  searchableFields?: string[];
  includeOnGetAll?: Record<string, unknown>;
  includeOnGetOne?: Record<string, unknown>;
  defaultLimit?: number;
  maxLimit?: number;
}

export class CrudFactory {
  private modelName: PrismaModelName;
  private model: any;
  private options: CrudOptions;

  constructor(modelName: PrismaModelName, options: CrudOptions = {}) {
    this.modelName = modelName;
    this.model = (prisma as any)[modelName];
    this.options = options;

    if (!this.model) {
      throw new Error(`Prisma model "${modelName}" not found`);
    }
  }

  getAll = catchAsync(async (req: Request, res: Response) => {
    const features = new APIFeatures(req.query as Record<string, unknown>, {
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

  getOne = catchAsync(async (req: Request, res: Response) => {
    const record = await this.model.findUnique({
      where: { id: req.params.id },
      ...(this.options.includeOnGetOne && {
        include: this.options.includeOnGetOne,
      }),
    });

    if (!record) {
      throw new AppError(`No ${this.modelName} found with id: ${req.params.id}`, 404);
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  });

  createOne = catchAsync(async (req: Request, res: Response) => {
    const record = await this.model.create({
      data: sanitizeBody(req.body as Record<string, unknown>),
    });

    res.status(201).json({
      success: true,
      data: record,
    });
  });

  updateOne = catchAsync(async (req: Request, res: Response) => {
    const record = await this.model.update({
      where: { id: req.params.id },
      data: sanitizeBody(req.body as Record<string, unknown>),
    });

    res.status(200).json({
      success: true,
      data: record,
    });
  });

  replaceOne = catchAsync(async (req: Request, res: Response) => {
    const record = await this.model.update({
      where: { id: req.params.id },
      data: sanitizeBody(req.body as Record<string, unknown>),
    });

    res.status(200).json({
      success: true,
      data: record,
    });
  });

  deleteOne = catchAsync(async (req: Request, res: Response) => {
    await this.model.delete({
      where: { id: req.params.id },
    });

    res.status(204).json({
      success: true,
      data: null,
    });
  });
}

export const createCrudHandlers = (modelName: PrismaModelName, options: CrudOptions = {}) => {
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
