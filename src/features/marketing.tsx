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


function TrafegoPago({
  adEntries,
  setAdEntries,
  sales,
  card,
  border,
  subtext,
  accent,
  text
}) {
  const today = new Date();
  const [periodStart, setPeriodStart] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [periodEnd, setPeriodEnd] = useState(today);

  const setPeriod = (s, e) => {
    setPeriodStart(s);
    setPeriodEnd(e);
  };

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    leads: "",
    spend: ""
  });
  const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3333").replace(/\/$/, "");
  const authHeaders = () => ({ "Content-Type":"application/json", "Authorization":`Bearer ${localStorage.getItem("byse_token")||""}` });
  const [stateLoaded, setStateLoaded] = useState(false);
  useEffect(() => { (async()=>{ try { const r=await fetch(`${API_URL}/api/app-state/marketing`,{headers:authHeaders()}); if(r.ok){const d=await r.json(); if(Array.isArray(d.adEntries))setAdEntries(d.adEntries.map((x:any)=>({...x,date:new Date(x.date)}))); setStateLoaded(true);} } catch(e){console.error(e);} })(); }, []);
  useEffect(() => { if(!stateLoaded)return; const serializable=adEntries.map((x:any)=>({...x,date:new Date(x.date).toISOString()})); fetch(`${API_URL}/api/app-state/marketing`,{method:"PUT",headers:authHeaders(),body:JSON.stringify({adEntries:serializable})}).catch(()=>{}); }, [adEntries]);

  const addEntry = () => {
    if (!form.leads && !form.spend) return;
    const d = new Date(form.date + "T12:00:00");
    setAdEntries([
      ...adEntries,
      {
        date: d,
        leads: parseInt(form.leads) || 0,
        spend: parseFloat(form.spend) || 0
      }
    ]);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      leads: "",
      spend: ""
    });
    setShowForm(false);
  };

  const periodAd = adEntries
    .filter((e) => inPeriod(e.date, periodStart, periodEnd))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const periodSales = sales.filter((s) =>
    inPeriod(s.date, periodStart, periodEnd)
  );

  const totalLeads = periodAd.reduce((s, e) => s + e.leads, 0);
  const totalSpend = periodAd.reduce((s, e) => s + e.spend, 0);
  const totalRev = periodSales.reduce((s, v) => s + v.total, 0);
  const roi =
    totalSpend > 0 ? ((totalRev - totalSpend) / totalSpend) * 100 : 0;
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

  return (
    <div>
      <SectionTitle
        title="Tráfego pago"
        sub="Leads, investimento e retorno sobre anúncios (lançamento manual)"
        subtext={subtext}
      />

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16
        }}
      >
        <StatCard
          label="Leads no período"
          value={totalLeads}
          {...{ card, border, subtext, accent }}
        />
        <StatCard
          label="Investido no período"
          value={money(totalSpend)}
          {...{ card, border, subtext, accent }}
        />
        <StatCard
          label="Custo por lead"
          value={money(cpl)}
          {...{ card, border, subtext, accent }}
        />
        <StatCard
          label="ROI do período"
          value={`${roi.toFixed(0)}%`}
          sub={roi >= 0 ? "Positivo" : "Negativo"}
          {...{ card, border, subtext, accent }}
        />
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          background: accent,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 16
        }}
      >
        <Plus size={15} /> Lançar leads e investimento do dia
      </button>

      {showForm && (
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            display: "flex",
            gap: 10,
            flexWrap: "wrap"
          }}
        >
          <input
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm({ ...form, date: e.target.value })
            }
            style={inputStyle(border, text)}
          />
          <input
            placeholder="Leads"
            type="number"
            value={form.leads}
            onChange={(e) =>
              setForm({ ...form, leads: e.target.value })
            }
            style={inputStyle(border, text)}
          />
          <input
            placeholder="Investido (R$)"
            type="number"
            value={form.spend}
            onChange={(e) =>
              setForm({ ...form, spend: e.target.value })
            }
            style={inputStyle(border, text)}
          />
          <button
            onClick={addEntry}
            style={{
              background: accent,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Salvar
          </button>
        </div>
      )}

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: 16
        }}
      >
        <SLabel subtext={subtext}>Período do relatório</SLabel>

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

        <div style={{ marginTop: 14 }}>
          {periodAd.length === 0 && (
            <div style={{ fontSize: 12.5, color: subtext }}>
              Nenhum lançamento nesse período.
            </div>
          )}

          {periodAd.map((e, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                padding: "8px 0",
                borderBottom: `1px solid ${border}`,
                fontSize: 12.5
              }}
            >
              <span>{new Date(e.date).toLocaleDateString("pt-BR")}</span>
              <span>{e.leads} lead(s)</span>
              <span style={{ textAlign: "right", fontWeight: 700 }}>
                {money(e.spend)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function CanaisDeVenda({
  sales,
  card,
  border,
  subtext,
  accent,
  text
}) {
  const totalRevenue = sales.reduce((s, v) => s + Number(v.total || 0), 0);

  const byChannel = CHANNELS.map((ch) => {
    const chSales = sales.filter(
      (s) => (s.sales_channel || s.salesChannel || s.channel || "Loja física") === ch
    );
    const revenue = chSales.reduce((s, v) => s + Number(v.total || 0), 0);
    const uniqueCustomers = new Set(
      chSales.map((s) => s.customer_name || s.customerName || s.customer).filter(Boolean)
    ).size;
    return {
      channel: ch,
      revenue,
      pct: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      count: chSales.length,
      uniqueCustomers
    };
  });

  // Mapeamento garantindo que GENDERS ("Masculino", "Feminino", "Prefiro não informar") sempre apareçam
  const genderCounts = {};
  const validGenders = Array.isArray(GENDERS) && GENDERS.length > 0 
    ? GENDERS 
    : ["Masculino", "Feminino", "Prefiro não informar"];

  validGenders.forEach((g) => {
    genderCounts[g] = 0;
  });

  sales.forEach((s) => {
    // Tratamento robusto para extrair o gênero corretamente, cobrindo `gender`, `genders` e valores legados/nulos
    let g = s.gender || s.genders || "Prefiro não informar";
    if (g === "Não informado" || !g) g = "Prefiro não informar";
    
    if (genderCounts[g] !== undefined) {
      genderCounts[g] += 1;
    } else {
      genderCounts["Prefiro não informar"] = (genderCounts["Prefiro não informar"] || 0) + 1;
    }
  });

  const fulfillmentCounts = {};
  sales.forEach((s) => {
    const f = s.delivery_type || s.deliveryType || s.fulfillment || "Retirada";
    fulfillmentCounts[f] = (fulfillmentCounts[f] || 0) + 1;
  });

  const totalSales = sales.length || 1;

  return (
    <div>
      <SectionTitle
        title="Canais de venda"
        sub="Faturamento, clientes e perfil de compra por canal"
        subtext={subtext}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px,1fr))",
          gap: 12,
          marginBottom: 20
        }}
      >
        {byChannel.map((c) => (
          <div
            key={c.channel}
            style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: 16
            }}
          >
            <SLabel subtext={subtext}>{c.channel}</SLabel>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 22
              }}
            >
              {money(c.revenue)}
            </div>
            <div
              style={{
                fontSize: 12,
                color: accent,
                fontWeight: 700,
                marginTop: 2
              }}
            >
              {c.pct.toFixed(1)}% do faturamento
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: subtext,
                marginTop: 6
              }}
            >
              {c.count} venda(s) · {c.uniqueCustomers} cliente(s) único(s)
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 18,
            flex: 1,
            minWidth: 220
          }}
        >
          <SLabel subtext={subtext}>Perfil por gênero</SLabel>

          {Object.entries(genderCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([g, c]) => (
              <div key={g} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 3
                  }}
                >
                  <span>{g}</span>
                  <span style={{ fontWeight: 700 }}>
                    {totalSales > 0 ? ((c / totalSales) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <HBar
                  pct={totalSales > 0 ? (c / totalSales) * 100 : 0}
                  color={accent}
                  border={border}
                  h={6}
                />
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
            minWidth: 220
          }}
        >
          <SLabel subtext={subtext}>Delivery x Retirada</SLabel>

          {Object.entries(fulfillmentCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([f, c]) => (
              <div key={f} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 3
                  }}
                >
                  <span>{f}</span>
                  <span style={{ fontWeight: 700 }}>
                    {((c / totalSales) * 100).toFixed(0)}%
                  </span>
                </div>
                <HBar
                  pct={(c / totalSales) * 100}
                  color={accent}
                  border={border}
                  h={6}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export { TrafegoPago, CanaisDeVenda };