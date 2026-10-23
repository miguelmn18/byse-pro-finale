

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

  QrCode,

  Trash2,

  CalendarDays

} from "lucide-react";

import { FONT_BODY, SUCCESS, DANGER } from "../data/constants";

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

  id: `wa-${Date.now()}-${number}-${Math.random().toString(36).slice(2, 8)}`,

  label: `Novo lembrete ${number}`,

  enabled: false,

  days: [],

  daysNote: "",

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

  const cleanApiUrl = API_URL.replace(/\/+$/, "");

  const [localCustomers, setLocalCustomers] = useState(customers);

  const [sales, setSales] = useState([]);

  const [sendingNowId, setSendingNowId] = useState(null);

  const [sendStatusMessage, setSendStatusMessage] = useState(null);

  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  const [loadingQr, setLoadingQr] = useState(false);

  const [resettingSession, setResettingSession] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [editLabel, setEditLabel] = useState("");

  const [editDays, setEditDays] = useState([]);

  const [editDaysNote, setEditDaysNote] = useState("");

  const [editTime, setEditTime] = useState("10:00");

  const [editText, setEditText] = useState("");

  const [editSendToAll, setEditSendToAll] = useState(true);

  const [editCustomerIds, setEditCustomerIds] = useState([]);

  const [customerSearch, setCustomerSearch] = useState("");

  const [daysFilter, setDaysFilter] = useState("all");

  const [creatingSchedule, setCreatingSchedule] = useState(false);

  const [savingSchedules, setSavingSchedules] = useState(false);

  const normalizedSchedule = useMemo(() => {

    return (Array.isArray(waSchedule) ? waSchedule : []).map(

      (item, index) => ({

        ...createSchedule(index + 1),

        ...item,

        label: item?.label || item?.name || `Lembrete ${index + 1}`,

        days: Array.isArray(item?.days)

          ? item.days

          : item?.day

            ? [item.day]

            : [],

        daysNote: typeof item?.daysNote === "string" ? item.daysNote : "",

        customerIds: Array.isArray(item?.customerIds)

          ? item.customerIds

          : [],

        sendToAll: item?.sendToAll !== false,

        enabled: Boolean(item?.enabled),

        time: item?.time || "10:00",

        text: item?.text || DEFAULT_MESSAGE

      })

    );

  }, [waSchedule]);

  useEffect(() => {

    if (customers && customers.length > 0) {

      setLocalCustomers(customers);

    }

  }, [customers]);

  const getAuthHeaders = () => {

    const token = localStorage.getItem("byse_token");

    const user = JSON.parse(localStorage.getItem("byse_user") || "{}");

    return {

      Authorization: `Bearer ${token}`,

      "x-user-id":

        user.id ||

        localStorage.getItem("userId") ||

        "user_1"

    };

  };

  const checkWhatsAppStatus = async () => {

    try {

      const res = await fetch(

        `${cleanApiUrl}/api/whatsapp/status`,

        { headers: getAuthHeaders() }

      );

      if (!res.ok) return;

      const data = await res.json();

      setConnectionStatus(data.status);

      if (data.qr) {

        setQrCodeUrl(data.qr);

      } else if (data.status === "connected") {

        setQrCodeUrl(null);

      }

    } catch (err) {

      console.error("Erro ao checar status do WhatsApp:", err);

    }

  };

  useEffect(() => {

    let cancelled = false;

    const fetchData = async () => {

      const headers = getAuthHeaders();

      try {

        const resClientes = await fetch(

          `${cleanApiUrl}/api/clientes`,

          { headers }

        );

        const contentTypeClientes =

          resClientes.headers.get("content-type") || "";

        if (

          resClientes.ok &&

          contentTypeClientes.includes("application/json")

        ) {

          const clientesData = await resClientes.json();

          if (!cancelled && Array.isArray(clientesData)) {

            setLocalCustomers(clientesData);

          }

        }

        const resSales = await fetch(

          `${cleanApiUrl}/api/sales`,

          { headers }

        );

        const contentTypeSales =

          resSales.headers.get("content-type") || "";

        if (

          resSales.ok &&

          contentTypeSales.includes("application/json")

        ) {

          const salesData = await resSales.json();

          if (!cancelled && Array.isArray(salesData)) {

            setSales(salesData);

          }

        }

        const response = await fetch(

          `${cleanApiUrl}/api/whatsapp`,

          { headers }

        );

        const contentTypeWa =

          response.headers.get("content-type") || "";

        if (

          response.ok &&

          contentTypeWa.includes("application/json")

        ) {

          const data = await response.json();

          if (!cancelled && Array.isArray(data)) {

            setWaSchedule(data);

          }

        }

        if (!cancelled) {

          await checkWhatsAppStatus();

        }

      } catch (error) {

        console.error(

          "Erro ao carregar dados do WhatsApp:",

          error

        );

      }

    };

    fetchData();

    const interval = setInterval(() => {

      checkWhatsAppStatus();

    }, 5000);

    return () => {

      cancelled = true;

      clearInterval(interval);

    };

  }, [cleanApiUrl]);

  const persistSchedules = async (newSchedules) => {

    // Atualização imediata da tela.

    setWaSchedule(newSchedules);

    setSavingSchedules(true);

    try {

      const res = await fetch(`${cleanApiUrl}/api/whatsapp`, {

        method: "POST",

        headers: {

          ...getAuthHeaders(),

          "Content-Type": "application/json"

        },

        body: JSON.stringify(newSchedules)

      });

      if (!res.ok) {

        throw new Error(`Erro HTTP ${res.status}`);

      }

      return true;

    } catch (error) {

      console.error(

        "Erro ao salvar programações no servidor:",

        error

      );

      alert(

        "Não foi possível confirmar o salvamento no servidor. Verifique sua conexão e tente novamente."

      );

      return false;

    } finally {

      setSavingSchedules(false);

    }

  };

  const daysSince = (customer) => {

    const custSales = sales.filter(

      (s) =>

        s.customer === customer.id ||

        s.customer === customer.name ||

        s.customer_id === customer.id ||

        s.customerId === customer.id

    );

    if (custSales.length === 0) return null;

    const last = custSales.reduce((max, s) => {

      const date = new Date(s.date);

      return date > max ? date : max;

    }, new Date(0));

    return Math.floor(

      (Date.now() - last.getTime()) / 86400000

    );

  };

  const fetchQrCode = async () => {

    setLoadingQr(true);

    try {

      const res = await fetch(

        `${cleanApiUrl}/api/whatsapp/qr`,

        { headers: getAuthHeaders() }

      );

      const data = await res.json();

      if (res.ok && data.success && data.qr) {

        setQrCodeUrl(data.qr);

        setConnectionStatus("qr_needed");

      } else {

        alert(

          data.message ||

            data.error ||

            "QR Code ainda não está pronto. Aguarde e tente novamente."

        );

      }

    } catch (err) {

      console.error("Erro ao buscar QR Code:", err);

      alert("Erro ao buscar o QR Code do servidor.");

    } finally {

      setLoadingQr(false);

    }

  };

  const handleResetSession = async () => {

    if (

      !window.confirm(

        "Deseja realmente reiniciar a sessão do WhatsApp? A conta conectada poderá ser desconectada e um novo QR Code será gerado."

      )

    ) {

      return;

    }

    setResettingSession(true);

    try {

      const res = await fetch(

        `${cleanApiUrl}/api/whatsapp/reset`,

        {

          method: "POST",

          headers: getAuthHeaders()

        }

      );

      const data = await res.json();

      if (res.ok && data.success) {

        alert(

          "Sessão reiniciada. Aguarde alguns instantes para escanear o novo QR Code."

        );

        setConnectionStatus("disconnected");

        setQrCodeUrl(null);

        await fetchQrCode();

      } else {

        alert(data.error || "Erro ao reiniciar sessão.");

      }

    } catch (err) {

      console.error("Erro ao reiniciar sessão:", err);

      alert("Erro de conexão ao reiniciar a sessão.");

    } finally {

      setResettingSession(false);

    }

  };

  const handleSendBatchAutomated = async (schedule) => {

    if (!schedule) return;

    if (

      !schedule.sendToAll &&

      (!schedule.customerIds || schedule.customerIds.length === 0)

    ) {

      alert("Selecione pelo menos um cliente para o envio.");

      return;

    }

    setSendingNowId(schedule.id);

    setSendStatusMessage(

      "Conectando ao WhatsApp para realizar o disparo..."

    );

    try {

      const res = await fetch(

        `${cleanApiUrl}/api/whatsapp/send-batch`,

        {

          method: "POST",

          headers: {

            ...getAuthHeaders(),

            "Content-Type": "application/json"

          },

          body: JSON.stringify({

            text: schedule.text,

            sendToAll: schedule.sendToAll,

            customerIds: schedule.customerIds

          })

        }

      );

      const contentType = res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {

        const rawText = await res.text();

        console.error(

          "Resposta do servidor não é JSON:",

          rawText

        );

        alert(`O servidor respondeu com erro (${res.status}).`);

        setSendStatusMessage(null);

        return;

      }

      const data = await res.json();

      if (res.ok && data.success) {

        setSendStatusMessage(

          data.message ||

            "Disparo concluído com sucesso pelo WhatsApp!"

        );

      } else {

        alert(data.error || "Erro ao realizar o disparo.");

        setSendStatusMessage(null);

      }

    } catch (err) {

      console.error(

        "Erro ao enviar mensagens em lote:",

        err

      );

      alert(

        "Erro ao conectar com o servidor. Verifique a conexão do WhatsApp."

      );

      setSendStatusMessage(null);

    } finally {

      setSendingNowId(null);

    }

  };

  // Cria um lembrete novo, sem limitar a quantidade.

  const handleCreateSchedule = () => {

    if (creatingSchedule) return;

    const nextNumber = normalizedSchedule.length + 1;

    const newSchedule = createSchedule(nextNumber);

    const updated = [...normalizedSchedule, newSchedule];

    setCreatingSchedule(true);

    persistSchedules(updated).then((success) => {

      setCreatingSchedule(false);

      if (success) {

        startEdit(newSchedule);

      }

    });

  };

  // Exclui o lembrete escolhido.

  const handleDeleteSchedule = async (schedule) => {

    const confirmed = window.confirm(

      `Deseja excluir o lembrete "${schedule.label}"? Esta ação não poderá ser desfeita.`

    );

    if (!confirmed) return;

    const updated = normalizedSchedule.filter(

      (item) => item.id !== schedule.id

    );

    const success = await persistSchedules(updated);

    if (success && editingId === schedule.id) {

      cancelEdit();

    }

  };

  const getUsedDays = (currentId) =>

    normalizedSchedule

      .filter((schedule) => schedule.id !== currentId)

      .flatMap((schedule) =>

        Array.isArray(schedule.days) ? schedule.days : []

      );

  const toggleDay = (day) => {

    setEditDays((current) => {

      const days = Array.isArray(current) ? current : [];

      return days.includes(day)

        ? days.filter((item) => item !== day)

        : [...days, day];

    });

  };

  const startEdit = (schedule) => {

    setEditingId(schedule.id);

    setEditLabel(schedule.label || "");

    setEditDays(

      Array.isArray(schedule.days) ? [...schedule.days] : []

    );

    setEditDaysNote(schedule.daysNote || "");

    setEditTime(schedule.time || "10:00");

    setEditText(schedule.text || DEFAULT_MESSAGE);

    setEditSendToAll(schedule.sendToAll !== false);

    setEditCustomerIds(

      Array.isArray(schedule.customerIds)

        ? [...schedule.customerIds]

        : []

    );

    setCustomerSearch("");

    setDaysFilter("all");

  };

  const cancelEdit = () => {

    setEditingId(null);

    setEditLabel("");

    setEditDays([]);

    setEditDaysNote("");

    setEditTime("10:00");

    setEditText("");

    setEditSendToAll(true);

    setEditCustomerIds([]);

    setCustomerSearch("");

    setDaysFilter("all");

  };

  const saveEdit = async (id) => {

    if (!editLabel.trim()) {

      alert("Informe o nome do lembrete.");

      return;

    }

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

            label: editLabel.trim(),

            days: [...editDays],

            daysNote: editDaysNote.trim(),

            time: editTime,

            text: editText,

            sendToAll: editSendToAll,

            customerIds: editSendToAll

              ? []

              : [...editCustomerIds]

          }

        : schedule

    );

    const success = await persistSchedules(updated);

    if (success) {

      cancelEdit();

    }

  };

  const toggle = async (id) => {

    const schedule = normalizedSchedule.find(

      (item) => item.id === id

    );

    if (!schedule) return;

    if (!schedule.enabled) {

      if (!schedule.days?.length) {

        startEdit(schedule);

        alert(

          "Configure os dias da semana antes de ativar o lembrete."

        );

        return;

      }

      if (!schedule.label?.trim()) {

        startEdit(schedule);

        alert("Informe o nome do lembrete antes de ativá-lo.");

        return;

      }

    }

    const updated = normalizedSchedule.map((item) =>

      item.id === id

        ? { ...item, enabled: !item.enabled }

        : item

    );

    await persistSchedules(updated);

  };

  const toggleCustomer = (customerId) => {

    setEditCustomerIds((current) =>

      current.includes(customerId)

        ? current.filter((id) => id !== customerId)

        : [...current, customerId]

    );

  };

  const filteredCustomers = useMemo(() => {

    const search = customerSearch.toLowerCase().trim();

    return localCustomers.filter((customer) => {

      const name = String(customer.name || "").toLowerCase();

      const phone = String(customer.phone || "").toLowerCase();

      const matchesSearch =

        !search ||

        name.includes(search) ||

        phone.includes(search);

      if (!matchesSearch) return false;

      if (daysFilter === "all") return true;

      const days = daysSince(customer);

      if (days === null) return false;

      return days <= parseInt(daysFilter, 10);

    });

  }, [localCustomers, customerSearch, daysFilter, sales]);

  const handleSelectFiltered = () => {

    const filteredIds = filteredCustomers.map(

      (customer) => customer.id

    );

    const allSelected = filteredIds.every((id) =>

      editCustomerIds.includes(id)

    );

    if (allSelected) {

      setEditCustomerIds((current) =>

        current.filter((id) => !filteredIds.includes(id))

      );

    } else {

      setEditCustomerIds((current) =>

        Array.from(new Set([...current, ...filteredIds]))

      );

    }

  };

  const getDaysLabel = (days) => {

    if (!Array.isArray(days) || days.length === 0) {

      return "Nenhum dia selecionado";

    }

    return days

      .map(

        (day) =>

          WEEK_DAYS.find((item) => item.value === day)?.label ||

          day

      )

      .join(", ");

  };

  const buttonStyle = {

    background: accent,

    color: "#fff",

    border: "none",

    borderRadius: 7,

    padding: "8px 12px",

    cursor: "pointer",

    fontWeight: 700,

    fontSize: 12,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: 6

  };

  const secondaryButtonStyle = {

    background: "transparent",

    border: `1px solid ${border}`,

    color: text,

    borderRadius: 7,

    padding: "8px 12px",

    cursor: "pointer",

    fontWeight: 600,

    fontSize: 12,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: 6

  };

  return (

    <div>

      <SectionTitle

        title="Disparos via WhatsApp"

        sub="Crie lembretes personalizados, programe dias e gerencie mensagens automatizadas."

        subtext={subtext}

      />

      {/* CONEXÃO COM WHATSAPP */}

      <div

        style={{

          background: card,

          border: `1px solid ${border}`,

          borderRadius: 12,

          padding: 18,

          marginBottom: 20,

          textAlign: "center"

        }}

      >

        <div

          style={{

            fontWeight: 700,

            fontSize: 14,

            marginBottom: 8,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            gap: 8

          }}

        >

          <QrCode size={18} color={accent} />

          Conexão com o WhatsApp (Baileys)

        </div>

        <p

          style={{

            fontSize: 12.5,

            color: subtext,

            marginBottom: 12

          }}

        >

          Status atual:{" "}

          <strong

            style={{

              color:

                connectionStatus === "connected"

                  ? SUCCESS

                  : accent

            }}

          >

            {connectionStatus === "connected"

              ? "Conectado ✅"

              : "Desconectado / Aguardando leitura"}

          </strong>

        </p>

        {connectionStatus === "connected" ? (

          <div

            style={{

              display: "flex",

              flexDirection: "column",

              alignItems: "center",

              gap: 10

            }}

          >

            <div

              style={{

                color: SUCCESS,

                fontSize: 13,

                fontWeight: 600,

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                gap: 6

              }}

            >

              <CheckCircle2 size={16} />

              WhatsApp conectado e pronto para disparos!

            </div>

            <button

              onClick={handleResetSession}

              disabled={resettingSession}

              style={secondaryButtonStyle}

            >

              <RefreshCw

                size={13}

                className={resettingSession ? "animate-spin" : ""}

              />

              {resettingSession

                ? "Reiniciando..."

                : "Desconectar / Ler Outro QR Code"}

            </button>

          </div>

        ) : qrCodeUrl ? (

          <div

            style={{

              display: "flex",

              flexDirection: "column",

              alignItems: "center",

              gap: 10

            }}

          >

            <div

              style={{

                background: "#fff",

                padding: 10,

                borderRadius: 8,

                display: "inline-block"

              }}

            >

              <img

                src={

                  qrCodeUrl.startsWith("data:")

                    ? qrCodeUrl

                    : `data:image/png;base64,${qrCodeUrl}`

                }

                alt="QR Code WhatsApp"

                style={{

                  width: 200,

                  height: 200,

                  objectFit: "contain"

                }}

              />

            </div>

            <p style={{ fontSize: 11.5, color: subtext }}>

              Abra o WhatsApp no celular, acesse Aparelhos

              Conectados e escaneie o código.

            </p>

            <div

              style={{

                display: "flex",

                gap: 8,

                flexWrap: "wrap",

                justifyContent: "center"

              }}

            >

              <button

                onClick={fetchQrCode}

                style={secondaryButtonStyle}

              >

                Atualizar QR Code

              </button>

              <button

                onClick={handleResetSession}

                disabled={resettingSession}

                style={secondaryButtonStyle}

              >

                {resettingSession

                  ? "Reiniciando..."

                  : "Forçar Novo QR Code"}

              </button>

            </div>

          </div>

        ) : (

          <div

            style={{

              display: "flex",

              gap: 10,

              justifyContent: "center",

              flexWrap: "wrap"

            }}

          >

            <button

              onClick={fetchQrCode}

              disabled={loadingQr}

              style={buttonStyle}

            >

              {loadingQr

                ? "Gerando QR Code..."

                : "Gerar QR Code na Tela"}

            </button>

            <button

              onClick={handleResetSession}

              disabled={resettingSession}

              style={secondaryButtonStyle}

            >

              {resettingSession

                ? "Reiniciando..."

                : "Reiniciar Sessão"}

            </button>

          </div>

        )}

      </div>

      {/* STATUS DOS DISPAROS */}

      {sendStatusMessage && (

        <div

          style={{

            background: `${accent}12`,

            border: `2px solid ${accent}`,

            borderRadius: 12,

            padding: 18,

            marginBottom: 20

          }}

        >

          <div

            style={{

              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",

              marginBottom: 6

            }}

          >

            <div

              style={{

                fontWeight: 700,

                fontSize: 14,

                display: "flex",

                alignItems: "center",

                gap: 8,

                color: accent

              }}

            >

              <Send size={18} />

              Status do Disparo

            </div>

            <button

              onClick={() => setSendStatusMessage(null)}

              style={{

                background: "transparent",

                border: "none",

                cursor: "pointer",

                color: subtext

              }}

            >

              <X size={18} />

            </button>

          </div>

          <div style={{ fontSize: 13, color: text }}>

            {sendStatusMessage}

          </div>

        </div>

      )}

      {/* CABEÇALHO DOS LEMBRETES */}

      <div

        style={{

          display: "flex",

          alignItems: "center",

          justifyContent: "space-between",

          gap: 12,

          flexWrap: "wrap",

          marginBottom: 14

        }}

      >

        <div>

          <h3

            style={{

              margin: 0,

              fontSize: 16,

              color: text,

              display: "flex",

              alignItems: "center",

              gap: 8

            }}

          >

            <CalendarDays size={19} color={accent} />

            Meus lembretes

          </h3>

          <p

            style={{

              margin: "5px 0 0",

              color: subtext,

              fontSize: 12

            }}

          >

            {normalizedSchedule.length} lembrete(s) cadastrado(s)

          </p>

        </div>

        <button

          type="button"

          onClick={handleCreateSchedule}

          disabled={creatingSchedule || savingSchedules}

          style={{

            ...buttonStyle,

            padding: "10px 14px",

            opacity:

              creatingSchedule || savingSchedules ? 0.65 : 1

          }}

        >

          <Plus size={16} />

          {creatingSchedule

            ? "Criando..."

            : "Criar novo lembrete"}

        </button>

      </div>

      {savingSchedules && (

        <p

          style={{

            color: subtext,

            fontSize: 11.5,

            margin: "0 0 12px"

          }}

        >

          Salvando alterações...

        </p>

      )}

      {/* LISTA DE LEMBRETES */}

      {normalizedSchedule.length === 0 ? (

        <div

          style={{

            background: card,

            border: `1px dashed ${border}`,

            borderRadius: 12,

            padding: 28,

            textAlign: "center"

          }}

        >

          <CalendarDays

            size={34}

            color={accent}

            style={{ marginBottom: 10 }}

          />

          <h3

            style={{

              margin: "0 0 8px",

              color: text,

              fontSize: 15

            }}

          >

            Você ainda não criou lembretes

          </h3>

          <p

            style={{

              color: subtext,

              fontSize: 12.5,

              margin: "0 0 16px"

            }}

          >

            Crie seu primeiro lembrete, escolha os dias da semana

            e personalize a mensagem para seus clientes.

          </p>

          <button

            onClick={handleCreateSchedule}

            disabled={creatingSchedule || savingSchedules}

            style={buttonStyle}

          >

            <Plus size={15} />

            Criar meu primeiro lembrete

          </button>

        </div>

      ) : (

        <div

          style={{

            display: "flex",

            flexDirection: "column",

            gap: 14

          }}

        >

          {normalizedSchedule.map((schedule) => {

            const usedDays = getUsedDays(schedule.id);

            const isEditing = editingId === schedule.id;

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

                {/* TÍTULO E AÇÕES */}

                <div

                  style={{

                    display: "flex",

                    justifyContent: "space-between",

                    alignItems: "center",

                    padding: 14,

                    borderBottom: `1px solid ${border}`,

                    gap: 10,

                    flexWrap: "wrap"

                  }}

                >

                  <div style={{ minWidth: 0, flex: 1 }}>

                    <div

                      style={{

                        fontWeight: 700,

                        fontSize: 14,

                        display: "flex",

                        alignItems: "center",

                        gap: 8,

                        flexWrap: "wrap"

                      }}

                    >

                      <MessageCircle size={16} color={accent} />

                      <span>{schedule.label}</span>

                      <Pill

                        color={

                          schedule.enabled ? SUCCESS : subtext

                        }

                      >

                        {schedule.enabled

                          ? "Ativo"

                          : "Pausado"}

                      </Pill>

                    </div>

                  </div>

                  <div

                    style={{

                      display: "flex",

                      alignItems: "center",

                      gap: 12

                    }}

                  >

                    <label

                      title="Ativar ou pausar lembrete"

                      style={{

                        position: "relative",

                        display: "inline-block",

                        width: 38,

                        height: 21,

                        cursor: "pointer",

                        flexShrink: 0

                      }}

                    >

                      <input

                        type="checkbox"

                        checked={Boolean(schedule.enabled)}

                        onChange={() => toggle(schedule.id)}

                        style={{

                          opacity: 0,

                          width: 0,

                          height: 0

                        }}

                      />

                      <span

                        style={{

                          position: "absolute",

                          inset: 0,

                          background: schedule.enabled

                            ? accent

                            : "#ccc",

                          borderRadius: 20

                        }}

                      />

                      <span

                        style={{

                          position: "absolute",

                          height: 15,

                          width: 15,

                          left: schedule.enabled ? 20 : 3,

                          bottom: 3,

                          background: "#fff",

                          borderRadius: "50%",

                          transition: "left 0.2s"

                        }}

                      />

                    </label>

                    <button

                      type="button"

                      onClick={() => handleDeleteSchedule(schedule)}

                      title="Excluir lembrete"

                      style={{

                        background: "transparent",

                        border: `1px solid ${DANGER}`,

                        color: DANGER,

                        borderRadius: 7,

                        padding: "7px 9px",

                        cursor: "pointer",

                        display: "inline-flex",

                        alignItems: "center",

                        gap: 5,

                        fontSize: 11.5,

                        fontWeight: 700

                      }}

                    >

                      <Trash2 size={14} />

                      Excluir

                    </button>

                  </div>

                </div>

                <div style={{ padding: 14 }}>

                  {/* RESUMO */}

                  <div

                    style={{

                      display: "grid",

                      gridTemplateColumns:

                        "repeat(auto-fit, minmax(140px, 1fr))",

                      gap: 12,

                      marginBottom: 12

                    }}

                  >

                    <div>

                      <SLabel subtext={subtext}>

                        DIAS DO LEMBRETE

                      </SLabel>

                      <div

                        style={{

                          marginTop: 5,

                          fontSize: 12.5,

                          fontWeight: 600

                        }}

                      >

                        {[schedule.daysNote?.trim(), getDaysLabel(schedule.days)]
                          .filter(Boolean)
                          .join(" • ")}

                      </div>

                    </div>

                    <div>

                      <SLabel subtext={subtext}>

                        HORÁRIO

                      </SLabel>

                      <div

                        style={{

                          marginTop: 5,

                          fontSize: 12.5,

                          fontWeight: 600

                        }}

                      >

                        {schedule.time || "10:00"}

                      </div>

                    </div>

                    <div>

                      <SLabel subtext={subtext}>

                        DESTINATÁRIOS

                      </SLabel>

                      <div

                        style={{

                          marginTop: 5,

                          fontSize: 12.5,

                          fontWeight: 600

                        }}

                      >

                        {schedule.sendToAll

                          ? `Todos (${localCustomers.length})`

                          : `${schedule.customerIds?.length || 0} selecionado(s)`}

                      </div>

                    </div>

                  </div>

                  <div

                    style={{

                      background: `${accent}08`,

                      borderRadius: 8,

                      padding: 10,

                      fontSize: 11.5,

                      color: subtext,

                      whiteSpace: "pre-wrap",

                      marginBottom: 12

                    }}

                  >

                    {schedule.text ||

                      "Nenhuma mensagem configurada."}

                  </div>

                  {/* BOTÕES DO LEMBRETE */}

                  <div

                    style={{

                      display: "flex",

                      gap: 8,

                      flexWrap: "wrap"

                    }}

                  >

                    <button

                      onClick={() => startEdit(schedule)}

                      style={buttonStyle}

                    >

                      <Edit2 size={13} />

                      Editar lembrete

                    </button>

                    <button

                      onClick={() =>

                        handleSendBatchAutomated(schedule)

                      }

                      disabled={sendingNowId === schedule.id}

                      style={{

                        ...buttonStyle,

                        background: "#25D366",

                        opacity:

                          sendingNowId === schedule.id ? 0.7 : 1

                      }}

                    >

                      <Send size={13} />

                      {sendingNowId === schedule.id

                        ? "Enviando..."

                        : "Disparar agora"}

                    </button>

                  </div>

                  {/* FORMULÁRIO DE EDIÇÃO */}

                  {isEditing && (

                    <div

                      style={{

                        marginTop: 16,

                        paddingTop: 16,

                        borderTop: `1px solid ${border}`

                      }}

                    >

                      <h4

                        style={{

                          margin: "0 0 14px",

                          fontSize: 14,

                          color: text

                        }}

                      >

                        Personalizar lembrete

                      </h4>

                      {/* NOME PERSONALIZADO */}

                      <div style={{ marginBottom: 14 }}>

                        <SLabel subtext={subtext}>

                          NOME DO LEMBRETE

                        </SLabel>

                        <input

                          type="text"

                          value={editLabel}

                          onChange={(e) =>

                            setEditLabel(e.target.value)

                          }

                          placeholder="Ex.: Lembrete de retorno dos clientes"

                          maxLength={100}

                          style={{

                            ...inputStyle(border, text),

                            width: "100%",

                            marginTop: 5

                          }}

                        />

                        <p

                          style={{

                            fontSize: 10.5,

                            color: subtext,

                            margin: "5px 0 0"

                          }}

                        >

                          Escolha um nome para identificar este

                          lembrete.

                        </p>

                      </div>

                      {/* DIAS DA SEMANA */}

                      <div style={{ marginBottom: 14 }}>

                        <SLabel subtext={subtext}>

                          DIAS DO LEMBRETE

                        </SLabel>

                        <p

                          style={{

                            color: subtext,

                            fontSize: 11,

                            margin: "5px 0 8px"

                          }}

                        >

                          Selecione os dias em que deseja

                          programar este lembrete.

                        </p>

                        <div

                          style={{

                            display: "grid",

                            gridTemplateColumns:

                              "repeat(auto-fit, minmax(135px, 1fr))",

                            gap: 7

                          }}

                        >

                          {WEEK_DAYS.map((day) => {

                            const unavailable =

                              usedDays.includes(day.value);

                            const selected =

                              editDays.includes(day.value);

                            return (

                              <button

                                key={day.value}

                                type="button"

                                disabled={unavailable}

                                onClick={() =>

                                  !unavailable &&

                                  toggleDay(day.value)

                                }

                                title={

                                  unavailable

                                    ? "Este dia já está associado a outro lembrete."

                                    : day.label

                                }

                                style={{

                                  background: selected

                                    ? `${accent}18`

                                    : unavailable

                                      ? `${border}50`

                                      : "transparent",

                                  color: selected

                                    ? accent

                                    : unavailable

                                      ? subtext

                                      : text,

                                  border: `1px solid ${

                                    selected ? accent : border

                                  }`,

                                  borderRadius: 7,

                                  padding: "9px 10px",

                                  cursor: unavailable

                                    ? "not-allowed"

                                    : "pointer",

                                  fontSize: 11.5,

                                  textAlign: "left",

                                  opacity: unavailable ? 0.45 : 1,

                                  display: "flex",

                                  alignItems: "center",

                                  gap: 7

                                }}

                              >

                                {selected ? (

                                  <Check size={14} />

                                ) : (

                                  <span

                                    style={{

                                      width: 14,

                                      height: 14,

                                      display: "inline-block",

                                      border: `1px solid ${border}`,

                                      borderRadius: 3

                                    }}

                                  />

                                )}

                                {day.label}

                              </button>

                            );

                          })}

                        </div>

                        <div

                          style={{

                            fontSize: 11,

                            color: subtext,

                            marginTop: 7

                          }}

                        >

                          Dias selecionados:{" "}

                          {editDays.length

                            ? getDaysLabel(editDays)

                            : "nenhum"}

                        </div>

                        <div style={{ marginTop: 12 }}>

                          <SLabel subtext={subtext}>

                            REGRA PERSONALIZADA DOS DIAS

                          </SLabel>

                          <input

                            type="text"

                            value={editDaysNote}

                            onChange={(e) => setEditDaysNote(e.target.value)}

                            placeholder="Ex.: Todo dia 15"

                            maxLength={120}

                            style={{

                              ...inputStyle(border, text),

                              width: "100%",

                              marginTop: 5

                            }}

                          />

                          <p

                            style={{

                              color: subtext,

                              fontSize: 11,

                              lineHeight: 1.5,

                              margin: "5px 0 0"

                            }}

                          >

                            Escreva uma regra ou observação personalizada, como “Todo dia 15”, além de marcar sexta-feira e domingo acima.

                          </p>

                        </div>

                      </div>

                      {/* HORÁRIO */}

                      <div style={{ marginBottom: 14 }}>

                        <SLabel subtext={subtext}>

                          HORÁRIO DO ENVIO

                        </SLabel>

                        <input

                          type="time"

                          value={editTime}

                          onChange={(e) =>

                            setEditTime(e.target.value)

                          }

                          style={{

                            ...inputStyle(border, text),

                            width: "100%",

                            marginTop: 5

                          }}

                        />

                      </div>

                      {/* DESTINATÁRIOS */}

                      <div style={{ marginBottom: 14 }}>

                        <SLabel subtext={subtext}>

                          DESTINATÁRIOS

                        </SLabel>

                        <div

                          style={{

                            display: "flex",

                            gap: 15,

                            flexWrap: "wrap",

                            marginTop: 8,

                            marginBottom: 10

                          }}

                        >

                          <label

                            style={{

                              display: "flex",

                              alignItems: "center",

                              gap: 6,

                              fontSize: 12,

                              cursor: "pointer"

                            }}

                          >

                            <input

                              type="radio"

                              name={`sendToAll-${schedule.id}`}

                              checked={editSendToAll}

                              onChange={() =>

                                setEditSendToAll(true)

                              }

                            />

                            Todos os clientes (

                            {localCustomers.length})

                          </label>

                          <label

                            style={{

                              display: "flex",

                              alignItems: "center",

                              gap: 6,

                              fontSize: 12,

                              cursor: "pointer"

                            }}

                          >

                            <input

                              type="radio"

                              name={`sendToAll-${schedule.id}`}

                              checked={!editSendToAll}

                              onChange={() =>

                                setEditSendToAll(false)

                              }

                            />

                            Escolher clientes específicos

                          </label>

                        </div>

                        {!editSendToAll && (

                          <div

                            style={{

                              border: `1px solid ${border}`,

                              borderRadius: 8,

                              padding: 10

                            }}

                          >

                            <div

                              style={{

                                display: "flex",

                                gap: 8,

                                flexWrap: "wrap",

                                marginBottom: 8

                              }}

                            >

                              <div

                                style={{

                                  position: "relative",

                                  flex: 1,

                                  minWidth: 180

                                }}

                              >

                                <Search

                                  size={14}

                                  color={subtext}

                                  style={{

                                    position: "absolute",

                                    left: 10,

                                    top: "50%",

                                    transform: "translateY(-50%)"

                                  }}

                                />

                                <input

                                  type="text"

                                  placeholder="Buscar nome ou telefone..."

                                  value={customerSearch}

                                  onChange={(e) =>

                                    setCustomerSearch(

                                      e.target.value

                                    )

                                  }

                                  style={{

                                    ...inputStyle(border, text),

                                    width: "100%",

                                    paddingLeft: 30,

                                    fontSize: 11.5

                                  }}

                                />

                              </div>

                              <select

                                value={daysFilter}

                                onChange={(e) =>

                                  setDaysFilter(e.target.value)

                                }

                                style={{

                                  ...inputStyle(border, text),

                                  fontSize: 11.5,

                                  padding: "6px 10px",

                                  width: "auto"

                                }}

                              >

                                <option value="all">

                                  Todo o histórico

                                </option>

                                <option value="3">

                                  Últimos 3 dias

                                </option>

                                <option value="15">

                                  Últimos 15 dias

                                </option>

                                <option value="30">

                                  Últimos 30 dias

                                </option>

                                <option value="60">

                                  Últimos 60 dias

                                </option>

                                <option value="90">

                                  Últimos 90 dias

                                </option>

                              </select>

                            </div>

                            <div

                              style={{

                                display: "flex",

                                justifyContent: "space-between",

                                alignItems: "center",

                                gap: 8,

                                flexWrap: "wrap",

                                marginBottom: 8,

                                fontSize: 11,

                                color: subtext

                              }}

                            >

                              <span>

                                {filteredCustomers.length} cliente(s)

                              </span>

                              <button

                                type="button"

                                onClick={handleSelectFiltered}

                                style={{

                                  background: "transparent",

                                  border: `1px solid ${border}`,

                                  color: accent,

                                  borderRadius: 4,

                                  padding: "4px 8px",

                                  cursor: "pointer",

                                  fontSize: 10.5,

                                  fontWeight: 600

                                }}

                              >

                                Selecionar/desmarcar filtrados

                              </button>

                            </div>

                            <div

                              style={{

                                maxHeight: 220,

                                overflowY: "auto",

                                display: "flex",

                                flexDirection: "column",

                                gap: 4

                              }}

                            >

                              {filteredCustomers.length === 0 ? (

                                <div

                                  style={{

                                    fontSize: 11.5,

                                    color: subtext,

                                    textAlign: "center",

                                    padding: 10

                                  }}

                                >

                                  Nenhum cliente encontrado.

                                </div>

                              ) : (

                                filteredCustomers.map((customer) => {

                                  const isSelected =

                                    editCustomerIds.includes(

                                      customer.id

                                    );

                                  const days = daysSince(customer);

                                  return (

                                    <div

                                      key={customer.id}

                                      onClick={() =>

                                        toggleCustomer(customer.id)

                                      }

                                      style={{

                                        display: "flex",

                                        alignItems: "center",

                                        justifyContent: "space-between",

                                        gap: 10,

                                        padding: "7px 8px",

                                        borderRadius: 6,

                                        background: isSelected

                                          ? `${accent}15`

                                          : "transparent",

                                        cursor: "pointer",

                                        fontSize: 11.5

                                      }}

                                    >

                                      <div

                                        style={{

                                          display: "flex",

                                          flexDirection: "column",

                                          gap: 3

                                        }}

                                      >

                                        <span

                                          style={{ fontWeight: 600 }}

                                        >

                                          {customer.name}

                                        </span>

                                        <span

                                          style={{ color: subtext }}

                                        >

                                          {customer.phone ||

                                            "Sem telefone"}

                                        </span>

                                        <span

                                          style={{

                                            fontSize: 10.5,

                                            color:

                                              days === null ||

                                              days >= 30

                                                ? DANGER

                                                : subtext

                                          }}

                                        >

                                          {days === null

                                            ? "Nunca comprou"

                                            : days === 0

                                              ? "Comprou hoje"

                                              : `Última compra há ${days} dia(s)`}

                                        </span>

                                      </div>

                                      <input

                                        type="checkbox"

                                        checked={isSelected}

                                        onChange={() =>

                                          toggleCustomer(customer.id)

                                        }

                                        onClick={(e) =>

                                          e.stopPropagation()

                                        }

                                      />

                                    </div>

                                  );

                                })

                              )}

                            </div>

                          </div>

                        )}

                      </div>

                      {/* TEXTO DA MENSAGEM */}

                      <div style={{ marginBottom: 14 }}>

                        <SLabel subtext={subtext}>

                          MENSAGEM COMPLETA DO LEMBRETE

                        </SLabel>

                        <p
                          style={{
                            color: subtext,
                            fontSize: 11,
                            lineHeight: 1.5,
                            margin: "5px 0 8px"
                          }}
                        >
                          Edite livremente toda a frase da mensagem, incluindo saudação, texto, emojis e pontuação. Você também pode manter as variáveis {"{nome}"} e {"{saldo}"} para personalizar o envio. A seleção dos dias da semana acima continua independente da mensagem.
                        </p>

                        <textarea

                          value={editText}

                          onChange={(e) =>

                            setEditText(e.target.value)

                          }

                          rows={5}

                          placeholder="Digite a mensagem que será enviada aos clientes..."

                          style={{

                            ...inputStyle(border, text),

                            width: "100%",

                            marginTop: 5,

                            fontFamily: FONT_BODY,

                            resize: "vertical"

                          }}

                        />

                      </div>

                      {/* SALVAR E CANCELAR */}

                      <div

                        style={{

                          display: "flex",

                          gap: 8,

                          flexWrap: "wrap"

                        }}

                      >

                        <button

                          type="button"

                          onClick={() => saveEdit(schedule.id)}

                          disabled={savingSchedules}

                          style={buttonStyle}

                        >

                          <Save size={13} />

                          {savingSchedules

                            ? "Salvando..."

                            : "Salvar lembrete"}

                        </button>

                        <button

                          type="button"

                          onClick={cancelEdit}

                          style={secondaryButtonStyle}

                        >

                          <X size={13} />

                          Cancelar

                        </button>

                        <button

                          type="button"

                          onClick={() =>

                            handleDeleteSchedule(schedule)

                          }

                          style={{

                            ...secondaryButtonStyle,

                            borderColor: DANGER,

                            color: DANGER

                          }}

                        >

                          <Trash2 size={13} />

                          Excluir lembrete

                        </button>

                      </div>

                    </div>

                  )}

                </div>

              </div>

            );

          })}

        </div>

      )}

    </div>

  );

}

export { WhatsApp };
