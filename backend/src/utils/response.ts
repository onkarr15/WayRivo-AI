import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  meta?: ApiResponse['meta'],
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
}

export function sendCreated<T>(res: Response, data: T, message = 'Resource created successfully'): Response {
  return sendSuccess(res, data, message, undefined, 201);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: any
): Response {
  return res.status(statusCode).json({
    success: false,
    error: message,
    errors,
  });
}
