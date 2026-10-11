import { Injectable, signal } from '@angular/core';
import { ROADS_KEY } from '../core/constants';
import { RoadData, RoadEntry } from '../core/models';

@Injectable({ providedIn: 'root' })
export class RoadService {
  readonly roadData = signal<RoadData>({});
  private busy = false;
  private readonly failures = new Map<string, number>();

  constructor() {
    if (typeof localStorage !== 'undefined') {
      try {
        this.roadData.set(JSON.parse(localStorage.getItem(ROADS_KEY) || '{}'));
      } catch {
        this.roadData.set({});
      }
    }
  }

  get isLoading(): boolean {
    return this.busy;
  }

  retry(): void {
    this.failures.clear();
  }

  async load(routes: { ids: number[] }[], keyFor: (ids: number[]) => string): Promise<boolean> {
    if (this.busy) return false;
    const missing = routes.filter(
      (r) =>
        !this.roadData()[keyFor(r.ids)] &&
        Date.now() - (this.failures.get(keyFor(r.ids)) || 0) > 60000
    );
    if (!missing.length) return false;
    this.busy = true;
    let updated = false;
    for (const r of missing) {
      const key = keyFor(r.ids);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${key}?overview=full&geometries=geojson&steps=false`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error('HTTP');
        const data = await response.json();
        const route = data.routes?.[0];
        if (
          data.code !== 'Ok' ||
          !route?.geometry?.coordinates?.length ||
          route.legs?.length !== r.ids.length ||
          route.legs.some((l: { distance: number }) => !Number.isFinite(l.distance) || l.distance < 0)
        ) {
          throw new Error('No route');
        }
        const entry: RoadEntry = {
          geometry: route.geometry,
          legs: route.legs.map((l: { distance: number }) => l.distance),
          at: Date.now()
        };
        this.roadData.update((data) => ({ ...data, [key]: entry }));
        updated = true;
      } catch {
        this.failures.set(key, Date.now());
      } finally {
        clearTimeout(timer);
      }
    }
    if (updated) {
      const entries = Object.entries(this.roadData())
        .sort((a, b) => b[1].at - a[1].at)
        .slice(0, 100);
      const trimmed = Object.fromEntries(entries);
      this.roadData.set(trimmed);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(ROADS_KEY, JSON.stringify(trimmed));
        }
      } catch {
        /* ignore quota errors */
      }
    }
    this.busy = false;
    return updated;
  }
}
