import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from '@openng/optimus-ui/api';
import { App } from './app';
import { I18nService } from './core/i18n/i18n.service';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
      ],
    }).compileComponents();
  });

  it('renders the header in French by default', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Split');
    expect(text).toContain('Partagez les dépenses');
    expect(text).toContain('Aller au contenu principal');
  });

  it('re-renders the header when the locale changes', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    TestBed.inject(I18nService).setLocale('en');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Skip to main content');
  });

  it('offers every shipped locale as a toggle', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.locale-switcher button',
    );

    expect(buttons.length).toBe(2);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
  });
});
