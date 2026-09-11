import { genSale, genNoiseSales, genAdEntries, fiadoDate } from "../utils/helpers";
import type { Product, Customer, Seller } from "../types";

export const FONT_DISPLAY = "'Bebas Neue', sans-serif";

export const FONT_BODY = "'DM Sans', sans-serif";

export const SUCCESS = "#4CAF7D";

export const DANGER = "#E05252";

export const GLOBAL_CSS = `   @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,700;1,500&display=swap');   *,*::before,*::after{box-sizing:border-box}   ::-webkit-scrollbar{width:3px;height:3px}   ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:2px}   ::-webkit-scrollbar-track{background:transparent}   input:focus,select:focus,textarea:focus{border-color:var(--accent) !important;outline:none}   @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}   @keyframes popIn3D{0%{opacity:0;transform:perspective(700px) rotateX(40deg) scale(.7)}55%{opacity:1;transform:perspective(700px) rotateX(-6deg) scale(1.06)}100%{opacity:1;transform:perspective(700px) rotateX(0deg) scale(1)}}   @keyframes fadeUpSmall{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} `;

export const FONT_PREMIUM = "'Playfair Display', serif";

export const seedProducts = [   { id: "p1", code: "10", name: "Whey Protein Concentrado 900g", category: "Proteínas", barcode: "7891000100019", cost: 45, imposto: 8, frete: 5, price: 89.9, vipPrice: 79.9, vipPrice3x: null, controlStock: true, variations: ["Chocolate", "Baunilha"], description: "Fonte de proteína de rápida absorção para ganho de massa magra e recuperação muscular.", imageUrl: null, stocks: { loja: 24, degustacao: 6 } },   { id: "p2", code: "30", name: "Creatina Monohidratada 300g", category: "Creatina", barcode: "7891000100026", cost: 22, imposto: 4, frete: 3, price: 59.9, vipPrice: 49.9, vipPrice3x: null, controlStock: true, variations: [], description: "Aumenta força e potência muscular, indicada para treinos intensos.", imageUrl: null, stocks: { loja: 40, degustacao: 3 } },   { id: "p3", code: "50", name: "Pré-treino Explosion 300g", category: "Pré-treino", barcode: "7891000100033", cost: 30, imposto: 5, frete: 4, price: 69.9, vipPrice: null, vipPrice3x: null, controlStock: true, variations: ["Tangerina", "Uva"], description: "Fórmula estimulante para mais energia e foco durante o treino.", imageUrl: null, stocks: { loja: 15, degustacao: 2 } },   { id: "p4", code: "90", name: "Consultoria nutricional (avulso)", category: "Serviços", barcode: "", cost: 0, imposto: 0, frete: 0, price: 120, vipPrice: null, vipPrice3x: null, controlStock: false, variations: [], description: "Acompanhamento individual com plano alimentar personalizado.", imageUrl: null, stocks: {} },   { id: "p5", code: "40", name: "BCAA 2:1:1 200g", category: "Aminoácidos", barcode: "7891000100040", cost: 18, imposto: 3, frete: 3, price: 49.9, vipPrice: 44.9, vipPrice3x: null, controlStock: true, variations: [], description: "Aminoácidos essenciais para preservar massa magra durante o treino.", imageUrl: null, stocks: { loja: 30, degustacao: 5 } },   { id: "p6", code: "60", name: "Termogênico Slim 60caps", category: "Emagrecimento", barcode: "7891000100057", cost: 25, imposto: 5, frete: 4, price: 79.9, vipPrice: 69.9, vipPrice3x: null, controlStock: true, variations: [], description: "Auxilia na queima de gordura e na aceleração do metabolismo.", imageUrl: null, stocks: { loja: 18, degustacao: 2 } },   { id: "p7", code: "70", name: "Multivitamínico Daily 60caps", category: "Saúde e bem-estar", barcode: "7891000100064", cost: 20, imposto: 4, frete: 3, price: 54.9, vipPrice: null, vipPrice3x: null, controlStock: true, variations: [], description: "Complexo vitamínico completo para o dia a dia.", imageUrl: null, stocks: { loja: 22, degustacao: 4 } }, ];

export const seedCustomers = [   { id: "c1", name: "Marcos Vinícius", phone: "(81) 99123-4567", cpf: "123.456.789-00", cashback: 18.4, sex: "Masculino" },   { id: "c2", name: "Fernanda Alves", phone: "(81) 99876-5432", cpf: "987.654.321-00", cashback: 42.1, sex: "Feminino" },   { id: "c3", name: "Ricardo Souza", phone: "(81) 99555-1122", cpf: "555.666.777-88", cashback: 5.0, sex: "Masculino" },   { id: "c4", name: "Carlos Henrique", phone: "(81) 99444-7788", cpf: "111.222.333-44", cashback: 0, sex: "Masculino" },   { id: "c5", name: "Patrícia Gomes", phone: "(81) 99333-2211", cpf: "222.333.444-55", cashback: 0, sex: "Feminino" }, ];

