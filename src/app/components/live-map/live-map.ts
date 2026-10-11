import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild
} from '@angular/core';
import { colors } from '../../core/constants';
import { iconPaths } from '../../core/icons';
import { esc, roadKey } from '../../core/metrics';
import { Customer, Order } from '../../core/models';
import { Icon } from '../icon/icon';
import { ModalService } from '../../services/modal.service';
import { NavService } from '../../services/nav.service';
import { RoadService } from '../../services/road.service';
import { StateService } from '../../services/state.service';
import { ToastService } from '../../services/toast.service';

let mapSequence = 0;

@Component({
  selector: 'app-live-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './live-map.html'
})
export class LiveMap implements AfterViewInit, OnDestroy {
  readonly colors = colors;
  readonly mapId = `live-map-${++mapSequence}`;
  readonly only = input<number | null>(null);

  private readonly state = inject(StateService);
  private readonly road = inject(RoadService);
  private readonly toast = inject(ToastService);
  private readonly nav = inject(NavService);
  private readonly modal = inject(ModalService);

  private readonly mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');
  private readonly statusElRef = viewChild<ElementRef<HTMLDivElement>>('statusEl');

  private map: any = null;
  private points: [number, number][] = [];
  private boundsByRider: Record<number, [number, number][]> = {};
  private initialized = false;

