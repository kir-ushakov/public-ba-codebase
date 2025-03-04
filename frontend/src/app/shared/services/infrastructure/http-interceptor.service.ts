import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { AppAction } from '../../state/app.actions';

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {
  constructor(public router: Router, private _store: Store) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error) => {
        if (error.status === 401) {
          this._store.dispatch(AppAction.UserNotAuthenticated);
        }
        if (error.status === 500) {
          // TICKET: https://brainas.atlassian.net/browse/BA-135
          // TODO: Log Unexpected Error On Client and notify user
          console.log('Unexpected Error');
          console.log(error);
        }
        return throwError(error);
      })
    );
  }
}
