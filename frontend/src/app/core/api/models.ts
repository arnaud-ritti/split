/** Mirrors the DTOs exposed by the Spring API. Amounts are decimal numbers of euros. */

export interface Member {
  readonly id: string;
  readonly name: string;
}

export interface Group {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly members: readonly Member[];
}

export interface Share {
  readonly memberId: string;
  readonly memberName: string;
  readonly amount: number;
}

export interface Expense {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly payerId: string;
  readonly payerName: string;
  readonly createdAt: string;
  readonly shares: readonly Share[];
}

/** Positive means the group owes the member; negative means the member owes the group. */
export interface Balance {
  readonly memberId: string;
  readonly memberName: string;
  readonly net: number;
}

export interface Transfer {
  readonly fromId: string;
  readonly fromName: string;
  readonly toId: string;
  readonly toName: string;
  readonly amount: number;
}

/** `OPTIMAL` guarantees the fewest transfers; `GREEDY` is the fallback for large groups. */
export type SettlementStrategy = 'OPTIMAL' | 'GREEDY';

export interface Settlement {
  readonly strategy: SettlementStrategy;
  readonly transferCount: number;
  readonly transfers: readonly Transfer[];
}

export interface CreateGroupRequest {
  readonly name: string;
}

export interface AddMemberRequest {
  readonly name: string;
}

export interface CreateExpenseRequest {
  readonly description: string;
  readonly amount: number;
  readonly payerId: string;
  readonly participantIds: readonly string[];
}
