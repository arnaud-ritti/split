import { Component, computed, inject, input } from '@angular/core';
import { CardModule } from '@openng/optimus-ui/card';
import { MessageModule } from '@openng/optimus-ui/message';
import { TagModule } from '@openng/optimus-ui/tag';
import { Balance } from '../../core/api/models';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/i18n.pipes';

type BalanceState = 'owed' | 'owes' | 'settled';

interface BalanceRow {
  readonly memberId: string;
  readonly memberName: string;
  readonly label: string;
  readonly state: BalanceState;
}

/** Below half a cent the API's own rounding makes the sign meaningless. */
const EPSILON = 0.005;

@Component({
  selector: 'app-balances-panel',
  imports: [CardModule, MessageModule, TagModule, TranslatePipe],
  template: `
    <p-card>
      <ng-template #title>
        <h2 class="panel-title__text">{{ 'balances.title' | t }}</h2>
      </ng-template>

      @if (rows().length) {
        <ul class="balances">
          @for (row of rows(); track row.memberId) {
            <li class="balances__row">
              <span class="balances__name">{{ row.memberName }}</span>
              <p-tag [value]="row.label" [severity]="severityFor(row.state)" />
            </li>
          }
        </ul>
        <p class="field__hint balances__hint">{{ 'balances.hint' | t }}</p>
      } @else {
        <p-message severity="info" variant="simple">{{ 'balances.empty' | t }}</p-message>
      }
    </p-card>
  `,
  styles: `
    .panel-title__text {
      margin: 0;
      font-size: 1.125rem;
    }

    .balances {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .balances__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding-block: 0.5rem;
      border-bottom: 1px solid var(--p-content-border-color);
    }

    .balances__row:last-child {
      border-bottom: 0;
    }

    .balances__name {
      font-weight: 550;
    }

    .balances__hint {
      margin-top: 0.75rem;
    }
  `,
})
export class BalancesPanel {
  readonly balances = input.required<readonly Balance[]>();

  private readonly i18n = inject(I18nService);

  protected readonly rows = computed<BalanceRow[]>(() =>
    this.balances().map((balance) => {
      const state = stateOf(balance.net);
      return {
        memberId: balance.memberId,
        memberName: balance.memberName,
        state,
        label: this.label(balance.net, state),
      };
    }),
  );

  protected severityFor(state: BalanceState): 'success' | 'danger' | 'secondary' {
    if (state === 'owed') {
      return 'success';
    }
    return state === 'owes' ? 'danger' : 'secondary';
  }

  /**
   * The direction is spelled out rather than left to the tag colour: colour alone would
   * fail WCAG 1.4.1, and "owes" versus "is owed" is exactly the bit people get wrong.
   */
  private label(net: number, state: BalanceState): string {
    if (state === 'settled') {
      return this.i18n.translate('balances.settled');
    }
    const amount = this.i18n.formatMoney(Math.abs(net));
    return this.i18n.translate(state === 'owed' ? 'balances.isOwed' : 'balances.owes', { amount });
  }
}

function stateOf(net: number): BalanceState {
  if (net > EPSILON) {
    return 'owed';
  }
  return net < -EPSILON ? 'owes' : 'settled';
}
