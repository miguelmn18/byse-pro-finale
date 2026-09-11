// @ts-nocheck
import React, { useEffect, useState } from "react";
import { FONT_DISPLAY, SUCCESS, DANGER, MONTH_NAMES } from "../data/constants";
import { money, inputStyle } from "../utils/helpers";
import { SectionTitle } from "../components/common";

function DRE({ sales, card, border, subtext, accent, text }) {
  const year = new Date().getFullYear();
  const [selMonth, setSelMonth] = useState(new Date().getMonth());

  const blank = () => ({
    produtos: "",
    imposto: "",
    gastosFixos: "",
    gastosVR: ""
  });

  const [entries, setEntries] = useState(
    Array.from({ length: 12 }, blank)
  );
  const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3333").replace(/\/$/, "");
  const authHeaders = () => ({ "Content-Type":"application/json", "Authorization":`Bearer ${localStorage.getItem("byse_token")||""}` });
  const [stateLoaded, setStateLoaded] = useState(false);
  useEffect(() => { (async()=>{ try { const r=await fetch(`${API_URL}/api/app-state/finance`,{headers:authHeaders()}); if(r.ok){const d=await r.json(); if(Array.isArray(d.entries)&&d.entries.length===12)setEntries(d.entries); setStateLoaded(true);} } catch(e){console.error(e);} })(); }, []);
  useEffect(() => { if(stateLoaded && entries.length===12) fetch(`${API_URL}/api/app-state/finance`,{method:"PUT",headers:authHeaders(),body:JSON.stringify({entries})}).catch(()=>{}); }, [entries]);

  const isAllYear = selMonth === -1;

  // Calculando o faturamento real direto das vendas reais do sistema[cite: 10]
  const realRevByMonth = Array(12).fill(0);
  sales.forEach((s) => {
    const d = new Date(s.date);
    if (!isNaN(d.getTime()) && d.getFullYear() === year) {
      realRevByMonth[d.getMonth()] += Number(s.total || 0);
    }
  });

  const realTotalYearRev = realRevByMonth.reduce((a, b) => a + b, 0);
  const faturamento = isAllYear ? realTotalYearRev : realRevByMonth[selMonth];

  const sumField = (key) =>
    isAllYear
      ? entries.reduce((s, e) => s + (parseFloat(e[key]) || 0), 0)
      : parseFloat(entries[selMonth][key]) || 0;

  const produtos = sumField("produtos");
  const imposto = sumField("imposto");
  const gastosFixos = sumField("gastosFixos");
  const gastosVR = sumField("gastosVR");

  const lucro = faturamento - produtos - imposto - gastosFixos - gastosVR;
  const pct = (v) => (faturamento > 0 ? `${((v / faturamento) * 100).toFixed(1)}%` : "—");

  const updateEntry = (key, val) => {
    if (isAllYear) return;
    setEntries((prev) =>
      prev.map((e, i) => (i === selMonth ? { ...e, [key]: val } : e))
    );
  };

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 0.6fr",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: `1px solid ${border}`,
    gap: 10
  };

  return (
    <div>
      <SectionTitle title="DRE" sub="Demonstração de resultado (Faturamento automático via PDV)" subtext={subtext} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 16 }}>
        <button
          onClick={() => setSelMonth(-1)}
          style={{
            padding: "9px 4px",
            borderRadius: 8,
            border: `1px solid ${isAllYear ? accent : border}`,
            background: isAllYear ? accent : "transparent",
            color: isAllYear ? "#fff" : text,
            fontSize: 11.5,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Ano todo
        </button>

        {MONTH_NAMES.map((m, i) => (
          <button
            key={i}
            onClick={() => setSelMonth(i)}
            style={{
              padding: "9px 4px",
              borderRadius: 8,
              border: `1px solid ${selMonth === i ? accent : border}`,
              background: selMonth === i ? accent : "transparent",
              color: selMonth === i ? "#fff" : text,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {m.slice(0, 3)}
          </button>
        ))}
      </div>

      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 18 }}>
        {/* Faturamento preenchido automaticamente pelas vendas do PDV[cite: 10] */}
        <div style={rowStyle}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Faturamento (PDV)</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: accent }}>{money(faturamento)}</span>
          <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right" }}>100%</span>
        </div>

        {[
          { key: "produtos", label: "Produtos" },
          { key: "imposto", label: "Imposto" },
          { key: "gastosFixos", label: "Gastos Fixos" },
          { key: "gastosVR", label: "Gastos VR" }
        ].map((f) => (
          <div key={f.key} style={rowStyle}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{f.label}</span>
            <input
              type="number"
              disabled={isAllYear}
              placeholder="R$ 0,00"
              value={isAllYear ? "" : entries[selMonth][f.key]}
              onChange={(e) => updateEntry(f.key, e.target.value)}
              style={{ ...inputStyle(border, text), width: "100%", opacity: isAllYear ? 0.5 : 1 }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: subtext, textAlign: "right" }}>
              {pct(sumField(f.key))}
            </span>
          </div>
        ))}

        <div style={{ ...rowStyle, borderBottom: "none", marginTop: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>Lucro</span>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: lucro >= 0 ? SUCCESS : DANGER }}>
            {money(lucro)}
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: lucro >= 0 ? SUCCESS : DANGER, textAlign: "right" }}>
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
    { name: "Semestral", price: 297.00, per: 49.59, note: "6x de" },
    { name: "Anual", price: 467.00, per: 38.90, note: "12x de", best: true }
  ];

  return (
    <div>
      <SectionTitle title="Planos" sub="Modelo de assinatura" subtext={subtext} />
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {plans.link || plans.map((p) => (
          <div key={p.name} style={{ background: card, border: p.best ? `2px solid ${accent}` : `1px solid ${border}`, borderRadius: 14, padding: 22, flex: 1, minWidth: 200, position: "relative" }}>
            {p.best && <div style={{ position: "absolute", top: -11, left: 16, background: accent, color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>MAIS ECONÔMICO</div>}
            <div style={{ fontWeight: 700, fontSize: 14, color: subtext }}>{p.name}</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, margin: "8px 0" }}>{money(p.price)}</div>
            <button style={{ width: "100%", marginTop: 16, background: p.best ? accent : "transparent", color: p.best ? "#fff" : text, border: p.best ? "none" : `1px solid ${border}`, borderRadius: 8, padding: "10px", fontWeight: 700, cursor: "pointer" }}>Assinar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export { DRE, Planos };