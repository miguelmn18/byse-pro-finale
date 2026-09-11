// @ts-nocheck

import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Store,
  MessageCircle,
  Gift,
  Printer,
  Plus,
  Search,
  Moon,
  Sun,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  Award,
  Percent,
  Eye,
  EyeOff,
  Edit2,
  Check,
  User,
  Lock,
  Menu,
  Bell,
  Clipboard,
  MoreVertical,
  Tag,
  Heart,
  ScanLine,
  List,
  History,
  LayoutGrid,
  TrendingUp,
  Share2,
  Calculator,
  CreditCard,
  Truck,
  Video,
  Music,
  Type,
  Mail,
  Wallet,
  Banknote,
  Save
} from "lucide-react";

import {
  FONT_BODY,
  FONT_DISPLAY,
  SUCCESS,
  DANGER,
  CHANNELS,
  GENDERS,
  FULFILLMENTS,
  MONTH_NAMES,
  MONTH_SHORT,
  WEEKDAY_LABELS,
  WEEKDAY_SHORT,
  seedCustomers,
  seedProducts,
  seedSellers,
  paymentMethods,
  HOUR_WEIGHTS,
  DOW_WEIGHTS,
  HOUR_SLOTS,
  CHANNEL_WEIGHTS,
  GENDER_WEIGHTS,
  FULFILL_WEIGHTS,
  PRESET_COLORS,
  seedSales,
  allSeedSales,
  seedAdEntries,
  seedFiados
} from "../data/constants";

import {
  money,
  formatDateShort,
  formatDateBadge,
  formatDateLong,
  inPeriod,
  sameOrBefore,
  sendWhatsAppMessage,
  sendSMS,
  fiadoDate,
  inputStyle,
  lbl,
  ghostBtn,
  hexAlpha
} from "../utils/helpers";

import {
  SectionTitle,
  StatCard,
  FinanceRow,
  HBar,
  WaveChart,
  Pill,
  SLabel,
  PeriodHeader,
  PeriodModal,
  SingleDatePicker,
  MenuGridScreen,
  LogoMark,
  VipWelcome
} from "../components/common";

import type {
  Product,
  Customer,
  Seller,
  Sale,
  StockLocation,
  AdEntry,
  WaScheduleEntry,
  WelcomeConfig
} from "../types";


