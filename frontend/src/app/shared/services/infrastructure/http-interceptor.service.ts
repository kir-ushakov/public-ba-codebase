import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { AppAction } from '../../state/app.actions';
import { isGoogleRefreshTokenInvalidError } from '../../helpers/google-refresh-token-invalid.function';

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {
  constructor(
    public router: Router,
    private _store: Store,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this._store.dispatch(AppAction.UserNotAuthenticated);
        }
        if (isGoogleRefreshTokenInvalidError(error)) {
          this._store.dispatch(new AppAction.GoogleRefreshTokenInvalid());
        }
        if (error instanceof HttpErrorResponse && error.status === 500) {
          // TICKET: https://brainas.atlassian.net/browse/BA-135
          // TODO: Log Unexpected Error On Client and notify user
          console.log('Unexpected Error');
          console.log(error);
        }
        return throwError(() => error);
      }),
    );
  }
}
