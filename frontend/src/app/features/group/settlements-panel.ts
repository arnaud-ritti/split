import { Component, computed, inject, input } from '@angular/core';
import { CardModule } from '@openng/optimus-ui/card';
import { MessageModule } from '@openng/optimus-ui/message';
import { TagModule } from '@openng/optimus-ui/tag';
import { Settlement } from '../../core/api/models';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/i18n.pipes';

@Component({
  selector: 'app-settlements-panel',
  imports: [CardModule, MessageModule, TagModule, TranslatePipe],
  template: `
    <p-card>
      <ng-template #title>
        <div class="panel-title">
          <h2 class="panel-title__text">{{ 'settlements.title' | t }}</h2>
          @if (settlement(); as plan) {
            <p-tag
              [value]="'settlements.strategy.' + plan.strategy | t"
              [severity]="plan.strategy === 'OPTIMAL' ? 'success' : 'warn'"
            />
          }
        </div>
      </ng-template>

      @if (settlement(); as plan) {
        @if (plan.transfers.length) {
          <p class="settlements__count">
            {{ 'settlements.count' | t: { count: plan.transferCount } }}
          </p>
          <ol class="settlements">
            @for (transfer of transferLabels(); track $index) {
              <li class="settlements__item">{{ transfer }}</li>
            }
          </ol>
          <p class="field__hint settlements__hint">
            {{ 'settlements.strategyHint.' + plan.strategy | t }}
          </p>
        } @else {
          <p-message severity="success" variant="simple">{{ 'settlements.empty' | t }}</p-message>
        }
      }
    </p-card>
  `,
  styles: `
    .panel-title {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .panel-title__text {
      margin: 0;
      font-size: 1.125rem;
    }

    .settlements__count {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      color: var(--p-text-muted-color);
    }

    .settlements {
      margin: 0;
      padding-left: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .settlements__item {
      line-height: 1.5;
    }

    .settlements__hint {
      margin-top: 0.75rem;
    }
  `,
})
export class SettlementsPanel {
  readonly settlement = input.required<Settlement | undefined>();

  private readonly i18n = inject(I18nService);

  protected readonly transferLabels = computed(() =>
    (this.settlement()?.transfers ?? []).map((transfer) =>
      this.i18n.translate('settlements.transfer', {
        from: transfer.fromName,
        to: transfer.toName,
        amount: this.i18n.formatMoney(transfer.amount),
      }),
    ),
  );
}