export const seedSellers = [   { id: "s1", name: "Juliana Costa", commissionPct: 5 },   { id: "s2", name: "Bruno Lima", commissionPct: 5 }, ];

export const paymentMethods = ["Pix", "Crédito", "Crédito parcelado", "Débito", "Dinheiro", "Fiado"];

export const CHANNELS = ["Instagram", "WhatsApp", "Degustação", "Loja física"];

export const GENDERS = ["Masculino", "Feminino", "Prefiro não informar"];

export const FULFILLMENTS = ["Retirada", "Delivery"];

export const HOUR_WEIGHTS = [1, 1.2, 1.3, 1.6, 1.4, 1, 1.1, 1.3, 2.2, 2.6, 2, 1.2];

export const DOW_WEIGHTS = [0.5, 1, 1.1, 1.1, 1.2, 1.6, 1.3];

export const CHANNEL_WEIGHTS = [0.15, 0.25, 0.15, 0.45];

export const GENDER_WEIGHTS = [0.48, 0.48, 0.04];

export const FULFILL_WEIGHTS = [0.75, 0.25];

export const money = (val:string) => {
  const numericValue = Number(val) || 0;
  return numericValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
export const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export const MONTH_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

export const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const seedSales = [   genSale("v1", 0, "c1", "s1", [{ productId: "p1", name: "Whey Protein Concentrado 900g", price: 89.9, qty: 1, cost: 45 }], "Pix", { gender: "Masculino", channel: "Loja física", fulfillment: "Retirada" }),   genSale("v2", 0, "c2", "s2", [{ productId: "p2", name: "Creatina Monohidratada 300g", price: 59.9, qty: 2, cost: 22 }], "Crédito", { gender: "Feminino", channel: "Instagram", fulfillment: "Delivery" }),   genSale("v3", 1, "c2", "s1", [{ productId: "p3", name: "Pré-treino Explosion 300g", price: 69.9, qty: 1, cost: 30 }], "Dinheiro", { gender: "Feminino", channel: "Loja física", fulfillment: "Retirada" }),   genSale("v4", 3, "c3", "s2", [{ productId: "p1", name: "Whey Protein Concentrado 900g", price: 89.9, qty: 1, cost: 45 }, { productId: "p5", name: "BCAA 2:1:1 200g", price: 49.9, qty: 1, cost: 18 }], "Débito", { gender: "Masculino", channel: "WhatsApp", fulfillment: "Retirada" }),   genSale("v5", 6, "c1", "s1", [{ productId: "p2", name: "Creatina Monohidratada 300g", price: 59.9, qty: 1, cost: 22 }], "Fiado", { gender: "Masculino", channel: "Loja física", fulfillment: "Retirada" }),   genSale("v6", 10, "c2", "s2", [{ productId: "p1", name: "Whey Protein Concentrado 900g", price: 89.9, qty: 3, cost: 45 }], "Crédito parcelado", { gender: "Feminino", channel: "Degustação", fulfillment: "Retirada" }),   genSale("v7", 75, "c4", "s2", [{ productId: "p2", name: "Creatina Monohidratada 300g", price: 59.9, qty: 1, cost: 22 }], "Dinheiro", { gender: "Masculino", channel: "Loja física", fulfillment: "Retirada" }), ];

export const HOUR_SLOTS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export const allSeedSales = [...seedSales, ...genNoiseSales(220)];

export const seedAdEntries = genAdEntries(60);

export const seedFiados = [   { id: "fd1", customerId: "c1", customerName: "Marcos Vinícius", date: fiadoDate(6), products: "Creatina Monohidratada 300g", origin: "manual", installments: [{ value: 59.9, dueDate: fiadoDate(-24), paid: false }] },   { id: "fd2", customerId: "c3", customerName: "Ricardo Souza", date: fiadoDate(20), products: "Whey Protein + BCAA", origin: "manual", installments: [{ value: 69.9, dueDate: fiadoDate(-10), paid: true }, { value: 69.9, dueDate: fiadoDate(-40), paid: false }] },   { id: "fd3", customerId: "c4", customerName: "Carlos Henrique", date: fiadoDate(45), products: "Termogênico Slim 60caps", origin: "manual", installments: [{ value: 79.9, dueDate: fiadoDate(-15), paid: true }] }, ];

export const PRESET_COLORS = ["#DC2626", "#2563EB", "#059669", "#7C3AED", "#EA580C", "#DB2777"];