export function Dashboard({
  sales = [],
  products,
  customers,
  sellers,
  card,
  border,
  subtext,
  accent,
  text
}) {
  // Estado local sincronizado diretamente com o banco de dados via props
  const [localSales, setLocalSales] = useState(sales);

  useEffect(() => {
    // Atualiza o estado refletindo exatamente o que veio do banco/API
    const currentSales = Array.isArray(sales) ? sales : [];
    setLocalSales(currentSales);

    try {
      if (currentSales.length > 0) {
        localStorage.setItem("app_sales", JSON.stringify(currentSales));
      } else {
        // Se o banco estiver vazio, limpa o cache local para refletir o estado zerado
        localStorage.removeItem("app_sales");
      }
    } catch (e) {
      console.error("Erro ao gerenciar vendas no storage", e);
    }
  }, [sales]);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Período inicial padrão (Últimos 30 dias)
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [periodEnd, setPeriodEnd] = useState(today);

  const setPeriod = (s, e) => {
    setPeriodStart(s);
    setPeriodEnd(e);
  };

  // Funções de atalho para os filtros de período solicitado
  const setFilterToday = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    setPeriod(start, end);
  };

  const setFilterThisWeek = () => {
    const start = new Date();
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Início na segunda-feira
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    setPeriod(start, end);
  };

  const setFilterThisMonth = () => {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    setPeriod(start, end);
  };

  const [showComm, setShowComm] = useState(false);

  // Filtro de vendas baseado em localSales para garantir robustez
  const periodSales = localSales.filter((s) => {
    if (!s.date) return false;
    const saleDate = new Date(s.date);
    if (isNaN(saleDate.getTime())) return false;

    const startCopy = new Date(periodStart);
    startCopy.setHours(0, 0, 0, 0);
    
    const endCopy = new Date(periodEnd);
    endCopy.setHours(23, 59, 59, 999);

    return saleDate >= startCopy && saleDate <= endCopy;
  });
  
  // Venda Total = Soma exata das vendas filtradas no período
  const totalVendido = periodSales.reduce((s, v) => s + Number(v.total || 0), 0);
  
  const custoTotal = periodSales.reduce(
    (s, v) =>
      s + (v.items && Array.isArray(v.items) ? v.items.reduce((a, it) => a + (Number(it.cost || 0) * Number(it.qty || it.quantity || 1)), 0) : 0),
    0
  );
  
  const lucroBruto = totalVendido - custoTotal;
  const numVendas = periodSales.length;

  const commBySeller = sellers.map((s) => {
    const ss = periodSales.filter((v) => v.seller === s.id || v.seller === s.name);
    const tot = ss.reduce((a, v) => a + Number(v.total || 0), 0);
    return { name: s.name, commission: (tot * Number(s.commissionPct || 0)) / 100 };
  });
  const commTotal = commBySeller.reduce((a, c) => a + c.commission, 0);

  const stockQty = products.reduce(
    (s, p) =>
      p.controlStock !== false
        ? s + Object.values(p.stocks || {}).reduce((a, b) => a + Number(b || 0), 0)
        : s,
    0
  );
  
  const stockCost = products.reduce((s, p) => {
    if (p.controlStock === false) return s;
    const q = Object.values(p.stocks || {}).reduce((a, b) => a + Number(b || 0), 0);
    return s + q * Number(p.cost || 0);
  }, 0);
  
  const stockValue = products.reduce((s, p) => {
    if (p.controlStock === false) return s;
    const q = Object.values(p.stocks || {}).reduce((a, b) => a + Number(b || 0), 0);
    return s + q * Number(p.price || 0);
  }, 0);

  const itemCount = {};
  periodSales.forEach((s) => {
    const itemsList = typeof s.items === 'string' ? JSON.parse(s.items || '[]') : (s.items || []);
    if (Array.isArray(itemsList)) {
      itemsList.forEach((it) => {
        const itemName = it.name || 'Produto';
        itemCount[itemName] = (itemCount[itemName] || 0) + Number(it.qty || it.quantity || 1);
      });
    }
  });
  
  const topItems = Object.entries(itemCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const periodCustomers = {};
  periodSales.forEach((s) => {
    const label = s.customer_name || s.customerName || (customers.find((c) => c.id === s.customerId || c.id === s.customer_id)?.name) || "Venda Balcão";
    periodCustomers[label] = (periodCustomers[label] || 0) + Number(s.total || 0);
  });

  const byHour = Array(HOUR_SLOTS.length).fill(0);
  const byDow = Array(7).fill(0);
  periodSales.forEach((s) => {
    const d = new Date(s.date);
    if (!isNaN(d.getTime())) {
      const hi = HOUR_SLOTS.indexOf(d.getHours());
      if (hi >= 0) byHour[hi]++;
      if (!isNaN(d.getDay())) byDow[d.getDay()]++;
    }
  });

  const peakHourIdx = byHour.indexOf(Math.max(...byHour));
  const peakDowIdx = byDow.indexOf(Math.max(...byDow));
  const hasHourData = Math.max(...byHour) > 0;
  const hasDowData = Math.max(...byDow) > 0;
  const DOW_NAMES = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado"
  ];

  return (
    <div>
      <SectionTitle
        title="Painel geral"
        sub="Selecione o período para ver o relatório"
        subtext={subtext}
      />

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: 18,
          marginBottom: 14
        }}
      >
        <SLabel subtext={subtext}>
          Dias e horários mais movimentados (no período)
        </SLabel>

        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: subtext,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginBottom: 2
          }}
        >
          Por horário
        </div>
        <div
          style={{
            fontSize: 12,
            color: accent,
            fontWeight: 700,
            marginBottom: 8
          }}
        >
          {hasHourData
            ? `Pico às ${HOUR_SLOTS[peakHourIdx]}h`
            : "Sem dados no período"}
        </div>
        <WaveChart
          data={byHour}
          color={accent}
          gradId="waveHour"
          height={78}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4
          }}
        >
          <span style={{ fontSize: 9, color: subtext }}>
            {HOUR_SLOTS[0]}h
          </span>
          <span style={{ fontSize: 9, color: subtext }}>
            {HOUR_SLOTS[Math.floor(HOUR_SLOTS.length / 2)]}h
          </span>
          <span style={{ fontSize: 9, color: subtext }}>
            {HOUR_SLOTS[HOUR_SLOTS.length - 1]}h
          </span>
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: subtext,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginTop: 20,
            marginBottom: 2
          }}
        >
          Por dia da semana
        </div>
        <div
          style={{
            fontSize: 12,
            color: accent,
            fontWeight: 700,
            marginBottom: 8
          }}
        >
          {hasDowData
            ? `Pico ${DOW_NAMES[peakDowIdx]}`
            : "Sem dados no período"}
        </div>
        <WaveChart
          data={byDow}
          color={accent}
          gradId="waveDow"
          height={64}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4
          }}
        >
          {WEEKDAY_LABELS.map((w, i) => (
            <span key={i} style={{ fontSize: 9, color: subtext }}>
              {w}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 8,
          flexWrap: "wrap"
        }}
      >
        <button
          onClick={setFilterToday}
          style={ghostBtn(border, text)}
        >
          Hoje
        </button>
        <button
          onClick={setFilterThisWeek}
          style={ghostBtn(border, text)}
        >
          Esta semana
        </button>
        <button
          onClick={setFilterThisMonth}
          style={ghostBtn(border, text)}
        >
          Este mês
        </button>
      </div>

      <PeriodHeader
        start={periodStart}
        end={periodEnd}
        onChange={setPeriod}
        accent={accent}
        card={card}
        border={border}
        text={text}
        subtext={subtext}
      />

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: 18,
          marginTop: 14,
          marginBottom: 14
        }}
      >
        <SLabel subtext={subtext}>Posição financeira</SLabel>
        <FinanceRow
          color={accent}
          label="Total vendido"
          sub="Valor em dinheiro das vendas do período"
          value={money(totalVendido)}
        />
        <FinanceRow
          color={accent}
          label="Custo total"
          value={money(custoTotal)}
        />
        <FinanceRow
          color={lucroBruto >= 0 ? SUCCESS : DANGER}
          label="Lucro Bruto"
          value={money(lucroBruto)}
        />
        <FinanceRow
          color={accent}
          label="Número de vendas"
          value={String(numVendas)}
        />
      </div>

      <div
        onClick={() => setShowComm(!showComm)}
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: 18,
          marginBottom: 14,
          cursor: "pointer"
        }}
      >
        <FinanceRow
          color="#D97706"
          label="Comissão total"
          sub={
            showComm
              ? undefined
              : "Toque para exibir o total por vendedor"
          }
          value={money(commTotal)}
        />
        {showComm &&
          commBySeller.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12.5,
                padding: "6px 0 6px 13px",
                borderTop: `1px dashed ${border}`
              }}
            >
              <span>{c.name}</span>
              <span style={{ fontWeight: 700 }}>
                {money(c.commission)}
              </span>
            </div>
          ))}
      </div>

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: 18,
          marginBottom: 14
        }}
      >
        <SLabel subtext={subtext}>Patrimônio em estoque</SLabel>
        <FinanceRow
          color={accent}
          label="Quantidade em estoque"
          sub="Total de itens"
          value={String(stockQty)}
        />
        <FinanceRow
          color={DANGER}
          label="Custo total"
          sub="Custo de produtos em estoque"
          value={money(stockCost)}
        />
        <FinanceRow
          color={SUCCESS}
          label="Venda total"
          sub="Valor de venda dos produtos em estoque"
          value={money(stockValue)}
        />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 18,
            flex: 1,
            minWidth: 240
          }}
        >
          <SLabel subtext={subtext}>Itens mais vendidos no período</SLabel>
          {topItems.length === 0 && (
            <div style={{ fontSize: 12.5, color: subtext }}>
              Nenhuma venda nesse período.
            </div>
          )}
          {topItems.map(([name, qty], i) => (
            <div
              key={name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "7px 0",
                borderBottom:
                  i < topItems.length - 1 ? `1px solid ${border}` : "none"
              }}
            >
              <span style={{ fontSize: 13 }}>{name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>
                {qty} un.
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 18,
            flex: 1,
            minWidth: 240
          }}
        >
          <SLabel subtext={subtext}>Clientes que compraram no período</SLabel>
          {Object.keys(periodCustomers).length === 0 && (
            <div style={{ fontSize: 12.5, color: subtext }}>
              Só vendas de balcão sem cadastro nesse período.
            </div>
          )}
          {Object.entries(periodCustomers)
            .sort((a, b) => b[1] - a[1])
            .map(([name, val]) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 0",
                  borderBottom: `1px solid ${border}`
                }}
              >
                <span style={{ fontSize: 13 }}>{name}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {money(val)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}