  private readonly escapeHandler = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    const frame = this.mapEl()?.nativeElement.closest('.map-frame');
    if (frame?.classList.contains('is-expanded')) {
      frame.classList.remove('is-expanded');
      this.map?.invalidateSize();
    }
  };

  readonly routes = computed(() => {
    const only = this.only();
    const routes = this.state.routes();
    return only === null ? routes : routes.filter((r) => r.rider === only);
  });

  constructor() {
    effect(() => {
      this.routes();
      this.road.roadData();
      if (this.initialized && untracked(() => this.modal.current() === null)) {
        this.rebuild();
      }
    });
  }

  ngAfterViewInit(): void {
    if (typeof document === 'undefined') return;
    this.initialized = true;
    this.buildMap();
    document.addEventListener('keydown', this.escapeHandler);
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') document.removeEventListener('keydown', this.escapeHandler);
    this.map?.remove();
    this.map = null;
  }

  private get leaflet(): any {
    return typeof window === 'undefined' ? undefined : (window as unknown as { L?: any }).L;
  }

  private statusEl(): HTMLElement | undefined {
    return this.statusElRef()?.nativeElement;
  }

  private rebuild(): void {
    this.map?.remove();
    this.map = null;
    this.buildMap();
  }

  private buildMap(): void {
    const el = this.mapEl().nativeElement;
    const L = this.leaflet;
    if (!L) {
      el.innerHTML =
        '<div class="map-no-service">ไม่สามารถเปิดแผนที่ได้ <a href="https://www.openstreetmap.org/#map=15/16.246/103.250" target="_blank" rel="noopener">เปิด OpenStreetMap ↗</a></div>';
      return;
    }
    el.innerHTML = '';
    const routes = this.routes();
    const shop = this.state.shop();
    const ctx = this.state.context();
    const roadData = this.road.roadData();
    const points: [number, number][] = [[shop.lat, shop.lng]];
    const boundsByRider: Record<number, [number, number][]> = {};

    const map = L.map(el, { scrollWheelZoom: false }).setView([shop.lat, shop.lng], 14);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      referrerPolicy: 'strict-origin-when-cross-origin'
    }).addTo(map);
    let loaded = 0;
    tiles.on('tileload', () => loaded++);
    tiles.on('tileerror', () => {
      if (loaded) return;
      const label = this.statusEl();
      if (label) {
        label.textContent = 'โหลดแผนที่ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ต หรือเปิด OpenStreetMap โดยตรง';
        label.classList.add('error');
      }
    });
    L.control.scale({ imperial: false }).addTo(map);
    L.marker([shop.lat, shop.lng], { icon: this.mapPin('⌂', '#27382c', true) })
      .addTo(map)
      .bindPopup(
        '<strong>จุดรับอาหารที่ร้าน</strong><div class="sub">พิกัดเริ่มต้นตัวอย่าง แก้ไขได้ในหน้าจัดเส้นทาง</div>'
      );

    routes.forEach((r) => {
      const coords: [number, number][] = [[shop.lat, shop.lng]];
      const cache = roadData[roadKey(ctx, r.ids)];
      r.ids.forEach((id, i) => {
        const o = this.state.order(id);
        if (!o) return;
        const c = this.state.customer(o.customer);
        if (!c) return;
        const p: [number, number] = [c.lat, c.lng];
        coords.push(p);
        points.push(p);
        L.marker(p, { icon: this.mapPin(String(i + 1), colors[r.rider % 8]) })
          .addTo(map)
          .bindPopup(this.stopPopup(r.rider, o, c, i));
      });
      const path: [number, number][] = cache
        ? cache.geometry.coordinates.map((coord) => [coord[1], coord[0]] as [number, number])
        : coords;
      boundsByRider[r.rider] = path;
      L.polyline(path, {
        color: colors[r.rider % 8],
        weight: 4,
        opacity: 0.85,
        dashArray: cache ? null : '7 9'
      })
        .addTo(map)
        .bindTooltip(
          esc(this.riderName(r.rider)) + (cache ? ' · เส้นทางถนนจริง' : ' · เส้นตรงประมาณการ')
        );
      path.forEach((p) => points.push(p));
    });

    if (!routes.length && (this.only() === null || this.only() === -1)) {
      this.state.customers().forEach((c) => {
        const p: [number, number] = [c.lat, c.lng];
        points.push(p);
        L.circleMarker(p, { radius: 6, color: '#fff', weight: 2, fillColor: '#ef9550', fillOpacity: 1 })
          .addTo(map)
          .bindPopup(
            `<strong>${esc(c.name)}</strong><div class="sub">${esc(c.address)}</div><a href="https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}" target="_blank" rel="noopener">ดูตำแหน่ง ↗</a>`
          );
      });
    }

    map.fitBounds(L.latLngBounds(points).pad(0.12), { maxZoom: 15 });
    this.map = map;
    this.points = points;
    this.boundsByRider = boundsByRider;
    map.invalidateSize();
    const label = this.statusEl();
    if (label) {
      label.textContent =
        (routes.length ? this.state.roadSummary() : 'ตำแหน่งลูกค้าบนแผนที่จริง') +
        ' · พิกัดตัวอย่าง · เวลาใช้ความเร็ว 30 กม./ชม.';
      label.classList.remove('error');
    }
  }

  private stopPopup(rider: number, o: Order, c: Customer, index: number): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = `<strong>${index + 1}. ${esc(c.name)}</strong><div class="sub">${esc(c.address)}<br>${o.boxes} กล่อง · ${esc(this.riderName(rider))}<br>${esc(o.status)}</div>`;
    const button = document.createElement('button');
    button.className = 'small';
    button.textContent = 'ดูรายละเอียด →';
    button.addEventListener('click', () => {
      this.state.selectRider(rider);
      this.state.selectedOrder.set(o.id);
      this.nav.go('delivery');
    });
    container.appendChild(button);
    return container;
  }

  private mapPin(label: string, color: string, shopPin = false): any {
    const L = this.leaflet;
    const content = shopPin
      ? `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPaths['store']}"/></svg>`
      : label;
    return L.divIcon({
      className: 'stop-pin' + (shopPin ? ' shop-pin' : ''),
      html: `<span style="background:${color}">${content}</span>`,
      iconSize: shopPin ? [34, 34] : [28, 28],
      iconAnchor: shopPin ? [17, 17] : [14, 14]
    });
  }

  riderName(id: number): string {
    return this.state.riders()[id]?.name ?? '';
  }

  focus(rider: number): void {
    const points = this.boundsByRider[rider];
    if (!points?.length || !this.map) return;
    this.map.fitBounds(this.leaflet.latLngBounds(points).pad(0.15), {
      maxZoom: 16,
      animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });
  }

  focusAll(): void {
    if (!this.points.length || !this.map) return;
    this.map.fitBounds(this.leaflet.latLngBounds(this.points).pad(0.15), {
      maxZoom: 16,
      animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });
  }

  expand(): void {
    const frame = this.mapEl()?.nativeElement.closest('.map-frame');
    frame?.classList.toggle('is-expanded');
    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  retryRoads(): void {
    this.state.retryRoads();
  }
}
