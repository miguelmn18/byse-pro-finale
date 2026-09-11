// @ts-nocheck
import React, { useState } from "react";
import { inputStyle, lbl } from "../utils/helpers";

export function CustomerRegistration({ card, border, text, subtext, accent, onSave }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [initialCashback, setInitialCashback] = useState("0");
  const [validityDays, setValidityDays] = useState("30");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Nome e Telefone são obrigatórios!");
      return;
    }

    const days = parseInt(validityDays) || 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    const expiryDateStr = expiryDate.toISOString().split('T')[0];

    onSave({
      name,
      phone,
      cpf,
      data_aniversario: birthDate || null,
      cashback: parseFloat(initialCashback) || 0,
      cashback_expiry: expiryDateStr,
      cashback_expiration_date: expiryDateStr
    });
  };

  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 20 }}>
      <h3 style={{ color: text, margin: "0 0 15px 0", fontSize: 16 }}>Cadastro Inicial de Cliente com Cashback Personalizado</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={lbl(subtext)}>Nome do Cliente *</label>
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Ex: João Silva" 
            style={{ ...inputStyle(border, text), width: "100%", marginTop: 4 }} 
            required 
          />
        </div>
        <div>
          <label style={lbl(subtext)}>Telefone / WhatsApp *</label>
          <input 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            placeholder="(00) 00000-0000" 
            style={{ ...inputStyle(border, text), width: "100%", marginTop: 4 }} 
            required 
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={lbl(subtext)}>CPF</label>
            <input 
              value={cpf} 
              onChange={(e) => setCpf(e.target.value)} 
              placeholder="000.000.000-00" 
              style={{ ...inputStyle(border, text), width: "100%", marginTop: 4 }} 
            />
          </div>
          <div>
            <label style={lbl(subtext)}>Data de Aniversário</label>
            <input 
              type="date"
              value={birthDate} 
              onChange={(e) => setBirthDate(e.target.value)} 
              style={{ ...inputStyle(border, text), width: "100%", marginTop: 4 }} 
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={lbl(subtext)}>Cashback Inicial (R$)</label>
            <input 
              type="number"
              step="0.01"
              value={initialCashback} 
              onChange={(e) => setInitialCashback(e.target.value)} 
              placeholder="0.00" 
              style={{ ...inputStyle(border, text), width: "100%", marginTop: 4 }} 
            />
          </div>
          <div>
            <label style={lbl(subtext)}>Validade do Cashback (Dias)</label>
            <input 
              type="number"
              value={validityDays} 
              onChange={(e) => setValidityDays(e.target.value)} 
              placeholder="30" 
              style={{ ...inputStyle(border, text), width: "100%", marginTop: 4 }} 
            />
          </div>
        </div>
        <button 
          type="submit" 
          style={{ background: accent, color: "#fff", border: "none", borderRadius: 8, padding: 12, fontWeight: "bold", cursor: "pointer", marginTop: 10 }}
        >
          Salvar e Cadastrar Cliente
        </button>
      </form>
    </div>
  );
}