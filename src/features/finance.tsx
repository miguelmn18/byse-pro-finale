// @ts-nocheck
import React, { useEffect, useState } from "react";
import { FONT_DISPLAY, SUCCESS, DANGER, MONTH_NAMES } from "../data/constants";
import { money, inputStyle } from "../utils/helpers";
import { SectionTitle } from "../components/common";

function DRE({ sales = [], card, border, subtext, accent, text }) {
  const year = new Date().getFullYear();
  const [selMonth, setSelMonth] = useState(new Date().getMonth());
  const [editingRevenue, setEditingRevenue] = useState(false);
  const [revenueAdjustmentDraft, setRevenueAdjustmentDraft] = useState("");

  const blank = () => ({
    produtos: "",
    imposto: "",
    gastosFixos: "",
    gastosVR: "",
    ajusteFaturamento: "",
  });

  const [entries, setEntries] = useState(Array.from({ length: 12 }, blank));
  const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:3333"
  )
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("byse_token") || ""}`,
  });

  const [stateLoaded, setStateLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`${API_URL}/api/app-state/finance`, {
          headers: authHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Falha ao carregar dados financeiros (${response.status})`);
        }

        const data = await response.json();

        if (!cancelled) {
          if (Array.isArray(data.entries) && data.entries.length === 12) {
            // Mantém compatibilidade com dados antigos sem ajusteFaturamento.
            const normalizedEntries = data.entries.map((entry) => ({
              ...blank(),
              ...entry,
              ajusteFaturamento: entry.ajusteFaturamento ?? "",
            }));
            setEntries(normalizedEntries);
          }
          setStateLoaded(true);
        }
      } catch (error) {
        console.error("Erro ao carregar dados financeiros:", error);
        // Não habilita o salvamento automático se a leitura falhar,
        // para não sobrescrever os dados existentes com valores vazios.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!stateLoaded || entries.length !== 12) return;

    const controller = new AbortController();

    fetch(`${API_URL}/api/app-state/finance`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ entries }),
      signal: controller.signal,
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Falha ao salvar dados financeiros (${response.status})`);
      }
    }).catch((error) => {
      if (error.name !== "AbortError") {
        console.error("Erro ao salvar dados financeiros:", error);
      }
    });

    return () => controller.abort();
  }, [entries]);

  const isAllYear = selMonth === -1;

  // Faturamento-base calculado a partir das vendas reais do PDV no ano atual.
  const realRevByMonth = Array(12).fill(0);

  (Array.isArray(sales) ? sales : []).forEach((sale) => {
    const date = new Date(sale.date);
    if (!Number.isNaN(date.getTime()) && date.getFullYear() === year) {
      realRevByMonth[date.getMonth()] += Number(sale.total) || 0;
    }
  });

  const realTotalYearRev = realRevByMonth.reduce((total, value) => total + value, 0);

  const ajusteFaturamento = isAllYear
    ? entries.reduce(
        (total, entry) => total + (Number(entry.ajusteFaturamento) || 0),
        0,
      )
    : Number(entries[selMonth]?.ajusteFaturamento) || 0;

  const faturamentoBase = isAllYear
    ? realTotalYearRev
    : realRevByMonth[selMonth];

  const faturamento = faturamentoBase + ajusteFaturamento;

  const sumField = (key) =>
    isAllYear
      ? entries.reduce((total, entry) => total + (parseFloat(entry[key]) || 0), 0)
      : parseFloat(entries[selMonth]?.[key]) || 0;

  const produtos = sumField("produtos");
  const imposto = sumField("imposto");
  const gastosFixos = sumField("gastosFixos");
  const gastosVR = sumField("gastosVR");

  const lucro = faturamento - produtos - imposto - gastosFixos - gastosVR;
  const pct = (value) =>
    faturamento > 0 ? `${((value / faturamento) * 100).toFixed(1)}%` : "—";

  const updateEntry = (key, value) => {
    if (isAllYear) return;

    setEntries((previous) =>
      previous.map((entry, index) =>
        index === selMonth ? { ...entry, [key]: value } : entry,
      ),
    );
  };

  const startEditingRevenue = () => {
    setRevenueAdjustmentDraft(
      String(entries[selMonth]?.ajusteFaturamento ?? ""),
    );
    setEditingRevenue(true);
  };

  const saveRevenueAdjustment = () => {
    const trimmedValue = revenueAdjustmentDraft.trim();
    const adjustment = trimmedValue === "" ? 0 : Number(trimmedValue);

    if (!Number.isFinite(adjustment)) {
      alert("Informe um valor válido para o ajuste do faturamento.");
      return;
    }

    updateEntry("ajusteFaturamento", String(adjustment));
    setEditingRevenue(false);
  };

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(110px, 1.4fr) minmax(0, 1fr) minmax(35px, 0.6fr)",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: `1px solid ${border}`,
    gap: 10,
  };

  return (
    <div>
      <SectionTitle
        title="DRE"
        sub="Demonstração de resultado (faturamento automático via PDV)"
        subtext={subtext}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 6,
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setSelMonth(-1);
            setEditingRevenue(false);
          }}
          style={{
            padding: "9px 4px",
            borderRadius: 8,
            border: `1px solid ${isAllYear ? accent : border}`,
            background: isAllYear ? accent : "transparent",
            color: isAllYear ? "#fff" : text,
            fontSize: 11.5,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Ano todo
        </button>

        {MONTH_NAMES.map((month, index) => (
          <button
            type="button"
            key={index}
            onClick={() => {
              setSelMonth(index);
              setEditingRevenue(false);
            }}
            style={{
              padding: "9px 4px",
              borderRadius: 8,
              border: `1px solid ${selMonth === index ? accent : border}`,
              background: selMonth === index ? accent : "transparent",
              color: selMonth === index ? "#fff" : text,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {month.slice(0, 3)}
          </button>
        ))}
      </div>

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: 18,
        }}
      >
        <div style={rowStyle}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Faturamento</span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 8,
              flexWrap: "wrap",
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: accent,
                overflowWrap: "anywhere",
              }}
            >
              {money(faturamento)}
            </span>

            {!editingRevenue ? (
              <button
                type="button"
                disabled={isAllYear}
                onClick={startEditingRevenue}
                title={isAllYear ? "Selecione um mês para editar o ajuste" : "Editar ajuste do faturamento"}
                style={{
                  border: `1px solid ${border}`,
                  background: "transparent",
                  color: text,
                  borderRadius: 7,
                  padding: "6px 9px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isAllYear ? "not-allowed" : "pointer",
                  opacity: isAllYear ? 0.5 : 1,
                }}
              >
                Editar
              </button>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="number"
                  step="0.01"
                  value={revenueAdjustmentDraft}
                  onChange={(event) => setRevenueAdjustmentDraft(event.target.value)}
                  placeholder="+500 ou -200"
                  aria-label="Ajuste do faturamento em reais"
                  style={{
                    ...inputStyle(border, text),
                    width: 130,
                    maxWidth: "100%",
                  }}
                />

                <button
                  type="button"
                  onClick={saveRevenueAdjustment}
                  style={{
                    background: accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: 7,
                    padding: "7px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Salvar
                </button>

                <button
                  type="button"
                  onClick={() => setEditingRevenue(false)}
                  style={{
                    background: "transparent",
                    color: text,
                    border: `1px solid ${border}`,
                    borderRadius: 7,
                    padding: "7px 10px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              textAlign: "right",
            }}
          >
            100%
          </span>
        </div>

        {ajusteFaturamento !== 0 && (
          <div
            style={{
              fontSize: 12,
              color: subtext,
              padding: "0 0 10px",
            }}
          >
            Faturamento original: {money(faturamentoBase)} · Ajuste:{" "}
            <span
              style={{
                color: ajusteFaturamento > 0 ? SUCCESS : DANGER,
                fontWeight: 700,
              }}
            >
              {ajusteFaturamento > 0 ? "+" : ""}
              {money(ajusteFaturamento)}
            </span>
          </div>
        )}

        {[
          { key: "produtos", label: "Produtos" },
          { key: "imposto", label: "Imposto" },
          { key: "gastosFixos", label: "Gastos Fixos" },
          { key: "gastosVR", label: "Gastos VR" },
        ].map((field) => (
          <div key={field.key} style={rowStyle}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{field.label}</span>

            <input
              type="number"
              disabled={isAllYear}
              placeholder="R$ 0,00"
              value={isAllYear ? "" : entries[selMonth]?.[field.key] ?? ""}
              onChange={(event) => updateEntry(field.key, event.target.value)}
              style={{
                ...inputStyle(border, text),
                width: "100%",
                minWidth: 0,
                opacity: isAllYear ? 0.5 : 1,
              }}
            />

            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: subtext,
                textAlign: "right",
              }}
            >
              {pct(sumField(field.key))}
            </span>
          </div>
        ))}

        <div style={{ ...rowStyle, borderBottom: "none", marginTop: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>Lucro</span>

          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 20,
              color: lucro >= 0 ? SUCCESS : DANGER,
            }}
          >
            {money(lucro)}
          </span>

          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: lucro >= 0 ? SUCCESS : DANGER,
              textAlign: "right",
            }}
          >
            {pct(lucro)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Planos({ card, border, subtext, accent, text }) {
  const plans = [
    { name: "Mensal", price: 59.99, per: null, note: null },
    { name: "Semestral", price: 297.0, per: 49.59, note: "6x de" },
    { name: "Anual", price: 467.0, per: 38.9, note: "12x de", best: true },
  ];

  return (
    <div>
      <SectionTitle title="Planos" sub="Modelo de assinatura" subtext={subtext} />

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {plans.map((plan) => (
          <div
            key={plan.name}
            style={{
              background: card,
              border: plan.best ? `2px solid ${accent}` : `1px solid ${border}`,
              borderRadius: 14,
              padding: 22,
              flex: 1,
              minWidth: 200,
              position: "relative",
            }}
          >
            {plan.best && (
              <div
                style={{
                  position: "absolute",
                  top: -11,
                  left: 16,
                  background: accent,
                  color: "#fff",
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 20,
                }}
              >
                MAIS ECONÔMICO
              </div>
            )}

            <div style={{ fontWeight: 700, fontSize: 14, color: subtext }}>
              {plan.name}
            </div>

            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 30,
                margin: "8px 0 2px 0",
              }}
            >
              {money(plan.price)}
            </div>

            {plan.per ? (
              <div
                style={{
                  fontSize: 12,
                  color: DANGER,
                  marginBottom: 16,
                  fontWeight: 700,
                }}
              >
                {plan.note} {money(plan.per)} /mês
              </div>
            ) : (
              <div style={{ height: 26 }} />
            )}

            <button
              type="button"
              style={{
                width: "100%",
                background: plan.best ? accent : "transparent",
                color: plan.best ? "#fff" : text,
                border: plan.best ? "none" : `1px solid ${border}`,
                borderRadius: 8,
                padding: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Assinar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export { DRE, Planos };
