import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from '@openng/optimus-ui/api';
import { Balance, Expense, Group, Settlement } from '../../core/api/models';
import { GroupPage } from './group-page';

const GROUP_ID = 'e3bd14dc-1fcb-4a64-9dee-3792e258f3ac';

const GROUP: Group = {
  id: GROUP_ID,
  name: 'Week-end à Lyon',
  createdAt: '2026-03-04T10:00:00Z',
  members: [
    { id: 'm-1', name: 'Camille' },
    { id: 'm-2', name: 'Dominique' },
  ],
};

const EXPENSES: Expense[] = [
  {
    id: 'e-1',
    description: 'Courses du samedi',
    amount: 42.5,
    payerId: 'm-1',
    payerName: 'Camille',
    createdAt: '2026-03-04T11:00:00Z',
    shares: [
      { memberId: 'm-1', memberName: 'Camille', amount: 21.25 },
      { memberId: 'm-2', memberName: 'Dominique', amount: 21.25 },
    ],
  },
];

const BALANCES: Balance[] = [
  { memberId: 'm-1', memberName: 'Camille', net: 21.25 },
  { memberId: 'm-2', memberName: 'Dominique', net: -21.25 },
];

const SETTLEMENT: Settlement = {
  strategy: 'OPTIMAL',
  transferCount: 1,
  transfers: [
    { fromId: 'm-2', fromName: 'Dominique', toId: 'm-1', toName: 'Camille', amount: 21.25 },
  ],
};

describe('GroupPage', () => {
  let fixture: ComponentFixture<GroupPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [GroupPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(GroupPage);
    fixture.componentRef.setInput('groupId', GROUP_ID);
  });

  afterEach(() => http.verify());

  /**
   * Runs change detection and drains the microtask queue.
   *
   * `whenStable()` is deliberately avoided: an unflushed `httpResource` request keeps the
   * application unstable, so awaiting stability before answering it would deadlock.
   */
  async function settle(): Promise<void> {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  /** Answers the four reads the page fires for a group. */
  async function serveGroup(): Promise<void> {
    await settle();
    const base = `/api/groups/${GROUP_ID}`;
    http.expectOne(base).flush(GROUP);
    http.expectOne(`${base}/expenses`).flush(EXPENSES);
    http.expectOne(`${base}/balances`).flush(BALANCES);
    http.expectOne(`${base}/settlements`).flush(SETTLEMENT);
    await settle();
  }

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('asks the API for the group and its three derived views', async () => {
    await serveGroup();

    expect(text()).toContain('Week-end à Lyon');
    expect(text()).toContain('2 membres');
  });

  it('shows the expenses with amounts formatted in euros', async () => {
    await serveGroup();

    expect(text()).toContain('Courses du samedi');
    expect(text()).toContain('42,50');
    expect(text()).toContain('€');
  });

  it('lets the expense table fill its card', async () => {
    await serveGroup();
    const table = (fixture.nativeElement as HTMLElement).querySelector<HTMLTableElement>(
      '.p-datatable-table',
    );

    // Optimus shrink-wraps the table otherwise, leaving a third of the card empty.
    expect(table?.style.width).toBe('100%');
  });

  it('spells out the direction of each balance rather than relying on colour', async () => {
    await serveGroup();

    expect(text()).toContain('On lui doit');
    expect(text()).toContain('Doit');
  });

  it('reports the settlement plan and the strategy behind it', async () => {
    await serveGroup();

    expect(text()).toContain('Dominique verse');
    expect(text()).toContain('Camille');
    expect(text()).toContain('Optimal');
    expect(text()).toContain('1 virement suffit');
  });

  it('records the group in the recently opened list', async () => {
    await serveGroup();

    expect(localStorage.getItem('split.recentGroups')).toContain(GROUP_ID);
  });

  it('explains a 404 as a wrong identifier', async () => {
    await settle();
    const base = `/api/groups/${GROUP_ID}`;
    http.expectOne(base).flush({ status: 404 }, { status: 404, statusText: 'Not Found' });
    http.expectOne(`${base}/expenses`).flush([]);
    http.expectOne(`${base}/balances`).flush([]);
    http.expectOne(`${base}/settlements`).flush(null);
    await settle();

    expect(text()).toContain('introuvable');
  });
});
