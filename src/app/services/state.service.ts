import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  BOX_COST,
  BOX_PRICE,
  DELIVERY_RATE,
  ORDER_STATUSES,
  RIDER_FEE,
  SESSION_KEY,
  STARTED_STATUSES,
  STORAGE_KEY,
  TARGET_TIME
} from '../core/constants';
import { km, money as formatMoney, roadKey, roadMetrics, timeOf } from '../core/metrics';
import {
  AppState,
  Customer,
  DeliveryRoute,
  HistoryEntry,
  LatLng,
  Order,
  Page,
  Rider,
  Role,
  RouteContext,
  RouteMetrics,
  Session,
  Settings
} from '../core/models';
import { seed } from '../core/seed';
import { RoadService } from './road.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class StateService {
  private readonly toast = inject(ToastService);
  private readonly road = inject(RoadService);

  readonly customers = signal<Customer[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly riders = signal<Rider[]>([]);
  readonly routes = signal<DeliveryRoute[]>([]);
  readonly history = signal<HistoryEntry[]>([]);
  readonly settings = signal<Settings>({ delay: 3, depart: '11:30' });
  readonly shop = signal<LatLng>({ lat: 16.246, lng: 103.25 });
  readonly role = signal<Role>('owner');
  readonly sessionRider = signal(0);
  readonly selected = signal(0);
  readonly selectedOrder = signal<number | null>(null);

  readonly activeOrders = computed(() => this.orders().filter((o) => o.status !== 'ยกเลิก'));

  readonly totals = computed(() => {
    const ctx = this.context();
    const roadData = this.road.roadData();
    const orders = this.orders();
    const routes = this.routes();
    const boxes = this.activeOrders().reduce((s, o) => s + o.boxes, 0);
    const delivery = routes.reduce(
      (s, r) =>
        s +
        roadMetrics(ctx, r.ids, roadData).deliveries.reduce(
          (a, d) => a + d.d * (orders.find((o) => o.id === d.id)?.boxes || 0) * DELIVERY_RATE,
          0
        ),
      0
    );
    const wages = routes.length * RIDER_FEE;
    return {
      boxes,
      sales: boxes * BOX_PRICE,
      food: boxes * BOX_COST,
      delivery,
      wages,
      profit: boxes * (BOX_PRICE - BOX_COST) - delivery - wages,
      distance: routes.reduce((s, r) => s + roadMetrics(ctx, r.ids, roadData).distance, 0),
      minutes: routes.reduce((s, r) => s + roadMetrics(ctx, r.ids, roadData).time, 0)
    };
  });

  constructor() {
    let loaded: AppState | null = null;
    if (typeof localStorage !== 'undefined') {
      try {
        loaded = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      } catch {
        loaded = null;
      }
    }
    const initial = loaded ?? seed();
    this.customers.set(initial.customers);
    this.orders.set(initial.orders);
    this.riders.set(initial.riders);
    this.routes.set(initial.routes);
    this.history.set(initial.history);
    this.settings.set(initial.settings);
    if (initial.settings.shop) this.shop.set(initial.settings.shop);

    if (typeof localStorage !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as Session | null;
        if (saved && ['owner', 'rider'].includes(saved.role)) {
          this.role.set(saved.role);
          this.sessionRider.set(this.riders().some((r) => r.id === saved.rider) ? saved.rider : 0);
        }
      } catch {
        /* ignore malformed session */
      }
    }

    effect(() => {
      const data: AppState = {
        customers: this.customers(),
        orders: this.orders(),
        riders: this.riders(),
        routes: this.routes(),
        history: this.history(),
        settings: this.settings()
      };
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
          /* ignore quota errors */
        }
      }
    });
  }

  context(): RouteContext {
    return {
      orders: this.orders(),
      customers: this.customers(),
      settings: this.settings(),
      shop: this.shop()
    };
  }

  customer(id: number): Customer | undefined {
    return this.customers().find((c) => c.id === id);
  }

  order(id: number | null | undefined): Order | undefined {
    return id == null ? undefined : this.orders().find((o) => o.id === id);
  }

  routeForOrder(id: number): DeliveryRoute | undefined {
    return this.routes().find((r) => r.ids.includes(id));
  }

  money(n: number): string {
    return formatMoney(n);
  }

  timeOf(minutes: number): string {
    return timeOf(this.settings(), minutes);
  }

  routeMetrics(ids: number[]): RouteMetrics {
    return roadMetrics(this.context(), ids, this.road.roadData());
  }

  isLate(route: DeliveryRoute): boolean {
    return this.timeOf(this.routeMetrics(route.ids).time) >= TARGET_TIME;
  }

  roadSummary(): string {
    const ready = this.routes().filter((r) => this.routeMetrics(r.ids).source === 'road').length;
    return `${ready}/${this.routes().length} ใบงานใช้ระยะทางถนนจริง · ที่เหลือเป็นค่าประมาณเส้นตรง`;
  }

  defaultPage(): Page {
    return this.role() === 'rider' ? 'jobs' : 'dashboard';
  }

  persistSession(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const session: Session = { role: this.role(), rider: this.sessionRider() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      /* ignore quota errors */
    }
  }

  switchWorkspace(role: Role): void {
    if (role !== 'owner' && role !== 'rider') return;
    this.role.set(role);
    this.selected.set(this.sessionRider());
    this.selectedOrder.set(null);
    this.persistSession();
  }

  selectRider(id: number): void {
    if (!this.riders().some((r) => r.id === id)) return;
    this.sessionRider.set(id);
    this.selected.set(id);
    this.selectedOrder.set(null);
    this.persistSession();
  }

  prepareSampleRoutes(): void {
    if (this.routes().length || this.history().length) return;
    const pool = this.orders().filter((o) => o.status === 'รอจัดส่ง');
    const routes: DeliveryRoute[] = [];
    this.riders().forEach((rider) => {
      const group = pool.splice(0, 3);
      if (group.length) {
        group.forEach((o) => (o.status = 'จัดสรรไรเดอร์แล้ว'));
        routes.push({ rider: rider.id, ids: group.map((o) => o.id) });
      }
    });
    this.orders.set(this.orders().map((o) => ({ ...o })));
    this.routes.set(routes);
    this.history.update((h) => [...h, { at: new Date().toISOString(), message: 'เตรียมใบงานตัวอย่าง' }]);
  }

  private ownerOnly(): boolean {
    if (this.role() !== 'owner') {
      this.toast.show('การทำงานนี้สำหรับเจ้าของร้าน');
      return false;
    }
    return true;
  }

  calculate(alt = false): void {
    if (!this.ownerOnly()) return;
    const lockedStatuses = ['ส่งสำเร็จ', 'กำลังจัดส่ง', 'ส่งไม่สำเร็จ'];
    const orders = this.orders().map((o) => ({ ...o }));
    const routes: DeliveryRoute[] = this.routes().map((r) => ({ rider: r.rider, ids: [...r.ids] }));
    const orderById = new Map(orders.map((o) => [o.id, o]));
    const cust = (id: number) => this.customers().find((c) => c.id === id)!;

    let pool = orders.filter((o) => !lockedStatuses.includes(o.status));
    const locked = routes.filter((r) =>
      r.ids.some((id) => lockedStatuses.includes(orderById.get(id)?.status ?? ''))
    );
    const lockedIds = new Set(locked.flatMap((r) => r.ids));
    pool = pool.filter((o) => !lockedIds.has(o.id));
    pool.sort((a, b) => {
      const ca = cust(a.customer);
      const cb = cust(b.customer);
      return (
        Math.atan2(ca.lat - this.shop().lat, ca.lng - this.shop().lng) -
        Math.atan2(cb.lat - this.shop().lat, cb.lng - this.shop().lng)
      );
    });
    if (alt && pool.length) pool.push(pool.shift()!);

    const free = this.riders().filter((r) => !locked.some((x) => x.rider === r.id));
    const nextRoutes: DeliveryRoute[] = [...locked];
    for (const rider of free) {
      if (!pool.length) break;
      const group = pool.splice(0, 3);
      const ids: number[] = [];
      let prev: LatLng = this.shop();
      while (group.length) {
        group.sort((a, b) => km(prev, cust(a.customer)) - km(prev, cust(b.customer)));
        const next = group.shift()!;
        ids.push(next.id);
        prev = cust(next.customer);
        next.status = 'จัดสรรไรเดอร์แล้ว';
      }
      nextRoutes.push({ rider: rider.id, ids });
    }
    pool.forEach((o) => (o.status = 'รอจัดส่ง'));

    this.orders.set(orders);
    this.routes.set(nextRoutes);
    this.history.update((h) => [
      ...h,
      { at: new Date().toISOString(), message: `คำนวณเส้นทาง ${nextRoutes.length} ใบงาน` }
    ]);
    this.toast.show(
      pool.length
        ? `ไรเดอร์ไม่เพียงพอ เหลือ ${pool.length} ออเดอร์รอจัดสรร`
        : `จัดเส้นทางเรียบร้อย · ${nextRoutes.length} ใบงาน`
    );
  }

  invalidate(): void {
    const orderById = new Map(this.orders().map((o) => [o.id, o]));
    const routes = this.routes().filter((r) =>
      r.ids.some((id) => STARTED_STATUSES.includes(orderById.get(id)?.status ?? ''))
    );
    const retained = new Set(routes.flatMap((r) => r.ids));
    this.routes.set(routes);
    this.orders.set(
      this.orders().map((o) =>
        o.status === 'จัดสรรไรเดอร์แล้ว' && !retained.has(o.id) ? { ...o, status: 'รอจัดส่ง' } : o
      )
    );
  }

  async loadRoads(): Promise<boolean> {
    return this.road.load(this.routes(), (ids) => roadKey(this.context(), ids));
  }

  retryRoads(): void {
    if (this.road.isLoading) {
      this.toast.show('กำลังโหลดเส้นทางถนน กรุณารอสักครู่');
      return;
    }
    this.road.retry();
    void this.loadRoads();
    this.toast.show('กำลังตรวจสอบเส้นทางถนน');
  }

  startJob(): void {
    if (this.role() !== 'rider') return;
    const route = this.routes().find((r) => r.rider === this.sessionRider());
    if (route) {
      this.orders.update((list) =>
        list.map((o) =>
          route.ids.includes(o.id) && o.status === 'จัดสรรไรเดอร์แล้ว' ? { ...o, status: 'กำลังจัดส่ง' } : o
        )
      );
    }
    this.toast.show('เริ่มจัดส่งแล้ว');
  }

  updateStatus(status: string): void {
    if (this.role() !== 'rider') return;
    this.selected.set(this.sessionRider());
    const route = this.routes().find((r) => r.rider === this.sessionRider());
    const o = this.orders().find((x) => x.id === this.selectedOrder() && route?.ids.includes(x.id));
    if (!o) return;
    if (o.status !== 'กำลังจัดส่ง') {
      this.toast.show('ต้องรับอาหารและเริ่มจัดส่งก่อนบันทึกผล งานที่บันทึกผลแล้วให้ร้านตรวจสอบ');
      return;
    }
    if (!['ส่งสำเร็จ', 'ส่งไม่สำเร็จ'].includes(status)) return;
    let reason = '';
    if (status === 'ส่งไม่สำเร็จ') {
      const input = typeof prompt === 'function' ? prompt('เหตุผลที่ส่งไม่สำเร็จ เช่น ลูกค้าไม่อยู่') : null;
      reason = input?.trim() ?? '';
      if (!reason) return;
    }
    const next: Order = { ...o, status };
    if (reason) next.reason = reason;
    else delete next.reason;
    this.orders.update((list) => list.map((x) => (x.id === o.id ? next : x)));
    this.history.update((h) => [
      ...h,
      { at: new Date().toISOString(), message: `#LF-${o.id} ${status}` }
    ]);
    this.toast.show('บันทึกสถานะแล้ว');
  }

  saveCustomer(
    d: { name: string; phone: string; address: string; lat: number; lng: number; note: string },
    id: number | null
  ): boolean {
    if (!this.ownerOnly()) return false;
    if (km(this.shop(), d) > 3) {
      this.toast.show('พิกัดต้องอยู่ในรัศมี 3 กม. จากจุดรับอาหารจำลอง');
      return false;
    }
    if (id && this.orders().some((o) => o.customer === id && STARTED_STATUSES.includes(o.status))) {
      this.toast.show('ไม่สามารถเปลี่ยนข้อมูลลูกค้าของงานที่เริ่มส่งแล้ว');
      return false;
    }
    const newId = id ?? Math.max(0, ...this.customers().map((c) => c.id)) + 1;
    const customer: Customer = { id: newId, ...d };
    if (id) {
      this.customers.update((list) => list.map((c) => (c.id === id ? customer : c)));
    } else {
      this.customers.update((list) => [...list, customer]);
    }
    this.invalidate();
    this.toast.show('บันทึกลูกค้าแล้ว · คำนวณเส้นทางใหม่เมื่อข้อมูลเปลี่ยน');
    return true;
  }

  removeCustomer(id: number): void {
    if (!this.ownerOnly()) return;
    if (this.orders().some((o) => o.customer === id)) {
      this.toast.show('ลูกค้านี้มีประวัติออเดอร์ จึงยังลบไม่ได้');
      return;
    }
    const customer = this.customer(id);
    if (!customer) return;
    if (typeof confirm === 'function' && !confirm('ลบลูกค้า ' + customer.name + '?')) return;
    this.customers.update((list) => list.filter((c) => c.id !== id));
    this.toast.show('ลบข้อมูลลูกค้าแล้ว');
  }

  saveOrder(
    fields: { customer: number; boxes: number; status: string; reason: string },
    id: number | null
  ): boolean {
    if (!this.ownerOnly()) return false;
    const old = id != null ? this.orders().find((o) => o.id === id) : undefined;
    const started = !!old && STARTED_STATUSES.includes(old.status);
    const customerId = started ? old!.customer : fields.customer;
    const boxes = started ? old!.boxes : fields.boxes;
    const status = fields.status;
    const reason = (fields.reason || '').trim();
    const route = id != null ? this.routeForOrder(id) : undefined;
    if (
      !Number.isInteger(boxes) ||
      boxes < 1 ||
      boxes > 3 ||
      !this.customer(customerId) ||
      !ORDER_STATUSES.includes(status)
    ) {
      this.toast.show('ตรวจสอบข้อมูลลูกค้า จำนวนกล่อง และสถานะ');
      return false;
    }
    if (['ส่งไม่สำเร็จ', 'ยกเลิก'].includes(status) && !reason) {
      this.toast.show('กรุณาระบุเหตุผลเมื่อส่งไม่สำเร็จหรือยกเลิก');
      return false;
    }
    const changed = !!old && (old.customer !== customerId || old.boxes !== boxes);
    if (
      ['จัดสรรไรเดอร์แล้ว', 'กำลังจัดส่ง', 'ส่งสำเร็จ', 'ส่งไม่สำเร็จ'].includes(status) &&
      (!route || changed)
    ) {
      this.toast.show(
        changed
          ? 'ข้อมูลจัดส่งเปลี่ยน เลือก “รอจัดส่ง” แล้วคำนวณเส้นทางใหม่'
          : 'กรุณาคำนวณเส้นทางเพื่อมอบหมายไรเดอร์ก่อนเลือกสถานะนี้'
      );
      return false;
    }
    const newId = id ?? Math.max(1000, ...this.orders().map((o) => o.id)) + 1;
    const next: Order = { id: newId, customer: customerId, boxes, status };
    if (reason) next.reason = reason;
    if (old) {
      this.orders.update((list) => list.map((o) => (o.id === old.id ? next : o)));
    } else {
      this.orders.update((list) => [...list, next]);
    }
    if (changed) {
      this.invalidate();
    } else if (['รอจัดส่ง', 'ยกเลิก'].includes(status)) {
      this.routes.update((routes) =>
        routes
          .map((r) => ({ ...r, ids: r.ids.filter((orderId) => orderId !== newId) }))
          .filter((r) => r.ids.length)
      );
    }
    this.history.update((h) => [
      ...h,
      {
        at: new Date().toISOString(),
        message: `#LF-${next.id} ${status}${reason ? ' · ' + reason : ''}`
      }
    ]);
    this.toast.show('บันทึกออเดอร์แล้ว · ' + status);
    return true;
  }

  removeOrder(id: number): void {
    if (!this.ownerOnly()) return;
    const o = this.order(id);
    if (!o) return;
    if (STARTED_STATUSES.includes(o.status)) {
      this.toast.show('ไม่สามารถลบออเดอร์ที่เริ่มส่งแล้ว');
      return;
    }
    if (typeof confirm === 'function' && !confirm('ลบออเดอร์ #LF-' + id + '?')) return;
    this.orders.update((list) => list.filter((x) => x.id !== id));
    this.invalidate();
    this.toast.show('ลบออเดอร์แล้ว');
  }

  simulate(): void {
    if (!this.ownerOnly()) return;
    if (!this.customers().length) {
      this.toast.show('เพิ่มข้อมูลลูกค้าก่อนจำลองออเดอร์');
      return;
    }
    let available = this.customers().filter((c) => !this.activeOrders().some((o) => o.customer === c.id));
    if (!available.length) available = this.customers();
    const c = available[Math.floor(Math.random() * available.length)];
    if (!c) return;
    const id = Math.max(1000, ...this.orders().map((o) => o.id)) + 1;
    this.orders.update((list) => [
      ...list,
      { id, customer: c.id, boxes: 1 + Math.floor(Math.random() * 3), status: 'รอจัดส่ง' }
    ]);
    this.invalidate();
    this.toast.show('เพิ่มออเดอร์จำลองแล้ว · คำนวณเส้นทางใหม่ได้ทันที');
  }

  exportCSV(): void {
    if (!this.ownerOnly()) return;
    const t = this.totals();
    const lines: (string | number)[][] = [
      ['รายการ', 'จำนวน'],
      ['ยอดขาย', t.sales],
      ['ต้นทุนอาหาร', t.food],
      ['ค่าเรียกไรเดอร์', t.wages],
      ['ค่าส่ง', t.delivery.toFixed(2)],
      ['กำไรประมาณการ', t.profit.toFixed(2)],
      ['ระยะทางรวม กม. (ถนนจริงหรือประมาณการตามข้อมูลที่โหลดได้)', t.distance.toFixed(2)],
      ['เวลารวม นาที', Math.ceil(t.minutes)]
    ];
    const url = URL.createObjectURL(
      new Blob(['\ufeff' + lines.map((l) => l.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LunchFlow-report.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.toast.show('ดาวน์โหลดรายงานแล้ว');
  }

  saveShop(lat: number, lng: number): boolean {
    if (!this.ownerOnly()) return false;
    const hasStarted = this.routes().some((r) =>
      r.ids.some((id) => STARTED_STATUSES.includes(this.order(id)?.status ?? ''))
    );
    if (hasStarted) {
      this.toast.show('ยังมีใบงานที่เริ่มดำเนินการแล้ว ไม่สามารถเปลี่ยนจุดเริ่มต้นได้');
      return false;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return false;
    }
    if (this.customers().some((c) => km({ lat, lng }, c) > 3)) {
      this.toast.show('จุดรับอาหารใหม่ทำให้ลูกค้าบางรายอยู่นอกรัศมี 3 กม.');
      return false;
    }
    this.shop.set({ lat, lng });
    this.settings.update((s) => ({ ...s, shop: { lat, lng } }));
    this.invalidate();
    this.toast.show('บันทึกจุดรับอาหารแล้ว กรุณาคำนวณเส้นทางใหม่');
    return true;
  }
}
