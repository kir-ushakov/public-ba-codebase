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

  it('dispatches UserNotAuthenticated on 401', async () => {
    const pending = firstValueFrom(http.get('/api/sync/changes'));
    const req = httpTesting.expectOne('/api/sync/changes');
    req.flush(
      { name: 'UNEXPECTED_ERROR', message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await expect(pending).rejects.toBeTruthy();
    expect(store.dispatch).toHaveBeenCalledWith(AppAction.UserNotAuthenticated);
  });
});
