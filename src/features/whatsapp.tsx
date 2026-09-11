// @ts-nocheck

import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  User,
  Plus,
  Search,
  Check,
  Edit2,
  Save,
  X,
  MessageCircle,
  Send,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  QrCode
} from "lucide-react";
import { FONT_BODY, SUCCESS } from "../data/constants";
import { inputStyle } from "../utils/helpers";
import { SectionTitle, Pill, SLabel } from "../components/common";

const WEEK_DAYS = [
  { value: "segunda", label: "Segunda-feira" },
  { value: "terça", label: "Terça-feira" },
  { value: "quarta", label: "Quarta-feira" },
  { value: "quinta", label: "Quinta-feira" },
  { value: "sexta", label: "Sexta-feira" },
  { value: "sábado", label: "Sábado" },
  { value: "domingo", label: "Domingo" }
];

const DEFAULT_MESSAGE =
  "Olá {nome}! 👋\n\n" +
  "Temos novidades especiais para você na BYSE PRO.\n\n" +
  "Passe para conferir nossas ofertas e aproveite seu cashback! 🎁 (Saldo: {saldo})";

const createSchedule = (number) => ({
  id: `wa-${Date.now()}-${number}`,
  label: `Mensagem ${number}`,
  enabled: false,
  days: [],
  time: "10:00",
  text: DEFAULT_MESSAGE,
  sendToAll: true,
  customerIds: []
});

