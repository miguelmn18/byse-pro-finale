// @ts-nocheck

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Users,
  BarChart3,
  CalendarDays,
  UserRound,
  Wallet,
  TrendingUp,
  Package,
  ShoppingCart,
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
  Share2,
  Calculator,
  CreditCard,
  Truck,
  Video,
  Music,
  Type,
  Mail,
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

// Normaliza a URL para funcionar tanto com VITE_API_URL terminando em /api
// quanto com a URL-base do backend sem /api. Evita gerar /fiados sem o prefixo /api.

function Fiados({
  fiados,
  setFiados,
  customers,
  card,
  border,
  subtext,
  accent,
  text,
  apiUrl
}) {
  const configuredApiUrl = (apiUrl || import.meta.env.VITE_API_URL || "http://localhost:3333/api")
    .trim()
    .replace(/\/+$/, "");
  const FIADOS_API_URL = `${configuredApiUrl.replace(/\/api$/i, "")}/api/fiados`;

  const [showForm, setShowForm] = useState(false);
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [customerMode, setCustomerMode] = useState("registered");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [products, setProducts] = useState("");
  const [value, setValue] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [comparisonMode, setComparisonMode] = useState("week");

  const safeFiados = Array.isArray(fiados) ? fiados : [];

  const reportSummary = useMemo(() => {
    const getInstallments = (fiado) => {
      if (Array.isArray(fiado?.installments)) return fiado.installments;
      if (typeof fiado?.installments === "string") {
        try {
          const parsed = JSON.parse(fiado.installments);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const getCustomerKey = (fiado) => {
      const customerIdValue = String(
        fiado?.customerId || fiado?.customer_id || ""
      ).trim();
      if (customerIdValue && !customerIdValue.startsWith("manual-")) {
        return `id:${customerIdValue}`;
      }
      const name = String(
        fiado?.customerName || fiado?.customer_name || "Cliente"
      ).trim().toLocaleLowerCase("pt-BR");
      return `name:${name}`;
    };

    const getCreatedDate = (fiado) => {
      const raw = fiado?.date || fiado?.createdAt || fiado?.created_at;
      if (!raw) return null;
      const date = raw instanceof Date ? raw : new Date(raw);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const summarize = (items) => {
      const customers = new Set();
      let registeredValue = 0;
      let openValue = 0;

      items.forEach((fiado) => {
        customers.add(getCustomerKey(fiado));
        getInstallments(fiado).forEach((installment) => {
          const amount = Math.max(0, Number(installment?.value || 0));
          registeredValue += amount;
          if (!installment?.paid) openValue += amount;
        });
      });

      return {
        count: items.length,
        people: customers.size,
        registeredValue,
        openValue,
      };
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let currentStart;
    let currentEnd;
    let previousStart;
    let previousEnd;
    let currentLabel;
    let previousLabel;

    if (comparisonMode === "day") {
      currentStart = todayStart;
      currentEnd = new Date(todayStart);
      currentEnd.setDate(currentEnd.getDate() + 1);
      previousStart = new Date(todayStart);
      previousStart.setDate(previousStart.getDate() - 1);
      previousEnd = todayStart;
      currentLabel = "Hoje";
      previousLabel = "Ontem";
    } else if (comparisonMode === "month") {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = now;
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthLastDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        0
      ).getDate();
      previousEnd = new Date(
        previousStart.getFullYear(),
        previousStart.getMonth(),
        Math.min(now.getDate(), previousMonthLastDay),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      );
      currentLabel = "Mês atual";
      previousLabel = "Mesmo período do mês passado";
    } else {
      currentStart = new Date(todayStart);
      const weekday = (currentStart.getDay() + 6) % 7;
      currentStart.setDate(currentStart.getDate() - weekday);
      currentEnd = now;
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
      const elapsed = now.getTime() - currentStart.getTime();
      previousEnd = new Date(previousStart.getTime() + elapsed);
      currentLabel = "Semana atual";
      previousLabel = "Mesmo período da semana passada";
    }

    const inRange = (fiado, start, end) => {
      const created = getCreatedDate(fiado);
      return created && created >= start && created < end;
    };

    const currentItems = safeFiados.filter((f) =>
      inRange(f, currentStart, currentEnd)
    );
    const previousItems = safeFiados.filter((f) =>
      inRange(f, previousStart, previousEnd)
    );

    return {
      overall: summarize(safeFiados),
      current: summarize(currentItems),
      previous: summarize(previousItems),
      currentLabel,
      previousLabel,
    };
  }, [safeFiados, comparisonMode]);

  const formatMoney = (amount) =>
    money(Number.isFinite(Number(amount)) ? Number(amount) : 0);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("byse_token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  const add = async () => {
    const selectedCustomer = customerMode === "registered"
      ? customers.find((c) => String(c.id) === String(customerId))
      : null;
    const customerName = customerMode === "registered"
      ? selectedCustomer?.name
      : newCustomerName.trim();

    if (!customerName) {
      alert(customerMode === "registered"
        ? "Selecione um cliente ou escolha cadastrar um novo."
        : "Informe o nome do novo cliente.");
      return;
    }
    if (!String(value).trim() || Number(value) <= 0) {
      alert("Informe um valor válido para o fiado.");
      return;
    }

    const d = dueDate ? new Date(dueDate + "T12:00:00") : new Date();
    const item = {
      id: "fd" + Date.now(),
      customerId: customerMode === "registered"
        ? selectedCustomer?.id
        : "manual-" + Date.now(),
      customerName,
      customerPhone: customerMode === "new" ? newCustomerPhone.trim() : (selectedCustomer?.phone || selectedCustomer?.telephone || ""),
      date: new Date(),
      products: products.trim(),
      origin: "manual",
      installments: [{ value: Number(value) || 0, dueDate: d, paid: false }]
    };

    // Atualização otimista: o fiado aparece imediatamente na tela,
    // sem esperar a resposta da API.
    const previousFiados = safeFiados;
    setFiados([...previousFiados, item]);
    setShowForm(false);
    setCustomerId(customers[0]?.id || "");
    setCustomerMode("registered");
    setNewCustomerName("");
    setNewCustomerPhone("");
    setProducts("");
    setValue("");
    setDueDate("");
    setSaving(true);

    try {
      const response = await fetch(FIADOS_API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(item)
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(detail || `Falha ao salvar fiado (${response.status})`);
      }
    } catch (err) {
      console.error("Erro ao sincronizar fiado com o servidor:", err);
      // Mantém o item visível para não fazê-lo desaparecer da interface.
      // A persistência após recarregar depende de a API aceitar o registro.
      alert("O fiado já foi exibido na tela, mas houve falha ao salvar no servidor. Verifique a URL da API/conexão antes de recarregar a página.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id, installmentIndex = 0) => {
    const updated = safeFiados.map((f) =>
      f.id === id
        ? {
            ...f,
            installments: f.installments.map((i, idx) =>
              idx === installmentIndex ? { ...i, paid: !i.paid } : i
            )
          }
        : f
    );
    setFiados(updated);

    const target = updated.find(f => f.id === id);
    if (target) {
      try {
        const response = await fetch(FIADOS_API_URL, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(target)
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          throw new Error(detail || `Falha ao atualizar fiado (${response.status})`);
        }
      } catch (err) {
        console.error("Erro ao atualizar status do fiado:", err);
      }
    }
  };

  
const deleteFiado = async (id) => {
  if (!confirm("Tem certeza que deseja excluir este fiado?")) {
    return;
  }

  const previousFiados = [...safeFiados];

  try {
    const response = await fetch(`${FIADOS_API_URL}/${encodeURIComponent(String(id))}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.error || `Falha ao excluir fiado (${response.status})`
      );
    }

    // Só remove da interface após confirmação do servidor.
    setFiados((current) =>
      current.filter((f) => String(f.id) !== String(id))
    );
  } catch (error) {
    console.error("Erro ao excluir fiado:", error);

    // Restaura os dados caso a exclusão não seja confirmada.
    setFiados(previousFiados);

    alert(
      "Não foi possível confirmar a exclusão do fiado no servidor. " +
      "Verifique a conexão e tente novamente."
    );
  }
};

  const clearAllFiados = async () => {
    if (!confirm("Tem certeza que deseja excluir TODOS os fiados? Esta ação não pode ser desfeita.")) {
      return;
    }

    const itemsToDelete = [...safeFiados];
    const failedItems = [];
    setFiados([]);

    for (const f of itemsToDelete) {
      try {
        const response = await fetch(
          `${FIADOS_API_URL}/${encodeURIComponent(String(f.id))}`,
          {
            method: "DELETE",
            headers: getAuthHeaders()
          }
        );

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          throw new Error(detail || `Falha ao excluir fiado (${response.status})`);
        }
      } catch (err) {
        console.error(`Erro ao excluir fiado ${f.id}:`, err);
        failedItems.push(f);
      }
    }

    if (failedItems.length > 0) {
      setFiados(failedItems);
      alert(
        `${failedItems.length} fiado(s) não puderam ser excluídos do servidor. ` +
        "Eles foram mantidos na tela para você tentar novamente."
      );
    }
  };

  return (
    <div>
      <SectionTitle
        title="Fiados"
        sub="Contas pendentes e parcelas"
        subtext={subtext}
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            background: accent,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "9px 14px",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          {showForm ? "Cancelar" : "Novo fiado"}
        </button>

        <button
          type="button"
          onClick={() => setShowReport((visible) => !visible)}
          style={{
            background: showReport ? accent : "transparent",
            color: showReport ? "#fff" : text,
            border: "1px solid " + (showReport ? accent : border),
            borderRadius: 8,
            padding: "9px 14px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <BarChart3 size={16} />
          {showReport ? "Fechar relatório" : "Relatório"}
        </button>

        {safeFiados.length > 0 && (
          <button
            onClick={clearAllFiados}
            style={{
              background: DANGER,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Trash2 size={15} /> Limpar tudo
          </button>
        )}
      </div>

      {showReport && (
        <section
          style={{
            background: card,
            border: "1px solid " + border,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 15 }}>
                <BarChart3 size={18} color={accent} />
                Relatório de fiados
              </div>
              <div style={{ color: subtext, fontSize: 12, marginTop: 4 }}>
                Resumo dos registros e comparação entre períodos
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowReport(false)}
              aria-label="Fechar relatório"
              style={{ background: "transparent", border: "1px solid " + border, color: text, borderRadius: 8, padding: 7, cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 18 }}>
            {[
              { label: "Fiados registrados", value: reportSummary.overall.count, icon: Clipboard },
              { label: "Pessoas com fiado", value: reportSummary.overall.people, icon: UserRound },
              { label: "Valor total registrado", value: formatMoney(reportSummary.overall.registeredValue), icon: Wallet },
              { label: "Valor em aberto", value: formatMoney(reportSummary.overall.openValue), icon: TrendingUp },
            ].map((metric) => {
              const MetricIcon = metric.icon;
              return (
                <div key={metric.label} style={{ background: "rgba(127,127,127,0.08)", border: "1px solid " + border, borderRadius: 10, padding: 12, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: subtext, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                    <MetricIcon size={15} color={accent} />
                    {metric.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, overflowWrap: "anywhere" }}>{metric.value}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Comparar períodos</div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: subtext, fontSize: 12 }}>
              <CalendarDays size={15} />
              <select
                value={comparisonMode}
                onChange={(event) => setComparisonMode(event.target.value)}
                style={{ background: card, color: text, border: "1px solid " + border, borderRadius: 8, padding: "8px 10px", fontWeight: 700 }}
              >
                <option value="day">Dias: hoje × ontem</option>
                <option value="week">Semanas: esta × anterior</option>
                <option value="month">Meses: atual × anterior</option>
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {[
              { label: "Quantidade de fiados", current: reportSummary.current.count, previous: reportSummary.previous.count, format: (v) => String(v) },
              { label: "Pessoas", current: reportSummary.current.people, previous: reportSummary.previous.people, format: (v) => String(v) },
              { label: "Valor registrado", current: reportSummary.current.registeredValue, previous: reportSummary.previous.registeredValue, format: formatMoney },
            ].map((comparison) => {
              const difference = comparison.current - comparison.previous;
              const positive = difference > 0;
              const percentage = comparison.previous > 0
                ? (difference / comparison.previous) * 100
                : comparison.current > 0 ? 100 : 0;
              return (
                <div key={comparison.label} style={{ border: "1px solid " + border, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: subtext, fontWeight: 700, marginBottom: 10 }}>{comparison.label}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: subtext, marginBottom: 3 }}>{reportSummary.currentLabel}</div>
                      <div style={{ fontWeight: 800, fontSize: 17, overflowWrap: "anywhere" }}>{comparison.format(comparison.current)}</div>
                    </div>
                    <div style={{ color: subtext, fontSize: 12 }}>×</div>
                    <div>
                      <div style={{ fontSize: 10, color: subtext, marginBottom: 3 }}>{reportSummary.previousLabel}</div>
                      <div style={{ fontWeight: 800, fontSize: 17, overflowWrap: "anywhere" }}>{comparison.format(comparison.previous)}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid " + border, display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: positive ? SUCCESS : difference < 0 ? DANGER : subtext }}>
                    <TrendingUp size={13} style={{ transform: difference < 0 ? "rotate(180deg)" : "none" }} />
                    {difference === 0
                      ? "Sem alteração"
                      : `${difference > 0 ? "+" : ""}${comparison.format(difference)} (${percentage > 0 ? "+" : ""}${percentage.toFixed(1).replace(".", ",")}%)`}
                    <span style={{ color: subtext, fontWeight: 400 }}>em relação ao período anterior</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ color: subtext, fontSize: 11, marginTop: 10 }}>
            A comparação considera a data de criação do fiado. O valor registrado soma todas as parcelas; o valor em aberto considera somente parcelas ainda não pagas.
          </div>
        </section>
      )}

      {showForm && (
        <div
          style={{
            background: card,
            border: "1px solid " + border,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16
          }}
        >
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            Cliente
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => setCustomerMode("registered")}
              style={{
                border: "1px solid " + (customerMode === "registered" ? accent : border),
                background: customerMode === "registered" ? accent : "transparent",
                color: customerMode === "registered" ? "#fff" : text,
                borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontWeight: 700
              }}
            >
              Selecionar cadastrado
            </button>
            <button
              type="button"
              onClick={() => setCustomerMode("new")}
              style={{
                border: "1px solid " + (customerMode === "new" ? accent : border),
                background: customerMode === "new" ? accent : "transparent",
                color: customerMode === "new" ? "#fff" : text,
                borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontWeight: 700
              }}
            >
              <Plus size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Novo cliente
            </button>
          </div>

          {customerMode === "registered" ? (
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              style={{ width: "100%", padding: 9, marginBottom: 8, boxSizing: "border-box" }}
            >
              <option value="">Selecione um cliente</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.phone || c.telephone ? ` — ${c.phone || c.telephone}` : ""}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Nome do novo cliente *"
                style={{ width: "100%", padding: 9, marginBottom: 8, boxSizing: "border-box" }}
              />
              <input
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="Telefone/WhatsApp (opcional)"
                inputMode="tel"
                style={{ width: "100%", padding: 9, marginBottom: 8, boxSizing: "border-box" }}
              />
              <div style={{ color: subtext, fontSize: 12, marginBottom: 8 }}>
                O cliente será identificado neste fiado mesmo que ainda não esteja no cadastro geral.
              </div>
            </>
          )}

          <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            Produto(s) ou descrição
          </label>
          <input
            value={products}
            onChange={(e) => setProducts(e.target.value)}
            placeholder="Digite qualquer produto, mesmo sem cadastro"
            style={{ width: "100%", padding: 9, marginBottom: 8, boxSizing: "border-box" }}
          />

          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="number"
            placeholder="Valor"
            style={{ width: "100%", padding: 9, marginBottom: 8 }}
          />

          <input
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            type="date"
            style={{ width: "100%", padding: 9, marginBottom: 8 }}
          />

          <button
            onClick={add}
            disabled={saving}
            style={{
              background: accent,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 14px",
              fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? "Salvando..." : "Salvar fiado"}
          </button>
        </div>
      )}

      {safeFiados.length === 0 ? (
        <div style={{ color: subtext }}>Nenhum fiado cadastrado.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {safeFiados.map((f) => (
            <div
              key={f.id}
              style={{
                background: card,
                border: "1px solid " + border,
                borderRadius: 12,
                padding: 14
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{f.customerName || f.customer_name}</strong>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700 }}>
                    {money(
                      (f.installments || []).reduce((a, i) => a + Number(i.value || 0), 0)
                    )}
                  </span>
                  <button
                    onClick={() => deleteFiado(f.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: DANGER,
                      padding: 2
                    }}
                    title="Excluir fiado"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: subtext,
                  margin: "6px 0"
                }}
              >
                {f.products || "Sem descrição"}
              </div>

              {(f.installments || []).map((i, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                    marginTop: 6
                  }}
                >
                  <span>{formatDateShort(i.dueDate)}</span>
                  <span style={{ color: i.paid ? SUCCESS : DANGER }}>
                    {i.paid ? "Pago" : "Pendente"}
                  </span>
                  <button
                    onClick={() => toggle(f.id, idx)}
                    style={{
                      border: "1px solid " + border,
                      background: "transparent",
                      color: text,
                      borderRadius: 6,
                      padding: "4px 7px",
                      cursor: "pointer"
                    }}
                  >
                    {i.paid ? "Reabrir" : "Marcar pago"}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { Fiados };