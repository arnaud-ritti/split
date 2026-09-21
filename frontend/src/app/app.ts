import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { ToastModule } from '@openng/optimus-ui/toast';
import { I18nService } from './core/i18n/i18n.service';
import { TranslatePipe } from './core/i18n/i18n.pipes';
import { LocaleSwitcher } from './core/i18n/locale-switcher';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ButtonModule, ToastModule, TranslatePipe, LocaleSwitcher],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly i18n = inject(I18nService);
}
