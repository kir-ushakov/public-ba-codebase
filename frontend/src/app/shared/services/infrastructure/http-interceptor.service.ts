import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { AppAction } from '../../state/app.actions';
import { isGoogleRefreshTokenInvalidError } from '../../helpers/google-refresh-token-invalid.function';
import { normalizeHttpErrorResponse } from '../../helpers/http-error-body.function';

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {
  constructor(
    public router: Router,
    private _store: Store,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: unknown) => {
        return from(this.onHttpError(error)).pipe(switchMap(() => throwError(() => error)));
      }),
    );
  }

  private async onHttpError(error: unknown): Promise<void> {
    const httpError =
      error instanceof HttpErrorResponse ? await normalizeHttpErrorResponse(error) : error;

    if (
      httpError instanceof HttpErrorResponse &&
      httpError.status === HttpStatusCode.Unauthorized
    ) {
      this._store.dispatch(AppAction.UserNotAuthenticated);
    }
    if (isGoogleRefreshTokenInvalidError(httpError)) {
      this._store.dispatch(new AppAction.GoogleRefreshTokenInvalid());
    }
    if (
      httpError instanceof HttpErrorResponse &&
      httpError.status === HttpStatusCode.InternalServerError
    ) {
      // TICKET: https://brainas.atlassian.net/browse/BA-135
      // TODO: Log Unexpected Error On Client and notify user
      console.log('Unexpected Error');
      console.log(httpError);
    }
  }
}
