
// @ts-nocheck

import React, { useEffect, useMemo, useState } from "react";

import {
  Percent,
  MessageCircle,
  Save,
  Filter,
  Edit2,
  Check
} from "lucide-react";

import {
  FONT_BODY,
  FONT_DISPLAY,
  DANGER
} from "../data/constants";

import {
  money,
  inputStyle,
  hexAlpha
} from "../utils/helpers";

import {
  SectionTitle
} from "../components/common";

/**
 * Adiciona cashback ao cliente.
 * A validade é definida pela configuração do PDV.
 */
export const applyCashback = (
  customers,
  setCustomers,
  customerId,
  saleTotal,
  cashbackPct,
  validityDays = 30
) => {
  if (!customerId || !saleTotal || saleTotal <= 0) return;

  const earned = (saleTotal * (cashbackPct || 0)) / 100;

  const expDate = new Date();
  expDate.setDate(expDate.getDate() + (validityDays || 30));

  const expDateStr = [
    expDate.getFullYear(),
    String(expDate.getMonth() + 1).padStart(2, "0"),
    String(expDate.getDate()).padStart(2, "0")
  ].join("-");

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

/**
 * Converte uma data de vencimento para uma data local.
 * Evita problemas de fuso horário com datas SQL.
 */
const parseExpirationDate = (value) => {
  if (!value) return null;

  const raw = String(value).trim();

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  let date;

  if (match) {
    date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );
  } else {
    date = new Date(raw);
  }

  if (Number.isNaN(date.getTime())) return null;

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
};

/**
 * Calcula a diferença entre duas datas de calendário.
 * Não depende de arredondamentos de milissegundos
 * nem sofre alterações por horário de verão.
 */
