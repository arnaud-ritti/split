import { DOCUMENT, Service, computed, effect, inject, signal } from '@angular/core';

export interface RecentGroup {
  readonly id: string;
  readonly name: string;
  readonly visitedAt: string;
}

const STORAGE_KEY = 'split.recentGroups';
const MAX_ENTRIES = 8;

/**
 * The API has no "list my groups" endpoint — a group is reachable only by its id — so the
 * ids someone has already opened are kept in this browser. Losing them costs nothing more
 * than having to paste an id again.
 */
@Service()
export class RecentGroups {
  private readonly document = inject(DOCUMENT);
  private readonly entries = signal<readonly RecentGroup[]>(this.read());

  readonly groups = computed(() => this.entries());

  constructor() {
    effect(() => this.write(this.entries()));
  }

  remember(group: { id: string; name: string }): void {
    this.entries.update((current) =>
      [
        { id: group.id, name: group.name, visitedAt: new Date().toISOString() },
        ...current.filter((entry) => entry.id !== group.id),
      ].slice(0, MAX_ENTRIES),
    );
  }

  forget(id: string): void {
    this.entries.update((current) => current.filter((entry) => entry.id !== id));
  }

  clear(): void {
    this.entries.set([]);
  }

  private read(): readonly RecentGroup[] {
    try {
      const raw = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(isRecentGroup) : [];
    } catch {
      // Unreadable or corrupt storage is the same as an empty history.
      return [];
    }
  }

  private write(entries: readonly RecentGroup[]): void {
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Nothing actionable: the app works without a history.
    }
  }
}

function isRecentGroup(value: unknown): value is RecentGroup {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<RecentGroup>;
  return typeof candidate.id === 'string' && typeof candidate.name === 'string';
}
