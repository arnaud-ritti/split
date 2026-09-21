import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, form, maxLength, pattern, required, submit } from '@angular/forms/signals';
import { ButtonModule } from '@openng/optimus-ui/button';
import { CardModule } from '@openng/optimus-ui/card';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { MessageModule } from '@openng/optimus-ui/message';
import { SplitApi } from '../../core/api/split-api';
import { toApiError } from '../../core/api/api-error';
import { RecentGroups } from '../../core/recent-groups';
import { Notifications } from '../../core/notifications';
import { I18nService } from '../../core/i18n/i18n.service';
import { LocalDatePipe, TranslatePipe } from '../../core/i18n/i18n.pipes';
import { fieldErrorMessage } from '../../core/i18n/validation-message';

/** The API only accepts a canonical UUID, so a typo is worth catching before the round trip. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    FormField,
    ButtonModule,
    CardModule,
    InputTextModule,
    MessageModule,
    TranslatePipe,
    LocalDatePipe,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly api = inject(SplitApi);
  private readonly router = inject(Router);
  private readonly notifications = inject(Notifications);
  private readonly i18n = inject(I18nService);

  protected readonly recent = inject(RecentGroups);

  protected readonly creating = signal(false);
  protected readonly opening = signal(false);

  private readonly createModel = signal({ name: '' });
  private readonly openModel = signal({ groupId: '' });

  protected readonly createForm = form(this.createModel, (path) => {
    required(path.name);
    maxLength(path.name, 100);
  });

  protected readonly openForm = form(this.openModel, (path) => {
    required(path.groupId);
    pattern(path.groupId, UUID_PATTERN);
  });

  protected readonly nameError = computed(() =>
    fieldErrorMessage(this.i18n, this.createForm.name()),
  );

  protected readonly groupIdError = computed(() =>
    fieldErrorMessage(this.i18n, this.openForm.groupId(), { pattern: 'validation.uuid' }),
  );

  protected async createGroup(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.createForm, async () => {
      this.creating.set(true);
      try {
        const group = await this.api.createGroup({ name: this.createModel().name.trim() });
        this.recent.remember(group);
        this.notifications.success('toast.groupCreated', { name: group.name });
        this.createForm().reset({ name: '' });
        await this.router.navigate(['/groups', group.id]);
      } catch (error) {
        this.notifications.failure(toApiError(error));
      } finally {
        this.creating.set(false);
      }
      return undefined;
    });
  }

  protected async openGroup(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.openForm, async () => {
      this.opening.set(true);
      try {
        await this.router.navigate(['/groups', this.openModel().groupId.trim()]);
      } finally {
        this.opening.set(false);
      }
      return undefined;
    });
  }
}
