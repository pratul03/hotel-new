export const successResponse = (data: any, message = 'Success') => ({
  success: true,
  data,
  message,
});

export const errorResponse = (code: string, message: string, field?: string) => ({
  success: false,
  error: {
    code,
    message,
    ...(field && { field }),
  },
});

export const paginatedResponse = (data: any[], page: number, limit: number, total: number) => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  },
});

export default { successResponse, errorResponse, paginatedResponse };
