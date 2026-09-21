import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { ButtonModule } from '@openng/optimus-ui/button';
import { CardModule } from '@openng/optimus-ui/card';
import { MessageModule } from '@openng/optimus-ui/message';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { Member } from '../../core/api/models';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/i18n.pipes';
import { fieldErrorMessage } from '../../core/i18n/validation-message';

@Component({
  selector: 'app-members-panel',
  imports: [FormField, ButtonModule, CardModule, MessageModule, InputTextModule, TranslatePipe],
  template: `
    <p-card>
      <ng-template #title>
        <div class="panel-title">
          <h2 class="panel-title__text">{{ 'members.title' | t }}</h2>
          <span class="panel-title__count">{{
            'members.count' | t: { count: members().length }
          }}</span>
        </div>
      </ng-template>

      @if (members().length) {
        <ul class="members">
          @for (member of members(); track member.id) {
            <li class="members__item">{{ member.name }}</li>
          }
        </ul>
      } @else {
        <p-message severity="info" variant="simple">{{ 'members.empty' | t }}</p-message>
      }

      <form class="members__form" (submit)="addMember($event)">
        <div class="field">
          <label class="field__label" for="new-member-name">
            {{ 'members.nameLabel' | t }}
            <span class="field__required" aria-hidden="true">*</span>
          </label>
          <input
            pInputText
            id="new-member-name"
            autocomplete="off"
            [formField]="memberForm.name"
            [class.is-invalid]="!!nameError()"
            [placeholder]="'members.namePlaceholder' | t"
            [attr.aria-invalid]="nameError() ? 'true' : null"
            [attr.aria-describedby]="nameError() ? 'new-member-name-error' : null"
          />
          @if (nameError()) {
            <p class="field__error" id="new-member-name-error">{{ nameError() }}</p>
          }
        </div>
        <button pButton type="submit" severity="secondary" [loading]="saving()">
          <span pButtonLabel>{{ 'members.add' | t }}</span>
        </button>
      </form>
    </p-card>
  `,
  styles: `
    .panel-title {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .panel-title__text {
      margin: 0;
      font-size: 1.125rem;
    }

    .panel-title__count {
      font-size: 0.8125rem;
      font-weight: 400;
      color: var(--p-text-muted-color);
    }

    .members {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .members__item {
      padding: 0.25rem 0.625rem;
      border-radius: 999px;
      background: var(--p-content-hover-background, rgb(0 0 0 / 5%));
      font-size: 0.875rem;
    }

    .members__form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: flex-start;
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--p-content-border-color);
    }

    .members__form .field {
      width: 100%;
    }
  `,
})
export class MembersPanel {
  readonly members = input.required<readonly Member[]>();
  readonly saving = input(false);
  readonly add = output<string>();

  private readonly i18n = inject(I18nService);
  private readonly model = signal({ name: '' });

  protected readonly memberForm = form(this.model, (path) => {
    required(path.name);
    maxLength(path.name, 100);
  });

  protected readonly nameError = computed(() =>
    fieldErrorMessage(this.i18n, this.memberForm.name()),
  );

  /** Clears the field so the next member can be typed straight away. */
  reset(): void {
    this.memberForm().reset({ name: '' });
  }

  protected async addMember(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.memberForm, async () => {
      this.add.emit(this.model().name.trim());
      return undefined;
    });
  }
}
