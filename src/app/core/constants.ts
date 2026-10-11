import { MenuItem, Page } from './models';

export const STORAGE_KEY = 'lunchflow-v1';
export const ROADS_KEY = 'lunchflow-roads-v1';
export const SESSION_KEY = 'lunchflow-view-v3';

export const ORDER_STATUSES = [
  'รอจัดส่ง',
  'จัดสรรไรเดอร์แล้ว',
  'กำลังจัดส่ง',
  'ส่งสำเร็จ',
  'ส่งไม่สำเร็จ',
  'ยกเลิก'
];

export const STARTED_STATUSES = ['กำลังจัดส่ง', 'ส่งสำเร็จ', 'ส่งไม่สำเร็จ'];

export const SPEED_KMH = 30;
export const TARGET_TIME = '12:30';
export const BOX_PRICE = 65;
export const BOX_COST = 40;
export const DELIVERY_RATE = 2;
export const RIDER_FEE = 15;

export const colors = [
  '#ec8059',
  '#6d93d4',
  '#83a987',
  '#b195d0',
  '#d8b66a',
  '#69a9b6',
  '#cf93a6',
  '#919fb8'
];

export const menus: MenuItem[] = [
  { page: 'dashboard', label: 'ภาพรวมวันนี้' },
  { page: 'customers', label: 'ข้อมูลลูกค้า' },
  { page: 'orders', label: 'จัดการออเดอร์' },
  { page: 'routes', label: 'เส้นทางและแบ่งงาน' },
  { page: 'reports', label: 'รายงานและกำไร' },
  { page: 'jobs', label: 'ใบงานของฉัน' },
  { page: 'navigation', label: 'แผนที่นำทาง' },
  { page: 'delivery', label: 'รายละเอียดจัดส่ง' }
];

export const ownerPages: Page[] = ['dashboard', 'customers', 'orders', 'routes', 'reports'];
export const riderPages: Page[] = ['jobs', 'navigation', 'delivery'];
export const ownerMenus = menus.filter((m) => ownerPages.includes(m.page));
export const riderMenus = menus.filter((m) => riderPages.includes(m.page));
