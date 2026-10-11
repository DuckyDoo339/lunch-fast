import { Injectable, computed, inject, signal } from '@angular/core';
import { menus, ownerPages, riderPages } from '../core/constants';
import { Page } from '../core/models';
import { StateService } from './state.service';

@Injectable({ providedIn: 'root' })
export class NavService {
  private readonly state = inject(StateService);

  readonly page = signal<Page>('dashboard');
  readonly isRider = computed(() => this.state.role() === 'rider');
  readonly crumb = computed(() => menus.find((m) => m.page === this.page())?.label ?? '');

  init(): void {
    if (typeof location === 'undefined') return;
    const valid = [...ownerPages, ...riderPages];
    const initial = location.hash.slice(1) as Page;
    if (ownerPages.includes(initial)) this.state.role.set('owner');
    else if (riderPages.includes(initial)) this.state.role.set('rider');
    this.page.set(valid.includes(initial) ? initial : this.state.defaultPage());
    this.state.selected.set(this.state.sessionRider());
    history.replaceState(null, '', '#' + this.page());
    window.addEventListener('hashchange', () => {
      const target = location.hash.slice(1) as Page;
      if ([...ownerPages, ...riderPages].includes(target)) {
        if (target !== this.page()) this.go(target);
      } else {
        history.replaceState(null, '', '#' + this.page());
      }
    });
  }

  go(p: Page): void {
    let page = p;
    if (ownerPages.includes(p)) this.state.role.set('owner');
    else if (riderPages.includes(p)) this.state.role.set('rider');
    else page = this.state.defaultPage();
    this.state.selected.set(this.state.sessionRider());
    this.page.set(page);
    this.state.persistSession();
    if (typeof location !== 'undefined') location.hash = page;
  }
}
