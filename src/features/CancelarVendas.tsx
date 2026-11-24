// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Search, CalendarDays, RefreshCw, Trash2, X, ShoppingBag, PackageCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateOf = (sale) => new Date(sale.date || sale.created_at || sale.createdAt || 0);
const saleId = (sale) => String(sale.id ?? sale.sale_id ?? "");

export function CancelarVendas({ sales = [], setSales, apiUrl, getAuthHeaders, card = "#18181b", border = "#303036", subtext = "#a1a1aa", accent = "#dc2626", text = "#f4f4f5", onCancelled }) {
  const [period, setPeriod] = useState("month");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const sortedSales = useMemo(() => [...sales].sort((a,b) => dateOf(b) - dateOf(a)), [sales]);
  const filtered = useMemo(() => {
    const now = new Date();
    return sortedSales.filter((sale) => {
      const date = dateOf(sale);
      const inMonth = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      const term = query.trim().toLowerCase();
      const matches = !term || [sale.customerName, sale.customer_name, sale.seller, sale.id, ...(sale.items || []).map(i => i.name || i.productName)].join(" ").toLowerCase().includes(term);
      return (period === "all" || inMonth) && matches;
    });
  }, [sortedSales, period, query]);

  const total = filtered.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const fmtDate = (d) => Number.isNaN(d.getTime()) ? "Data indisponível" : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  const cancelSale = async () => {
    if (!selected || busy) return;
    setBusy(true); setFeedback("");
    try {
      const response = await fetch(`${String(apiUrl || "").replace(/\/$/, "")}/sales/${encodeURIComponent(saleId(selected))}`, {
        method: "DELETE",
        headers: getAuthHeaders ? getAuthHeaders() : { Authorization: `Bearer ${localStorage.getItem("byse_token") || ""}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.error || "Não foi possível cancelar esta venda.");
      const next = sales.filter(s => saleId(s) !== saleId(selected));
      if (setSales) setSales(next);
      if (onCancelled) await onCancelled(next);
      setSelected(null); setConfirming(false);
      setFeedback("Venda cancelada. O valor foi removido dos indicadores e os itens com controle de estoque foram devolvidos.");
    } catch (error) {
      setFeedback(error.message || "Erro ao cancelar a venda.");
    } finally { setBusy(false); }
  };

  const panel = { background: card, border: `1px solid ${border}`, borderRadius: 16 };
  const button = (active) => ({ border: `1px solid ${active ? accent : border}`, background: active ? `${accent}18` : "transparent", color: active ? accent : text, borderRadius: 10, padding: "9px 13px", fontWeight: 700, cursor: "pointer" });

  return <div style={{ color: text, display: "grid", gap: 18, minWidth: 0 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
      <div><div style={{ fontSize: 25, fontWeight: 850, letterSpacing: "-0.7px" }}>Cancelar vendas</div><div style={{ color: subtext, fontSize: 13, marginTop: 5 }}>Consulte o histórico e estorne uma venda com segurança.</div></div>
      <button onClick={() => { setFeedback(""); }} style={{ ...button(false), display: "flex", alignItems: "center", gap: 7 }}><RefreshCw size={15}/> Atualizar visualização</button>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
      <div style={{ ...panel, padding: 16 }}><div style={{ color: subtext, fontSize: 12 }}>Vendas no período</div><div style={{ fontSize: 25, fontWeight: 850, marginTop: 7 }}>{filtered.length}</div></div>
      <div style={{ ...panel, padding: 16 }}><div style={{ color: subtext, fontSize: 12 }}>Valor das vendas listadas</div><div style={{ fontSize: 23, fontWeight: 850, marginTop: 7 }}>{money(total)}</div></div>
      <div style={{ ...panel, padding: 16 }}><div style={{ color: subtext, fontSize: 12 }}>Histórico total</div><div style={{ fontSize: 25, fontWeight: 850, marginTop: 7 }}>{sales.length}</div></div>
    </div>
    <div style={{ ...panel, padding: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 7 }}><button style={button(period === "month")} onClick={() => setPeriod("month")}><CalendarDays size={14} style={{ verticalAlign: "-2px", marginRight: 5 }}/>Este mês</button><button style={button(period === "all")} onClick={() => setPeriod("all")}><ShoppingBag size={14} style={{ verticalAlign: "-2px", marginRight: 5 }}/>Todas as vendas</button></div>
      <div style={{ position: "relative", flex: "1 1 220px", minWidth: 170 }}><Search size={16} color={subtext} style={{ position: "absolute", left: 12, top: 12 }}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar cliente, vendedor ou produto..." style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px 11px 37px", background: "transparent", border: `1px solid ${border}`, borderRadius: 10, color: text, outline: "none" }}/></div>
    </div>
    {feedback && <div role="status" style={{ padding: 12, borderRadius: 11, background: feedback.startsWith("Venda cancelada") ? "#16a34a18" : "#dc262618", color: feedback.startsWith("Venda cancelada") ? "#4ade80" : "#f87171", fontSize: 13 }}>{feedback}</div>}
    <div style={{ display: "grid", gap: 10 }}>
      {filtered.map((sale) => {
        const items = Array.isArray(sale.items) ? sale.items : [];
        return <button key={saleId(sale)} onClick={() => { setSelected(sale); setConfirming(false); }} style={{ ...panel, padding: 15, color: text, textAlign: "left", cursor: "pointer", display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, width: "100%" }}>
          <div style={{ minWidth: 0 }}><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><strong>{sale.customerName || sale.customer_name || "Cliente Geral"}</strong><span style={{ color: subtext, fontSize: 11 }}>#{saleId(sale).slice(-10)}</span></div><div style={{ color: subtext, fontSize: 12, marginTop: 5 }}>{fmtDate(dateOf(sale))} · {sale.seller || "Sem vendedor"} · {items.length} item(ns)</div><div style={{ color: subtext, fontSize: 12, marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{items.slice(0,3).map(i => `${i.qty || i.quantity || 1}x ${i.name || i.productName || "Produto"}`).join(" · ") || "Itens não detalhados"}</div></div>
          <div style={{ textAlign: "right", alignSelf: "center" }}><div style={{ fontWeight: 850, fontSize: 17 }}>{money(sale.total)}</div><div style={{ color: accent, fontSize: 11, fontWeight: 800, marginTop: 6 }}>VER VENDA →</div></div>
        </button>;
      })}
      {!filtered.length && <div style={{ ...panel, padding: 35, textAlign: "center", color: subtext }}>Nenhuma venda encontrada neste período.</div>}
    </div>

    {selected && <div onClick={() => !busy && setSelected(null)} style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 1200, display: "grid", placeItems: "center", padding: 14 }}>
      <div onClick={e => e.stopPropagation()} style={{ ...panel, width: "min(100%,520px)", maxHeight: "88vh", overflow: "auto", padding: 20, boxShadow: "0 20px 70px #0008" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div><div style={{ fontSize: 19, fontWeight: 850 }}>Detalhes da venda</div><div style={{ color: subtext, fontSize: 12, marginTop: 4 }}>{fmtDate(dateOf(selected))} · #{saleId(selected)}</div></div><button onClick={() => setSelected(null)} style={{ background: "transparent", border: 0, color: text, cursor: "pointer" }}><X/></button></div>
        <div style={{ margin: "18px 0", display: "grid", gap: 8 }}>{(selected.items || []).map((item, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: `1px solid ${border}` }}><div><div style={{ fontWeight: 700 }}>{item.name || item.productName || "Produto"}</div><div style={{ color: subtext, fontSize: 12 }}>{item.qty || item.quantity || 1} un. · {item.variationName || item.variation || "Sem variação"}</div></div><strong>{money(Number(item.price || 0) * Number(item.qty || item.quantity || 1))}</strong></div>)}</div>
        <div style={{ display: "flex", justifyContent: "space-between", color: subtext, fontSize: 13 }}><span>Desconto</span><span>{money(selected.discount)}</span></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, fontWeight: 900, marginTop: 10 }}><span>Total</span><span>{money(selected.total)}</span></div>
        {!confirming ? <button onClick={() => setConfirming(true)} style={{ width: "100%", marginTop: 20, border: 0, borderRadius: 11, background: accent, color: "white", padding: 13, fontWeight: 850, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Trash2 size={17}/> Cancelar esta venda</button> : <div style={{ marginTop: 18, padding: 13, borderRadius: 12, border: "1px solid #ef444466", background: "#ef444410" }}><div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800, color: "#f87171" }}><AlertTriangle size={18}/> Confirma o cancelamento?</div><p style={{ color: subtext, fontSize: 13, lineHeight: 1.5 }}>A venda será removida do histórico, o valor deixará de compor os indicadores e as quantidades dos produtos serão devolvidas ao estoque. Esta ação não pode ser desfeita.</p><div style={{ display: "flex", gap: 8 }}><button disabled={busy} onClick={() => setConfirming(false)} style={{ ...button(false), flex: 1 }}>Voltar</button><button disabled={busy} onClick={cancelSale} style={{ flex: 1, border: 0, borderRadius: 10, background: "#dc2626", color: "white", padding: 11, fontWeight: 850, cursor: busy ? "wait" : "pointer" }}>{busy ? "Cancelando..." : "Confirmar cancelamento"}</button></div></div>}
      </div>
    </div>}
  </div>;
}
