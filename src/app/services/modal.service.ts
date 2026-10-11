import { Injectable, inject, signal } from '@angular/core';
import { StateService } from './state.service';
import { ToastService } from './toast.service';

export type ModalState =
  | { kind: 'customer'; id?: number }
  | { kind: 'order'; id?: number }
  | { kind: 'shop' }
  | { kind: 'worksheet'; id: number }
  | null;

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly state = inject(StateService);
  private readonly toast = inject(ToastService);
  readonly current = signal<ModalState>(null);

  private ownerOnly(): boolean {
    if (this.state.role() !== 'owner') {
      this.toast.show('การทำงานนี้สำหรับเจ้าของร้าน');
      return false;
    }
    return true;
  }

  openCustomer(id?: number): void {
    if (!this.ownerOnly()) return;
    this.current.set({ kind: 'customer', id });
  }

  openOrder(id?: number): void {
    if (!this.ownerOnly()) return;
    if (!this.state.customers().length) {
      this.toast.show('เพิ่มข้อมูลลูกค้าก่อนสร้างออเดอร์');
      return;
    }
    this.current.set({ kind: 'order', id });
  }

  openShop(): void {
    if (!this.ownerOnly()) return;
    this.current.set({ kind: 'shop' });
  }

  openWorksheet(id: number): void {
    if (!this.ownerOnly()) return;
    this.current.set({ kind: 'worksheet', id });
  }

  close(): void {
    this.current.set(null);
  }
}
