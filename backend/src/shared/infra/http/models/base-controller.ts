import { EApiError } from '@brainassistant/contracts';
import express from 'express';
import { serialize } from '../utils/middleware.js';

export const UNEXPECTED_ERROR_RESPONSE = {
  name: EApiError.Unexpected,
  message: 'Some unexpected error occurred',
} as const;

export enum EHttpStatus {
  Ok = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  PayloadTooLarge = 413,
  InternalServerError = 500,
  BadGateway = 502,
}

// TODO: need to return resp_code and message in BE response
// TICKET: https://brainas.atlassian.net/browse/BA-20
export abstract class BaseController {
  protected abstract executeImpl(
    req: express.Request,
    res: express.Response,
    next?: express.NextFunction,
  ): Promise<void | express.Response>;

  public async execute(
    req: express.Request,
    res: express.Response,
    next?: express.NextFunction,
  ): Promise<void> {
    try {
      await this.executeImpl(req, res, next);
    } catch (err) {
      console.log(`[BaseController]: Uncaught controller error`);
      console.log(err);
      this.fail(res, 'An unexpected error occurred');
    }
  }

  public static jsonResponse(
    res: express.Response,
    code: EHttpStatus,
    payload: unknown = null,
  ): express.Response {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(code).json(payload);
  }

  public static redirect(
    res: express.Response,
    path: string,
    queryParams: Record<string, string>,
  ): void {
    const queryString = serialize(queryParams);
    res.redirect(`${path}?${queryString}`);
  }

  public ok(res: express.Response, dto?: unknown): express.Response {
    res.type('application/json');
    return res.status(200).json(dto ?? {});
  }

  public created(res: express.Response, payload: unknown = null): express.Response {
    return BaseController.jsonResponse(res, EHttpStatus.Created, payload);
  }

  public fail(res: express.Response, error: unknown): express.Response {
    // Log errors here
    console.log(error);
    return BaseController.jsonResponse(
      res,
      EHttpStatus.InternalServerError,
      UNEXPECTED_ERROR_RESPONSE,
    );
  }
}
