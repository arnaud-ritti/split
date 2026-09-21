import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateExpenseRequest, Member } from '../../core/api/models';
import { ExpenseForm } from './expense-form';

const MEMBERS: Member[] = [
  { id: 'm-1', name: 'Camille' },
  { id: 'm-2', name: 'Dominique' },
];

@Component({
  imports: [ExpenseForm],
  template: `<app-expense-form [members]="members()" (create)="submitted = $event" />`,
})
class Host {
  readonly members = signal<readonly Member[]>(MEMBERS);
  submitted: CreateExpenseRequest | null = null;
}

describe('ExpenseForm', () => {
  let fixture: ComponentFixture<Host>;
  let element: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  });

  async function setValue(id: string, value: string): Promise<void> {
    const field = element.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)!;
    field.value = value;
    // `<input>` binds on `input`, `<select>` on `change`; both are harmless on the other.
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  async function checkParticipant(index: number): Promise<void> {
    const boxes = element.querySelectorAll<HTMLInputElement>('.participants__option input');
    boxes[index].checked = true;
    boxes[index].dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  async function submitForm(): Promise<void> {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    // `submit()` resolves through promises the zoneless scheduler does not track.
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  it('asks for members before anything else', async () => {
    fixture.componentInstance.members.set([]);
    await fixture.whenStable();

    expect(element.textContent).toContain('Ajoutez au moins un membre');
    expect(element.querySelector('form')).toBeNull();
  });

  it('offers a checkbox per member', () => {
    expect(element.querySelectorAll('.participants__option').length).toBe(2);
    expect(element.textContent).toContain('Camille');
  });

  it('refuses to emit an empty form and reports the fields in French', async () => {
    await submitForm();

    expect(fixture.componentInstance.submitted).toBeNull();
    expect(element.textContent).toContain('Ce champ est obligatoire.');
    expect(element.textContent).toContain('Sélectionnez au moins un participant.');
  });

  it('leaves an untouched field unmarked, and marks it only once it is rejected', async () => {
    // Signal Forms hands Optimus a raw `invalid` state from the start; `.is-invalid` is
    // what actually drives the red border, and it has to wait for the person.
    const description = element.querySelector('#expense-description')!;
    expect(description.classList.contains('is-invalid')).toBe(false);
    expect(element.querySelector('.field__error')).toBeNull();

    await submitForm();

    expect(description.classList.contains('is-invalid')).toBe(true);
  });

  it('rejects an amount below one cent', async () => {
    await setValue('expense-description', 'Courses');
    await setValue('expense-amount', '0');
    await submitForm();

    expect(fixture.componentInstance.submitted).toBeNull();
    expect(element.textContent).toContain('supérieur ou égal à 0.01');
  });

  it('emits the request once every field is filled in', async () => {
    await setValue('expense-description', '  Courses du samedi  ');
    await setValue('expense-amount', '42.50');
    await setValue('expense-payer', 'm-1');
    await checkParticipant(0);
    await checkParticipant(1);
    await submitForm();

    expect(fixture.componentInstance.submitted).toEqual({
      description: 'Courses du samedi',
      amount: 42.5,
      payerId: 'm-1',
      participantIds: ['m-1', 'm-2'],
    });
  });

  it('selects the whole group in one click', async () => {
    element.querySelectorAll<HTMLButtonElement>('button')[1].click();
    await fixture.whenStable();

    const boxes = element.querySelectorAll<HTMLInputElement>('.participants__option input');
    expect([...boxes].every((box) => box.checked)).toBe(true);
  });
});
