// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Check, ChevronRight, Edit2 } from "lucide-react";
import { DANGER } from "../data/constants";
import { money, inputStyle } from "../utils/helpers";
import { SectionTitle, Pill } from "../components/common";

function Clientes({
  customers,
  setCustomers,
  sales,
  card,
  border,
  subtext,
  accent,
  text,
}) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    ddd: "",
    phoneNumber: "",
    cpf: "",
  });

  const [phoneError, setPhoneError] = useState("");
  const [selected, setSelected] = useState(null);
  const [editingCashback, setEditingCashback] = useState(null);
  const [cashbackInput, setCashbackInput] = useState("");

  const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) {
      const raw = import.meta.env.VITE_API_URL;
      return raw.endsWith("/api")
        ? raw
        : `${raw.endsWith("/") ? raw.slice(0, -1) : raw}/api`;
    }

    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://localhost:3333/api";
    }

    return "https://byse-pro-backend-production.up.railway.app/api";
  };

  const API_URL = getApiUrl();

  useEffect(() => {
    const fetchCustomers = async () => {
      const token = localStorage.getItem("byse_token");
      const user = JSON.parse(localStorage.getItem("byse_user") || "{}");

      try {
        const response = await fetch(`${API_URL}/customers`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-user-id": user.id || "user_1",
          },
        });

        if (response.ok) {
          const data = await response.json();

          if (Array.isArray(data)) {
            setCustomers(data);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      }
    };

    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) =>
    String(c.name || "")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  // Cadastra o cliente com o telefone completo: 55 + DDD + número.
  const addCustomer = async () => {
    const name = String(form.name || "").trim();
    const ddd = String(form.ddd || "").replace(/\D/g, "");
    const phoneNumber = String(form.phoneNumber || "").replace(/\D/g, "");

    if (!name) {
      alert("Informe o nome do cliente.");
      return;
    }

    if (ddd.length !== 2) {
      alert("Informe o DDD com exatamente 2 números.");
      return;
    }

    if (phoneNumber.length !== 8) {
      setPhoneError("O número do WhatsApp deve conter exatamente 8 números.");
      return;
    }

    setPhoneError("");

    const token = localStorage.getItem("byse_token");
    const user = JSON.parse(localStorage.getItem("byse_user") || "{}");

    // Código do Brasil + DDD + número do cliente.
    const fullPhone = `55${ddd}${phoneNumber}`;

    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-id": user.id || "user_1",
        },
        body: JSON.stringify({
          name,
          phone: fullPhone,
          cpf: form.cpf,
          cashback: 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erro HTTP: ${response.status}`);
      }

      setCustomers([...customers, data]);

      setForm({
        name: "",
        ddd: "",
        phoneNumber: "",
        cpf: "",
      });

      setPhoneError("");
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert(`Erro ao salvar cliente: ${error.message}`);
    }
  };

  const deleteCustomer = async (id, e) => {
    e.stopPropagation();

    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      const token = localStorage.getItem("byse_token");
      const user = JSON.parse(localStorage.getItem("byse_user") || "{}");

      try {
        const response = await fetch(`${API_URL}/customers/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-user-id": user.id || "user_1",
          },
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        setCustomers(customers.filter((c) => c.id !== id));
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        alert("Falha ao excluir o cliente no servidor.");
      }
    }
  };

  const clearAllCustomers = () => {
    if (
      confirm(
        "Tem certeza que deseja excluir TODOS os clientes? Esta ação não pode ser desfeita.",
      )
    ) {
      setCustomers([]);
    }
  };

  const historyFor = (customer) => {
    const custSales = sales.filter(
      (s) =>
        s.customer === customer.id ||
        s.customer === customer.name ||
        s.customer_id === customer.id ||
        s.customerId === customer.id,
    );

    const totalSpent = custSales.reduce((s, v) => s + v.total, 0);

    const avgTicket = custSales.length ? totalSpent / custSales.length : 0;

    return { custSales, totalSpent, avgTicket };
  };

  const daysSince = (customer) => {
    const custSales = sales.filter(
      (s) =>
        s.customer === customer.id ||
        s.customer === customer.name ||
        s.customer_id === customer.id ||
        s.customerId === customer.id,
    );

    if (custSales.length === 0) return null;

    const last = custSales.reduce(
      (max, s) => (new Date(s.date) > max ? new Date(s.date) : max),
      new Date(0),
    );

    return Math.floor((Date.now() - last.getTime()) / 86400000);
  };

  const saveCashback = async (id) => {
    const newCb = parseFloat(cashbackInput) || 0;
    const token = localStorage.getItem("byse_token");
    const user = JSON.parse(localStorage.getItem("byse_user") || "{}");

    const targetCust = customers.find((c) => c.id === id);

    if (targetCust) {
      try {
        const existingExpiry =
          targetCust.cashbackExpirationDate ||
          targetCust.cashback_expiration_date ||
          targetCust.cashbackExpiry ||
          targetCust.cashback_expiry ||
          null;

        const response = await fetch(`${API_URL}/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-user-id": user.id || "user_1",
          },
          body: JSON.stringify({
            ...targetCust,
            cashback: newCb,
            cashbackExpirationDate: existingExpiry,
            cashback_expiration_date: existingExpiry,
            cashbackExpiry: existingExpiry,
            cashback_expiry: existingExpiry,
          }),
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
      } catch (e) {
        console.error("Erro ao salvar cashback no servidor:", e);
      }
    }

    setCustomers(
      customers.map((c) => (c.id === id ? { ...c, cashback: newCb } : c)),
    );

    setEditingCashback(null);
  };

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const spendByCustomer = {};

  sales
    .filter((s) => new Date(s.date) >= monthAgo)
    .forEach((s) => {
      const cId = s.customer || s.customer_id || s.customerId;

      if (cId) {
        spendByCustomer[cId] = (spendByCustomer[cId] || 0) + s.total;
      }
    });

  const topCustomerId = Object.entries(spendByCustomer).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];

  return (
    <div>
      <SectionTitle
        title="Clientes"
        sub="Cadastro e histórico de compras"
        subtext={subtext}
      />

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 8,
            padding: "8px 12px",
          }}
        >
          <Search size={15} color={subtext} />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              color: text,
              fontSize: 13,
              flex: 1,
            }}
          />
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: accent,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={15} /> Novo cliente
        </button>

        {customers.length > 0 && (
          <button
            onClick={clearAllCustomers}
            style={{
              background: DANGER,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Trash2 size={15} /> Limpar tudo
          </button>
        )}
      </div>

      {showForm && (
        <div
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            
          }}
        >
          {/* Nome do cliente */}
          <div
            style={{
              
              gap: 6,  
            
              height:"100%",
              width: "100%",
              
            }}
          >
            <label
              style={{
                fontSize: 13,
                color: subtext,
                fontWeight: 600,
              }}
            >
              Nome do cliente
            </label>

            <input
              type="text"
              placeholder="Digite o nome do cliente"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{
                ...inputStyle(border, text),
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* WhatsApp do cliente */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              width: "100%",
            }}
          >
            <label
              style={{
                fontSize: 13,
                color: subtext,
                fontWeight: 600,
              }}
            >
              WhatsApp do cliente
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: 8,
                width: "100%",
              }}
            >
              {/* Código do país fixo */}
              <div
                title="Código do Brasil fixo"
                style={{
                  ...inputStyle(border, text),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 58,
                  boxSizing: "border-box",
                  fontWeight: 700,
                  background: `${border}55`,
                  cursor: "not-allowed",
                }}
              >
                +55
              </div>

              {/* DDD */}
              <input
                type="text"
                inputMode="numeric"
                placeholder="DDD"
                aria-label="DDD do cliente"
                value={form.ddd}
                maxLength={2}
                onChange={(e) => {
                  const ddd = e.target.value.replace(/\D/g, "").slice(0, 2);

                  setForm({ ...form, ddd });
                }}
                style={{
                  ...inputStyle(border, text),
                  width: 75,
                  minWidth: 65,
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              />

              {/* Número do WhatsApp */}
              <input
                type="text"
                inputMode="numeric"
                placeholder="Número com 8 dígitos"
                aria-label="Número do WhatsApp do cliente"
                value={form.phoneNumber}
                maxLength={8}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, "");

                  if (rawValue.length > 8) {
                    setPhoneError(
                      "Só pode ter 8 números. Remova o número excedente.",
                    );
                  } else {
                    setPhoneError("");
                  }

                  setForm({
                    ...form,
                    phoneNumber: rawValue.slice(0, 8),
                  });
                }}
                style={{
                  ...inputStyle(phoneError ? "#DC2626" : border, text),
                  flex: 1,
                  minWidth: 0,
                  boxSizing: "border-box",
                  border: `1px solid ${phoneError ? "#DC2626" : border}`,
                  outline: "none",
                  boxShadow: phoneError
                    ? "0 0 0 1px rgba(220, 38, 38, 0.15)"
                    : "none",
                }}
              />
            </div>

            {phoneError && (
              <span
                role="alert"
                style={{
                  color: "#DC2626",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                ⚠ {phoneError}
              </span>
            )}

            <span
              style={{
                color: subtext,
                fontSize: 11,
              }}
            >
              Exemplo: +55 · 83 · 81709857
            </span>
          </div>

          {/* CPF */}
          <div
            style={{
              
              gap: 6,
              width: "100%",
            }}
          >
            <label
              style={{
                fontSize: 13,
                color: subtext,
                fontWeight: 600,
              }}
            >
              CPF
            </label>

            <input
              type="text"
              placeholder="Digite o CPF (opcional)"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              style={{
                ...inputStyle(border, text),
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Botão salvar */}
          <button
            onClick={addCustomer}
            disabled={
              !form.name.trim() ||
              form.ddd.length !== 2 ||
              form.phoneNumber.length !== 8
            }
            style={{
              background: accent,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "11px 16px",
              width: "100%",
              boxSizing: "border-box",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              opacity:
                !form.name.trim() ||
                form.ddd.length !== 2 ||
                form.phoneNumber.length !== 8
                  ? 0.55
                  : 1,
            }}
          >
            Salvar cliente
          </button>
        </div>
      )}

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {filtered.map((c, i) => {
          const { custSales, totalSpent, avgTicket } = historyFor(c);

          const days = daysSince(c);
          const isOpen = selected === c.id;

          return (
            <div
              key={c.id}
              style={{
                borderBottom:
                  i < filtered.length - 1 ? `1px solid ${border}` : "none",
              }}
            >
              <div
                onClick={() => setSelected(isOpen ? null : c.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  cursor: "pointer",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {c.name}

                    {c.id === topCustomerId && (
                      <Pill color={accent}>TOP DO MÊS</Pill>
                    )}

                    {(days === null || days >= 30) && (
                      <Pill color={DANGER}>
                        {days === null
                          ? "nunca comprou"
                          : `${days}d sem comprar`}
                      </Pill>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: subtext,
                    }}
                  >
                    {c.phone} · {custSales.length} compra(s) · ticket médio{" "}
                    {money(avgTicket)} · Cashback:{" "}
                    <strong style={{ color: accent }}>
                      {money(c.cashback)}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <button
                    onClick={(e) => deleteCustomer(c.id, e)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: DANGER,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>

                  <ChevronRight
                    size={16}
                    style={{
                      transform: isOpen ? "rotate(90deg)" : "none",
                      transition: "transform .15s",
                    }}
                    color={subtext}
                  />
                </div>
              </div>

              {isOpen && (
                <div
                  style={{
                    padding: "0 14px 14px",
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      color: subtext,
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>CPF: {c.cpf || "não informado"}</span>

                    <span>· Cashback Atual:</span>

                    {editingCashback === c.id ? (
                      <>
                        <input
                          value={cashbackInput}
                          onChange={(e) => setCashbackInput(e.target.value)}
                          type="number"
                          style={{
                            ...inputStyle(border, text),
                            width: 90,
                            flex: "0 0 90px",
                          }}
                        />

                        <button
                          onClick={() => saveCashback(c.id)}
                          style={{
                            background: accent,
                            border: "none",
                            borderRadius: 6,
                            padding: "4px 8px",
                            cursor: "pointer",
                          }}
                        >
                          <Check size={12} color="#fff" />
                        </button>
                      </>
                    ) : (
                      <>
                        <b style={{ color: accent }}>{money(c.cashback)}</b>

                        <button
                          onClick={() => {
                            setEditingCashback(c.id);
                            setCashbackInput(String(c.cashback));
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <Edit2 size={12} color={subtext} />
                        </button>
                      </>
                    )}
                  </div>

                  {custSales.length === 0 && (
                    <div style={{ color: subtext }}>
                      Nenhuma compra registrada.
                    </div>
                  )}

                  {custSales.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderTop: `1px dashed ${border}`,
                      }}
                    >
                      <span>
                        {new Date(s.date).toLocaleDateString("pt-BR")} —{" "}
                        {(s.items || []).map((it) => it.name).join(", ")}
                      </span>

                      <span style={{ fontWeight: 700 }}>{money(s.total)}</span>
                    </div>
                  ))}

                  <div
                    style={{
                      marginTop: 8,
                      fontWeight: 700,
                    }}
                  >
                    Total gasto: {money(totalSpent)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { Clientes };
