import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import { Icon } from '../icon/icon';
import { ModalService } from '../../services/modal.service';
import { StateService } from '../../services/state.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-customer-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './customer-form.html'
})
export class CustomerForm implements OnDestroy {
  private readonly state = inject(StateService);
  private readonly toast = inject(ToastService);
  readonly modal = inject(ModalService);

  readonly id = input<number | null>(null);
  readonly c = computed(
    () =>
      this.state.customer(this.id() ?? -1) ?? {
        name: '',
        phone: '',
        address: '',
        lat: 16.246,
        lng: 103.25,
        note: ''
      }
  );
  readonly pickerVisible = signal(false);

  private readonly latInput = viewChild<ElementRef<HTMLInputElement>>('lat');
  private readonly lngInput = viewChild<ElementRef<HTMLInputElement>>('lng');
  private readonly pickerEl = viewChild<ElementRef<HTMLDivElement>>('picker');
  private coordinateMap: any = null;

  ngOnDestroy(): void {
    this.coordinateMap?.remove();
    this.coordinateMap = null;
  }

  save(event: Event): void {
    event.preventDefault();
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const ok = this.state.saveCustomer(
      {
        name: data['name'],
        phone: data['phone'],
        address: data['address'],
        lat: Number(data['lat']),
        lng: Number(data['lng']),
        note: data['note']
      },
      this.id()
    );
    if (ok) this.modal.close();
  }

  openPicker(): void {
    const L = typeof window === 'undefined' ? undefined : (window as unknown as { L?: any }).L;
    if (!L) {
      this.toast.show('ไม่สามารถเปิดแผนที่ได้ ตรวจสอบอินเทอร์เน็ต');
      return;
    }
    const el = this.pickerEl()?.nativeElement;
    if (!el) return;
    this.pickerVisible.set(true);
    if (this.coordinateMap) {
      this.coordinateMap.remove();
      this.coordinateMap = null;
    }
    const latInput = this.latInput()?.nativeElement;
    const lngInput = this.lngInput()?.nativeElement;
    const lat = Number(latInput?.value);
    const lng = Number(lngInput?.value);
    const map = L.map(el).setView([lat, lng], 16);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      referrerPolicy: 'strict-origin-when-cross-origin'
    }).addTo(map);
    const marker = L.circleMarker([lat, lng], { radius: 8, color: '#2563eb', fillOpacity: 0.8 }).addTo(map);
    const shop = this.state.shop();
    L.circle([shop.lat, shop.lng], { radius: 3000, color: '#639154', fillOpacity: 0.03, weight: 1 }).addTo(map);
    map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
      if (latInput) latInput.value = e.latlng.lat.toFixed(6);
      if (lngInput) lngInput.value = e.latlng.lng.toFixed(6);
      marker.setLatLng(e.latlng);
    });
    this.coordinateMap = map;
    setTimeout(() => this.coordinateMap?.invalidateSize(), 100);
  }
}
