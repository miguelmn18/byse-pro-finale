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
  const [customerMode, setCustomerMode] = useState("registered");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [products, setProducts] = useState("");
  const [value, setValue] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

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
    const previousFiados = Array.isArray(fiados) ? fiados : [];
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
      const response = await fetch(`${API_URL}/fiados`, {
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
      const itemsToDelete = [...fiados];
      setFiados([]);
      for (const f of itemsToDelete) {
        try {
          await fetch(`${API_URL}/fiados/${f.id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
          });
        } catch (err) {
          console.error(`Erro ao excluir fiado ${f.id}:`, err);
        }
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