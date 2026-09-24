// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, X, Eye } from "lucide-react";
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
  
  // Estado para armazenar a categoria selecionada no filtro
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  // Estado para o Modal/Gaveta de Detalhes do Produto
  const [viewingProduct, setViewingProduct] = useState(null);

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
    variations: [],
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

  const addVariation = () => {
    setForm(f => ({
      ...f,
      variations: [
        ...(f.variations || []),
        { id: `var_${Date.now()}_${Math.random()}`, name: "", stocks: {} }
      ]
    }));
  };

  const updateVariationName = (varId, name) => {
    setForm(f => ({
      ...f,
      variations: (f.variations || []).map(v => v.id === varId ? { ...v, name } : v)
    }));
  };

  const updateVariationStock = (varId, locId, value) => {
    setForm(f => ({
      ...f,
      variations: (f.variations || []).map(v => {
        if (v.id === varId) {
          return {
            ...v,
            stocks: { ...(v.stocks || {}), [locId]: value }
          };
        }
        return v;
      })
    }));
  };

  const removeVariation = (varId) => {
    setForm(f => ({
      ...f,
      variations: (f.variations || []).filter(v => v.id !== varId)
    }));
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    
    // Normaliza as variações existentes para o formato do form garantindo leitura correta
    const rawVariations = p.variations || p.subcategories || [];
    const parsedVariations = rawVariations.map((v, idx) => ({
      id: v.id || `var_${idx}_${Date.now()}`,
      name: v.name || "",
      stocks: Object.fromEntries(
        Object.entries(v.stocks || {}).map(([k, val]) => [k, String(val)])
      )
    }));

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
      variations: parsedVariations,
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

    const builtVariations = (form.variations || []).map(v => ({
      id: v.id || `var_${Date.now()}`,
      name: v.name || "Padrão",
      stocks: Object.fromEntries(
        stockLocations.map(l => [l.id, parseInt(v.stocks?.[l.id]) || 0])
      )
    }));

    const built = {
      id: editingId || `prod_${Date.now()}`,
      name: form.name,
      category: form.category || "Sem categoria",
      barcode: form.barcode || "",
      code: form.code || "",
      cost: parseFloat(form.cost) || 0,
      price: parseFloat(form.price) || 0,
      imposto: form.imposto ? parseFloat(form.imposto) : 0,
      frete: form.frete ? parseFloat(form.frete) : 0,
      vipPrice: form.vipPrice !== "" && form.vipPrice != null ? parseFloat(form.vipPrice) : null,
      vip_price: form.vipPrice !== "" && form.vipPrice != null ? parseFloat(form.vipPrice) : null,
      vipPrice3x: form.vipPrice3x !== "" && form.vipPrice3x != null ? parseFloat(form.vipPrice3x) : null,
      vip_price_3x: form.vipPrice3x !== "" && form.vipPrice3x != null ? parseFloat(form.vipPrice3x) : null,
      description: form.description || "",
      controlStock: Boolean(form.controlStock),
      control_stock: Boolean(form.controlStock),
      imageUrl: form.imageUrl || null,
      image_url: form.imageUrl || null,
      stocks: stocksObj,
      variations: builtVariations
    };

    try {
      const token = localStorage.getItem("byse_token");
      const rawApiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === "localhost" ? "http://localhost:3333/api" : "https://byse-pro-backend-production.up.railway.app/api");
      const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl}/api`;

      const endpoint = editingId ? `${API_URL}/products/${editingId}` : `${API_URL}/products`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(built)
      });

      if (response.ok) {
        const savedData = await response.json();
        const finalProduct = {
          ...built,
          ...savedData,
          variations: savedData.variations || savedData.subcategories || built.variations
        };

        if (editingId) {
          if (onEditProduct) {
            await onEditProduct(finalProduct);
          } else if (setProducts) {
            const currentList = Array.isArray(products) ? products : [];
            setProducts(currentList.map(p => p.id === finalProduct.id ? finalProduct : p));
          }
        } else {
          if (setProducts) {
            if (typeof setProducts === "function") {
              const currentList = Array.isArray(products) ? products : [];
              setProducts([finalProduct, ...currentList]);
            }
          }
        }
      } else {
        if (editingId && onEditProduct) {
          await onEditProduct(built);
        } else if (!editingId && setProducts) {
          const currentList = Array.isArray(products) ? products : [];
          setProducts([built, ...currentList]);
        }
      }
    } catch (err) {
      console.error("Erro ao salvar produto no backend:", err);
      if (editingId && onEditProduct) {
        await onEditProduct(built);
      } else if (!editingId && setProducts) {
        const currentList = Array.isArray(products) ? products : [];
        setProducts([built, ...currentList]);
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

  const categories = [
    "Todas",
    ...Array.from(
      new Set(
        (Array.isArray(products) ? products : []).map(
          (p) => p.category || "Sem categoria"
        )
      )
    )
  ];

  const filteredProducts = Array.isArray(products)
    ? products.filter((p) => {
        const cat = p.category || "Sem categoria";
        return selectedCategory === "Todas" || cat === selectedCategory;
      })
    : [];

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
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: text, marginBottom: 6 }}>
                Estoque Principal / Global:
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 14
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

              <div style={{ borderTop: `1px dashed ${border}`, paddingTop: 12, marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: text }}>
                    Subcategorias / Variações (ex: Sabores, Cores, Tamanhos)
                  </div>
                  <button
                    type="button"
                    onClick={addVariation}
                    style={{
                      background: "transparent",
                      border: `1px solid ${accent}`,
                      color: accent,
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    + Adicionar Variação
                  </button>
                </div>

                {(form.variations || []).map((v) => (
                  <div
                    key={v.id}
                    style={{
                      background: card,
                      border: `1px solid ${border}`,
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        placeholder='Nome da variação (ex: "Chocolate")'
                        value={v.name}
                        onChange={(e) => updateVariationName(v.id, e.target.value)}
                        style={{ ...inputStyle(border, text), flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeVariation(v.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {stockLocations.map((l) => (
                        <input
                          key={l.id}
                          placeholder={`Qtd ${l.name} (${v.name || "Variação"})`}
                          type="number"
                          value={v.stocks?.[l.id] ?? ""}
                          onChange={(e) => updateVariationStock(v.id, l.id, e.target.value)}
                          style={{ ...inputStyle(border, text), flex: "1 1 120px" }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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

      {/* Barra de Filtro por Categoria */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              background: selectedCategory === cat ? accent : card,
              color: selectedCategory === cat ? "#fff" : text,
              border: `1px solid ${selectedCategory === cat ? accent : border}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

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

        {filteredProducts.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: subtext, fontSize: 13 }}>
            Nenhum produto encontrado nesta categoria.
          </div>
        )}

        {filteredProducts.map((p, i) => {
          const pVipPrice = p.vip_price !== undefined ? p.vip_price : p.vipPrice;
          const pVipPrice3x = p.vip_price_3x !== undefined ? p.vip_price_3x : p.vipPrice3x;
          const pControlStock = p.control_stock !== undefined ? p.control_stock : p.controlStock;
          const pImageUrl = p.image_url || p.imageUrl;
          const pVariations = Array.isArray(p.variations) ? p.variations : (p.subcategories || []);
          
          return (
            <div
              key={p.id}
              onClick={() => setViewingProduct(p)}
              style={{
                display: "grid",
                gridTemplateColumns: gridCols,
                padding: "12px 14px",
                fontSize: 13,
                alignItems: "center",
                borderBottom:
                  i < filteredProducts.length - 1 ? `1px solid ${border}` : "none",
                minWidth: 700,
                cursor: "pointer",
                transition: "background 0.15s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${accent}08`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
                {pImageUrl && (
                  <img
                    src={pImageUrl}
                    alt={p.name}
                    style={{
                      width: 32,
                      height: 32,
                      objectFit: "cover",
                      borderRadius: 4,
                      flexShrink: 0
                    }}
                  />
                )}
                <div>
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

                  {/* Exibição das subcategorias/variações e somatório automático na tabela */}
                  {pVariations.length > 0 && (
                    <div style={{ fontSize: 11, color: subtext, marginTop: 3, fontWeight: 400 }}>
                      {pVariations.map((v, vIdx) => {
                        const varTotal = Object.values(v.stocks || {}).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
                        return (
                          <span key={vIdx}>
                            {v.name}: {varTotal}{vIdx < pVariations.length - 1 ? " | " : ""}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div>{p.category}</div>
              <div>{money(p.cost)}</div>
              <div style={{ fontWeight: 700 }}>{money(p.price)}</div>
              <div style={{ fontWeight: 700, color: accent }}>{pVipPrice != null ? money(pVipPrice) : "—"}</div>
              <div style={{ fontWeight: 700, color: accent }}>{pVipPrice3x != null ? money(pVipPrice3x) : "—"}</div>

              {stockLocations.map((l) => {
                const globalLocStock = Number(p.stocks?.[l.id] || 0);
                const variationsLocStock = pVariations.reduce((acc, v) => acc + (Number(v.stocks?.[l.id]) || 0), 0);
                const totalLocStock = globalLocStock + variationsLocStock;

                return (
                  <div key={l.id}>
                    {pControlStock !== false ? (
                      <>
                        <div>{totalLocStock}</div>
                        <div style={{ marginTop: 3 }}>
                          <HBar
                            pct={(totalLocStock / 50) * 100}
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
                );
              })}

              <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setViewingProduct(p)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                  title="Ver detalhes"
                >
                  <Eye size={14} color={subtext} />
                </button>
                <button
                  onClick={() => startEdit(p)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                  title="Editar"
                >
                  <Edit2 size={14} color={subtext} />
                </button>
                <button
                  onClick={() => removeProduct(p.id)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                  title="Excluir"
                >
                  <Trash2 size={14} color={subtext} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Gaveta de Detalhes Completos do Produto */}
      {viewingProduct && (() => {
        const vp = viewingProduct;
        const vpVipPrice = vp.vip_price !== undefined ? vp.vip_price : vp.vipPrice;
        const vpVipPrice3x = vp.vip_price_3x !== undefined ? vp.vip_price_3x : vp.vipPrice3x;
        const vpControlStock = vp.control_stock !== undefined ? vp.control_stock : vp.controlStock;
        const vpImageUrl = vp.image_url || vp.imageUrl;
        const vpVariations = Array.isArray(vp.variations) ? vp.variations : (vp.subcategories || []);

        return (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: 16
            }}
            onClick={() => setViewingProduct(null)}
          >
            <div
              style={{
                background: card,
                border: `1px solid ${border}`,
                borderRadius: 16,
                width: "100%",
                maxWidth: 700,
                maxHeight: "90vh",
                overflowY: "auto",
                padding: 24,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                position: "relative"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botão Fechar */}
              <button
                onClick={() => setViewingProduct(null)}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: text,
                  padding: 4
                }}
              >
                <X size={20} />
              </button>

              {/* Cabeçalho do Modal */}
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
                {vpImageUrl ? (
                  <img
                    src={vpImageUrl}
                    alt={vp.name}
                    style={{
                      width: 90,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 10,
                      border: `1px solid ${border}`
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 90,
                      height: 90,
                      background: `${accent}15`,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: accent,
                      fontWeight: 700,
                      fontSize: 12
                    }}
                  >
                    Sem foto
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 12, color: accent, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                    {vp.category || "Sem categoria"}
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: text, margin: "0 0 6px 0" }}>
                    {vp.name}
                  </h2>
                  <div style={{ fontSize: 12, color: subtext, display: "flex", gap: 12 }}>
                    {vp.code && <span>Cód. rápido: <strong>{vp.code}</strong></span>}
                    {vp.barcode && <span>Cód. barras: <strong>{vp.barcode}</strong></span>}
                  </div>
                </div>
              </div>

              {/* Descrição */}
              {vp.description && (
                <div style={{ marginBottom: 20, background: `${border}20`, padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: subtext, textTransform: "uppercase", marginBottom: 4 }}>
                    Descrição
                  </div>
                  <div style={{ fontSize: 13, color: text, lineHeight: 1.4 }}>
                    {vp.description}
                  </div>
                </div>
              )}

              {/* Grid de Preços e Custos */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
                <div style={{ background: `${border}15`, padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: subtext, fontWeight: 600 }}>Custo</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: text, marginTop: 2 }}>{money(vp.cost)}</div>
                </div>
                <div style={{ background: `${border}15`, padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: subtext, fontWeight: 600 }}>Venda Padrão</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: text, marginTop: 2 }}>{money(vp.price)}</div>
                </div>
                <div style={{ background: `${accent}15`, border: `1px solid ${accent}40`, padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: accent, fontWeight: 600 }}>VIP À Vista</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: accent, marginTop: 2 }}>
                    {vpVipPrice != null ? money(vpVipPrice) : "—"}
                  </div>
                </div>
                <div style={{ background: `${accent}15`, border: `1px solid ${accent}40`, padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: accent, fontWeight: 600 }}>VIP 3x S/ Juros</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: accent, marginTop: 2 }}>
                    {vpVipPrice3x != null ? money(vpVipPrice3x) : "—"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                <div style={{ background: `${border}15`, padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: subtext, fontWeight: 600 }}>Imposto</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: text, marginTop: 2 }}>{money(vp.imposto)}</div>
                </div>
                <div style={{ background: `${border}15`, padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: subtext, fontWeight: 600 }}>Frete</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: text, marginTop: 2 }}>{money(vp.frete)}</div>
                </div>
              </div>

              {/* Distribuição de Estoque */}
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 12 }}>
                  Distribuição de Estoque por Local
                </div>

                {vpControlStock === false ? (
                  <div style={{ fontSize: 12, color: subtext, fontStyle: "italic", marginBottom: 12 }}>
                    Este produto está configurado para **não controlar estoque**.
                  </div>
                ) : (
                  <>
                    {/* Totais por Local */}
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${stockLocations.length}, 1fr)`, gap: 8, marginBottom: 16 }}>
                      {stockLocations.map((l) => {
                        const globalLocStock = Number(vp.stocks?.[l.id] || 0);
                        const variationsLocStock = vpVariations.reduce((acc, v) => acc + (Number(v.stocks?.[l.id]) || 0), 0);
                        const totalLocStock = globalLocStock + variationsLocStock;

                        return (
                          <div key={l.id} style={{ background: card, border: `1px solid ${border}`, padding: 10, borderRadius: 8, textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: subtext, marginBottom: 4 }}>{l.name}</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: accent }}>{totalLocStock}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Variações Detalhadas */}
                    {vpVariations.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: subtext, marginBottom: 8 }}>
                          Detalhamento por Variações / Subcategorias:
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {vpVariations.map((v, vIdx) => (
                            <div key={vIdx} style={{ background: `${border}10`, padding: 8, borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: 600, fontSize: 12, color: text }}>{v.name}</span>
                              <div style={{ display: "flex", gap: 12, fontSize: 12, color: subtext }}>
                                {stockLocations.map((l) => (
                                  <span key={l.id}>
                                    {l.name}: <strong style={{ color: text }}>{v.stocks?.[l.id] || 0}</strong>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Ações no Rodapé do Modal */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24, borderTop: `1px solid ${border}`, paddingTop: 16 }}>
                <button
                  onClick={() => {
                    const prodToEdit = viewingProduct;
                    setViewingProduct(null);
                    startEdit(prodToEdit);
                  }}
                  style={{
                    background: accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Edit2 size={14} /> Editar Produto
                </button>
                <button
                  onClick={() => setViewingProduct(null)}
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
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}