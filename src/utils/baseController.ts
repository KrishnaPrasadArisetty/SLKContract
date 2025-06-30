import { Response } from "express";

interface SuccessResponseOptions {
  res: Response;
  status?: number;
  message: string;
  data: any;
  [key: string]: any;
}

interface ErrorResponseOptions {
  res: Response;
  status?: number;
  message: string;
}

export class BaseController {
  protected sendSuccess({
    res,
    status = 200,
    message,
    data,
    ...extra
  }: SuccessResponseOptions) {
    return res.status(status).json({ status, message, data, ...extra });
  }

  protected sendError({ res, status = 400, message }: ErrorResponseOptions) {
    return res.status(status).json({ status, message });
  }
}
