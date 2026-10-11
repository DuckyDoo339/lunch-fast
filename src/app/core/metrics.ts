import { SPEED_KMH } from './constants';
import { Customer, LatLng, Order, RoadData, RouteContext, RouteMetrics, Settings } from './models';

export function km(a: LatLng, b: LatLng): number {
  const p = Math.PI / 180;
  const x = (b.lng - a.lng) * Math.cos(((a.lat + b.lat) * p) / 2);
  const y = b.lat - a.lat;
  return Math.sqrt(x * x + y * y) * 111.32;
}

export function customerOf(ctx: RouteContext, id: number): Customer | undefined {
  return ctx.customers.find((c) => c.id === id);
}

export function orderOf(ctx: RouteContext, id: number): Order | undefined {
  return ctx.orders.find((o) => o.id === id);
}

export function straightMetrics(ctx: RouteContext, ids: number[]): RouteMetrics {
  let prev: LatLng = ctx.shop;
  let d = 0;
  const deliveries: RouteMetrics['deliveries'] = [];
  ids.forEach((id) => {
    const o = orderOf(ctx, id);
    if (!o) return;
    const c = customerOf(ctx, o.customer);
    if (!c) return;
    d += km(prev, c);
    deliveries.push({
      id,
      d,
      minutes: (d / SPEED_KMH) * 60 + deliveries.length * ctx.settings.delay + ctx.settings.delay
    });
    prev = c;
  });
  return { distance: d, deliveries, time: (d / SPEED_KMH) * 60 + ids.length * ctx.settings.delay, source: 'estimate' };
}

export function roadKey(ctx: RouteContext, ids: number[]): string {
  return [
    ctx.shop as LatLng | undefined,
    ...ids.map((id) => {
      const o = orderOf(ctx, id);
      return o ? customerOf(ctx, o.customer) : undefined;
    })
  ]
    .filter((c): c is LatLng => !!c)
    .map((c) => `${c.lng.toFixed(6)},${c.lat.toFixed(6)}`)
    .join(';');
}

export function roadMetrics(ctx: RouteContext, ids: number[], roadData: RoadData): RouteMetrics {
  const cache = roadData[roadKey(ctx, ids)];
  if (!cache || cache.legs.length !== ids.length) return straightMetrics(ctx, ids);
  let distance = 0;
  const deliveries = ids.map((id, i) => {
    distance += cache.legs[i] / 1000;
    return { id, d: distance, minutes: (distance / SPEED_KMH) * 60 + (i + 1) * ctx.settings.delay };
  });
  return {
    distance,
    deliveries,
    time: (distance / SPEED_KMH) * 60 + ids.length * ctx.settings.delay,
    source: 'road'
  };
}

export function timeOf(settings: Settings, minutes: number): string {
  const parts = settings.depart.split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  const total = h * 60 + m + Math.ceil(minutes);
  return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}

export function badgeKind(status: string): string {
  const success = ['ส่งสำเร็จ', 'เสร็จสิ้น'];
  const error = ['ส่งไม่สำเร็จ', 'อาจส่งไม่ทัน', 'งานล่าช้า', 'ผิดพลาด', 'ยกเลิก'];
  const follow = ['รอจัดส่ง', 'กำลังจัดส่ง', 'พร้อมออกส่ง', 'รอรับงาน', 'ต้องติดตาม'];
  const primary = ['จัดสรรไรเดอร์แล้ว', 'ทันเวลา'];
  return success.includes(status)
    ? 'success'
    : error.includes(status)
      ? 'error'
      : follow.includes(status)
        ? 'follow'
        : primary.includes(status)
          ? 'primary'
          : 'neutral';
}

const thb = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 });

export function money(n: number): string {
  return thb.format(n);
}

export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}
