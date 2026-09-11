export type ThemeMode = "dark" | "light";
export type DeviceMode = "mobile" | "desktop";
export interface Product { id:string; code:string; name:string; category:string; barcode:string; cost:number; imposto:number; frete:number; price:number; vipPrice:number|null; vipPrice3x:number|null; controlStock:boolean; variations:string[]; description:string; imageUrl:string|null; stocks:Record<string,number>; }
export interface Customer { id:string; name:string; phone:string; cpf:string; cashback:number; sex?:string; }
export interface Seller { id:string; name:string; commissionPct:number; }
export interface SaleItem { productId:string; name:string; price:number; qty:number; cost:number; }
export interface Sale { id:string; date:Date; customer:string|null; seller:string; items:SaleItem[]; payment:string; total:number; gender?:string; channel?:string; fulfillment?:string; }
export interface StockLocation { id:string; name:string; }
export interface FiadoInstallment { value:number; dueDate:Date; paid:boolean; }
export interface Fiado { id:string; customerId:string; customerName:string; date:Date; products:string; origin:string; installments:FiadoInstallment[]; }
export interface AdEntry { date:Date; leads:number; spend:number; }
export interface WaScheduleEntry { id:string; day:string; text:string; }
export interface WelcomeConfig { mode?:string; videoUrl?:string; audioUrl?:string; line1?:string; line2?:string; line3?:string; line4?:string; }