function WhatsApp({
  waSchedule,
  setWaSchedule,
  card,
  border,
  subtext,
  accent,
  text,
  customers = []
}) {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

  const [localCustomers, setLocalCustomers] = useState(customers);
  const [sendingNowId, setSendingNowId] = useState(null);
  const [sendStatusMessage, setSendStatusMessage] = useState(null);

  // Estados para gerenciar a leitura do QR Code no Front-end
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [resettingSession, setResettingSession] = useState(false);

  useEffect(() => {
    if (customers && customers.length > 0) {
      setLocalCustomers(customers);
    }
  }, [customers]);

  const checkWhatsAppStatus = async () => {
    const token = localStorage.getItem("byse_token");
    const user = JSON.parse(localStorage.getItem("byse_user") || "{}");
    const headers = { 
      "Authorization": `Bearer ${token}`, 
      "x-user-id": user.id || localStorage.getItem("userId") || "user_1" 
    };

    try {
      const res = await fetch(`${API_URL}/api/whatsapp/status`, { headers });
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus(data.status);
        if (data.qr) {
          setQrCodeUrl(data.qr);
        } else if (data.status === "connected") {
          setQrCodeUrl(null);
        }
      }
    } catch (err) {
      console.error("Erro ao checar status do WhatsApp:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("byse_token");
      const user = JSON.parse(localStorage.getItem("byse_user") || "{}");
      const headers = { 
        "Authorization": `Bearer ${token}`, 
        "x-user-id": user.id || localStorage.getItem("userId") || "user_1" 
      };

      try {
        const resClientes = await fetch(`${API_URL}/api/clientes`, { headers });
        const contentTypeClientes = resClientes.headers.get("content-type");
        if (resClientes.ok && contentTypeClientes && contentTypeClientes.includes("application/json")) {
          const clientesData = await resClientes.json();
          if (Array.isArray(clientesData) && clientesData.length > 0) {
            setLocalCustomers(clientesData);
          }
        }

        const response = await fetch(`${API_URL}/api/whatsapp`, { headers });
        const contentTypeWa = response.headers.get("content-type");
        if (response.ok && contentTypeWa && contentTypeWa.includes("application/json")) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setWaSchedule(data);
          }
        }

        await checkWhatsAppStatus();
      } catch (error) {
        console.error("Erro ao carregar dados do WhatsApp:", error);
      }
    };

    fetchData();

    // Polling a cada 5 segundos para atualizar o status da conexão/QR Code automaticamente
    const interval = setInterval(checkWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, [setWaSchedule, API_URL]);

  const fetchQrCode = async () => {
    setLoadingQr(true);
    try {
      const token = localStorage.getItem("byse_token");
      const user = JSON.parse(localStorage.getItem("byse_user") || "{}");
      const headers = { 
        "Authorization": `Bearer ${token}`, 
        "x-user-id": user.id || "user_1" 
      };

      const res = await fetch(`${API_URL}/api/whatsapp/qr`, { headers });
      const data = await res.json();
      
      if (res.ok && data.success && data.qr) {
        setQrCodeUrl(data.qr);
        setConnectionStatus("qr_needed");
      } else {
        alert(data.message || data.error || "QR Code ainda não está pronto. Aguarde alguns instantes e tente novamente.");
      }
    } catch (err) {
      console.error("Erro ao buscar QR Code:", err);
      alert("Erro ao buscar o QR Code do servidor.");
    } finally {
      setLoadingQr(false);
    }
  };

  const handleResetSession = async () => {
    if (!window.confirm("Deseja realmente reiniciar a sessão do WhatsApp? Se houver outra conta conectada, ela será desconectada e um novo QR Code será gerado.")) {
      return;
    }

    setResettingSession(true);
    try {
      const token = localStorage.getItem("byse_token");
      const user = JSON.parse(localStorage.getItem("byse_user") || "{}");
      const headers = { 
        "Authorization": `Bearer ${token}`, 
        "x-user-id": user.id || "user_1" 
      };

      const res = await fetch(`${API_URL}/api/whatsapp/reset`, {
        method: "POST",
        headers
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Sessão reiniciada com sucesso! Aguarde alguns instantes para escanear o novo QR Code.");
        setConnectionStatus("disconnected");
        setQrCodeUrl(null);
        await fetchQrCode();
      } else {
        alert(data.error || "Erro ao reiniciar sessão.");
      }
    } catch (err) {
      console.error("Erro ao reiniciar sessão:", err);
      alert("Erro de conexão ao reiniciar a sessão do WhatsApp.");
    } finally {
      setResettingSession(false);
    }
  };

  const handleSendBatchAutomated = async (schedule) => {
    setSendingNowId(schedule.id);
    setSendStatusMessage("Conectando ao WhatsApp para disparo em massa...");
    
    const token = localStorage.getItem("byse_token");
    const user = JSON.parse(localStorage.getItem("byse_user") || "{}");

    try {
      const res = await fetch(`${API_URL}/api/whatsapp/send-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-user-id": user.id || "user_1"
        },
        body: JSON.stringify({
          text: schedule.text,
          sendToAll: schedule.sendToAll,
          customerIds: schedule.customerIds
        })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const rawText = await res.text();
        console.error("Resposta do servidor não é um JSON:", rawText);
        alert(`O servidor respondeu com um erro (${res.status}).`);
        setSendStatusMessage(null);
        return;
      }

      const data = await res.json();
      
      if (res.ok && data.success) {
        setSendStatusMessage(data.message || "Disparo concluído com sucesso pelo Baileys!");
      } else {
        alert(data.error || "Erro ao realizar o disparo.");
        setSendStatusMessage(null);
      }
    } catch (err) {
      console.error("Erro ao enviar mensagens em lote:", err);
      alert("Erro ao conectar com o servidor. Verifique se o backend está rodando e escaneou o QR Code.");
      setSendStatusMessage(null);
    } finally {
      setSendingNowId(null);
    }
  };

  const persistSchedules = async (newSchedules) => {
    setWaSchedule(newSchedules);
    const token = localStorage.getItem("byse_token");
    const user = JSON.parse(localStorage.getItem("byse_user") || "{}");

    try {
      await fetch(`${API_URL}/api/whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-user-id": user.id || localStorage.getItem("userId") || "user_1"
        },
        body: JSON.stringify(newSchedules)
      });
    } catch (error) {
      console.error("Erro ao salvar programações no servidor:", error);
    }
  };

  const normalizedSchedule = useMemo(() => {
    const current = (Array.isArray(waSchedule) ? waSchedule : []).map(
      (item, index) => ({
        ...createSchedule(index + 1),
        ...item,
        days: Array.isArray(item?.days) ? item.days : item?.day ? [item.day] : []
      })
    );
    while (current.length < 3) {
      current.push(createSchedule(current.length + 1));
    }
    return current.slice(0, 3);
  }, [waSchedule]);

  useEffect(() => {
    if (!Array.isArray(waSchedule) || waSchedule.length !== 3) {
      setWaSchedule(normalizedSchedule);
    }
  }, [waSchedule, normalizedSchedule, setWaSchedule]);

  const [editingId, setEditingId] = useState(null);
  const [editDays, setEditDays] = useState([]);
  const [editTime, setEditTime] = useState("10:00");
  const [editText, setEditText] = useState("");
  const [editSendToAll, setEditSendToAll] = useState(true);
  const [editCustomerIds, setEditCustomerIds] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");

  const getUsedDays = (currentId) =>
    normalizedSchedule
      .filter((s) => s.id !== currentId)
      .flatMap((s) => (Array.isArray(s.days) ? s.days : []));

  const toggleDay = (day) => {
    setEditDays((current) => {
      const days = Array.isArray(current) ? current : [];
      if (days.includes(day)) return days.filter((item) => item !== day);
      return [...days, day];
    });
  };

  const startEdit = (schedule) => {
    setEditingId(schedule.id);
    setEditDays(Array.isArray(schedule.days) ? [...schedule.days] : []);
    setEditTime(schedule.time || "10:00");
    setEditText(schedule.text || DEFAULT_MESSAGE);
    setEditSendToAll(schedule.sendToAll !== false);
    setEditCustomerIds(Array.isArray(schedule.customerIds) ? [...schedule.customerIds] : []);
    setCustomerSearch("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDays([]);
    setEditTime("10:00");
    setEditText("");
    setEditSendToAll(true);
    setEditCustomerIds([]);
    setCustomerSearch("");
  };

  const saveEdit = (id) => {
    if (!editDays.length) {
      alert("Selecione pelo menos um dia da semana.");
      return;
    }
    if (!editText.trim()) {
      alert("Digite uma mensagem antes de salvar.");
      return;
    }
    if (!editSendToAll && editCustomerIds.length === 0) {
      alert("Selecione pelo menos um cliente para o envio.");
      return;
    }

    const updated = normalizedSchedule.map((schedule) =>
      schedule.id === id
        ? {
            ...schedule,
            days: [...editDays],
            time: editTime,
            text: editText,
            sendToAll: editSendToAll,
            customerIds: editSendToAll ? [] : [...editCustomerIds]
          }
        : schedule
    );

    persistSchedules(updated);
    cancelEdit();
  };

  const toggle = (id) => {
    const schedule = normalizedSchedule.find((item) => item.id === id);
    if (!schedule) return;

    if (!schedule.enabled && !schedule.days?.length) {
      startEdit(schedule);
      return;
    }

    const updated = normalizedSchedule.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    persistSchedules(updated);
  };

  const toggleCustomer = (customerId) => {
    setEditCustomerIds((current) =>
      current.includes(customerId) ? current.filter((id) => id !== customerId) : [...current, customerId]
    );
  };

  const filteredCustomers = useMemo(() => {
    const search = customerSearch.toLowerCase().trim();
    if (!search) return localCustomers;
    return localCustomers.filter((c) => {
      const name = String(c.name || "").toLowerCase();
      const phone = String(c.phone || "").toLowerCase();
      return name.includes(search) || phone.includes(search);
    });
  }, [localCustomers, customerSearch]);

  const getDaysLabel = (days) => {
    if (!Array.isArray(days) || days.length === 0) return "Nenhum dia selecionado";
    return days.map((d) => WEEK_DAYS.find((item) => item.value === d)?.label || d).join(", ");
  };

  return (
    <div>
      <SectionTitle
        title="Disparos via WhatsApp"
        sub="Gerencie programações e envie mensagens automatizadas diretamente pelo backend"
        subtext={subtext}
      />

      {/* Bloco de Conexão e Leitura do QR Code na Tela */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 18, marginBottom: 20, textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <QrCode size={18} color={accent} />
          Conexão com o WhatsApp (Baileys)
        </div>
        <p style={{ fontSize: 12.5, color: subtext, marginBottom: 12 }}>
          Status atual: <strong style={{ color: connectionStatus === "connected" ? SUCCESS : accent }}>{connectionStatus === "connected" ? "Conectado ✅" : "Desconectado / Aguardando leitura"}</strong>
        </p>

        {connectionStatus === "connected" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ color: SUCCESS, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <CheckCircle2 size={16} /> WhatsApp conectado e pronto para disparos em massa!
            </div>
            <button
              onClick={handleResetSession}
              disabled={resettingSession}
              style={{ background: "transparent", border: `1px solid ${accent}`, color: accent, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 700, fontSize: 11.5, display: "flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={13} className={resettingSession ? "animate-spin" : ""} />
              {resettingSession ? "Reiniciando..." : "Desconectar / Ler Outro QR Code"}
            </button>
          </div>
        ) : qrCodeUrl ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#fff", padding: 10, borderRadius: 8, display: "inline-block", border: `1px solid ${border}` }}>
              <img 
                src={qrCodeUrl?.startsWith("data:") ? qrCodeUrl : `data:image/png;base64,${qrCodeUrl}`} 
                alt="QR Code WhatsApp" 
                style={{ width: 200, height: 200 }} 
              />
            </div>
            <p style={{ fontSize: 11.5, color: subtext }}>Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o código acima.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={fetchQrCode}
                style={{ background: "transparent", border: `1px solid ${border}`, color: text, borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}
              >
                Atualizar QR Code
              </button>
              <button
                onClick={handleResetSession}
                disabled={resettingSession}
                style={{ background: "transparent", border: `1px solid ${accent}`, color: accent, borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}
              >
                {resettingSession ? "Reiniciando..." : "Forçar Novo QR Code"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={fetchQrCode}
              disabled={loadingQr}
              style={{ background: accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}
            >
              {loadingQr ? "Gerando QR Code..." : "Gerar QR Code na Tela"}
            </button>
            <button
              onClick={handleResetSession}
              disabled={resettingSession}
              style={{ background: "transparent", border: `1px solid ${border}`, color: text, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}
            >
              {resettingSession ? "Reiniciando..." : "Reiniciar Sessão"}
            </button>
          </div>
        )}
      </div>

      {/* Alerta de Status do Envio Automatizado */}
      {sendStatusMessage && (
        <div style={{ background: `${accent}12`, border: `2px solid ${accent}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, color: accent }}>
              <Send size={18} />
              Status do Disparo Automático
            </div>
            <button
              onClick={() => setSendStatusMessage(null)}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: subtext }}
            >
              <X size={18} />
            </button>
          </div>
          <div style={{ fontSize: 13, color: text }}>
            {sendStatusMessage}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {normalizedSchedule.map((schedule) => {
          const usedDays = getUsedDays(schedule.id);

          return (
            <div
              key={schedule.id}
              style={{
                background: card,
                border: `1px solid ${border}`,
                borderRadius: 12,
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  borderBottom: `1px solid ${border}`,
                  gap: 10
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <MessageCircle size={16} color={accent} />
                    {schedule.label}
                    <Pill color={schedule.enabled ? SUCCESS : subtext}>
                      {schedule.enabled ? "Agendamento Ativo" : "Pausado"}
                    </Pill>
                  </div>
                </div>

                <label style={{ position: "relative", display: "inline-block", width: 38, height: 21, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={() => toggle(schedule.id)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{ position: "absolute", inset: 0, background: schedule.enabled ? accent : "#ccc", borderRadius: 20 }} />
                  <span style={{ position: "absolute", height: 15, width: 15, left: schedule.enabled ? 20 : 3, bottom: 3, background: "#fff", borderRadius: "50%" }} />
                </label>
              </div>

              <div style={{ padding: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <SLabel subtext={subtext}>DIAS</SLabel>
                    <div style={{ marginTop: 5, fontSize: 12.5, fontWeight: 600 }}>{getDaysLabel(schedule.days)}</div>
                  </div>
                  <div>
                    <SLabel subtext={subtext}>HORÁRIO</SLabel>
                    <div style={{ marginTop: 5, fontSize: 12.5, fontWeight: 600 }}>{schedule.time || "10:00"}</div>
                  </div>
                  <div>
                    <SLabel subtext={subtext}>CLIENTES</SLabel>
                    <div style={{ marginTop: 5, fontSize: 12.5, fontWeight: 600 }}>
                      {schedule.sendToAll ? `Todos (${localCustomers.length})` : `${schedule.customerIds?.length || 0} selecionado(s)`}
                    </div>
                  </div>
                </div>

                <div style={{ background: `${accent}08`, borderRadius: 8, padding: 10, fontSize: 11.5, color: subtext, whiteSpace: "pre-wrap", marginBottom: 12 }}>
                  {schedule.text || "Nenhuma mensagem configurada."}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => startEdit(schedule)}
                    style={{ background: accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 12px", cursor: "pointer", fontWeight: 700, fontSize: 11.5 }}
                  >
                    <Edit2 size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />
                    Editar programação
                  </button>

                  <button
                    onClick={() => handleSendBatchAutomated(schedule)}
                    disabled={sendingNowId === schedule.id}
                    style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 7, padding: "7px 12px", cursor: "pointer", fontWeight: 700, fontSize: 11.5, display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <Send size={13} />
                    {sendingNowId === schedule.id ? "Enviando Automaticamente..." : "Disparar para Todos"}
                  </button>
                </div>

                {editingId === schedule.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${border}` }}>
                    <div style={{ marginBottom: 12 }}>
                      <SLabel subtext={subtext}>DIAS DA SEMANA</SLabel>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 7, marginTop: 6 }}>
                        {WEEK_DAYS.map((day) => {
                          const unavailable = usedDays.includes(day.value);
                          const selected = editDays.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              disabled={unavailable}
                              onClick={() => !unavailable && toggleDay(day.value)}
                              style={{
                                background: selected ? `${accent}18` : unavailable ? `${border}50` : "transparent",
                                color: selected ? accent : unavailable ? subtext : text,
                                border: `1px solid ${selected ? accent : border}`,
                                borderRadius: 7,
                                padding: "8px 10px",
                                cursor: unavailable ? "not-allowed" : "pointer",
                                fontSize: 11.5,
                                textAlign: "left",
                                opacity: unavailable ? 0.45 : 1
                              }}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <SLabel subtext={subtext}>HORÁRIO DO ENVIO</SLabel>
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        style={{ ...inputStyle(border, text), width: "100%", marginTop: 5 }}
                      />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <SLabel subtext={subtext}>DESTINATÁRIOS</SLabel>
                      <div style={{ display: "flex", gap: 15, marginTop: 6, marginBottom: 8 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", fontWeight: editSendToAll ? 600 : 400 }}>
                          <input
                            type="radio"
                            name={`sendToAll-${schedule.id}`}
                            checked={editSendToAll}
                            onChange={() => setEditSendToAll(true)}
                          />
                          Enviar para todos os clientes ({localCustomers.length})
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", fontWeight: !editSendToAll ? 600 : 400 }}>
                          <input
                            type="radio"
                            name={`sendToAll-${schedule.id}`}
                            checked={!editSendToAll}
                            onChange={() => setEditSendToAll(false)}
                          />
                          Selecionar clientes específicos
                        </label>
                      </div>

                      {!editSendToAll && (
                        <div style={{ border: `1px solid ${border}`, borderRadius: 8, padding: 10, background: `${card}aa` }}>
                          <div style={{ position: "relative", marginBottom: 8 }}>
                            <Search size={14} color={subtext} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                            <input
                              type="text"
                              placeholder="Buscar cliente por nome ou telefone..."
                              value={customerSearch}
                              onChange={(e) => setCustomerSearch(e.target.value)}
                              style={{ ...inputStyle(border, text), width: "100%", paddingLeft: 30, fontSize: 11.5 }}
                            />
                          </div>

                          <div style={{ maxHeight: 150, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                            {filteredCustomers.length === 0 ? (
                              <div style={{ fontSize: 11.5, color: subtext, textAlign: "center", padding: 10 }}>Nenhum cliente encontrado.</div>
                            ) : (
                              filteredCustomers.map((c) => {
                                const isSelected = editCustomerIds.includes(c.id);
                                return (
                                  <div
                                    key={c.id}
                                    onClick={() => toggleCustomer(c.id)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "6px 8px",
                                      borderRadius: 6,
                                      background: isSelected ? `${accent}15` : "transparent",
                                      cursor: "pointer",
                                      fontSize: 11.5
                                    }}
                                  >
                                    <div>
                                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                                      <span style={{ color: subtext, marginLeft: 8 }}>{c.phone || "Sem telefone"}</span>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}}
                                    />
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <SLabel subtext={subtext}>MENSAGEM (Variáveis: {"{nome}"}, {"{saldo}"})</SLabel>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={5}
                        style={{ ...inputStyle(border, text), width: "100%", marginTop: 5, fontFamily: FONT_BODY }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => saveEdit(schedule.id)}
                        style={{ background: accent, border: "none", borderRadius: 7, padding: "8px 13px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 11.5 }}
                      >
                        <Save size={13} style={{ verticalAlign: "middle", marginRight: 5 }} /> Salvar
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 7, padding: "8px 13px", color: text, fontWeight: 700, cursor: "pointer", fontSize: 11.5 }}
                      >
                        <X size={13} style={{ verticalAlign: "middle", marginRight: 5 }} /> Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { WhatsApp };