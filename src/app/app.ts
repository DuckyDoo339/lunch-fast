import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';
import { ownerMenus, riderMenus } from './core/constants';
import { Page, Role } from './core/models';
import { Dialog } from './components/dialog/dialog';
import { Icon } from './components/icon/icon';
import { Customers } from './pages/customers/customers';
import { Dashboard } from './pages/dashboard/dashboard';
import { Delivery } from './pages/delivery/delivery';
import { Jobs } from './pages/jobs/jobs';
import { NavigationPage } from './pages/navigation-page/navigation-page';
import { Orders } from './pages/orders/orders';
import { Reports } from './pages/reports/reports';
import { RoutesPage } from './pages/routes-page/routes-page';
import { ModalService } from './services/modal.service';
import { NavService } from './services/nav.service';
import { StateService } from './services/state.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Dialog, Dashboard, Customers, Orders, RoutesPage, Reports, Jobs, NavigationPage, Delivery],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly nav = inject(NavService);
  readonly state = inject(StateService);
  readonly toast = inject(ToastService);
  private readonly modal = inject(ModalService);

  readonly sidebarOpen = signal(false);
  readonly ownerMenus = ownerMenus;
  readonly riderMenus = riderMenus;

  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    const isBrowser = isPlatformBrowser(this.platformId);

    effect(() => {
      if (!isBrowser || typeof document === 'undefined') return;
      const mode = this.state.role() === 'rider' ? 'mode-rider' : 'mode-owner';
      document.body.className = mode + ' modern-motion';
    });

    if (!isBrowser) return;

    this.nav.init();
    this.state.prepareSampleRoutes();

    effect(() => {
      this.state.routes();
      this.state.shop();
      untracked(() => void this.state.loadRoads());
    });

    const onPointerDown = (event: PointerEvent): void => {
      const button = (event.target as HTMLElement | null)?.closest('button');
      if (!button) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      wave.style.cssText = `width:${size}px;height:${size}px;left:${event.clientX - rect.left - size / 2}px;top:${event.clientY - rect.top - size / 2}px`;
      button.appendChild(wave);
      setTimeout(() => wave.remove(), 550);
    };
    document.addEventListener('pointerdown', onPointerDown);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('pointerdown', onPointerDown));
  }

  go(page: Page): void {
    this.nav.go(page);
    this.sidebarOpen.set(false);
  }

  switchWorkspace(role: Role): void {
    this.modal.close();
    this.state.switchWorkspace(role);
    this.nav.go(this.state.defaultPage());
  }

  riderLabel(page: Page): string {
    return page === 'jobs' ? 'ใบงานของฉัน' : page === 'navigation' ? 'แผนที่นำทาง' : 'รายละเอียดงาน';
  }
}
