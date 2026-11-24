// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Instagram, Search, Send, Target, MessageCircle, Star, X, Plus } from "lucide-react";

const initialLeads = [
  { id: "ig-1001", name: "josefa", handle: "@josefa.fit", avatar: "MS", message: "Oi! Vi o anúncio de creatina. Qual o valor e vocês entregam?", time: "Agora", status: "novo", source: "Story patrocinado", interest: "Creatina" },
  { id: "ig-1002", name: "Rafael", handle: "@rafael.lima", avatar: "RL", message: "Estou pesquisando opções para começar a suplementar. Pode me orientar?", time: "12 min", status: "qualificado", source: "Direct orgânico", interest: "Iniciante" },
  { id: "ig-1003", name: "Alves", handle: "@Alvestreina", avatar: "CA", message: "Obrigada, mas por enquanto não vou comprar.", time: "35 min", status: "nutrir", source: "Reels", interest: "Whey protein" },
  { id: "ig-1004", name: "Bruno", handle: "@bruno", avatar: "BC", message: "Só queria saber se tem parceria gratuita.", time: "1 h", status: "descartar", source: "Direct orgânico", interest: "Parceria" },
];
const labels = { novo: "Novo contato", qualificado: "Qualificado", nutrir: "Nutrir", descartar: "Não captar" };
const colors = { novo: "#60a5fa", qualificado: "#4ade80", nutrir: "#fbbf24", descartar: "#f87171" };

