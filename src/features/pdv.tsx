// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { Search, X, UserPlus, ShoppingCart, ArrowLeft, RotateCcw } from "lucide-react";
import { inputStyle, lbl } from "../utils/helpers";
import { SectionTitle } from "../components/common";
import { CustomerRegistration } from "./CustomerRegistration";

export function PDV({
  device,
  customers = [],
  setCustomers,
  products = [],
  setProducts,
  stockLocations = [],
  sellers = [],
  sales = [],
  setSales,
  onSaleCompleted,
  card,
  border,
  subtext,
  accent,
  text
}) {
  const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3333").replace(/\/+$/, "");

  const STORAGE_KEY = "byse_pdv_persistent_data";
  const TIMEOUT_DURATION = 10 * 60 * 1000;

  const getInitialState = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const elapsed = Date.now() - parsed.timestamp;
        if (elapsed < TIMEOUT_DURATION) {
          return parsed[key] !== undefined ? parsed[key] : defaultValue;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Erro ao ler dados persistidos do PDV", e);
    }
    return defaultValue;
  };

  const [step, setStep] = useState(() => getInitialState("step", "gate"));
  const [phoneQuery, setPhoneQuery] = useState(() => getInitialState("phoneQuery", ""));
  const [foundCustomer, setFoundCustomer] = useState(() => getInitialState("foundCustomer", null));
  const [selectedCustomer, setSelectedCustomer] = useState(() => getInitialState("selectedCustomer", null));
  const [cart, setCart] = useState(() => getInitialState("cart", []));
  const [discount, setDiscount] = useState(() => getInitialState("discount", 0));
  
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const finalizingSaleRef = useRef(false);
  const [isFinalizingSale, setIsFinalizingSale] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos produtos");
  const [seller, setSeller] = useState(sellers[0]?.name || "Juliana Costa");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [gender, setGender] = useState("Prefiro não informar");
  const [salesChannel, setSalesChannel] = useState("Loja física");
  const [deliveryType, setDeliveryType] = useState("Retirada");

  const [activeProductForVariation, setActiveProductForVariation] = useState(null);
  const [selectedVariationOption, setSelectedVariationOption] = useState("");

  const [cashbackPercent, setCashbackPercent] = useState(3);
  const [cashbackValidityDays, setCashbackValidityDays] = useState(30);
  const [cashbackMessage, setCashbackMessage] = useState('Oi {nome}, você tem {saldo} em cashback te esperando na nossa loja! Aproveite antes de vencer em {vencimento}. 🎁');
  const [activeReminderButton, setActiveReminderButton] = useState(false);

  useEffect(() => {
    const currentState = {
      step,
      phoneQuery,
      foundCustomer,
      selectedCustomer,
      cart,
      discount,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
  }, [step, phoneQuery, foundCustomer, selectedCustomer, cart, discount]);

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const token = localStorage.getItem("byse_token");
      const user = JSON.parse(localStorage.getItem("byse_user") || "{}");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "x-user-id": user.id || localStorage.getItem("userId") || "user_1"
      };
      const res = await fetch(`${API_URL}/api/pdv/config`, { headers });
      if (res.ok) {
        const data = await res.json();
        
        const fetchedPct = data.cashbackPercentage !== undefined && data.cashbackPercentage !== null ? Number(data.cashbackPercentage) : 3;
        setCashbackPercent(fetchedPct);

        if (data.cashbackPercentage !== undefined) setCashbackPercent(Number(data.cashbackPercentage));
        if (data.cashbackValidityDays !== undefined) setCashbackValidityDays(Number(data.cashbackValidityDays));
        if (data.cashbackMessage) setCashbackMessage(data.cashbackMessage);
        if (data.activeReminderButton !== undefined) setActiveReminderButton(Boolean(data.activeReminderButton));
      }
    } catch (e) {
      console.error("Erro ao buscar configurações do PDV", e);
    }
  };

  const saveUserSettings = async (updatedSettings) => {
    try {
      const token = localStorage.getItem("byse_token");
      const user = JSON.parse(localStorage.getItem("byse_user") || "{}");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-user-id": user.id || localStorage.getItem("userId") || "user_1"
      };
      
      const currentConfig = {
        cashbackPercentage: cashbackPercent,
        cashbackValidityDays,
        cashbackMessage,
        activeReminderButton,
        ...updatedSettings
      };

      await fetch(`${API_URL}/api/pdv/config`, {
        method: "POST",
        headers,
        body: JSON.stringify(currentConfig)
      });
    } catch (e) {
      console.error("Erro ao salvar configurações", e);
    }
  };

  // Padronização: Usa ID 'loja' em vez de 'loja-fisica' para corresponder ao estoque.tsx
  const availableStockLocations = stockLocations && stockLocations.length > 0 
    ? stockLocations 
    : [
        { id: 'loja', name: 'Loja Física' },
        { id: 'degustacao', name: 'Degustação' }
      ];

  const [selectedStockLoc, setSelectedStockLoc] = useState(availableStockLocations[0]?.id || "loja");

  const categories = [
    "Todos produtos",
    ...Array.from(new Set(products.map((p) => p.category || "Sem categoria")))
  ];

  const handleCustomerInputChange = (value) => {
    setPhoneQuery(value);
    setFoundCustomer(null);

    if (!value || value.trim().length === 0) {
      setCustomerSuggestions([]);
      return;
    }

    const queryClean = value.trim().toLowerCase();
    const queryDigits = queryClean.replace(/\D/g, "");

    const matches = customers.filter((c) => {
      const nameMatch = c.name && c.name.toLowerCase().includes(queryClean);
      const phoneDigits = c.phone ? c.phone.replace(/\D/g, "") : "";
      const phoneMatch = queryDigits.length > 0 && phoneDigits.includes(queryDigits);
      return nameMatch || phoneMatch;
    });

    setCustomerSuggestions(matches);
    if (matches.length === 1) {
      setFoundCustomer(matches[0]);
    }
  };

  const search = () => {
    if (!phoneQuery || phoneQuery.trim().length === 0) {
      setFoundCustomer(null);
      setCustomerSuggestions([]);
      return;
    }

    const queryClean = phoneQuery.trim().toLowerCase();
    const queryDigits = queryClean.replace(/\D/g, "");

    const match = customers.find((c) => {
      const nameMatch = c.name && c.name.toLowerCase().includes(queryClean);
      const phoneDigits = c.phone ? c.phone.replace(/\D/g, "") : "";
      const phoneMatch = queryDigits.length > 0 && phoneDigits.includes(queryDigits);
      return nameMatch || phoneMatch;
    });

    if (match) {
      setFoundCustomer(match);
      setCustomerSuggestions([match]);
    } else {
      setFoundCustomer(null);
      setCustomerSuggestions([]);
    }
  };

  const handleKeyDownSearch = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (customerSuggestions.length === 1) {
        startOrderWithFoundCustomer(customerSuggestions[0]);
      } else if (foundCustomer) {
        startOrderWithFoundCustomer(foundCustomer);
      } else {
        search();
      }
    }
  };

  const saveNewCustomer = async (newCustomerData) => {
    const newCust = {
      id: "c" + Date.now(),
      ...newCustomerData,
      data_aniversario: newCustomerData.data_aniversario || newCustomerData.birthDate || null,
      cashback: 0
    };

    const token = localStorage.getItem("byse_token");
    const user = JSON.parse(localStorage.getItem("byse_user") || "{}");
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "x-user-id": user.id || localStorage.getItem("userId") || "user_1"
    };

    try {
      await fetch(`${API_URL}/api/clientes`, {
        method: "POST",
        headers,
        body: JSON.stringify(newCust)
      });

      if (typeof setCustomers === "function") {
        setCustomers([...customers, newCust]);
      }
      setSelectedCustomer(newCust);
      setStep("order");
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar novo cliente no servidor.");
    }
  };

  const startOrderWithoutCustomer = () => {
    setSelectedCustomer(null);
    setStep("order");
  };

  const startOrderWithFoundCustomer = (cust) => {
    setSelectedCustomer(cust);
    setStep("order");
  };

  const backToGate = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStep("gate");
    setPhoneQuery("");
    setFoundCustomer(null);
    setCustomerSuggestions([]);
    setSelectedCustomer(null);
    setCart([]);
    setProductQuery("");
    setLastCompletedSale(null);
    setDiscount(0);
  };

  const handleProductClick = (prod) => {
    const variationsList = prod.variations || prod.options || prod.variationList || [];
    if (Array.isArray(variationsList) && variationsList.length > 0) {
      setActiveProductForVariation(prod);
      const firstOpt = typeof variationsList[0] === 'string' ? variationsList[0] : (variationsList[0].name || "");
      setSelectedVariationOption(firstOpt.trim());
    } else {
      addToCartWithVariation(prod, "");
    }
  };

  const addToCartWithVariation = (prod, chosenVariation) => {
    const cleanVariation = (chosenVariation || "").trim();

    setCart((prev) => {
      const existsIndex = prev.findIndex(
        (item) => String(item.id) === String(prod.id) && (item.variationName || item.variation || "").trim() === cleanVariation
      );

      if (existsIndex > -1) {
        return prev.map((item, idx) =>
          idx === existsIndex ? { ...item, qty: item.qty + 1 } : item
        );
      }

      return [
        ...prev,
        {
          ...prod,
          qty: 1,
          variationName: cleanVariation,
          variation: cleanVariation
        }
      ];
    });
    setActiveProductForVariation(null);
    setSelectedVariationOption("");
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "Todos produtos" || p.category === selectedCategory;
    const query = productQuery.toLowerCase();
    const matchesQuery =
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.barcode && p.barcode.toLowerCase().includes(query)) ||
      (p.code && p.code.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.price) || 0) * item.qty, 0);
  const total = Math.max(0, subtotal - Number(discount));
  const earnedCashbackCalc = selectedCustomer ? total * (cashbackPercent / 100) : 0;

  const handlePrintReceipt = (saleData) => {
    if (!saleData) return;
    window.print();
  };

  const handleDownloadPDF = (saleData) => {
    if (!saleData) return;
    window.print();
  };

  const finalizeSale = async () => {
    if (finalizingSaleRef.current) return;

    if (cart.length === 0) {
      alert("O carrinho está vazio!");
      return;
    }

    if (!selectedStockLoc) {
      alert("Por favor, selecione um local de estoque antes de finalizar a venda.");
      return;
    }

    finalizingSaleRef.current = true;
    setIsFinalizingSale(true);

    const currentLocObj = availableStockLocations.find(l => l.id === selectedStockLoc);
    const localName = currentLocObj ? currentLocObj.name : "Estoque Principal";

    const formattedItems = cart.map(item => {
      const varName = (item.variationName || item.variation || "").trim();
      const itemQty = Math.max(1, Number(item.qty || 1));

      return {
        ...item,
        productId: item.id,
        price: Number(item.price || 0),
        qty: itemQty,
        quantity: itemQty,
        local: localName,
        location: localName,
        stockLocation: selectedStockLoc,
        stock_location: selectedStockLoc,
        variationName: varName,
        variation: varName
      };
    });

    const cashbackEarnedVal = earnedCashbackCalc;
    const saleId = `pur_${typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;

    const newSale = {
      id: saleId,
      customerId: selectedCustomer ? selectedCustomer.id : null,
      customer_id: selectedCustomer ? selectedCustomer.id : null,
      customer_name: selectedCustomer ? selectedCustomer.name : "Cliente Geral",
      seller: seller,
      payment_method: paymentMethod,
      discount: Number(discount) || 0,
      total: total,
      subtotal: subtotal,
      earned_cashback: cashbackEarnedVal,
      cashbackEarned: cashbackEarnedVal,
      gender: gender,
      sales_channel: salesChannel,
      delivery_type: deliveryType,
      items: formattedItems,
      date: new Date().toISOString()
    };

    const token = localStorage.getItem("byse_token");
    const user = JSON.parse(localStorage.getItem("byse_user") || "{}");
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "x-user-id": user.id || localStorage.getItem("userId") || "user_1"
    };

    try {
      const response = await fetch(`${API_URL}/api/sales`, {
        method: "POST",
        headers,
        body: JSON.stringify(newSale)
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw new Error(result?.error || "Falha ao salvar a venda no servidor.");
      }

      const duplicateRequest = Boolean(result?.duplicate);
      localStorage.removeItem(STORAGE_KEY);

      if (!duplicateRequest && selectedCustomer && typeof setCustomers === "function") {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + Number(cashbackValidityDays || 30));

        const updatedCustomersList = customers.map(c =>
          c.id === selectedCustomer.id
            ? {
                ...c,
                cashback: Number(c.cashback || 0) + cashbackEarnedVal,
                cashback_expiration_date: expirationDate.toISOString().split("T")[0]
              }
            : c
        );

        setCustomers(updatedCustomersList);
      }

      // Sincroniza o estoque atualizado enviado pelo backend
      if (
        !duplicateRequest &&
        typeof setProducts === "function" &&
        Array.isArray(result?.stockUpdates) &&
        result.stockUpdates.length > 0
      ) {
        setProducts(prevProducts =>
          prevProducts.map(prod => {
            const update = result.stockUpdates.find(u => String(u.productId) === String(prod.id));
            if (!update) return prod;
            return {
              ...prod,
              ...(update.stocks !== undefined ? { stocks: update.stocks } : {}),
              ...(update.variations !== undefined ? { variations: update.variations } : {})
            };
          })
        );
      }

      if (!duplicateRequest && typeof setSales === "function") {
        setSales(prevSales => {
          const current = Array.isArray(prevSales) ? prevSales : [];
          if (current.some(s => String(s.id) === String(newSale.id))) return current;
          return [...current, newSale];
        });
      }

      if (typeof onSaleCompleted === "function") {
        onSaleCompleted();
      }

      setLastCompletedSale(newSale);

      if (!duplicateRequest && selectedCustomer && selectedCustomer.phone) {
        const telefoneLimpo = selectedCustomer.phone.replace(/\D/g, "");
        if (telefoneLimpo.length >= 10) {
          const nomeCliente = selectedCustomer.name || "Cliente";
          const cashbackGanhoFormatado = cashbackEarnedVal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
          const vencimentoFormatado = new Date(Date.now() + Number(cashbackValidityDays || 30) * 86400000).toLocaleDateString("pt-BR");

          const mensagemPronta = cashbackMessage
            .replace(/{nome}/g, nomeCliente)
            .replace(/{saldo}/g, cashbackGanhoFormatado)
            .replace(/{vencimento}/g, vencimentoFormatado);

          window.open(`https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagemPronta)}`, "_blank");
        }
      }

      alert(
        duplicateRequest
          ? "Esta venda já havia sido processada. O estoque não foi abatido novamente."
          : "Venda finalizada com sucesso! O cashback foi creditado a partir de hoje e o estoque atualizado."
      );
    } catch (error) {
      console.error("❌ Erro ao finalizar venda:", error);
      alert(error?.message || "Erro ao conectar com o servidor para salvar a venda. Verifique se a API está rodando.");
    } finally {
      finalizingSaleRef.current = false;
      setIsFinalizingSale(false);
    }
  };

  return (
    <div style={{ padding: device === "desktop" ? 20 : 10 }}>
      <style>{`
        @media print {
          @page { size: 58mm auto; margin: 0; }
          body * { visibility: hidden !important; }
          #printable-receipt, #printable-receipt * { visibility: visible !important; }
          #printable-receipt {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 58mm !important;
            max-width: 58mm !important;
            font-family: monospace !important;
            padding: 4px !important;
            color: #000 !important;
            background: #fff !important;
            font-size: 10px !important;
            line-height: 1.2 !important;
          }
        }
      `}</style>

      {activeProductForVariation && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
            <h3 style={{ color: text, margin: "0 0 8px 0", fontSize: 18 }}>Escolha a Variação</h3>
            <p style={{ color: subtext, fontSize: 13, marginBottom: 16 }}>
              Produto: <strong>{activeProductForVariation.name}</strong>
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl(subtext)}>Selecione a opção desejada (ex: Chocolate, Morango):</label>
              <select
                value={selectedVariationOption}
                onChange={(e) => setSelectedVariationOption(e.target.value)}
                style={{ ...inputStyle(border, text), backgroundColor: card, color: text, width: "100%", marginTop: 6 }}
              >
                {(activeProductForVariation.variations || activeProductForVariation.options || activeProductForVariation.variationList || []).map((opt, idx) => {
                  const optName = (typeof opt === 'string' ? opt : (opt.name || String(opt))).trim();
                  return (
                    <option key={idx} value={optName} style={{ backgroundColor: card, color: text }}>
                      {optName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setActiveProductForVariation(null)}
                style={{ flex: 1, background: "transparent", color: text, border: `1px solid ${border}`, padding: 10, borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => addToCartWithVariation(activeProductForVariation, selectedVariationOption)}
                style={{ flex: 1, background: accent, color: "#fff", border: "none", padding: 10, borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="printable-receipt" style={{ display: "none" }}>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 12, marginBottom: 6 }}>BYSE PRO — COMPROVANTE</div>
        <div style={{ borderBottom: "1px dashed #000", margin: "4px 0" }}></div>
        <div><strong>Data:</strong> {lastCompletedSale ? new Date(lastCompletedSale.date).toLocaleString("pt-BR") : ""}</div>
        <div><strong>Cliente:</strong> {lastCompletedSale ? lastCompletedSale.customer_name : ""}</div>
        <div><strong>Vendedor:</strong> {lastCompletedSale ? lastCompletedSale.seller : ""}</div>
        <div><strong>Pagamento:</strong> {lastCompletedSale ? lastCompletedSale.payment_method : ""}</div>
        <div><strong>Canal:</strong> {lastCompletedSale ? lastCompletedSale.sales_channel : ""}</div>
        <div style={{ borderBottom: "1px dashed #000", margin: "4px 0" }}></div>
        <div style={{ fontWeight: "bold" }}>ITENS DA COMPRA:</div>
        {lastCompletedSale && lastCompletedSale.items && lastCompletedSale.items.map((i, index) => (
          <div key={index} style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
            <span>{i.qty}x {i.name} {i.variationName ? `(${i.variationName})` : ""}</span>
            <span>{(Number(i.price) * i.qty).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </div>
        ))}
        <div style={{ borderBottom: "1px dashed #000", margin: "4px 0" }}></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal:</span>
          <span>{lastCompletedSale ? lastCompletedSale.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Desconto:</span>
          <span>{lastCompletedSale ? lastCompletedSale.discount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 11, marginTop: 3 }}>
          <span>TOTAL:</span>
          <span>{lastCompletedSale ? lastCompletedSale.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          <span>Cashback Gerado:</span>
          <span>{lastCompletedSale ? lastCompletedSale.earned_cashback.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}</span>
        </div>
        <div style={{ borderBottom: "1px dashed #000", margin: "6px 0" }}></div>
        <div style={{ textAlign: "center", fontStyle: "italic", fontSize: 9 }}>Obrigado pela preferência! Volte sempre.</div>
      </div>

      {step === "gate" && (
        <div>
          <SectionTitle
            title="PDV — Ponto de Venda & Cashback"
            sub="Busque um cliente por nome ou telefone, cadastre ou inicie uma venda rápida com gestão integrada"
          />
          <div style={{ display: "grid", gridTemplateColumns: device === "desktop" ? "1fr 1fr" : "1fr", gap: 20 }}>
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 20 }}>
              <button
                onClick={startOrderWithoutCustomer}
                style={{
                  background: accent,
                  color: "#fff",
                  border: "none",
                  padding: "12px",
                  borderRadius: 8,
                  width: "100%",
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                <ShoppingCart size={18} /> Venda Rápida (Sem Cadastro)
              </button>

              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 15, marginBottom: 15 }}></div>

              <label style={lbl(subtext)}>BUSCAR CLIENTE (DIGITE O NOME OU TELEFONE)</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8, position: "relative" }}>
                <input
                  value={phoneQuery}
                  onChange={(e) => handleCustomerInputChange(e.target.value)}
                  onKeyDown={handleKeyDownSearch}
                  placeholder="Digite o nome ou (00) 00000-0000 (Pressione Enter)..."
                  style={{ ...inputStyle(border, text), flex: 1 }}
                />
                <button
                  onClick={search}
                  style={{ background: accent, border: "none", borderRadius: 8, padding: "0 15px", cursor: "pointer" }}
                  title="Buscar"
                >
                  <Search size={20} color="#fff" />
                </button>
              </div>

              {customerSuggestions.length > 0 && (
                <div style={{ marginTop: 8, background: card, border: `1px solid ${border}`, borderRadius: 8, maxHeight: 180, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10, position: "relative" }}>
                  <div style={{ padding: "6px 10px", fontSize: 11, color: subtext, borderBottom: `1px solid ${border}` }}>
                    Sugestões encontradas ({customerSuggestions.length}) — Clique ou pressione Enter:
                  </div>
                  {customerSuggestions.map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => startOrderWithFoundCustomer(cust)}
                      style={{ padding: "10px 12px", cursor: "pointer", borderBottom: `1px solid ${border}40`, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = `${accent}15`}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: text, fontSize: 13 }}>{cust.name}</div>
                        <div style={{ fontSize: 11, color: subtext }}>{cust.phone || "Sem telefone"}</div>
                      </div>
                      <div style={{ fontSize: 12, color: accent, fontWeight: "bold" }}>
                        {Number(cust.cashback || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {foundCustomer && customerSuggestions.length <= 1 && (
                <div style={{ marginTop: 15, padding: 12, background: `${accent}15`, borderRadius: 8 }}>
                  <p style={{ color: text, margin: "0 0 8px 0" }}>
                    Cliente selecionado: <strong>{foundCustomer.name}</strong> ({foundCustomer.phone}) — Saldo: <strong>{Number(foundCustomer.cashback || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                  </p>
                  <button
                    onClick={() => startOrderWithFoundCustomer(foundCustomer)}
                    style={{ ...inputStyle(border, text), cursor: "pointer", width: "100%", background: accent, color: "#fff", border: "none", fontWeight: "bold" }}
                  >
                    Iniciar Pedido com Este Cliente (Enter)
                  </button>
                </div>
              )}

              {!foundCustomer && customerSuggestions.length === 0 && phoneQuery.length >= 2 && (
                <p style={{ color: subtext, marginTop: 15, fontSize: 13 }}>
                  Nenhum cliente correspondente encontrado com essas letras/números.
                </p>
              )}

              <div style={{ marginTop: foundCustomer ? 12 : 20, borderTop: `1px solid ${border}`, paddingTop: 15 }}>
                <button
                  onClick={() => setStep("register")}
                  style={{ background: "transparent", color: accent, border: `1px solid ${accent}`, padding: 10, borderRadius: 8, width: "100%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: "bold" }}
                >
                  <UserPlus size={18} /> Cadastrar Novo Cliente
                </button>
              </div>
            </div>

            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h3 style={{ color: text, margin: "0 0 8px 0", fontSize: 16, borderBottom: `1px solid ${border}`, paddingBottom: 8 }}>
                  🔔 Automação de Lembretes de Cashback
                </h3>
                <p style={{ color: subtext, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                  Ative este botão para que, durante os dias de vendas, o sistema envie lembretes automáticos via WhatsApp conforme os dias passarem para os clientes que possuem saldo ativo.
                </p>
              </div>

              <div
                onClick={() => {
                  const newState = !activeReminderButton;
                  setActiveReminderButton(newState);
                  saveUserSettings({ activeReminderButton: newState });
                }}
                style={{
                  background: activeReminderButton ? `${accent}20` : `${border}20`,
                  border: `2px solid ${activeReminderButton ? accent : border}`,
                  borderRadius: 12,
                  padding: 18,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: activeReminderButton ? accent : subtext, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: 12 }}>
                    {activeReminderButton ? "✓" : ""}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: text }}>
                      {activeReminderButton ? "Lembretes Automáticos ATIVOS" : "Lembretes Automáticos DESATIVADOS"}
                    </div>
                    <div style={{ fontSize: 12, color: subtext }}>
                      {activeReminderButton ? "Disparos diários em background ligados" : "Clique para ativar os disparos automáticos"}
                    </div>
                  </div>
                </div>

                <div style={{ background: activeReminderButton ? accent : subtext, color: "#fff", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                  {activeReminderButton ? "Ligado" : "Desligado"}
                </div>
              </div>

              <div style={{ fontSize: 11, color: subtext, fontStyle: "italic", textAlign: "center" }}>
                * Certifique-se de que a conexão do WhatsApp está ativa na aba de integrações.
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "register" && (
        <div>
          <button
            onClick={backToGate}
            style={{ background: "transparent", border: "none", cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", gap: 5, color: text }}
          >
            <X size={16} /> Voltar
          </button>
          <CustomerRegistration
            card={card}
            border={border}
            text={text}
            subtext={subtext}
            accent={accent}
            onSave={saveNewCustomer}
          />
        </div>
      )}

      {step === "order" && (
        <div style={{ display: "grid", gridTemplateColumns: device === "desktop" ? "2fr 1fr" : "1fr", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 15 }}>
              <button
                onClick={backToGate}
                style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 8, padding: 8, cursor: "pointer", color: text, display: "flex", alignItems: "center", gap: 5 }}
              >
                <ArrowLeft size={16} /> Trocar cliente
              </button>
              <div style={{ background: card, border: `1px solid ${border}`, padding: "8px 12px", borderRadius: 8, fontSize: 14, color: text }}>
                Cliente:{" "}
                <strong>
                  {selectedCustomer
                    ? `${selectedCustomer.name} (Cashback Atual: ${Number(selectedCustomer.cashback || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`
                    : "Sem cliente (Venda Geral)"}
                </strong>
              </div>
            </div>

            <div style={{ marginBottom: 15 }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={18} color={subtext} style={{ position: "absolute", left: 12 }} />
                <input
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Pesquisar produto por nome ou código de barras..."
                  style={{ ...inputStyle(border, text), paddingLeft: 38, width: "100%" }}
                />
                {productQuery && (
                  <button
                    onClick={() => setProductQuery("")}
                    style={{ position: "absolute", right: 10, background: "transparent", border: "none", cursor: "pointer", color: subtext }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 15 }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: selectedCategory === cat ? accent : card,
                    color: selectedCategory === cat ? "#fff" : text,
                    border: `1px solid ${border}`,
                    borderRadius: 20,
                    padding: "6px 14px",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    fontSize: 13
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {filteredProducts.length === 0 ? (
                <p style={{ color: subtext, fontSize: 14, gridColumn: "1 / -1" }}>
                  Nenhum produto cadastrado ou encontrado.
                </p>
              ) : (
                filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleProductClick(prod)}
                    style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: 15, cursor: "pointer" }}
                  >
                    <p style={{ fontWeight: "bold", color: text, fontSize: 14, marginBottom: 4 }}>
                      {prod.name}
                    </p>
                    <p style={{ color: subtext, fontSize: 11, marginBottom: 8 }}>
                      {prod.barcode ? `Cód: ${prod.barcode}` : prod.category}
                    </p>
                    <p style={{ color: accent, fontWeight: "600" }}>
                      {Number(prod.price || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 16, height: "fit-content", display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ color: text, margin: 0, fontSize: 16, borderBottom: `1px solid ${border}`, paddingBottom: 8 }}>
              Carrinho de Compras
            </h3>

            {cart.length === 0 ? (
              <p style={{ color: subtext, fontSize: 13, margin: "4px 0" }}>Nenhum item adicionado.</p>
            ) : (
              <div style={{ maxHeight: 140, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingRight: 4 }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: text }}>
                    <span>
                      {item.qty}x {item.name} {item.variationName ? <strong style={{ color: accent }}>({item.variationName})</strong> : ""}
                    </span>
                    <span style={{ fontWeight: 500 }}>
                      {((Number(item.price) || 0) * item.qty).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: `${border}15`, borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 8, border: `1px solid ${border}` }}>
              <div>
                <label style={lbl(subtext)}>Vendedor</label>
                <select
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  style={{ ...inputStyle(border, text), backgroundColor: card, color: text, width: "100%", marginTop: 2 }}
                >
                  {sellers.map((s) => (
                    <option key={s.id || s.name} value={s.name} style={{ backgroundColor: card, color: text }}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl(subtext)}>Local de Estoque (Baixa)</label>
                <select
                  value={selectedStockLoc}
                  onChange={(e) => setSelectedStockLoc(e.target.value)}
                  style={{ ...inputStyle(border, text), backgroundColor: card, color: text, width: "100%", marginTop: 2 }}
                >
                  {availableStockLocations.map((loc) => (
                    <option key={loc.id} value={loc.id} style={{ backgroundColor: card, color: text }}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={lbl(subtext)}>Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ ...inputStyle(border, text), backgroundColor: card, color: text, width: "100%", marginTop: 2 }}
                  >
                    <option value="Pix" style={{ backgroundColor: card, color: text }}>Pix</option>
                    <option value="Crédito" style={{ backgroundColor: card, color: text }}>Crédito</option>
                    <option value="Crédito parcelado" style={{ backgroundColor: card, color: text }}>Crédito parcelado</option>
                    <option value="Débito" style={{ backgroundColor: card, color: text }}>Débito</option>
                    <option value="Dinheiro" style={{ backgroundColor: card, color: text }}>Dinheiro</option>
                    <option value="Fiado" style={{ backgroundColor: card, color: text }}>Fiado</option>
                  </select>
                </div>

                <div>
                  <label style={lbl(subtext)}>Desconto (R$)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    style={{ ...inputStyle(border, text), backgroundColor: card, color: text, width: "100%", marginTop: 2 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={lbl(subtext)}>Canal</label>
                  <select
                    value={salesChannel}
                    onChange={(e) => setSalesChannel(e.target.value)}
                    style={{ ...inputStyle(border, text), backgroundColor: card, color: text, width: "100%", marginTop: 2 }}
                  >
                    <option value="Loja física" style={{ backgroundColor: card, color: text }}>Loja física</option>
                    <option value="Instagram" style={{ backgroundColor: card, color: text }}>Instagram</option>
                    <option value="WhatsApp" style={{ backgroundColor: card, color: text }}>WhatsApp</option>
                    <option value="Degustação" style={{ backgroundColor: card, color: text }}>Degustação</option>
                  </select>
                </div>

                <div>
                  <label style={lbl(subtext)}>Entrega</label>
                  <select
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value)}
                    style={{ ...inputStyle(border, text), backgroundColor: card, color: text, width: "100%", marginTop: 2 }}
                  >
                    <option value="Retirada" style={{ backgroundColor: card, color: text }}>Retirada</option>
                    <option value="Delivery" style={{ backgroundColor: card, color: text }}>Delivery</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl(subtext)}>Gênero do Cliente</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{ ...inputStyle(border, text), backgroundColor: card, color: text, width: "100%", marginTop: 2 }}
                >
                  <option value="Prefiro não informar" style={{ backgroundColor: card, color: text }}>Prefiro não informar</option>
                  <option value="Masculino" style={{ backgroundColor: card, color: text }}>Masculino</option>
                  <option value="Feminino" style={{ backgroundColor: card, color: text }}>Feminino</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: `1px solid ${border}`, paddingTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: text }}>
                <span>Subtotal:</span>
                <span>{subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: text }}>
                <span>Desconto:</span>
                <span>{Number(discount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: accent }}>
                <span>Cashback da Compra ({cashbackPercent}%):</span>
                <span>{earnedCashbackCalc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: "bold", color: accent, borderTop: `1px dashed ${border}`, paddingTop: 6, marginTop: 2 }}>
                <span>Total:</span>
                <span>{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
            </div>

            <button
              onClick={finalizeSale}
              disabled={isFinalizingSale}
              style={{
                background: accent,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: 12,
                fontWeight: "bold",
                cursor: isFinalizingSale ? "not-allowed" : "pointer",
                opacity: isFinalizingSale ? 0.7 : 1,
                textAlign: "center",
                marginTop: 6
              }}
            >
              {isFinalizingSale ? "Finalizando venda..." : "Finalizar Venda & Gerar Cashback Imediato"}
            </button>

            {lastCompletedSale && (
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button
                  onClick={() => handlePrintReceipt(lastCompletedSale)}
                  style={{ flex: 1, background: "transparent", color: text, border: `1px solid ${border}`, borderRadius: 8, padding: 8, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                >
                  Imprimir Comprovante
                </button>
                <button
                  onClick={() => handleDownloadPDF(lastCompletedSale)}
                  style={{ flex: 1, background: "transparent", color: text, border: `1px solid ${border}`, borderRadius: 8, padding: 8, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                >
                  Baixar / Imprimir PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}