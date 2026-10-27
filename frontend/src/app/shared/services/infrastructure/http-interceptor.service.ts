import { Injectable, Injector } from '@angular/core';
import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { AppAction } from '../../state/app.actions';
import { isGoogleRefreshTokenInvalidError } from '../../helpers/google-refresh-token-invalid.function';
import { normalizeHttpErrorResponse } from '../../helpers/http-error-body.function';
import { AuthService } from '../api/auth.service';

const REFRESH_RETRY = new HttpContextToken<boolean>(() => false);

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {
  private refreshInFlight: Observable<void> | null = null;

  constructor(
    public router: Router,
    private _store: Store,
    private injector: Injector,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next
      .handle(req)
      .pipe(catchError((error: unknown) => this.handleError(req, next, error)));
  }

  private handleError(
    req: HttpRequest<unknown>,
    next: HttpHandler,
    error: unknown,
  ): Observable<HttpEvent<unknown>> {
    return from(this.normalize(error)).pipe(
      switchMap(httpError => {
        if (this.shouldRefresh(req, httpError)) {
          return this.refreshOnce().pipe(
            switchMap(() =>
              next.handle(req.clone({ context: req.context.set(REFRESH_RETRY, true) })),
            ),
            catchError(refreshError => this.afterRefreshFailed(refreshError, error)),
          );
        }
        this.report(req, httpError);
        return throwError(() => error);
      }),
    );
  }

  private afterRefreshFailed(refreshError: unknown, original: unknown): Observable<never> {
    return from(this.normalize(refreshError)).pipe(
      switchMap(httpError => {
        if (
          httpError instanceof HttpErrorResponse &&
          httpError.status === HttpStatusCode.Unauthorized
        ) {
          this._store.dispatch(AppAction.UserNotAuthenticated);
        }
        return throwError(() => original);
      }),
    );
  }

  private shouldRefresh(req: HttpRequest<unknown>, error: unknown): boolean {
    return (
      error instanceof HttpErrorResponse &&
      error.status === HttpStatusCode.Unauthorized &&
      !req.context.get(REFRESH_RETRY) &&
      !req.url.includes('/api/auth/')
    );
  }

  private refreshOnce(): Observable<void> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    const auth = this.injector.get(AuthService);
    this.refreshInFlight = auth.refresh().pipe(
      finalize(() => {
        this.refreshInFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshInFlight;
  }

  private report(req: HttpRequest<unknown>, httpError: unknown): void {
    if (
      httpError instanceof HttpErrorResponse &&
      httpError.status === HttpStatusCode.Unauthorized &&
      !req.url.includes('/api/auth/refresh')
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

  private async normalize(error: unknown): Promise<unknown> {
    return error instanceof HttpErrorResponse ? normalizeHttpErrorResponse(error) : error;
  }
}
