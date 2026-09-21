import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { I18nService } from '../i18n/i18n.service';
import { acceptLanguageInterceptor } from './accept-language.interceptor';

describe('acceptLanguageInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([acceptLanguageInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('asks for French while French is the active locale', () => {
    http.get('/api/groups').subscribe();

    const request = backend.expectOne('/api/groups');
    expect(request.request.headers.get('Accept-Language')).toBe('fr-FR,fr;q=0.9');
    request.flush([]);
  });

  it('follows the locale the person picks', () => {
    TestBed.inject(I18nService).setLocale('en');
    http.get('/api/groups').subscribe();

    const request = backend.expectOne('/api/groups');
    expect(request.request.headers.get('Accept-Language')).toBe('en-GB,en;q=0.9');
    request.flush([]);
  });
});
