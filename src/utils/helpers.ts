import {
  seedProducts,
  seedSellers,
  DOW_WEIGHTS,
  HOUR_SLOTS,
  HOUR_WEIGHTS,
  paymentMethods,
  CHANNELS,
  CHANNEL_WEIGHTS,
  GENDERS,
  GENDER_WEIGHTS,
  FULFILLMENTS,
  FULFILL_WEIGHTS,
  MONTH_SHORT,
  WEEKDAY_SHORT,
} from "../data/constants";

// --- Interfaces para tipagem dos dados ---

export interface SaleItem {
  productId?: string;
  name?: string;
  price: number;
  qty: number;
  cost?: number;
}

export interface Sale {
  id: string;
  date: Date;
  customer: any;
  seller: string;
  items: SaleItem[];
  payment: string;
  total: number;
  channel?: string;
  gender?: string;
  fulfillment?: string;
  [key: string]: any;
}

export interface AdEntry {
  date: Date;
  leads: number;
  spend: number;
}

// --- Funções Utilitárias Tipadas ---

export function hexAlpha(hex: string, alpha01: number): string {
  const a = Math.round(Math.min(Math.max(alpha01, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

export function sendWhatsAppMessage(phone: string, text: string): void {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return;
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  window.open(`https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`, "_blank");
}

export function sendSMS(phone: string, text: string): void {
  console.log("[SMS pendente de integração] Para:", phone, "| Mensagem:", text);
}

export function genSale(
  id: string,
  daysAgo: number,
  customer: any,
  seller: string,
  items: SaleItem[],
  payment: string,
  extra?: Record<string, any>
): Sale {
  const total = items.reduce((s: number, it: SaleItem) => s + it.price * it.qty, 0);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { id, date: d, customer, seller, items, payment, total, ...(extra || {}) };
}

export function weightedIndex(weights: number[]): number {
  const total = weights.reduce((a: number, b: number) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return weights.length - 1;
}

export function genNoiseSales(count: number): Sale[] {
  const out: Sale[] = [];
  const sellerIds = seedSellers.map((s) => s.id);
  for (let i = 0; i < count; i++) {
    let d: Date | null = null;
    for (let tries = 0; tries < 10 && !d; tries++) {
      const daysAgo = Math.floor(Math.random() * 365);
      const cand = new Date();
      cand.setDate(cand.getDate() - daysAgo);
      if (Math.random() < DOW_WEIGHTS[cand.getDay()] / 1.6) d = cand;
    }
    if (!d) {
      d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * 365));
    }
    const hour = HOUR_SLOTS[weightedIndex(HOUR_WEIGHTS)];
    d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    const prod = seedProducts[Math.floor(Math.random() * seedProducts.length)];
    const qty = 1 + Math.floor(Math.random() * 2);
    out.push({
      id: "r" + i,
      date: d,
      customer: null,
      seller: sellerIds[Math.floor(Math.random() * sellerIds.length)],
      items: [{ productId: prod.id, name: prod.name, price: prod.price, qty, cost: prod.cost }],
      payment: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      total: prod.price * qty,
      channel: CHANNELS[weightedIndex(CHANNEL_WEIGHTS)],
      gender: GENDERS[weightedIndex(GENDER_WEIGHTS)],
      fulfillment: FULFILLMENTS[weightedIndex(FULFILL_WEIGHTS)],
    });
  }
  return out;
}

export function genAdEntries(days: number): AdEntry[] {
  const out: AdEntry[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(12, 0, 0, 0);
    const leads = Math.floor(Math.random() * 8) + 1;
    const spend = Math.round(leads * (15 + Math.random() * 10) * 100) / 100;
    out.push({ date: d, leads, spend });
  }
  return out;
}

export function fiadoDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

export function getMonthGrid(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1);
  const offset = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}

export function formatDateShort(dateInput: string | Date | number | null | undefined): string {
    if (!dateInput) return "";
    
    // Converte para objeto Date caso venha como string do banco de dados/JSON
    const d = typeof dateInput === "string" || typeof dateInput === "number" 
        ? new Date(dateInput) 
        : dateInput;

    // Garante que é uma data válida
    if (!(d instanceof Date) || isNaN(d.getTime())) return "";

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;

}
export function formatDateBadge(d: Date): string {
  return `${WEEKDAY_SHORT[d.getDay()]}., ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}. ${d.getFullYear()}`;
}

export function formatDateLong(d: Date): string {
  return `${WEEKDAY_SHORT[d.getDay()]}., ${d.getDate()} de ${MONTH_SHORT[d.getMonth()]}.`;
}

export function sameOrBefore(a: Date | string | number, b: Date | string | number): boolean {
  const x = new Date(a);
  x.setHours(0, 0, 0, 0);
  const y = new Date(b);
  y.setHours(0, 0, 0, 0);
  return x <= y;
}

export function inPeriod(
  date: Date | string | number,
  start: Date | string | number,
  end: Date | string | number
): boolean {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  return d >= s && d <= e;
}

export const inputStyle = (border: string, text: string) => ({
  padding: "8px 10px",
  borderRadius: 10,
  border: `1px solid ${border}`,
  fontSize: 13,
  background: "transparent",
  color: text,
  outline: "none",
  flex: "1 1 150px",
});

export const lbl = (subtext: string) => ({
  fontSize: 10.5,
  color: subtext,
  fontWeight: 700,
});

export const ghostBtn = (border: string, text: string) => ({
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "transparent",
  border: `1px solid ${border}`,
  color: text,
  borderRadius: 8,
  padding: "7px 14px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
});

export { money } from "../data/constants";