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
  Save,
  Filter,
  Calendar
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

/**
 * Função utilitária para adicionar o cashback acumulado a um cliente com validade padrão de 30 dias pós-venda.
 */
export const applyCashback = (customers, setCustomers, customerId, saleTotal, cashbackPct, validityDays = 30) => {
  if (!customerId || !saleTotal || saleTotal <= 0) return;
  const earned = (saleTotal * (cashbackPct || 0)) / 100;
  
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + (validityDays || 30));
  const expDateStr = expDate.toISOString().split('T')[0];

  setCustomers(
    customers.map((c) =>
      c.id === customerId
        ? {
            ...c,
            cashback: (Number(c.cashback) || 0) + earned,
            cashbackExpirationDate: expDateStr,
            cashback_expiration_date: expDateStr
          }
        : c
    )
  );
};

function Cashback({
  customers,
  setCustomers,
  cashbackPct,
  setCashbackPct,
  cashbackValidityDays,
  setCashbackValidityDays,
  card,
  border,
  subtext,
  accent,
  text
}) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  
  const [cashbackMessage, setCashbackMessage] = useState(
    'Oi {nome}, você tem {saldo} em cashback te esperando na nossa loja! Aproveite antes de vencer em {vencimento}. 🎁'
  );
  const [validityFilterDays, setValidityFilterDays] = useState("30");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    if (!cashbackValidityDays) {
      setCashbackValidityDays(30);
    }

    fetch('/api/cashback-config', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('byse_token') }
    })
      .then(res => res.json())
      .then(data => {
        if (data.cashbackPercentage !== undefined && data.cashbackPercentage !== null) {
          setCashbackPct(Number(data.cashbackPercentage));
        }
        if (data.cashbackValidityDays) setCashbackValidityDays(data.cashbackValidityDays);
        if (data.cashbackMessage) setCashbackMessage(data.cashbackMessage);
      })
      .catch(err => console.error("Erro ao carregar config de cashback", err));
  }, []);

  const saveConfigToBackend = async () => {
    setIsSavingConfig(true);
    try {
      await fetch('/api/cashback-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('byse_token')
        },
        body: JSON.stringify({
          cashbackPercentage: Number(cashbackPct) || 0,
          cashbackValidityDays: cashbackValidityDays || 30,
          cashbackMessage
        })
      });
      alert('Configurações de cashback, percentual e mensagem salvas com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar configurações', err);
      alert('Erro ao salvar configurações.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditValue(String(c.cashback));
  };

  const saveEdit = (id) => {
    setCustomers(
      customers.map((c) =>
        c.id === id
          ? {
              ...c,
              cashback: parseFloat(editValue) || 0
            }
          : c
      )
    );
    setEditingId(null);
  };

  const getRemainingDays = (c) => {
    const expDateRaw = c.cashbackExpirationDate || c.cashback_expiration_date || c.cashbackExpiry || c.cashback_expiry;
    if (!expDateRaw) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expDateRaw);
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredCustomers = useMemo(() => {
    const filterDaysNum = parseInt(validityFilterDays);
    if (isNaN(filterDaysNum) || filterDaysNum <= 0) {
      return customers.filter(c => Number(c.cashback) > 0);
    }

    return customers.filter(c => {
      const cashbackVal = Number(c.cashback) || 0;
      if (cashbackVal <= 0) return false;

      if (filterDaysNum >= 365) {
        return true;
      }

      const diffDays = getRemainingDays(c);
      if (diffDays === null) return false;
      return diffDays >= 0 && diffDays <= filterDaysNum;
    });
  }, [customers, validityFilterDays]);

  const getRenderedMessage = (c) => {
    const vencimentoFormatado = (c.cashbackExpirationDate || c.cashback_expiration_date || c.cashbackExpiry || c.cashback_expiry) 
      ? new Date(c.cashbackExpirationDate || c.cashback_expiration_date || c.cashbackExpiry || c.cashback_expiry).toLocaleDateString('pt-BR') 
      : 'breve';

    return cashbackMessage
      .replace(/{nome}/g, c.name || 'Cliente')
      .replace(/{saldo}/g, money(c.cashback || 0))
      .replace(/{vencimento}/g, vencimentoFormatado);
  };

  const handleSendWhatsAppMessage = (c) => {
    if (!c.phone) {
      alert("Este cliente não possui telefone cadastrado.");
      return;
    }
    const telefoneLimpo = c.phone.replace(/\D/g, '');
    if (telefoneLimpo.length < 10) {
      alert("Número de telefone inválido.");
      return;
    }
    const mensagemPronta = getRenderedMessage(c);
    window.open(`https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagemPronta)}`, '_blank');
  };

  return (
    <div>
      <SectionTitle
        title="Gestão de Cashback e Fidelidade"
        sub="Controle percentual customizado, validade de 30 dias pós-venda e mensagens personalizadas"
        subtext={subtext}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 24
        }}
      >
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 18
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Percent size={16} color={accent} /> Regras de Acúmulo
          </div>

          <label style={{ fontSize: 12, color: subtext }}>Porcentagem de cashback por compra (%)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, marginBottom: 14 }}>
            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={cashbackPct}
              onChange={(e) => setCashbackPct(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: accent }}
            />
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={cashbackPct}
              onChange={(e) => setCashbackPct(parseFloat(e.target.value) || 0)}
              style={{ ...inputStyle(border, text), width: 70, textAlign: 'center', fontWeight: 'bold' }}
            />
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: accent, minWidth: 20 }}>
              %
            </div>
          </div>

          <label style={{ fontSize: 12, color: subtext }}>Validade Padrão Pós-Venda (Dias)</label>
          <input
            type="number"
            value={cashbackValidityDays || 30}
            onChange={(e) => setCashbackValidityDays(parseInt(e.target.value) || 30)}
            style={{ ...inputStyle(border, text), width: "100%", marginTop: 6 }}
          />
        </div>

        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 18,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={16} color={accent} /> Edição da Mensagem de WhatsApp
          </div>
          <label style={{ fontSize: 11, color: subtext, marginBottom: 6 }}>
            Variáveis disponíveis: <code style={{ color: accent }}>{'{nome}'}</code>, <code style={{ color: accent }}>{'{saldo}'}</code>, <code style={{ color: accent }}>{'{vencimento}'}</code>
          </label>
          <textarea
            value={cashbackMessage}
            onChange={(e) => setCashbackMessage(e.target.value)}
            rows={3}
            style={{
              ...inputStyle(border, text),
              width: "100%",
              resize: "vertical",
              fontSize: 12,
              fontFamily: FONT_BODY
            }}
          />
          <button
            onClick={saveConfigToBackend}
            disabled={isSavingConfig}
            style={{
              marginTop: 10,
              background: accent,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              alignSelf: "flex-end"
            }}
          >
            <Save size={14} /> {isSavingConfig ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Filter size={18} color={accent} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: text }}>Radar de Cashback (Filtro por Vencimento)</div>
            <div style={{ fontSize: 11, color: subtext }}>Acompanhe os dias decrescentes e filtre saldos prestes a expirar</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select
            value={validityFilterDays}
            onChange={(e) => setValidityFilterDays(e.target.value)}
            style={{
              ...inputStyle(border, text),
              backgroundColor: card,
              color: text,
              padding: "8px 12px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <option value="15" style={{ backgroundColor: card, color: text }}>A 15 dias de vencer</option>
            <option value="30" style={{ backgroundColor: card, color: text }}>A 30 dias de vencer</option>
            <option value="60" style={{ backgroundColor: card, color: text }}>A 60 dias de vencer</option>
            <option value="90" style={{ backgroundColor: card, color: text }}>A 90 dias de vencer</option>
            <option value="365" style={{ backgroundColor: card, color: text }}>Todos com saldo ativo</option>
          </select>
          <div style={{ fontSize: 12, fontWeight: 600, color: accent, background: hexAlpha(accent, 0.1), padding: "6px 12px", borderRadius: 8 }}>
            {filteredCustomers.length} cliente(s) no radar
          </div>
        </div>
      </div>

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.8fr 1fr 1.2fr 2fr 1fr",
            padding: "12px 14px",
            fontSize: 11,
            color: subtext,
            fontWeight: 700,
            borderBottom: `1px solid ${border}`,
            textTransform: "uppercase"
          }}
        >
          <div>Cliente / Telefone</div>
          <div>Saldo Cashback</div>
          <div>Contagem Regressiva</div>
          <div>Prévia da Mensagem</div>
          <div style={{ textAlign: "right" }}>Ação WhatsApp</div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: subtext, fontSize: 13 }}>
            Nenhum cliente encontrado no radar com os critérios de filtro selecionados.
          </div>
        ) : (
          filteredCustomers.map((c, i) => {
            const expDateRaw = c.cashbackExpirationDate || c.cashback_expiration_date || c.cashbackExpiry || c.cashback_expiry;
            const expDateFormatted = expDateRaw 
              ? new Date(expDateRaw).toLocaleDateString('pt-BR') 
              : 'Sem data';
            
            const remainingDays = getRemainingDays(c);

            return (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 1fr 1.2fr 2fr 1fr",
                  padding: "12px 14px",
                  fontSize: 13,
                  alignItems: "center",
                  borderBottom:
                    i < filteredCustomers.length - 1
                      ? `1px solid ${border}`
                      : "none"
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: text }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: subtext }}>{c.phone || 'Sem telefone'}</div>
                </div>

                {editingId === c.id ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      type="number"
                      style={{ ...inputStyle(border, text), width: 80 }}
                    />
                    <button
                      onClick={() => saveEdit(c.id)}
                      style={{
                        background: accent,
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 8px",
                        cursor: "pointer"
                      }}
                    >
                      <Check size={12} color="#fff" />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontWeight: 800, color: accent }}>
                      {money(c.cashback)}
                    </span>
                    <button
                      onClick={() => startEdit(c)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      title="Editar saldo"
                    >
                      <Edit2 size={12} color={subtext} />
                    </button>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: remainingDays !== null && remainingDays <= 5 ? DANGER : text }}>
                    {remainingDays !== null ? `${remainingDays} dia(s) restantes` : 'Sem prazo'}
                  </div>
                  <div style={{ fontSize: 10, color: subtext }}>Vence em: {expDateFormatted}</div>
                </div>

                <div
                  style={{
                    color: subtext,
                    fontSize: 11,
                    background: hexAlpha(border, 0.3),
                    padding: "8px 10px",
                    borderRadius: 6,
                    fontStyle: "italic"
                  }}
                >
                  "{getRenderedMessage(c)}"
                </div>

                <div style={{ textAlign: "right" }}>
                  <button
                    onClick={() => handleSendWhatsAppMessage(c)}
                    style={{
                      background: "#25D366",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}
                    title="Disparar mensagem no WhatsApp"
                  >
                    <MessageCircle size={14} /> Enviar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export { Cashback };