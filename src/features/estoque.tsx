// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { FONT_BODY } from "../data/constants";
import { money, inputStyle, ghostBtn } from "../utils/helpers";
import { SectionTitle, HBar } from "../components/common";

export function Estoque({
  products,
  setProducts,
  stockLocations,
  setStockLocations,
  onDeleteProduct,
  onEditProduct,
  card,
  border,
  subtext,
  accent,
  text
}) {
  const [showLocations, setShowLocations] = useState(false);
  const [newLocName, setNewLocName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const blankForm = {
    name: "",
    category: "",
    cost: "",
    price: "",
    imposto: "",
    frete: "",
    vipPrice: "",
    vipPrice3x: "",
    barcode: "",
    code: "",
    description: "",
    controlStock: true,
    stocks: {},
    imageUrl: null
  };

  const [form, setForm] = useState(blankForm);

  const renameLoc = async (id, name) => {
    const updatedLocs = stockLocations.map((l) => (l.id === id ? { ...l, name } : l));
    setStockLocations(updatedLocs);
  };

  const addLoc = () => {
    if (!newLocName.trim()) return;
    const newLocs = [...stockLocations, { id: `loc_${Date.now()}`, name: newLocName.trim() }];
    setStockLocations(newLocs);
    setNewLocName("");
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      category: p.category || "",
      cost: p.cost != null ? String(p.cost) : "",
      price: p.price != null ? String(p.price) : "",
      imposto: p.imposto != null ? String(p.imposto) : "",
      frete: p.frete != null ? String(p.frete) : "",
      vipPrice: p.vip_price != null ? String(p.vip_price) : (p.vipPrice != null ? String(p.vipPrice) : ""),
      vipPrice3x: p.vip_price_3x != null ? String(p.vip_price_3x) : (p.vipPrice3x != null ? String(p.vipPrice3x) : ""),
      barcode: p.barcode || "",
      code: p.code || "",
      description: p.description || "",
      controlStock: p.control_stock ?? (p.controlStock ?? true),
      stocks: Object.fromEntries(
        Object.entries(p.stocks || {}).map(([k, v]) => [k, String(v)])
      ),
      imageUrl: p.image_url || p.imageUrl || null
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(blankForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setForm((f) => ({ ...f, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const pctOfCost = (val) => {
    const c = parseFloat(form.cost);
    const v = parseFloat(val);
    if (!c || !v) return null;
    return (v / c) * 100;
  };

  const saveProduct = async () => {
    if (!form.name || !form.price) return;
    
    const stocksObj = form.controlStock
      ? Object.fromEntries(
          stockLocations.map((l) => [
            l.id,
            parseInt(form.stocks[l.id]) || 0
          ])
        )
      : {};

    const built = {
      id: editingId || "prod_" + Date.now(),
      name: form.name,
      category: form.category || "Sem categoria",
      barcode: form.barcode || "",
      code: form.code || "",
      cost: parseFloat(form.cost) || 0,
      price: parseFloat(form.price) || 0,
      imposto: form.imposto ? parseFloat(form.imposto) : 0,
      frete: form.frete ? parseFloat(form.frete) : 0,
      vip_price: form.vipPrice !== "" && form.vipPrice != null ? parseFloat(form.vipPrice) : null,
      vip_price_3x: form.vipPrice3x !== "" && form.vipPrice3x != null ? parseFloat(form.vipPrice3x) : null,
      description: form.description || "",
      control_stock: Boolean(form.controlStock),
      image_url: form.imageUrl || null,
      stocks: stocksObj
    };

    if (editingId) {
      if (onEditProduct) {
        await onEditProduct(built);
      }
    } else {
      if (setProducts) {
        await setProducts(built);
      }
    }
    cancelForm();
  };

  const removeProduct = async (id) => {
    if (!confirm("Deseja realmente remover este produto?")) return;
    if (onDeleteProduct) {
      await onDeleteProduct(id);
    }
  };

  const gridCols = `2fr 1fr 0.7fr 0.7fr 0.8fr 0.8fr ${stockLocations
    .map(() => "0.9fr")
    .join(" ")} 0.6fr`;

  return (
    <div>
      <SectionTitle
        title="Controle de estoque"
        sub="Múltiplos pontos de estoque — Valor Vip À VISTA e VIP 3x s/ juros"
        subtext={subtext}
      />

      <button
        onClick={() => setShowLocations(!showLocations)}
        style={{ ...ghostBtn(border, text), marginBottom: 12 }}
      >
        {showLocations
          ? "Ocultar locais de estoque"
          : "Editar locais de estoque"}
      </button>

      {showLocations && (
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 16
          }}
        >
          {stockLocations.map((l) => (
            <input
              key={l.id}
              value={l.name}
              onChange={(e) => renameLoc(l.id, e.target.value)}
              style={{
                ...inputStyle(border, text),
                width: "100%",
                marginBottom: 6
              }}
            />
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              value={newLocName}
              onChange={(e) => setNewLocName(e.target.value)}
              placeholder="Novo local (ex: Filial Boa Viagem)"
              style={{ ...inputStyle(border, text), flex: 1 }}
            />
            <button
              onClick={addLoc}
              style={{
                background: accent,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0 14px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              + Adicionar
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => (showForm ? cancelForm() : setShowForm(true))}
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
          marginBottom: 16
        }}
      >
        <Plus size={15} />{" "}
        {editingId ? "Editando produto" : "Cadastrar produto"}
      </button>

      {showForm && (
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 10
            }}
          >
            <input
              placeholder="Nome do produto"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              style={inputStyle(border, text)}
            />
            <input
              placeholder="Categoria"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              style={inputStyle(border, text)}
            />
            <input
              placeholder="Código de barras"
              value={form.barcode}
              onChange={(e) =>
                setForm({ ...form, barcode: e.target.value })
              }
              style={inputStyle(border, text)}
            />
            <input
              placeholder="Código rápido (ex: 30) - Usado no Catálogo"
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value })
              }
              style={inputStyle(border, text)}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 10
            }}
          >
            <input
              placeholder="Custo (R$)"
              type="number"
              value={form.cost}
              onChange={(e) =>
                setForm({ ...form, cost: e.target.value })
              }
              style={inputStyle(border, text)}
            />
            <input
              placeholder="Valor de venda (R$)"
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: e.target.value })
              }
              style={inputStyle(border, text)}
            />
            <input
              placeholder="Valor Vip À VISTA (R$)"
              type="number"
              value={form.vipPrice}
              onChange={(e) =>
                setForm({ ...form, vipPrice: e.target.value })
              }
              style={{ ...inputStyle(border, text), borderColor: accent }}
            />
            <input
              placeholder="Valor VIP 3x s/ juros (R$)"
              type="number"
              value={form.vipPrice3x}
              onChange={(e) =>
                setForm({ ...form, vipPrice3x: e.target.value })
              }
              style={{ ...inputStyle(border, text), borderColor: accent }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 10
            }}
          >
            <div style={{ flex: "1 1 150px" }}>
              <input
                placeholder="Imposto (R$)"
                type="number"
                value={form.imposto}
                onChange={(e) =>
                  setForm({ ...form, imposto: e.target.value })
                }
                style={{ ...inputStyle(border, text), width: "100%" }}
              />
              <div
                style={{
                  fontSize: 10.5,
                  color: subtext,
                  marginTop: 3
                }}
              >
                {pctOfCost(form.imposto) != null
                  ? `${pctOfCost(form.imposto).toFixed(1)}% do custo`
                  : "% do custo (automático)"}
              </div>
            </div>

            <div style={{ flex: "1 1 150px" }}>
              <input
                placeholder="Frete (R$)"
                type="number"
                value={form.frete}
                onChange={(e) =>
                  setForm({ ...form, frete: e.target.value })
                }
                style={{ ...inputStyle(border, text), width: "100%" }}
              />
              <div
                style={{
                  fontSize: 10.5,
                  color: subtext,
                  marginTop: 3
                }}
              >
                {pctOfCost(form.frete) != null
                  ? `${pctOfCost(form.frete).toFixed(1)}% do custo`
                  : "% do custo (automático)"}
              </div>
            </div>
          </div>

          <textarea
            placeholder="Descrição (aparece no catálogo)"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            rows={2}
            style={{
              ...inputStyle(border, text),
              width: "100%",
              marginBottom: 10,
              fontFamily: FONT_BODY,
              resize: "vertical"
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
              flexWrap: "wrap"
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: text
              }}
            >
              <input
                type="checkbox"
                checked={form.controlStock}
                onChange={(e) =>
                  setForm({ ...form, controlStock: e.target.checked })
                }
              />{" "}
              Controlar estoque
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12.5,
                color: subtext
              }}
            >
              Foto:{" "}
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                style={{ fontSize: 11 }}
              />
            </label>
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="preview"
                style={{
                  width: 40,
                  height: 40,
                  objectFit: "cover",
                  borderRadius: 6
                }}
              />
            )}
          </div>

          {form.controlStock && (
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 10
              }}
            >
              {stockLocations.map((l) => (
                <input
                  key={l.id}
                  placeholder={`Qtd. ${l.name}`}
                  type="number"
                  value={form.stocks[l.id] ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stocks: {
                        ...form.stocks,
                        [l.id]: e.target.value
                      }
                    })
                  }
                  style={inputStyle(border, text)}
                />
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={saveProduct}
              style={{
                background: accent,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Salvar produto
            </button>
            {editingId && (
              <button
                onClick={cancelForm}
                style={{
                  background: "transparent",
                  border: `1px solid ${border}`,
                  color: text,
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          overflow: "auto"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            padding: "10px 14px",
            fontSize: 11,
            color: subtext,
            fontWeight: 700,
            borderBottom: `1px solid ${border}`,
            textTransform: "uppercase",
            minWidth: 700
          }}
        >
          <div>Produto</div>
          <div>Categoria</div>
          <div>Custo</div>
          <div>Venda</div>
          <div>VIP À Vista</div>
          <div>VIP 3x</div>
          {stockLocations.map((l) => (
            <div key={l.id}>{l.name}</div>
          ))}
          <div></div>
        </div>

        {Array.isArray(products) && products.map((p, i) => {
          const pVipPrice = p.vip_price !== undefined ? p.vip_price : p.vipPrice;
          const pVipPrice3x = p.vip_price_3x !== undefined ? p.vip_price_3x : p.vipPrice3x;
          const pControlStock = p.control_stock !== undefined ? p.control_stock : p.controlStock;
          
          return (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: gridCols,
                padding: "12px 14px",
                fontSize: 13,
                alignItems: "center",
                borderBottom:
                  i < products.length - 1 ? `1px solid ${border}` : "none",
                minWidth: 700
              }}
            >
              <div style={{ fontWeight: 600 }}>
                {p.name}
                {(p.barcode || p.code) && (
                  <div
                    style={{
                      fontSize: 11,
                      color: subtext,
                      fontWeight: 400
                    }}
                  >
                    {p.code && `cód. ${p.code}`}
                    {p.code && p.barcode && " · "}
                    {p.barcode}
                  </div>
                )}
              </div>
              <div>{p.category}</div>
              <div>{money(p.cost)}</div>
              <div style={{ fontWeight: 700 }}>{money(p.price)}</div>
              <div style={{ fontWeight: 700, color: accent }}>{pVipPrice != null ? money(pVipPrice) : "—"}</div>
              <div style={{ fontWeight: 700, color: accent }}>{pVipPrice3x != null ? money(pVipPrice3x) : "—"}</div>

              {stockLocations.map((l) => (
                <div key={l.id}>
                  {pControlStock !== false ? (
                    <>
                      <div>{p.stocks?.[l.id] ?? 0}</div>
                      <div style={{ marginTop: 3 }}>
                        <HBar
                          pct={(((p.stocks?.[l.id] ?? 0)) / 50) * 100}
                          color={accent}
                          border={border}
                          h={4}
                        />
                      </div>
                    </>
                  ) : (
                    <span style={{ color: subtext }}>—</span>
                  )}
                </div>
              ))}

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => startEdit(p)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  <Edit2 size={14} color={subtext} />
                </button>
                <button
                  onClick={() => removeProduct(p.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
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