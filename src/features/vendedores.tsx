// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { SectionTitle } from "../components/common";
import { money, inputStyle } from "../utils/helpers";

export function Vendedores({ sellers, setSellers, sales, card, border, subtext, accent, text }) {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", commissionPct: "5" });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("byse_token");
    const user = JSON.parse(localStorage.getItem("byse_user") || "{}");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "x-user-id": user.id || localStorage.getItem("userId") || "user_1"
    };
  };

  // BUSCA OS VENDEDORES DO BANCO DE DADOS ASSIM QUE O COMPONENTE É CARREGADO
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vendedores`, {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setSellers(data);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar vendedores do banco:", error);
      }
    };

    fetchSellers();
  }, [API_URL, setSellers]);

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({ name: s.name, commissionPct: String(s.commissionPct ?? 5) });
    setShowForm(true);
  };

  const cancel = () => {
    setForm({ name: "", commissionPct: "5" });
    setEditingId(null);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    
    const sellerPayload = {
      id: editingId || ("s" + Date.now()),
      name: form.name.trim(),
      commissionPct: parseFloat(form.commissionPct) || 0
    };

    try {
      const response = await fetch(`${API_URL}/api/vendedores`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(sellerPayload)
      });

      if (!response.ok) throw new Error("Erro ao salvar no servidor");

      const result = await response.json();
      const savedSeller = result.seller || sellerPayload;

      if (editingId) {
        setSellers(sellers.map((s) => (s.id === editingId ? savedSeller : s)));
      } else {
        setSellers([...sellers, savedSeller]);
      }
      cancel();
    } catch (error) {
      console.error("Erro ao salvar vendedor:", error);
      alert("Erro ao salvar vendedor no servidor.");
    }
  };

  const remove = async (id) => {
    if (!confirm("Deseja realmente excluir este vendedor?")) return;
    try {
      const response = await fetch(`${API_URL}/api/vendedores/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error("Erro ao excluir no servidor");

      setSellers(sellers.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Erro ao remover vendedor:", error);
      alert("Erro ao remover vendedor do servidor.");
    }
  };

  return (
    <div>
      <SectionTitle title="Vendedores" sub="Desempenho de vendas e comissão" subtext={subtext} />
      
      <button 
        onClick={() => (showForm ? cancel() : setShowForm(true))} 
        style={{ 
          background: accent, color: "#fff", border: "none", borderRadius: 8, 
          padding: "8px 16px", display: "flex", alignItems: "center", gap: 6, 
          fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16 
        }}
      >
        <Plus size={15} /> {editingId ? "Editando vendedor" : "Novo vendedor"}
      </button>

      {showForm && (
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input 
            placeholder="Nome" 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            style={inputStyle(border, text)} 
          />
          <input 
            placeholder="Comissão (%)" 
            type="number" 
            step="0.1"
            value={form.commissionPct} 
            onChange={(e) => setForm({ ...form, commissionPct: e.target.value })} 
            style={{ ...inputStyle(border, text), flex: "0 0 130px" }} 
          />
          <button 
            onClick={save} 
            style={{ background: accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Salvar
          </button>
          {editingId && (
            <button 
              onClick={cancel} 
              style={{ background: "transparent", border: `1px solid ${border}`, color: text, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Cancelar
            </button>
          )}
        </div>
      )}

      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 0.6fr", padding: "10px 14px", fontSize: 11, color: subtext, fontWeight: 700, borderBottom: `1px solid ${border}`, textTransform: "uppercase" }}>
          <div>Vendedor</div><div>Vendas</div><div>Faturado</div><div>Comissão</div><div></div>
        </div>

        {sellers.map((s, i) => {
          const sellerSales = sales.filter((v) => v.seller === s.name || v.seller === s.id);
          const total = sellerSales.reduce((a, v) => a + v.total, 0);
          const commissionPct = Number(s.commissionPct || 0);
          const commission = (total * commissionPct) / 100;

          return (
            <div key={s.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 0.6fr", padding: "12px 14px", fontSize: 13, alignItems: "center", borderBottom: i < sellers.length - 1 ? `1px solid ${border}` : "none" }}>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div>{sellerSales.length}</div>
              <div style={{ fontWeight: 700 }}>{money(total)}</div>
              <div style={{ color: accent, fontWeight: 700 }}>
                {money(commission)} <span style={{ color: subtext, fontWeight: 400 }}>({commissionPct}%)</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => startEdit(s)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <Edit2 size={14} color={subtext} />
                </button>
                <button onClick={() => remove(s.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <Trash2 size={14} color={subtext} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}