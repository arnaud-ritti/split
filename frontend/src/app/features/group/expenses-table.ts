import { Component, computed, inject, input } from '@angular/core';
import { CardModule } from '@openng/optimus-ui/card';
import { MessageModule } from '@openng/optimus-ui/message';
import { TableModule } from '@openng/optimus-ui/table';
import { Expense } from '../../core/api/models';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/i18n.pipes';

interface ExpenseRow {
  readonly id: string;
  readonly description: string;
  readonly amount: string;
  readonly payerName: string;
  readonly createdAt: string;
  readonly createdAtLabel: string;
  readonly sharesLabel: string;
}

@Component({
  selector: 'app-expenses-table',
  imports: [CardModule, MessageModule, TableModule, TranslatePipe],
  template: `
    <p-card>
      <ng-template #title>
        <div class="panel-title">
          <h2 class="panel-title__text">{{ 'expenses.title' | t }}</h2>
          <span class="panel-title__meta">
            {{ 'expenses.count' | t: { count: expenses().length } }}
            @if (expenses().length) {
              · {{ 'expenses.total' | t: { amount: totalLabel() } }}
            }
          </span>
        </div>
      </ng-template>

      @if (rows().length) {
        <p-table [value]="rows()" dataKey="id" size="small" [tableStyle]="{ width: '100%' }">
          <ng-template #header>
            <tr>
              <th scope="col">{{ 'expenses.column.description' | t }}</th>
              <th scope="col" class="numeric">{{ 'expenses.column.amount' | t }}</th>
              <th scope="col">{{ 'expenses.column.payer' | t }}</th>
              <th scope="col">{{ 'expenses.column.date' | t }}</th>
            </tr>
          </ng-template>
          <ng-template #body let-row>
            <tr>
              <th scope="row" class="expenses__description">
                {{ row.description }}
                <span class="expenses__shares">{{ row.sharesLabel }}</span>
              </th>
              <td class="numeric">{{ row.amount }}</td>
              <td>{{ row.payerName }}</td>
              <td>
                <time [attr.datetime]="row.createdAt">{{ row.createdAtLabel }}</time>
              </td>
            </tr>
          </ng-template>
        </p-table>
      } @else {
        <p-message severity="info" variant="simple">{{ 'expenses.empty' | t }}</p-message>
      }
    </p-card>
  `,
  styles: `
    .panel-title {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .panel-title__text {
      margin: 0;
      font-size: 1.125rem;
    }

    .panel-title__meta {
      font-size: 0.8125rem;
      font-weight: 400;
      color: var(--p-text-muted-color);
    }

    .numeric {
      text-align: end;
      font-variant-numeric: tabular-nums;
    }

    /*
     * The description cell is a row header (th scope=row) so a screen reader can tie each
     * figure back to its expense. Optimus styles only td inside the table body, so the row
     * header has to borrow the same border and padding — without this the row separator
     * starts after the first column and the cell loses its padding.
     */
    .expenses__description {
      text-align: start;
      font-weight: 550;
      border-color: var(--p-datatable-body-cell-border-color);
      border-style: solid;
      border-width: 0 0 1px 0;
      padding: var(--p-datatable-body-cell-sm-padding, var(--p-datatable-body-cell-padding));
    }

    .expenses__shares {
      display: block;
      font-size: 0.8125rem;
      font-weight: 400;
      color: var(--p-text-muted-color);
    }
  `,
})
export class ExpensesTable {
  readonly expenses = input.required<readonly Expense[]>();

  private readonly i18n = inject(I18nService);

  /**
   * Rows are pre-formatted rather than piped in the template: `p-table` wants a mutable
   * array anyway, and doing the money formatting here keeps one `Intl` lookup per cell.
   */
  protected readonly rows = computed<ExpenseRow[]>(() =>
    this.expenses().map((expense) => ({
      id: expense.id,
      description: expense.description,
      amount: this.i18n.formatMoney(expense.amount),
      payerName: expense.payerName,
      createdAt: expense.createdAt,
      createdAtLabel: this.i18n.formatDate(expense.createdAt),
      sharesLabel: expense.shares
        .map((share) => `${share.memberName} ${this.i18n.formatMoney(share.amount)}`)
        .join(' · '),
    })),
  );

  protected readonly totalLabel = computed(() =>
    this.i18n.formatMoney(this.expenses().reduce((sum, expense) => sum + expense.amount, 0)),
  );
}
