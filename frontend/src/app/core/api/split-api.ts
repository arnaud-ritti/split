import { HttpClient, httpResource } from '@angular/common/http';
import { InjectionToken, Service, Signal, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  AddMemberRequest,
  Balance,
  CreateExpenseRequest,
  CreateGroupRequest,
  Expense,
  Group,
  Member,
  Settlement,
} from './models';

/**
 * Where the Spring API lives. The dev server proxies `/api` to it (see `proxy.conf.json`),
 * and a deployment can override the token to point somewhere else.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});

@Service()
export class SplitApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  // --- Reads. Each returns a resource that refetches whenever `groupId` changes. ---

  groupResource(groupId: Signal<string | undefined>) {
    return httpResource<Group>(() => this.groupUrl(groupId()));
  }

  expensesResource(groupId: Signal<string | undefined>) {
    return httpResource<Expense[]>(() => this.groupUrl(groupId(), 'expenses'), {
      defaultValue: [],
    });
  }

  balancesResource(groupId: Signal<string | undefined>) {
    return httpResource<Balance[]>(() => this.groupUrl(groupId(), 'balances'), {
      defaultValue: [],
    });
  }

  /**
   * A default value is what keeps `value()` from rethrowing if the request fails: the
   * panel then simply has nothing to show, rather than breaking the page around it.
   */
  settlementsResource(groupId: Signal<string | undefined>) {
    return httpResource<Settlement | undefined>(() => this.groupUrl(groupId(), 'settlements'), {
      defaultValue: undefined,
    });
  }

  // --- Writes. ---

  createGroup(request: CreateGroupRequest): Promise<Group> {
    return firstValueFrom(this.http.post<Group>(`${this.baseUrl}/groups`, request));
  }

  addMember(groupId: string, request: AddMemberRequest): Promise<Member> {
    return firstValueFrom(
      this.http.post<Member>(`${this.baseUrl}/groups/${groupId}/members`, request),
    );
  }

  createExpense(groupId: string, request: CreateExpenseRequest): Promise<Expense> {
    return firstValueFrom(
      this.http.post<Expense>(`${this.baseUrl}/groups/${groupId}/expenses`, request),
    );
  }

  /** `undefined` keeps the resource idle until a group is actually selected. */
  private groupUrl(groupId: string | undefined, segment?: string): string | undefined {
    if (!groupId) {
      return undefined;
    }
    const base = `${this.baseUrl}/groups/${encodeURIComponent(groupId)}`;
    return segment ? `${base}/${segment}` : base;
  }
}