export function CRM({ card = "#18181b", border = "#303036", subtext = "#a1a1aa", accent = "#dc2626", text = "#f4f4f5", userId = "guest" }) {
  const storageKey = `byse_crm_instagram_${userId || "guest"}`;
  const [leads, setLeads] = useState(() => {
    try { const saved = localStorage.getItem(storageKey); return saved ? JSON.parse(saved) : initialLeads; }
    catch { return initialLeads; }
  });
  const [active, setActive] = useState(initialLeads[0].id);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(leads)); } catch (error) { console.warn("Não foi possível salvar o CRM de demonstração.", error); } }, [leads, storageKey]);
  const current = leads.find(l => l.id === active) || leads[0];
  const filtered = useMemo(() => leads.filter(l => (filter === "todos" || l.status === filter) && `${l.name} ${l.handle} ${l.message} ${l.interest}`.toLowerCase().includes(search.toLowerCase())), [leads, filter, search]);
  const panel = { background: card, border: `1px solid ${border}`, borderRadius: 15 };
  const button = (on = false) => ({ border: `1px solid ${on ? accent : border}`, background: on ? `${accent}18` : "transparent", color: on ? accent : text, borderRadius: 9, padding: "8px 11px", fontWeight: 750, cursor: "pointer" });
  const classify = (id, status) => setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  const addLead = () => {
    if (!newName.trim() || !newMessage.trim()) return;
    const lead = { id: `demo-${Date.now()}`, name: newName.trim(), handle: newHandle.trim() || "@novo_contato", avatar: newName.trim().split(/\s+/).map(x => x[0]).slice(0, 2).join("").toUpperCase(), message: newMessage.trim(), time: "Agora", status: "novo", source: "Entrada manual", interest: "A identificar" };
    setLeads(prev => [lead, ...prev]); setActive(lead.id); setShowNew(false); setNewName(""); setNewHandle(""); setNewMessage("");
  };
  const count = status => leads.filter(l => l.status === status).length;

  return <div style={{ color: text, display: "grid", gap: 16, minWidth: 0 }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
      <div><div style={{ fontSize: 25, fontWeight: 900, display: "flex", alignItems: "center", gap: 9 }}><Instagram color={accent}/> CRM Instagram</div><div style={{ color: subtext, fontSize: 13, marginTop: 5 }}>Central de conversas e qualificação de oportunidades.</div></div>
      <button onClick={() => setShowNew(true)} style={{ ...button(true), display: "flex", alignItems: "center", gap: 7 }}><Plus size={16}/> Simular mensagem</button>
    </header>
    <div style={{ padding: 12, borderRadius: 12, background: "#f59e0b12", border: "1px solid #f59e0b55", color: "#fbbf24", fontSize: 12, lineHeight: 1.5 }}><strong>Modo demonstração:</strong> as conversas são fictícias e não estão conectadas à Meta ou ao Instagram. A integração oficial será implementada posteriormente com permissões e webhooks da Meta.</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(125px,1fr))", gap: 9 }}>{[{ label: "Novos", key: "novo" }, { label: "Qualificados", key: "qualificado" }, { label: "Em nutrição", key: "nutrir" }, { label: "Não captar", key: "descartar" }].map(x => <div key={x.key} style={{ ...panel, padding: 13 }}><div style={{ fontSize: 12, color: subtext }}>{x.label}</div><div style={{ fontSize: 24, fontWeight: 900, color: colors[x.key], marginTop: 5 }}>{count(x.key)}</div></div>)}</div>
    <div className="byse-crm-grid" style={{ display: "grid", gridTemplateColumns: "minmax(245px,.85fr) minmax(300px,1.4fr)", gap: 12, alignItems: "stretch" }}>
      <section style={{ ...panel, padding: 12, minWidth: 0 }}>
        <div style={{ fontWeight: 850, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}><MessageCircle size={17}/> Caixa de entrada <span style={{ marginLeft: "auto", fontSize: 11, color: subtext }}>{filtered.length} contatos</span></div>
        <div style={{ position: "relative", marginBottom: 9 }}><Search size={15} color={subtext} style={{ position: "absolute", left: 10, top: 11 }}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversa..." style={{ width: "100%", boxSizing: "border-box", padding: "9px 9px 9px 32px", border: `1px solid ${border}`, borderRadius: 9, background: "transparent", color: text }}/></div>
        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 9 }}>{[{ id: "todos", label: "Todos" }, { id: "novo", label: "Novos" }, { id: "qualificado", label: "Qualificados" }, { id: "nutrir", label: "Nutrir" }, { id: "descartar", label: "Não captar" }].map(x => <button key={x.id} onClick={() => setFilter(x.id)} style={{ ...button(filter === x.id), fontSize: 10, whiteSpace: "nowrap", padding: "7px 9px" }}>{x.label}</button>)}</div>
        <div style={{ display: "grid", gap: 5 }}>{filtered.map(l => <button key={l.id} onClick={() => { setActive(l.id); setSent(false); }} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 10, borderRadius: 11, border: `1px solid ${active === l.id ? accent : border}`, background: active === l.id ? `${accent}12` : "transparent", color: text, textAlign: "left", cursor: "pointer" }}><div style={{ width: 36, height: 36, borderRadius: 50, background: `${accent}25`, display: "grid", placeItems: "center", fontWeight: 850, fontSize: 12, flexShrink: 0 }}>{l.avatar}</div><div style={{ minWidth: 0, flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}><strong style={{ fontSize: 12 }}>{l.name}</strong><small style={{ color: subtext, fontSize: 10 }}>{l.time}</small></div><div style={{ fontSize: 11, color: subtext, marginTop: 2 }}>{l.handle}</div><div style={{ fontSize: 11, marginTop: 5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{l.message}</div><div style={{ marginTop: 6, fontSize: 10, fontWeight: 800, color: colors[l.status] }}>{labels[l.status]}</div></div></button>)}</div>
        {!filtered.length && <div style={{ padding: 20, textAlign: "center", color: subtext, fontSize: 12 }}>Nenhuma conversa nesse filtro.</div>}
      </section>
      <section style={{ ...panel, padding: 15, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {current ? <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${border}`, paddingBottom: 12 }}><div style={{ width: 42, height: 42, borderRadius: 50, background: `${accent}25`, display: "grid", placeItems: "center", fontWeight: 900 }}>{current.avatar}</div><div style={{ minWidth: 0, flex: 1 }}><strong>{current.name}</strong><div style={{ fontSize: 12, color: subtext }}>{current.handle} · {current.source}</div></div><span style={{ fontSize: 10, fontWeight: 850, color: colors[current.status], background: `${colors[current.status]}18`, padding: "6px 8px", borderRadius: 20 }}>{labels[current.status]}</span></div>
          <div style={{ padding: 14, borderRadius: 12, background: `${accent}0d`, maxWidth: "90%", fontSize: 13, lineHeight: 1.5 }}>{current.message}<div style={{ fontSize: 10, color: subtext, marginTop: 7 }}>{current.time} · mensagem recebida</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8 }}><div style={{ padding: 10, borderRadius: 10, border: `1px solid ${border}` }}><div style={{ fontSize: 10, color: subtext }}>Interesse identificado</div><strong style={{ fontSize: 12 }}>{current.interest}</strong></div><div style={{ padding: 10, borderRadius: 10, border: `1px solid ${border}` }}><div style={{ fontSize: 10, color: subtext }}>Origem</div><strong style={{ fontSize: 12 }}>{current.source}</strong></div></div>
          <div><div style={{ fontSize: 12, fontWeight: 850, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Target size={15}/> Classificar contato</div><div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}><button onClick={() => classify(current.id, "qualificado")} style={button(current.status === "qualificado")}><Star size={13} style={{ verticalAlign: "-2px", marginRight: 4 }}/>Qualificado</button><button onClick={() => classify(current.id, "nutrir")} style={button(current.status === "nutrir")}>Nutrir</button><button onClick={() => classify(current.id, "descartar")} style={button(current.status === "descartar")}>Não captar</button><button onClick={() => classify(current.id, "novo")} style={button(current.status === "novo")}>Novo</button></div><div style={{ fontSize: 11, color: subtext, marginTop: 7 }}>Qualificado: perfil aderente ao público desejado. Nutrir: precisa de mais informações. Não captar: fora do foco comercial.</div></div>
          <div style={{ marginTop: "auto", borderTop: `1px solid ${border}`, paddingTop: 12 }}><div style={{ fontSize: 12, fontWeight: 800, marginBottom: 7 }}>Resposta simulada</div><div style={{ display: "flex", gap: 7 }}><input value={reply} onChange={e => setReply(e.target.value)} placeholder="Escreva uma resposta..." style={{ flex: 1, minWidth: 0, padding: 11, border: `1px solid ${border}`, borderRadius: 10, background: "transparent", color: text }}/><button onClick={() => { if (reply.trim()) { setSent(true); setReply(""); } }} style={{ ...button(true), display: "flex", alignItems: "center", gap: 5 }}><Send size={15}/>Enviar</button></div>{sent && <div style={{ fontSize: 11, color: "#4ade80", marginTop: 7 }}>Resposta registrada apenas nesta demonstração (não enviada ao Instagram).</div>}</div>
        </> : <div style={{ color: subtext, textAlign: "center", padding: 30 }}>Selecione uma conversa para visualizar.</div>}
      </section>
    </div>
    <style>{`@media(max-width:680px){.byse-crm-grid{grid-template-columns:1fr!important}}`}</style>
    {showNew && <div style={{ position: "fixed", inset: 0, zIndex: 1300, background: "#000a", display: "grid", placeItems: "center", padding: 14 }}><div style={{ ...panel, padding: 18, width: "min(100%,430px)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><strong>Simular nova mensagem</strong><button onClick={() => setShowNew(false)} style={{ background: "none", border: 0, color: text, cursor: "pointer" }}><X/></button></div><div style={{ display: "grid", gap: 9 }}><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do contato" style={{ padding: 11, border: `1px solid ${border}`, borderRadius: 9, background: "transparent", color: text }}/><input value={newHandle} onChange={e => setNewHandle(e.target.value)} placeholder="@usuario do Instagram" style={{ padding: 11, border: `1px solid ${border}`, borderRadius: 9, background: "transparent", color: text }}/><textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Mensagem recebida" rows={4} style={{ padding: 11, border: `1px solid ${border}`, borderRadius: 9, background: "transparent", color: text, resize: "vertical" }}/><button onClick={addLead} style={{ border: 0, borderRadius: 10, background: accent, color: "white", padding: 12, fontWeight: 850, cursor: "pointer" }}>Adicionar conversa de demonstração</button></div></div></div>}
  </div>;
}