const calculateCalendarDays = (expirationDate, currentDate) => {
  const expirationUTC = Date.UTC(
    expirationDate.getFullYear(),
    expirationDate.getMonth(),
    expirationDate.getDate()
  );

  const currentUTC = Date.UTC(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );

  return Math.round(
    (expirationUTC - currentUTC) / 86400000
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
    "Oi {nome}, você tem {saldo} em cashback te esperando na nossa loja! Aproveite antes de vencer em {vencimento}. 🎁"
  );

  const [validityFilterDays, setValidityFilterDays] = useState("all");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [sendingWhatsAppId, setSendingWhatsAppId] = useState(null);

  // Atualiza a contagem regressiva a cada minuto.
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:3333"
  )
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

  /**
   * Carrega as configurações de cashback.
   */
  useEffect(() => {
    const loadCashbackConfig = async () => {
      try {
        const token = localStorage.getItem("byse_token");

        if (!token) {
          throw new Error("Sessão não encontrada. Faça login novamente.");
        }

        const response = await fetch(`${API_URL}/api/pdv/config`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(
            `Falha ao carregar configurações (${response.status}).`
          );
        }

        const data = await response.json();

        setCashbackPct(Number(data.cashbackPercentage ?? 0));

        const loadedDays = Math.max(
          1,
          Math.min(
            3650,
            Math.floor(Number(data.cashbackValidityDays ?? 30) || 30)
          )
        );

        setCashbackValidityDays(loadedDays);
        setValidityFilterDays("all");

        if (data.cashbackMessage) {
          setCashbackMessage(data.cashbackMessage);
        }
      } catch (err) {
        console.error("Erro ao carregar config de cashback:", err);
      }
    };

    loadCashbackConfig();
  }, []);

  /**
   * Salva as configurações no backend.
   */
  const saveConfigToBackend = async () => {
    setIsSavingConfig(true);

    try {
      const token = localStorage.getItem("byse_token");

      if (!token) {
        throw new Error("Sua sessão expirou. Entre novamente no sistema.");
      }

      const configuredDays = Math.max(
        1,
        Math.min(
          3650,
          Math.floor(Number(cashbackValidityDays) || 30)
        )
      );

      const config = {
        cashbackPercentage: Number(cashbackPct) || 0,
        cashbackValidityDays: configuredDays,
        cashbackMessage
      };

      const response = await fetch(`${API_URL}/api/pdv/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-id": (() => {
            try {
              const user = JSON.parse(
                localStorage.getItem("byse_user") || "{}"
              );

              return String(
                user.id || localStorage.getItem("userId") || ""
              );
            } catch {
              return String(localStorage.getItem("userId") || "");
            }
          })()
        },
        body: JSON.stringify(config)
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok || responseData.success === false) {
        throw new Error(
          responseData.error ||
          responseData.message ||
          `Falha ao salvar configurações (${response.status}).`
        );
      }

      window.dispatchEvent(
        new CustomEvent("byse:cashback-config-updated", {
          detail: config
        })
      );

      setCashbackValidityDays(configuredDays);
      setValidityFilterDays("all");

      alert(
        `Configurações salvas! O PDV utilizará ${configuredDays} dia(s) de validade nas próximas vendas.`
      );
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      alert(err.message || "Erro ao salvar configurações.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  /**
   * Edição manual do saldo.
   */
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

  /**
   * Obtém a data de vencimento do cliente.
   */
  const getExpirationDate = (c) => {
    const raw =
      c.cashbackExpirationDate ||
      c.cashback_expiration_date ||
      c.cashbackExpiry ||
      c.cashback_expiry;

    return parseExpirationDate(raw);
  };

  /**
   * Retorna os dias de calendário restantes.
   *
   * Exemplos:
   * 30 = vence daqui a 30 dias.
   * 15 = vence daqui a 15 dias.
   * 0 = vence hoje.
   * -1 = já venceu.
   */
  const getRemainingDays = (c) => {
    const expDate = getExpirationDate(c);

    if (!expDate) return null;

    return calculateCalendarDays(
      expDate,
      currentTime
    );
  };

  /**
   * Verifica se o cashback ainda está válido.
   *
   * O cliente continua aparecendo durante
   * todo o último dia de validade.
   */
  const isCashbackValid = (c) => {
    const expDate = getExpirationDate(c);

    if (!expDate) return false;

    const expirationEnd = new Date(expDate);

    expirationEnd.setHours(23, 59, 59, 999);

    return currentTime.getTime() <= expirationEnd.getTime();
  };

  /**
   * Calcula a contagem regressiva do último dia.
   *
   * Exemplo:
   * Faltam 2 horas e 15 minutos.
   * Faltam 45 minutos.
   * Faltam 10 minutos.
   */
  const getLastDayCountdown = (c) => {
    const expDate = getExpirationDate(c);

    if (!expDate) return null;

    const expirationEnd = new Date(expDate);

    expirationEnd.setHours(23, 59, 59, 999);

    const difference =
      expirationEnd.getTime() - currentTime.getTime();

    if (difference <= 0) {
      return "Vencido";
    }

    const totalMinutes = Math.ceil(
      difference / 60000
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `Faltam ${hours}h ${minutes}min`;
    }

    return `Faltam ${minutes}min`;
  };

  /**
   * Validade configurada.
   */
  const configuredDays = Math.max(
    1,
    Math.min(
      3650,
      Math.floor(Number(cashbackValidityDays) || 30)
    )
  );

  /**
   * Opções do radar.
   */
  const validityFilterOptions = Array.from(
    new Set([
      15,
      configuredDays,
      configuredDays * 2,
      configuredDays * 3
    ])
  ).sort((a, b) => a - b);

  /**
   * CORREÇÃO PRINCIPAL:
   *
   * Os filtros agora funcionam por FAIXAS.
   *
   * 15 dias: de 0 até 15 dias.
   * 30 dias: de 16 até 30 dias.
   * 90 dias: de 31 até 90 dias.
   * 180 dias: de 91 até 180 dias.
   *
   * Quando o cliente entra na faixa seguinte,
   * ele deixa automaticamente a faixa anterior.
   *
   * O cliente permanece no último dia até 23:59.
   */
  const filteredCustomers = useMemo(() => {
    const activeCustomers = customers.filter((c) => {
      const balance = Number(
        c.cashback ??
        c.cashback_balance ??
        c.saldoCashback ??
        c.saldo ??
        0
      );

      return balance > 0;
    });

    // Exibe todos os clientes com saldo positivo.
    if (validityFilterDays === "all") {
      return activeCustomers;
    }

    const selectedDays = Number(validityFilterDays);

    if (
      !Number.isFinite(selectedDays) ||
      selectedDays <= 0
    ) {
      return activeCustomers;
    }

    // Identifica o limite inferior da faixa.
    const previousLimits = validityFilterOptions.filter(
      (days) => days < selectedDays
    );

    const previousLimit =
      previousLimits.length > 0
        ? Math.max(...previousLimits)
        : 0;

    return activeCustomers.filter((c) => {
      const remaining = getRemainingDays(c);

      // Sem data ou já vencido: não entra no radar.
      if (remaining === null || remaining < 0) {
        return false;
      }

      // Garante que o cashback permaneça válido.
      if (!isCashbackValid(c)) {
        return false;
      }

      // Faixa superior inclusiva.
      const isBelowUpperLimit = remaining <= selectedDays;

      // Faixa inferior exclusiva.
      const isAbovePreviousLimit = remaining > previousLimit;

      return isBelowUpperLimit && isAbovePreviousLimit;
    });
  }, [
    customers,
    validityFilterDays,
    validityFilterOptions,
    currentTime
  ]);

  /**
   * Mensagem personalizada do WhatsApp.
   */
  const getRenderedMessage = (c) => {
    const saldoValor =
      c.cashback ??
      c.cashback_balance ??
      c.saldoCashback ??
      c.saldo ??
      0;

    const expDate = getExpirationDate(c);

    const vencimentoFormatado = expDate
      ? expDate.toLocaleDateString("pt-BR")
      : "breve";

    return cashbackMessage
      .replace(/{nome}/g, c.name || "Cliente")
      .replace(/{saldo}/g, money(saldoValor))
      .replace(/{vencimento}/g, vencimentoFormatado);
  };

  /**
   * Envio de WhatsApp.
   */
  const handleSendWhatsAppMessage = async (c) => {
    if (!c?.phone) {
      alert("Este cliente não possui telefone cadastrado.");
      return;
    }

    const telefoneLimpo = String(c.phone).replace(/\D/g, "");

    if (
      telefoneLimpo.length < 10 ||
      telefoneLimpo.length > 13
    ) {
      alert("Número de telefone inválido.");
      return;
    }

    const token = localStorage.getItem("byse_token");

    if (!token) {
      alert("Sua sessão expirou. Entre novamente no sistema.");
      return;
    }

    setSendingWhatsAppId(c.id);

    try {
      const response = await fetch(
        `${API_URL}/api/whatsapp/send-single`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-user-id": (() => {
              try {
                const user = JSON.parse(
                  localStorage.getItem("byse_user") || "{}"
                );

                return (
                  user.id ||
                  localStorage.getItem("userId") ||
                  "user_1"
                );
              } catch {
                return (
                  localStorage.getItem("userId") ||
                  "user_1"
                );
              }
            })()
          },
          body: JSON.stringify({
            phone: telefoneLimpo,
            text: getRenderedMessage(c)
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
          "Não foi possível enviar a mensagem pelo WhatsApp."
        );
      }

      alert(
        data.message ||
        `Mensagem enviada para ${c.name || "o cliente"} pelo WhatsApp.`
      );
    } catch (error) {
      console.error(
        "Erro ao enviar mensagem de cashback pelo WhatsApp:",
        error
      );

      alert(
        error.message ||
        "Falha ao enviar a mensagem. Verifique se o WhatsApp está conectado no módulo WhatsApp."
      );
    } finally {
      setSendingWhatsAppId(null);
    }
  };

  return (
    <div className="cashback-shell">

      <style>{`
        .cashback-shell {
          width: 100%;
          min-width: 0;
        }

        .cashback-config-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(min(100%, 300px), 1fr)
          );
          gap: 16px;
          margin-bottom: 24px;
        }

        .cashback-panel {
          min-width: 0;
          box-shadow: 0 8px 24px rgba(0,0,0,.045);
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .cashback-panel:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0,0,0,.08);
        }

        .cashback-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .cashback-table {
          width: 100%;
          overflow: hidden;
        }

        .cashback-table-head,
        .cashback-customer-row {
          display: grid;
          grid-template-columns: 1.8fr 1fr 1.2fr 2fr 1fr;
          gap: 12px;
        }

        .cashback-customer-row > div {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        @media (max-width: 760px) {
          .cashback-table-head {
            display: none !important;
          }

          .cashback-customer-row {
            display: grid !important;
            grid-template-columns: minmax(0,1fr) minmax(0,1fr) !important;
            gap: 12px !important;
            padding: 14px !important;
          }

          .cashback-customer-row > div:nth-child(1) {
            grid-column: 1/-1;
          }

          .cashback-customer-row > div:nth-child(4) {
            grid-column: 1/-1;
          }

          .cashback-customer-row > div:nth-child(5) {
            grid-column: 1/-1;
            text-align: left !important;
          }

          .cashback-customer-row > div:nth-child(5) button {
            width: 100%;
            justify-content: center;
          }

          .cashback-filter-bar {
            align-items: stretch;
          }

          .cashback-filter-controls {
            width: 100%;
            display: grid !important;
            grid-template-columns: 1fr;
          }

          .cashback-filter-controls select {
            width: 100%;
          }
        }

        @media (max-width: 420px) {
          .cashback-customer-row {
            grid-template-columns: 1fr !important;
          }

          .cashback-customer-row > div:nth-child(1),
          .cashback-customer-row > div:nth-child(4),
          .cashback-customer-row > div:nth-child(5) {
            grid-column: 1;
          }
        }
      `}</style>

      <SectionTitle
        title="Gestão de Cashback e Fidelidade"
        sub={`Configure o percentual e a validade de ${configuredDays} dia(s); o PDV aplicará essa regra automaticamente nas próximas vendas.`}
        subtext={subtext}
      />

      {/* CONFIGURAÇÕES */}

      <div className="cashback-config-grid">

        <div
          className="cashback-panel"
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 18
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 12,
              color: text,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <Percent size={16} color={accent} />
            Regras de Acúmulo
          </div>

          <label style={{ fontSize: 12, color: subtext }}>
            Porcentagem de cashback por compra (%)
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 6,
              marginBottom: 14
            }}
          >
            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={cashbackPct}
              onChange={(e) =>
                setCashbackPct(parseFloat(e.target.value))
              }
              style={{
                flex: 1,
                accentColor: accent
              }}
            />

            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={cashbackPct}
              onChange={(e) =>
                setCashbackPct(parseFloat(e.target.value) || 0)
              }
              style={{
                ...inputStyle(border, text),
                width: 70,
                textAlign: "center",
                fontWeight: "bold"
              }}
            />

            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 18,
                color: accent,
                minWidth: 20
              }}
            >
              %
            </div>
          </div>

          <label style={{ fontSize: 12, color: subtext }}>
            Validade Padrão Pós-Venda (Dias)
          </label>

          <input
            type="number"
            min="1"
            max="3650"
            value={cashbackValidityDays ?? ""}
            onChange={(e) =>
              setCashbackValidityDays(
                e.target.value === ""
                  ? ""
                  : Math.max(
                      1,
                      Math.min(
                        3650,
                        parseInt(e.target.value, 10) || 1
                      )
                    )
              )
            }
            style={{
              ...inputStyle(border, text),
              width: "100%",
              marginTop: 6
            }}
          />

          <div
            style={{
              fontSize: 11,
              color: subtext,
              marginTop: 7
            }}
          >
            Exemplo: {configuredDays} dias cadastrados aqui serão
            usados automaticamente em cada venda feita no PDV.
          </div>
        </div>

        {/* MENSAGEM WHATSAPP */}

        <div
          className="cashback-panel"
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 18,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 8,
              color: text,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <MessageCircle size={16} color={accent} />
            Edição da Mensagem de WhatsApp
          </div>

          <label
            style={{
              fontSize: 11,
              color: subtext,
              marginBottom: 6
            }}
          >
            Variáveis disponíveis:{" "}
            <code style={{ color: accent }}>{"{nome}"}</code>,{" "}
            <code style={{ color: accent }}>{"{saldo}"}</code>,{" "}
            <code style={{ color: accent }}>{"{vencimento}"}</code>
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
            <Save size={14} />
            {isSavingConfig ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>

      </div>

      {/* RADAR DE VENCIMENTO */}

      <div
        className="cashback-filter-bar"
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 16
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
        >
          <Filter size={18} color={accent} />

          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: text
              }}
            >
              Radar de Cashback (Filtro por Vencimento)
            </div>

            <div style={{ fontSize: 11, color: subtext }}>
              Cada faixa acompanha os clientes até o vencimento,
              transferindo-os automaticamente para a próxima faixa.
            </div>
          </div>
        </div>

        <div
          className="cashback-filter-controls"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <select
            value={validityFilterDays}
            onChange={(e) =>
              setValidityFilterDays(e.target.value)
            }
            style={{
              ...inputStyle(border, text),
              backgroundColor: card,
              color: text,
              padding: "8px 12px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <option value="all">
              Todos com saldo ativo
            </option>

            {validityFilterOptions.map((days) => {
              const previous = validityFilterOptions
                .filter((value) => value < days)
                .reduce((max, value) => Math.max(max, value), 0);

              return (
                <option
                  key={days}
                  value={String(days)}
                >
                  {previous === 0
                    ? `Vencem em até ${days} dias`
                    : `Vencem de ${previous + 1} a ${days} dias`}
                </option>
              );
            })}
          </select>

          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: accent,
              background: hexAlpha(accent, 0.1),
              padding: "6px 12px",
              borderRadius: 8,
              whiteSpace: "nowrap"
            }}
          >
            {filteredCustomers.length} cliente(s) no radar
          </div>
        </div>
      </div>

      {/* TABELA */}

      <div
        className="cashback-table"
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          overflow: "hidden"
        }}
      >

        <div
          className="cashback-table-head"
          style={{
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
          <div style={{ textAlign: "right" }}>
            Ação WhatsApp
          </div>
        </div>

        {filteredCustomers.length === 0 ? (

          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: subtext,
              fontSize: 13
            }}
          >
            Nenhum cliente encontrado no radar com os critérios de filtro selecionados.
          </div>

        ) : (

          filteredCustomers.map((c, i) => {
            const expDate = getExpirationDate(c);
            const remainingDays = getRemainingDays(c);

            const expDateFormatted = expDate
              ? expDate.toLocaleDateString("pt-BR")
              : "Sem data";

            const isLastDay = remainingDays === 0;

            const countdown = isLastDay
              ? getLastDayCountdown(c)
              : null;

            return (
              <div
                key={c.id}
                className="cashback-customer-row"
                style={{
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

                {/* CLIENTE */}

                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: text
                    }}
                  >
                    {c.name}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: subtext
                    }}
                  >
                    {c.phone || "Sem telefone"}
                  </div>
                </div>

                {/* SALDO */}

                {editingId === c.id ? (

                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center"
                    }}
                  >
                    <input
                      value={editValue}
                      onChange={(e) =>
                        setEditValue(e.target.value)
                      }
                      type="number"
                      style={{
                        ...inputStyle(border, text),
                        width: 80
                      }}
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

                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center"
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 800,
                        color: accent
                      }}
                    >
                      {money(c.cashback)}
                    </span>

                    <button
                      onClick={() => startEdit(c)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0
                      }}
                      title="Editar saldo"
                    >
                      <Edit2 size={12} color={subtext} />
                    </button>
                  </div>

                )}

                {/* CONTAGEM REGRESSIVA */}

                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        remainingDays !== null &&
                        remainingDays <= 5
                          ? DANGER
                          : text
                    }}
                  >
                    {remainingDays === null
                      ? "Sem prazo"
                      : isLastDay
                        ? countdown
                        : `${remainingDays} dia(s) restantes`}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: subtext
                    }}
                  >
                    Vence em: {expDateFormatted}
                  </div>
                </div>

                {/* MENSAGEM */}

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

                {/* WHATSAPP */}

                <div style={{ textAlign: "right" }}>
                  <button
                    onClick={() =>
                      handleSendWhatsAppMessage(c)
                    }
                    disabled={sendingWhatsAppId === c.id}
                    style={{
                      background: "#25D366",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor:
                        sendingWhatsAppId === c.id
                          ? "wait"
                          : "pointer",
                      opacity:
                        sendingWhatsAppId === c.id
                          ? 0.7
                          : 1,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}
                    title="Disparar mensagem no WhatsApp"
                  >
                    <MessageCircle size={14} />

                    {sendingWhatsAppId === c.id
                      ? "Enviando..."
                      : "Enviar"}
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
