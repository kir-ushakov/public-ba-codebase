import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { EGetImageUseCaseError, EUploadImageUseCaseError } from '@brainassistant/contracts';
import { firstValueFrom } from 'rxjs';
import { HttpInterceptorService } from 'src/app/shared/services/infrastructure/http-interceptor.service';
import { AppAction } from 'src/app/shared/state/app.actions';

describe('HttpInterceptorService', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let store: { dispatch: jest.Mock };

  beforeEach(() => {
    store = { dispatch: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: Store, useValue: store },
        { provide: Router, useValue: {} },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HttpInterceptorService,
          multi: true,
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('dispatches GoogleRefreshTokenInvalid on upload 403 JSON', async () => {
    const pending = firstValueFrom(http.post('/api/files/image', new FormData()));
    const req = httpTesting.expectOne('/api/files/image');
    req.flush(
      {
        name: EUploadImageUseCaseError.GoogleRefreshTokenInvalid,
        message: 'Google refresh token is invalid or revoked',
      },
      { status: 403, statusText: 'Forbidden' },
    );

    await expect(pending).rejects.toBeTruthy();
    expect(store.dispatch).toHaveBeenCalledWith(expect.any(AppAction.GoogleRefreshTokenInvalid));
  });

  it('dispatches GoogleRefreshTokenInvalid when a blob GET returns JSON 403', async () => {
    const pending = firstValueFrom(http.get('/api/files/image/img-1', { responseType: 'blob' }));
    const req = httpTesting.expectOne('/api/files/image/img-1');
    const body = new Blob(
      [
        JSON.stringify({
          name: EGetImageUseCaseError.GoogleRefreshTokenInvalid,
          message: 'Google refresh token is invalid or revoked',
        }),
      ],
      { type: 'application/json' },
    );
    req.flush(body, { status: 403, statusText: 'Forbidden' });

    await expect(pending).rejects.toBeTruthy();
    expect(store.dispatch).toHaveBeenCalledWith(expect.any(AppAction.GoogleRefreshTokenInvalid));
  });

  async function nextTick(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  it('retries a 401 after refresh and does not mark the user signed out', async () => {
    const pending = firstValueFrom(http.get('/api/sync/changes'));
    httpTesting
      .expectOne('/api/sync/changes')
      .flush(
        { name: 'USER_NOT_AUTHENTICATED', message: 'User not authenticated' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await nextTick();
    httpTesting
      .expectOne('/api/auth/refresh')
      .flush({ refreshed: true }, { status: 200, statusText: 'OK' });
    await nextTick();
    httpTesting
      .expectOne('/api/sync/changes')
      .flush({ changes: [], syncRevision: 0 }, { status: 200, statusText: 'OK' });

    await expect(pending).resolves.toEqual({ changes: [], syncRevision: 0 });
    expect(store.dispatch).not.toHaveBeenCalledWith(AppAction.UserNotAuthenticated);
  });

  it('dispatches UserNotAuthenticated when refresh also returns 401', async () => {
    const pending = firstValueFrom(http.get('/api/sync/changes'));
    httpTesting
      .expectOne('/api/sync/changes')
      .flush(
        { name: 'USER_NOT_AUTHENTICATED', message: 'User not authenticated' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await nextTick();
    httpTesting
      .expectOne('/api/auth/refresh')
      .flush(
        { name: 'REFRESH_SESSION_USECASE_ERROR__INVALID', message: 'Refresh session is invalid' },
        { status: 401, statusText: 'Unauthorized' },
      );

    await expect(pending).rejects.toBeTruthy();
    expect(store.dispatch).toHaveBeenCalledWith(AppAction.UserNotAuthenticated);
  });

  it('does not refresh a 401 from login', async () => {
    const pending = firstValueFrom(http.post('/api/auth/login', {}));
    httpTesting
      .expectOne('/api/auth/login')
      .flush(
        { name: 'LOGIN_USECASE_ERROR__AUTHENTICATION_FAILED', message: 'Authorization failed!' },
        { status: 401, statusText: 'Unauthorized' },
      );

    await expect(pending).rejects.toBeTruthy();
    expect(store.dispatch).toHaveBeenCalledWith(AppAction.UserNotAuthenticated);
    httpTesting.expectNone('/api/auth/refresh');
  });
});
