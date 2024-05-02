import express from 'express';
import { IApiErrorDto } from '../dtos/api-errors.dto';
import { UseCaseError } from '../../../core/use-case-error';
import { EAppError } from '../../../core/app-error';
import { serialize } from '../utils/middleware';

export enum EHttpStatus {
  Ok = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  InternalServerError = 500,
}

// TODO: need to return resp_code and message in BE response
// TICKET: https://brainas.atlassian.net/browse/BA-20
export abstract class BaseController {
  protected abstract executeImpl(
    req: express.Request,
    res: express.Response,
    next?: express.NextFunction
  ): Promise<void | any>;

  public async execute(
    req: express.Request,
    res: express.Response,
    next?: express.NextFunction
  ): Promise<void> {
    try {
      await this.executeImpl(req, res, next);
    } catch (err) {
      console.log(`[BaseController]: Uncaught controller error`);
      console.log(err);
      this.fail(res, 'An unexpected error occurred');
    }
  }

  public static jsonResponse<T>(
    res: express.Response,
    code: number,
    payload: T | any = null
  ) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(code).json(payload);
  }

  public static redirect(res: express.Response, path: string, queryParams) {
    const queryString = serialize(queryParams);
    return res.redirect(`${path}?${queryString}`);
  }

  public ok<T>(res: express.Response, dto: T | {} = {}) {
    res.type('application/json');
    return res.status(200).json(dto);
  }

  public created(res: express.Response, payload: any = null) {
    return BaseController.jsonResponse(res, 201, payload);
  }

  // TODO: Need to remove all error's methods like clientError, notFound and others
  // TOCKET: https://brainas.atlassian.net/browse/BA-117
  public clientError(res: express.Response, payload?: IApiErrorDto | string) {
    return BaseController.jsonResponse(
      res,
      EHttpStatus.BadRequest,
      payload ? payload : 'Wrong Parameters'
    );
  }

  public notFound(res: express.Response, payload?: IApiErrorDto | string) {
    return BaseController.jsonResponse(
      res,
      404,
      payload ? payload : 'Not found'
    );
  }

  public conflict(res: express.Response, payload?: IApiErrorDto | string) {
    return BaseController.jsonResponse(
      res,
      409,
      payload ? payload : 'Conflict'
    );
  }

  public tooMany(res: express.Response, payload?: IApiErrorDto | string) {
    return BaseController.jsonResponse(
      res,
      429,
      payload ? payload : 'Too many requests'
    );
  }

  public fail(res: express.Response, error: Error | string) {
    // Log errors here
    console.log(error);
    return res.status(EHttpStatus.InternalServerError).json({
      name: EAppError.UnexpectedError,
      message: 'Some unexpected error occurred',
    });
  }
}
