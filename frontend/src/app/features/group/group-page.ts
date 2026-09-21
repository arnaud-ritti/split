import { Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { MessageModule } from '@openng/optimus-ui/message';
import { ProgressSpinnerModule } from '@openng/optimus-ui/progressspinner';
import { SplitApi } from '../../core/api/split-api';
import { CreateExpenseRequest } from '../../core/api/models';
import { toApiError } from '../../core/api/api-error';
import { RecentGroups } from '../../core/recent-groups';
import { Notifications } from '../../core/notifications';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/i18n.pipes';
import { MembersPanel } from './members-panel';
import { ExpenseForm } from './expense-form';
import { ExpensesTable } from './expenses-table';
import { BalancesPanel } from './balances-panel';
import { SettlementsPanel } from './settlements-panel';

@Component({
  selector: 'app-group-page',
  imports: [
    RouterLink,
    ButtonModule,
    MessageModule,
    ProgressSpinnerModule,
    TranslatePipe,
    MembersPanel,
    ExpenseForm,
    ExpensesTable,
    BalancesPanel,
    SettlementsPanel,
  ],
  templateUrl: './group-page.html',
  styleUrl: './group-page.css',
})
export class GroupPage {
  /** Bound from the `groups/:groupId` route segment. */
  readonly groupId = input.required<string>();

  private readonly api = inject(SplitApi);
  private readonly recent = inject(RecentGroups);
  private readonly notifications = inject(Notifications);
  private readonly i18n = inject(I18nService);

  private readonly membersPanel = viewChild(MembersPanel);
  private readonly expenseForm = viewChild(ExpenseForm);

  protected readonly group = this.api.groupResource(this.groupId);
  protected readonly expenses = this.api.expensesResource(this.groupId);
  protected readonly balances = this.api.balancesResource(this.groupId);
  protected readonly settlements = this.api.settlementsResource(this.groupId);

  protected readonly addingMember = signal(false);
  protected readonly addingExpense = signal(false);

  protected readonly createdAtLabel = computed(() => {
    if (!this.group.hasValue()) {
      return '';
    }
    const date = this.i18n.formatDate(this.group.value().createdAt);
    return this.i18n.translate('group.createdOn', { date });
  });

  /** A 404 gets its own wording: the id is almost always the thing that is wrong. */
  protected readonly errorMessage = computed(() => {
    const failure = this.group.error();
    if (!failure) {
      return null;
    }
    const error = toApiError(failure);
    return error.status === 404
      ? this.i18n.translate('group.notFound')
      : this.i18n.translate(error.messageKey);
  });

  constructor() {
    // `hasValue()` rather than a truthiness check: reading `value()` on a resource that
    // failed rethrows the error, which inside an effect takes the whole view down.
    effect(() => {
      if (this.group.hasValue()) {
        this.recent.remember(this.group.value());
      }
    });
  }

  /**
   * The identifier is the only way to share a group, since the API has no listing
   * endpoint. Clipboard access can be refused, in which case nothing is claimed.
   */
  protected async copyId(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.groupId());
      this.notifications.success('group.idCopied');
    } catch {
      this.notifications.failure({ messageKey: 'error.unknown', status: 0 });
    }
  }

  protected reload(): void {
    this.group.reload();
    this.expenses.reload();
    this.balances.reload();
    this.settlements.reload();
  }

  protected async addMember(name: string): Promise<void> {
    this.addingMember.set(true);
    try {
      const member = await this.api.addMember(this.groupId(), { name });
      this.notifications.success('toast.memberAdded', { name: member.name });
      this.membersPanel()?.reset();
      this.group.reload();
      // The new member enters the balance sheet at zero, which the API reports for them.
      this.balances.reload();
      this.settlements.reload();
    } catch (error) {
      this.notifications.failure(toApiError(error));
    } finally {
      this.addingMember.set(false);
    }
  }

  protected async addExpense(request: CreateExpenseRequest): Promise<void> {
    this.addingExpense.set(true);
    try {
      const expense = await this.api.createExpense(this.groupId(), request);
      this.notifications.success('toast.expenseAdded', { description: expense.description });
      this.expenseForm()?.reset();
      this.expenses.reload();
      this.balances.reload();
      this.settlements.reload();
    } catch (error) {
      this.notifications.failure(toApiError(error));
    } finally {
      this.addingExpense.set(false);
    }
  }
}
