import { Component, computed, inject, input, output, signal } from '@angular/core';
import {
  FormField,
  form,
  maxLength,
  min,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import { ButtonModule } from '@openng/optimus-ui/button';
import { CardModule } from '@openng/optimus-ui/card';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { MessageModule } from '@openng/optimus-ui/message';
import { CreateExpenseRequest, Member } from '../../core/api/models';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/i18n.pipes';
import { fieldErrorMessage } from '../../core/i18n/validation-message';

interface ExpenseDraft {
  description: string;
  amount: number | null;
  payerId: string;
  participantIds: string[];
}

const EMPTY_DRAFT: ExpenseDraft = {
  description: '',
  amount: null,
  payerId: '',
  participantIds: [],
};

/**
 * The payer is a native `<select>` and the participants are native checkboxes rather than
 * `p-select` / `p-multiselect`: those extend Optimus's `BaseInput`, whose `pattern`, `min`
 * and `max` inputs collide with the host bindings `[formField]` applies.
 */
@Component({
  selector: 'app-expense-form',
  imports: [FormField, ButtonModule, CardModule, InputTextModule, MessageModule, TranslatePipe],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.css',
})
export class ExpenseForm {
  readonly members = input.required<readonly Member[]>();
  readonly saving = input(false);
  readonly create = output<CreateExpenseRequest>();

  private readonly i18n = inject(I18nService);
  private readonly model = signal<ExpenseDraft>({ ...EMPTY_DRAFT });

  protected readonly expenseForm = form(this.model, (path) => {
    required(path.description);
    maxLength(path.description, 200);
    required(path.amount);
    min(path.amount, 0.01);
    required(path.payerId);
    minLength(path.participantIds, 1);
  });

  protected readonly hasMembers = computed(() => this.members().length > 0);

  protected readonly descriptionError = computed(() =>
    fieldErrorMessage(this.i18n, this.expenseForm.description()),
  );

  protected readonly amountError = computed(() =>
    fieldErrorMessage(this.i18n, this.expenseForm.amount()),
  );

  protected readonly payerError = computed(() =>
    fieldErrorMessage(this.i18n, this.expenseForm.payerId()),
  );

  protected readonly participantsError = computed(() =>
    fieldErrorMessage(this.i18n, this.expenseForm.participantIds(), {
      minLength: 'validation.participantsRequired',
    }),
  );

  protected readonly participantsDescribedBy = computed(() =>
    this.participantsError()
      ? 'expense-participants-hint expense-participants-error'
      : 'expense-participants-hint',
  );

  reset(): void {
    this.expenseForm().reset({ ...EMPTY_DRAFT });
  }

  protected isParticipant(memberId: string): boolean {
    return this.expenseForm.participantIds().value().includes(memberId);
  }

  protected toggleParticipant(memberId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const field = this.expenseForm.participantIds();

    field.value.update((current) =>
      checked ? [...current, memberId] : current.filter((id) => id !== memberId),
    );
    field.markAsTouched();
    field.markAsDirty();
  }

  protected selectEveryone(): void {
    const field = this.expenseForm.participantIds();
    field.value.set(this.members().map((member) => member.id));
    field.markAsTouched();
    field.markAsDirty();
  }

  protected async submitExpense(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.expenseForm, async () => {
      const draft = this.model();
      // `submit` runs the action only when the form validates, so the amount is set.
      this.create.emit({
        description: draft.description.trim(),
        amount: draft.amount!,
        payerId: draft.payerId,
        participantIds: [...draft.participantIds],
      });
      return undefined;
    });
  }
}
