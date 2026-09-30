// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { SectionTitle } from "../components/common";
import { money, inputStyle } from "../utils/helpers";

export function Vendedores({
  sellers = [],
  setSellers,
  sales = [],
  card,
  border,
  subtext,
  accent,
  text,
}) {
  const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:3333"
  ).replace(/\/+$/, "");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", commissionPct: "5" });
  const [saving, setSaving] = useState(false);

  const headers = () => {
    const token = localStorage.getItem("byse_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API_URL}/api/sellers`, { headers: headers() });
        const data = await r.json().catch(() => []);
        if (!r.ok) throw new Error(data.error || `Erro ${r.status}`);
        if (Array.isArray(data)) setSellers(data);
      } catch (e) {
        console.error("Erro ao carregar vendedores:", e);
      }
    };
    load();
  }, [API_URL]);

  const startEdit = (s) => {
    const pct = s.commissionPct ?? s.commission_pct ?? 5;
    setEditingId(s.id);
    setForm({
      name: s.name || "",
      commissionPct: String(pct),
    });
    setShowForm(true);
  };

  const cancel = () => {
    setEditingId(null);
    setForm({ name: "", commissionPct: "5" });
    setShowForm(false);
  };

  const save = async () => {
    const name = String(form.name || "").trim();
    if (!name) {
      alert("Informe o nome do vendedor.");
      return;
    }

    const parsed = parseFloat(String(form.commissionPct || "5"));
    const commissionPct = Number.isFinite(parsed) ? parsed : 5;

    setSaving(true);

    try {
      const editing = Boolean(editingId);

      const payload = {
        ...(editing ? { id: editingId } : {}),
        name,
        commissionPct,
        commission_pct: commissionPct,
      };

      const r = await fetch(
        editing
          ? `${API_URL}/api/sellers/${encodeURIComponent(editingId)}`
          : `${API_URL}/api/sellers`,
        {
          method: editing ? "PUT" : "POST",
          headers: headers(),
          body: JSON.stringify(payload),
        },
      );

      const data = await r.json().catch(() => ({}));

      if (!r.ok)
        throw new Error(
          data.error || data.message || `Erro ao salvar vendedor (${r.status})`,
        );

      const pct = Number(
        data.commissionPct ?? data.commission_pct ?? commissionPct,
      );

      const saved = {
        id: data.id || (editing ? editingId : null),
        name: data.name || name,
        commissionPct: pct,
        commission_pct: pct,
      };

      setSellers((prev) => {
        const list = Array.isArray(prev) ? prev : [];

        if (editing) {
          return list.map((s) =>
            String(s.id) === String(saved.id) ? { ...s, ...saved } : s,
          );
        }

        const exists = list.some((s) => String(s.id) === String(saved.id));

        return exists
          ? list.map((s) =>
              String(s.id) === String(saved.id) ? { ...s, ...saved } : s,
            )
          : [...list, saved];
      });

      cancel();
    } catch (e) {
      console.error("Erro ao salvar vendedor:", e);
      alert(`Erro ao salvar vendedor: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };


  const getAuthHeaders = () => {
  const token = localStorage.getItem("byse_token");

  return {
    "Content-Type": "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {})
  };
};

  const remove = async (id) => {
    if (!confirm("Deseja realmente excluir este vendedor?")) return;

    try {
      const response = await fetch(`${API_URL}/api/sellers/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok)
        throw new Error(
          data.error || `Erro ao excluir vendedor (${response.status})`,
        );

      setSellers((prev) => prev.filter((s) => String(s.id) !== String(id)));
    } catch (error) {
      console.error("Erro ao remover vendedor:", error);
      alert(`Erro ao remover vendedor: ${error.message}`);
    }
  };

  return (
    <div>
      <SectionTitle
        title="Vendedores"
        sub="Desempenho de vendas e comissão"
        subtext={subtext}
      />

      <button
        onClick={() => (showForm ? cancel() : setShowForm(true))}
        style={{
          background: accent,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "9px 14px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        {showForm ? <Trash2 size={15} /> : <Plus size={15} />}
        {showForm ? "Cancelar" : "Novo vendedor"}
      </button>

      {showForm && (
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 180px auto",
              gap: 10,
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: subtext,
                  marginBottom: 5,
                }}
              >
                Nome
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome do vendedor"
                style={inputStyle(border, text)}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: subtext,
                  marginBottom: 5,
                }}
              >
                Comissão (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.commissionPct}
                onChange={(e) =>
                  setForm({ ...form, commissionPct: e.target.value })
                }
                style={inputStyle(border, text)}
              />
            </div>

            <button
              onClick={save}
              disabled={saving}
              style={{
                height: 38,
                padding: "0 16px",
                border: "none",
                borderRadius: 8,
                background: accent,
                color: "#fff",
                cursor: saving ? "wait" : "pointer",
                fontWeight: 600,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? "Salvando..."
                : editingId
                  ? "Salvar alteração"
                  : "Cadastrar"}
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {!sellers.length ? (
          <div style={{ padding: 25, textAlign: "center", color: subtext }}>
            Nenhum vendedor cadastrado.
          </div>
        ) : (
          sellers.map((s) => {
            const sellerSales = sales.filter(
              (v) => v.seller === s.name || v.seller === s.id,
            );

            const total = sellerSales.reduce(
              (a, v) => a + Number(v.total || 0),
              0,
            );

            const commissionPct = Number(
              s.commissionPct ?? s.commission_pct ?? 5,
            );

            const commission = (total * commissionPct) / 100;

            return (
              <div
                key={s.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 110px 130px 100px 90px",
                  gap: 10,
                  alignItems: "center",
                  padding: "13px 15px",
                  borderBottom: `1px solid ${border}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: text }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: subtext }}>
                    {sellerSales.length} venda(s)
                  </div>
                </div>

                <div style={{ fontSize: 12, color: subtext }}>
                  {commissionPct}%
                </div>

                <div style={{ fontSize: 13 }}>{money(total)}</div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: accent,
                  }}
                >
                  {money(commission)}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 5,
                  }}
                >
                  <button
                    onClick={() => startEdit(s)}
                    title="Editar"
                    style={{
                      width: 32,
                      height: 32,
                      border: `1px solid ${border}`,
                      background: "transparent",
                      color: text,
                      borderRadius: 7,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    onClick={() => remove(s.id)}
                    title="Excluir"
                    style={{
                      width: 32,
                      height: 32,
                      border: "1px solid #7f1d1d",
                      background: "transparent",
                      color: "#ef4444",
                      borderRadius: 7,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={14} />
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

export default Vendedores;
