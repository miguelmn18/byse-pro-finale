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

const API_URL = "http://localhost:3333/api";

function Fiados({
  fiados,
  setFiados,
  customers,
  card,
  border,
  subtext,
  accent,
  text
}) {
  const [showForm, setShowForm] = useState(false);
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [products, setProducts] = useState("");
  const [value, setValue] = useState("");
  const [dueDate, setDueDate] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("byse_token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  const add = async () => {
    if (!customerId || !value) return;
    const c = customers.find((c) => c.id === customerId);
    const d = dueDate
      ? new Date(dueDate + "T12:00:00")
      : new Date();
    
    const item = {
      id: "fd" + Date.now(),
      customerId,
      customerName: c?.name || "Cliente",
      date: new Date(),
      products,
      origin: "manual",
      installments: [{ value: Number(value) || 0, dueDate: d, paid: false }]
    };

    const updated = [...fiados, item];
    setFiados(updated);

    try {
      await fetch(`${API_URL}/fiados`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(item)
      });
    } catch (err) {
      console.error("Erro ao salvar fiado no servidor:", err);
    }

    setShowForm(false);
    setProducts("");
    setValue("");
    setDueDate("");
  };

  const toggle = async (id) => {
    const updated = fiados.map((f) =>
      f.id === id
        ? {
            ...f,
            installments: f.installments.map((i, idx) =>
              idx === 0 ? { ...i, paid: !i.paid } : i
            )
          }
        : f
    );
    setFiados(updated);

    const target = updated.find(f => f.id === id);
    if (target) {
      try {
        await fetch(`${API_URL}/fiados`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(target)
        });
      } catch (err) {
        console.error("Erro ao atualizar status do fiado:", err);
      }
    }
  };

  const deleteFiado = async (id) => {
    if (confirm("Tem certeza que deseja excluir este fiado?")) {
      const updated = fiados.filter((f) => f.id !== id);
      setFiados(updated);

      try {
        await fetch(`${API_URL}/fiados/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
      } catch (err) {
        console.error("Erro ao excluir fiado:", err);
      }
    }
  };

  const clearAllFiados = async () => {
    if (confirm("Tem certeza que deseja excluir TODOS os fiados? Esta ação não pode ser desfeita.")) {
      setFiados([]);
      for (const f of fiados) {
        try {
          await fetch(`${API_URL}/fiados/${f.id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
          });
        } catch (err) {}
      }
    }
  };

  return (
    <div>
      <SectionTitle
        title="Fiados"
        sub="Contas pendentes e parcelas"
        subtext={subtext}
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
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

        {fiados.length > 0 && (
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
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={{ width: "100%", padding: 9, marginBottom: 8 }}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            value={products}
            onChange={(e) => setProducts(e.target.value)}
            placeholder="Produtos"
            style={{ width: "100%", padding: 9, marginBottom: 8 }}
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
            Salvar
          </button>
        </div>
      )}

      {fiados.length === 0 ? (
        <div style={{ color: subtext }}>Nenhum fiado cadastrado.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {fiados.map((f) => (
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
                    onClick={() => toggle(f.id)}
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