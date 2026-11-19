// @ts-nocheck

import React, { useEffect, useRef, useState } from "react";

import {

  Users,

  Package,

  ShoppingCart,

  BarChart3,

  Store,

  MessageCircle,

  Gift,

  Printer,

  Plus,

  Search,

  Moon,

  Sun,

  Trash2,

  X,

  ChevronRight,

  ChevronLeft,

  Award,

  Percent,

  Eye,

  EyeOff,

  Edit2,

  Check,

  User,

  Lock,

  Menu,

  Bell,

  Clipboard,

  MoreVertical,

  Tag,

  Heart,

  ScanLine,

  List,

  History,

  LayoutGrid,

  TrendingUp,

  Share2,

  Calculator,

  CreditCard,

  Truck,

  Video,

  Music,

  Type,

  Mail,

  Wallet,

  Banknote,

  Save,

  LogOut,

  Calendar,

} from "lucide-react";

import {

  FONT_BODY,

  FONT_DISPLAY,

  SUCCESS,

  DANGER,

  GLOBAL_CSS,

  PRESET_COLORS,

} from "../data/constants";

import { money, genNoiseSales, genAdEntries, inPeriod } from "../utils/helpers";

import {

  LoginScreen,

  VipWelcome,

  MenuGridScreen,

  LogoMark,

  SLabel,

} from "../components/common";

import { Dashboard } from "../features/dashboard";

import { Clientes } from "../features/clientes";

import { Estoque } from "../features/estoque";

import { PDV } from "../features/pdv";

import { Vendedores } from "../features/vendedores";

import Catalogo from "../features/catalogo";

import CatalogoPublico from "../features/catalogo";

import { Cashback } from "../features/cashback";

import { WhatsApp } from "../features/whatsapp";

import { TrafegoPago, CanaisDeVenda } from "../features/marketing";

import { DRE, Planos } from "../features/finance";

import { Fiados } from "../features/fiados";

import { PreTreino } from "../features/preTreino";

import { PublicCatalog } from "../features/PublicCatalog";



const getApiUrl = () => {
  const configuredUrl = String(import.meta.env.VITE_API_URL || "").trim();
  const fallbackUrl =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:3333"
      : "https://byse-pro-backend-production.up.railway.app";

  // Aceita VITE_API_URL com ou sem /api e com ou sem barra final.
  const baseUrl = (configuredUrl || fallbackUrl)
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

  return `${baseUrl}/api`;
};

const API_URL = getApiUrl();

/**
 * Cache local protegido contra QuotaExceededError.
 * Catálogos de produtos ficam no estado do React e no servidor, não no localStorage.
 */
const safeStorageSet = (key, value) => {
  const normalizedKey = String(key || "");

  if (
    normalizedKey.startsWith("byse_products_") ||
    normalizedKey.startsWith("byse_pre_treino_products_")
  ) {
    try { localStorage.removeItem(normalizedKey); } catch (error) {
      console.warn("Não foi possível remover cache antigo de produtos:", error);
    }
    return false;
  }

  try {
    localStorage.setItem(normalizedKey, value);
    return true;
  } catch (error) {
    const isQuotaError =
      error?.name === "QuotaExceededError" ||
      error?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error?.code === 22 ||
      error?.code === 1014;

    if (!isQuotaError) {
      console.warn(`Não foi possível salvar ${normalizedKey} no cache local:`, error);
      return false;
    }

    // Libera somente caches descartáveis de produtos do mesmo usuário.
    const userScopedPrefixes = [
      "byse_customers_",
      "byse_sales_",
      "byse_products_",
      "byse_sellers_",
      "byse_fiados_",
      "byse_pre_treino_records_",
      "byse_pre_treino_products_",
      "byse_pre_treino_customers_",
    ];
    const matchedPrefix = userScopedPrefixes.find((prefix) => normalizedKey.startsWith(prefix));
    const userKey = matchedPrefix ? normalizedKey.slice(matchedPrefix.length) : null;

    if (userKey) {
      ["byse_products_", "byse_pre_treino_products_"].forEach((prefix) => {
        try { localStorage.removeItem(`${prefix}${userKey}`); } catch (cleanupError) {
          console.warn("Falha ao liberar cache de produtos:", cleanupError);
        }
      });
    }

    try {
      localStorage.setItem(normalizedKey, value);
      return true;
    } catch (retryError) {
      console.warn(
        `Limite do armazenamento local atingido ao salvar ${normalizedKey}. A sincronização com o servidor continuará.`,
        retryError,
      );
      return false;
    }
  }
};


function SupplementSystem() {

  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [dark, setDark] = useState(() => {

    const saved = localStorage.getItem("byse_dark");

    return saved === null ? true : saved === "true";

  });

  const [accent, setAccent] = useState(() => localStorage.getItem("byse_accent") || "#DC2626");

  const [device, setDevice] = useState("mobile");

  const [tab, setTab] = useState("pdv");

  // Mantém montadas as abas já visitadas para preservar estado e evitar remontagens.

  const [visitedTabs, setVisitedTabs] = useState(["pdv"]);

  const navigateToTab = (nextTab) => {

    setVisitedTabs((current) =>

      current.includes(nextTab) ? current : [...current, nextTab],

    );

    setTab(nextTab);

  };



  useEffect(() => { safeStorageSet("byse_dark", String(dark)); }, [dark]);

  useEffect(() => { safeStorageSet("byse_accent", accent); }, [accent]);



  const [publicStoreData, setPublicStoreData] = useState<any>(null);

  const [isPublicCatalog, setIsPublicCatalog] = useState(false);



  const [products, setProducts] = useState([]);

  const [customers, setCustomers] = useState([]);

  const [sellers, setSellers] = useState([]);

  const [sales, setSales] = useState([]);



  const [fiados, setFiados] = useState([]);

  // Impede que uma consulta antiga sobrescreva alterações recentes nos fiados.

  const fiadosRevision = useRef(0);

  // Invalida respostas de sincronizações iniciadas antes de trocar de usuário/sair.

  const syncVersionRef = useRef(0);

  const [adEntries, setAdEntries] = useState([]);

  const [stockLocations, setStockLocations] = useState([

    { id: "loja", name: "Loja física" },

    { id: "degustacao", name: "Degustação" },

  ]);



  const [preTreinoRecords, setPreTreinoRecords] = useState([]);

  const [produtosPreTreino, setProdutosPreTreino] = useState([]);

  const [preTreinoCustomers, setPreTreinoCustomers] = useState([]);



  const [cashbackPct, setCashbackPct] = useState(3);

  const [cashbackValidityDays, setCashbackValidityDays] = useState(90);

  const [waSchedule, setWaSchedule] = useState([

    {

      id: 1,

      label: "Lembrete de saldo cashback",

      day: "Toda sexta-feira",

      enabled: true,

      text: "Oi {nome}, você tem {saldo} em cashback esperando! 🎁",

    },

    {

      id: 2,

      label: "Promoção do mês",

      day: "Dia 5 de cada mês",

      enabled: true,

      text: "Oi {nome}! Temos novidades e promoções especiais esse mês na loja. 💪",

    },

    {

      id: 3,

      label: "Cliente sumido (30 dias sem comprar)",

      day: "Dia 15 de cada mês",

      enabled: false,

      text: "Sentimos sua falta, {nome}! Faz tempo que você não aparece por aqui.",

    },

  ]);



  const getAuthHeaders = () => {

    const token = localStorage.getItem("byse_token");

    return {

      "Content-Type": "application/json",

      Authorization: `Bearer ${token}`,

    };

  };



  const getStorageKey = (key: string, customUser?: any) => {

    const activeUser = customUser || user;

    const userId = activeUser?.id || activeUser?.email || "guest";

    return `byse_${key}_${userId}`;

  };



  // Sincroniza as áreas independentes em paralelo. A tela não precisa esperar

  // uma consulta terminar para iniciar a próxima.

  const fetchUserData = async (targetUser = user) => {

    if (!targetUser) return;



    const headers = getAuthHeaders();

    const requestVersion = syncVersionRef.current;

    const userKey = targetUser?.id || targetUser?.email || "guest";

    const requests = [

      { key: "customers", url: `${API_URL}/customers` },

      { key: "sales", url: `${API_URL}/sales` },

      { key: "products", url: `${API_URL}/products` },

      { key: "sellers", url: `${API_URL}/sellers` },

      { key: "fiados", url: `${API_URL}/fiados` },

      { key: "pre_treino_records", url: `${API_URL}/pre-treino/records` },

      { key: "pre_treino_products", url: `${API_URL}/pre-treino/products` },

      { key: "pre_treino_customers", url: `${API_URL}/pre-treino/customers` },

    ];



    const fiadosRevisionAtRequest = fiadosRevision.current;



    try {

      const results = await Promise.allSettled(

        requests.map(async (request) => {

          const response = await fetch(request.url, { headers });

          if (!response.ok) {

            throw new Error(`${request.key}: HTTP ${response.status}`);

          }

          const data = await response.json();

          if (!Array.isArray(data)) {

            throw new Error(`${request.key}: resposta inválida`);

          }

          return { key: request.key, data };

        }),

      );



      // Descarta respostas antigas caso outro usuário tenha entrado ou a sessão tenha sido encerrada.

      if (requestVersion !== syncVersionRef.current) return;



      results.forEach((result) => {

        if (result.status !== "fulfilled") {

          console.warn("Falha parcial na sincronização:", result.reason);

          return;

        }



        const { key, data } = result.value;

        const storageKey = `byse_${key}_${userKey}`;



        if (key === "sales") {

          const normalizedSales = data.map((sale) => ({

            ...sale,

            customerId: sale.customerId || sale.customer_id || sale.customer || null,

            customer_id: sale.customer_id || sale.customerId || sale.customer || null,

            customerName: sale.customerName || sale.customer_name || "Cliente Geral",

            customer_name: sale.customer_name || sale.customerName || "Cliente Geral",

            gender: sale.gender || sale.genders || "Prefiro não informar",

          }));

          setSales([...normalizedSales]);

          safeStorageSet(storageKey, JSON.stringify(normalizedSales));

          return;

        }



        if (key === "fiados") {

          // Não deixa uma resposta antiga desfazer uma alteração feita na tela Fiados.

          if (fiadosRevision.current !== fiadosRevisionAtRequest) return;

          setFiados([...data]);

          safeStorageSet(storageKey, JSON.stringify(data));

          return;

        }



        if (key === "customers") setCustomers([...data]);
        if (key === "products") setProducts([...data]);
        if (key === "sellers") setSellers([...data]);
        if (key === "pre_treino_records") setPreTreinoRecords([...data]);
        if (key === "pre_treino_products") setProdutosPreTreino([...data]);
        if (key === "pre_treino_customers") setPreTreinoCustomers([...data]);

        // Produtos permanecem no estado e no banco, sem ocupar o localStorage.
        if (key !== "products" && key !== "pre_treino_products") {
          safeStorageSet(storageKey, JSON.stringify(data));
        } else {
          try { localStorage.removeItem(storageKey); } catch {}
        }

      });

    } catch (err) {

      // Promise.allSettled evita que uma rota indisponível bloqueie as demais.

      console.error("Erro ao sincronizar dados com o servidor:", err);

    }

  };



  useEffect(() => {

    if (!user) return;

    const interval = setInterval(() => {

      fetchUserData();

    }, 45000);

    return () => clearInterval(interval);

  }, [user]);



  useEffect(() => {

    const path = window.location.pathname;



    // Aceita os dois formatos de endereço da vitrine pública.

    const match = path.match(/^\/(?:publicCatalog|catalogo)\/([^/]+)\/?$/i);



    if (match) {

      const storeUserId = decodeURIComponent(match[1]);



      setIsPublicCatalog(true);

      setLoading(true);



      fetch(`${API_URL}/public/catalogo/${encodeURIComponent(storeUserId)}`)

        .then(async (res) => {

          if (!res.ok) {

            throw new Error(

              `Erro HTTP ${res.status} ao carregar catálogo público.`,

            );

          }



          return res.json();

        })

        .then((data) => {

          setPublicStoreData(data);

          setLoading(false);

        })

        .catch((err) => {

          console.error("Erro ao carregar catálogo público:", err);

          setPublicStoreData(null);

          setLoading(false);

        });



      return;

    }



    const savedToken = localStorage.getItem("byse_token");

    const savedUser = localStorage.getItem("byse_user");



    if (savedToken && savedUser) {

      try {

        const parsedUser = JSON.parse(savedUser);

        setUser(parsedUser);



        const uKey = parsedUser?.id || parsedUser?.email || "guest";



        const localCust = localStorage.getItem(`byse_customers_${uKey}`);

        const localSales = localStorage.getItem(`byse_sales_${uKey}`);

        try { localStorage.removeItem(`byse_products_${uKey}`); } catch {}
        const localProd = null;

        const localSellers = localStorage.getItem(`byse_sellers_${uKey}`);

        const localFiados = localStorage.getItem(`byse_fiados_${uKey}`);

        const localPtRecs = localStorage.getItem(

          `byse_pre_treino_records_${uKey}`,

        );

        try { localStorage.removeItem(`byse_pre_treino_products_${uKey}`); } catch {}
        const localPtProds = null;

        const localPtCusts = localStorage.getItem(

          `byse_pre_treino_customers_${uKey}`,

        );



        if (localCust) setCustomers(JSON.parse(localCust));

        if (localSales) setSales(JSON.parse(localSales));

        if (localProd) setProducts(JSON.parse(localProd));

        if (localSellers) setSellers(JSON.parse(localSellers));

        if (localFiados) setFiados(JSON.parse(localFiados));

        if (localPtRecs) setPreTreinoRecords(JSON.parse(localPtRecs));

        if (localPtProds) setProdutosPreTreino(JSON.parse(localPtProds));

        if (localPtCusts) setPreTreinoCustomers(JSON.parse(localPtCusts));



        // Se há cache local, abre o sistema imediatamente e sincroniza sem bloquear.

        const hasLocalCache = Boolean(

          localCust || localSales || localProd || localSellers || localFiados ||

          localPtRecs || localPtProds || localPtCusts

        );

        setLoading(!hasLocalCache);

        fetchUserData(parsedUser).finally(() => setLoading(false));

        return;

      } catch (error) {

        console.error("Erro ao carregar sessão salva:", error);

        localStorage.removeItem("byse_token");

        localStorage.removeItem("byse_user");

      }

    }



    setLoading(false);

  }, []);



  const handleLogin = (userData, token) => {

    syncVersionRef.current += 1;

    setTab("pdv");

    setVisitedTabs(["pdv"]);

    if (token) safeStorageSet("byse_token", token);

    safeStorageSet("byse_user", JSON.stringify(userData));



    setCustomers([]);

    setSales([]);

    setProducts([]);

    setSellers([]);

    setFiados([]);

    setPreTreinoRecords([]);

    setProdutosPreTreino([]);

    setPreTreinoCustomers([]);



    setUser(userData);

    setLoading(true);



    const uKey = userData?.id || userData?.email || "guest";

    const localCust = localStorage.getItem(`byse_customers_${uKey}`);

    const localSales = localStorage.getItem(`byse_sales_${uKey}`);

    try { localStorage.removeItem(`byse_products_${uKey}`); } catch {}
    const localProd = null;

    const localSellers = localStorage.getItem(`byse_sellers_${uKey}`);

    const localFiados = localStorage.getItem(`byse_fiados_${uKey}`);

    const localPtRecs = localStorage.getItem(`byse_pre_treino_records_${uKey}`);

    try { localStorage.removeItem(`byse_pre_treino_products_${uKey}`); } catch {}
    const localPtProds = null;

    const localPtCusts = localStorage.getItem(

      `byse_pre_treino_customers_${uKey}`,

    );



    if (localCust) setCustomers(JSON.parse(localCust));

    if (localSales) setSales(JSON.parse(localSales));

    if (localProd) setProducts(JSON.parse(localProd));

    if (localSellers) setSellers(JSON.parse(localSellers));

    if (localFiados) setFiados(JSON.parse(localFiados));

    if (localPtRecs) setPreTreinoRecords(JSON.parse(localPtRecs));

    if (localPtProds) setProdutosPreTreino(JSON.parse(localPtProds));

    if (localPtCusts) setPreTreinoCustomers(JSON.parse(localPtCusts));



    const hasLocalCache = Boolean(

      localCust || localSales || localProd || localSellers || localFiados ||

      localPtRecs || localPtProds || localPtCusts

    );

    setLoading(!hasLocalCache);

    fetchUserData(userData).finally(() => setLoading(false));

  };



  const handleLogout = () => {

    syncVersionRef.current += 1;

    setTab("pdv");

    setVisitedTabs(["pdv"]);

    localStorage.removeItem("byse_token");

    localStorage.removeItem("byse_user");



    const uKey = user?.id || user?.email;

    if (uKey) {

      localStorage.removeItem(`byse_customers_${uKey}`);

      localStorage.removeItem(`byse_products_${uKey}`);

      localStorage.removeItem(`byse_sales_${uKey}`);

      localStorage.removeItem(`byse_sellers_${uKey}`);

      localStorage.removeItem(`byse_fiados_${uKey}`);

      localStorage.removeItem(`byse_pre_treino_records_${uKey}`);

      localStorage.removeItem(`byse_pre_treino_products_${uKey}`);

      localStorage.removeItem(`byse_pre_treino_customers_${uKey}`);

    }

    setUser(null);

    setCustomers([]);

    setSales([]);

    setProducts([]);

    setSellers([]);

    setFiados([]);

    setPreTreinoRecords([]);

    setProdutosPreTreino([]);

    setPreTreinoCustomers([]);

  };



  const handleUpdateCustomers = async (newCustomers) => {

    const latestCustomer =

      Array.isArray(newCustomers) && newCustomers.length > 0

        ? newCustomers[newCustomers.length - 1]

        : null;



    setCustomers([...newCustomers]);

    safeStorageSet(

      getStorageKey("customers"),

      JSON.stringify(newCustomers),

    );



    if (latestCustomer) {

      try {

        await fetch(`${API_URL}/customers`, {

          method: "POST",

          headers: getAuthHeaders(),

          body: JSON.stringify({

            id: latestCustomer.id || `cli_${Date.now()}`,

            name: latestCustomer.name,

            phone: latestCustomer.phone,

            cpf: latestCustomer.cpf || "",

            cashback: latestCustomer.cashback || 0,

          }),

        });

      } catch (err) {

        console.error("Erro ao salvar cliente no banco:", err);

      }

    }

  };



  const handleUpdateProducts = async (productData) => {

    try {

      const isEditing = Boolean(

        productData.id && products.some((p) => p.id === productData.id),

      );

      const endpoint = isEditing

        ? `${API_URL}/products/${productData.id}`

        : `${API_URL}/products`;

      const method = isEditing ? "PUT" : "POST";



      const controlStockVal =

        productData.controlStock ?? productData.control_stock ?? true;

      const vipPriceVal =

        productData.vipPrice !== undefined && productData.vipPrice !== ""

          ? Number(productData.vipPrice)

          : productData.vip_price !== undefined && productData.vip_price !== ""

            ? Number(productData.vip_price)

            : null;

      const vipPrice3xVal =

        productData.vipPrice3x !== undefined && productData.vipPrice3x !== ""

          ? Number(productData.vipPrice3x)

          : productData.vip_price_3x !== undefined &&

              productData.vip_price_3x !== ""

            ? Number(productData.vip_price_3x)

            : null;

      const imageUrlVal = productData.imageUrl || productData.image_url || null;

      const costPriceVal =

        productData.costPrice !== undefined && productData.costPrice !== ""

          ? Number(productData.costPrice)

          : productData.cost_price !== undefined &&

              productData.cost_price !== ""

            ? Number(productData.cost_price)

            : null;



      const payload = {

        ...productData,

        controlStock: controlStockVal,

        control_stock: controlStockVal,

        vipPrice: vipPriceVal,

        vip_price: vipPriceVal,

        vipPrice3x: vipPrice3xVal,

        vip_price_3x: vipPrice3xVal,

        imageUrl: imageUrlVal,

        image_url: imageUrlVal,

        costPrice: costPriceVal,

        cost_price: costPriceVal,

      };



      const response = await fetch(endpoint, {

        method,

        headers: getAuthHeaders(),

        body: JSON.stringify(payload),

      });



      if (!response.ok) {

        throw new Error("Falha ao persistir o produto na API.");

      }



      const savedProduct = await response.json();



      const normalizedSavedProduct = {

        ...savedProduct,

        controlStock:

          savedProduct.controlStock ?? savedProduct.control_stock ?? true,

        control_stock:

          savedProduct.control_stock ?? savedProduct.controlStock ?? true,

        vipPrice: savedProduct.vipPrice ?? savedProduct.vip_price ?? null,

        vip_price: savedProduct.vip_price ?? savedProduct.vipPrice ?? null,

        vipPrice3x:

          savedProduct.vipPrice3x ?? savedProduct.vip_price_3x ?? null,

        vip_price_3x:

          savedProduct.vip_price_3x ?? savedProduct.vipPrice3x ?? null,

        imageUrl: savedProduct.imageUrl ?? savedProduct.image_url ?? null,

        image_url: savedProduct.image_url ?? savedProduct.imageUrl ?? null,

      };



      setProducts((prevProducts) => {

        if (isEditing) {

          return prevProducts.map((p) =>

            p.id === normalizedSavedProduct.id ? normalizedSavedProduct : p,

          );

        }

        return [normalizedSavedProduct, ...prevProducts];

      });



      return { success: true, product: normalizedSavedProduct };

    } catch (error) {

      console.error("Erro em handleUpdateProducts:", error);

      return { success: false, error: error.message };

    }

  };



  const handleDeleteProduct = async (productId) => {

    try {

      const response = await fetch(`${API_URL}/products/${productId}`, {

        method: "DELETE",

        headers: getAuthHeaders(),

      });



      if (response.ok) {

        const updatedProducts = products.filter((p) => p.id !== productId);

        setProducts(updatedProducts);

        safeStorageSet(

          getStorageKey("products"),

          JSON.stringify(updatedProducts),

        );

      }

    } catch (err) {

      console.error("Erro de conexão ao excluir produto:", err);

    }

  };



  const handleEditProduct = async (updatedProduct) => {

    try {

      const response = await fetch(`${API_URL}/products/${updatedProduct.id}`, {

        method: "PUT",

        headers: getAuthHeaders(),

        body: JSON.stringify(updatedProduct),

      });



      if (response.ok) {

        const savedData = await response.json();

        const finalProduct = savedData.id ? savedData : updatedProduct;

        const updatedProducts = products.map((p) =>

          p.id === finalProduct.id ? finalProduct : p,

        );

        setProducts(updatedProducts);

        safeStorageSet(

          getStorageKey("products"),

          JSON.stringify(updatedProducts),

        );

      } else {

        await handleUpdateProducts(updatedProduct);

      }

    } catch (err) {

      console.error("Erro ao atualizar produto:", err);

    }

  };



  const handleUpdateSellers = async (newSellers) => {

    const latestSeller =

      Array.isArray(newSellers) && newSellers.length > 0

        ? newSellers[newSellers.length - 1]

        : null;



    setSellers([...newSellers]);

    safeStorageSet(getStorageKey("sellers"), JSON.stringify(newSellers));



    if (latestSeller) {

      try {

        await fetch(`${API_URL}/sellers`, {

          method: "POST",

          headers: getAuthHeaders(),

          body: JSON.stringify({

            id: latestSeller.id || `sel_${Date.now()}`,

            name: latestSeller.name,

          }),

        });

      } catch (err) {

        console.error("Erro ao salvar vendedor no banco:", err);

      }

    }

  };



  const handleFiadosStateUpdate = (valueOrUpdater) => {

    // Esse setter é exclusivo da tela Fiados: atualiza estado e cache local,

    // sem disparar um POST indevido ao excluir ou marcar uma parcela.

    fiadosRevision.current += 1;



    if (typeof valueOrUpdater === "function") {

      setFiados((current) => {

        const updated = valueOrUpdater(current);

        const safeUpdated = Array.isArray(updated) ? updated : current;

        safeStorageSet(

          getStorageKey("fiados"),

          JSON.stringify(safeUpdated),

        );

        return safeUpdated;

      });

      return;

    }



    const safeFiados = Array.isArray(valueOrUpdater) ? valueOrUpdater : [];

    setFiados([...safeFiados]);

    safeStorageSet(getStorageKey("fiados"), JSON.stringify(safeFiados));

  };



  const handleUpdateFiados = async (newFiados) => {

    if (!Array.isArray(newFiados)) return;

    fiadosRevision.current += 1;

    const latestFiado =

      Array.isArray(newFiados) && newFiados.length > 0

        ? newFiados[newFiados.length - 1]

        : null;



    setFiados([...newFiados]);

    safeStorageSet(getStorageKey("fiados"), JSON.stringify(newFiados));



    if (latestFiado) {

      try {

        await fetch(`${API_URL}/fiados`, {

          method: "POST",

          headers: getAuthHeaders(),

          body: JSON.stringify({

            id: latestFiado.id || `fiado_${Date.now()}`,

            customer_id:

              latestFiado.customer_id || latestFiado.customerId || null,

            customer_name:

              latestFiado.customer_name ||

              latestFiado.customerName ||

              "Cliente",

            products: latestFiado.products || latestFiado.items || [],

            installments: latestFiado.installments || [],

            origin: latestFiado.origin || "PDV",

          }),

        });

      } catch (err) {

        console.error("Erro ao salvar fiado no banco:", err);

      }

    }

  };



  const handleUpdateSales = async (newSales) => {

    const latestSale =

      Array.isArray(newSales) && newSales.length > 0

        ? newSales[newSales.length - 1]

        : null;



    setSales([...newSales]);

    safeStorageSet(getStorageKey("sales"), JSON.stringify(newSales));



    if (latestSale) {

      try {

        await fetch(`${API_URL}/sales`, {

          method: "POST",

          headers: getAuthHeaders(),

          body: JSON.stringify({

            id: latestSale.id || `pur_${Date.now()}`,

            customerId:

              latestSale.customerId ||

              latestSale.customer_id ||

              latestSale.customer ||

              null,

            customer_name:

              latestSale.customer_name ||

              latestSale.customerName ||

              "Cliente Geral",

            total: Number(latestSale.total || 0),

            subtotal: Number(latestSale.subtotal || latestSale.total || 0),

            discount: Number(latestSale.discount || 0),

            items: latestSale.items || [],

            seller: latestSale.seller || null,

            payment_method:

              latestSale.payment_method || latestSale.paymentMethod || "Pix",

            sales_channel:

              latestSale.sales_channel ||

              latestSale.salesChannel ||

              latestSale.channel ||

              "Loja física",

            delivery_type:

              latestSale.delivery_type ||

              latestSale.deliveryType ||

              latestSale.fulfillment ||

              "Retirada",

            gender:

              latestSale.gender || latestSale.genders || "Prefiro não informar",

            date: latestSale.date || new Date().toISOString(),

          }),

        });

      } catch (err) {

        console.error("Erro de conexão ao registrar venda:", err);

      }

    }

  };



  const handleUpdatePreTreinoRecords = (valueOrUpdater) => {

    setPreTreinoRecords((current) => {

      const updated = typeof valueOrUpdater === "function"

        ? valueOrUpdater(current)

        : valueOrUpdater;

      const safe = Array.isArray(updated) ? updated : current;

      safeStorageSet(getStorageKey("pre_treino_records"), JSON.stringify(safe));

      return safe;

    });

  };



  const handleUpdatePreTreinoProducts = (valueOrUpdater) => {

    setProdutosPreTreino((current) => {

      const updated = typeof valueOrUpdater === "function"

        ? valueOrUpdater(current)

        : valueOrUpdater;

      const safe = Array.isArray(updated) ? updated : current;

      safeStorageSet(getStorageKey("pre_treino_products"), JSON.stringify(safe));

      return safe;

    });

  };



  const bg = dark ? "#121212" : "#F4F4F5";

  const card = dark ? "#18181B" : "#FFFFFF";

  const card2 = dark ? "#202024" : "#FAFAFA";

  const text = dark ? "#F4F4F5" : "#18181B";

  const subtext = dark ? "#A1A1AA" : "#71717A";

  const border = dark ? "#27272A" : "#E4E4E7";



  if (loading) {

    return (

      <div

        style={{

          minHeight: "100vh",

          background: bg,

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          color: text,

          fontFamily: FONT_BODY,

        }}

      >

        Carregando dados...

      </div>

    );

  }



  if (isPublicCatalog) {

    return <PublicCatalog accent={accent} dark={dark} />;

  }



  if (!user) {

    return (

      <LoginScreen

        accent={accent}

        onLogin={(userData, token) => handleLogin(userData, token)}

      />

    );

  }



  const nav = [

    { id: "pdv", label: "PDV", icon: ShoppingCart },

    { id: "dashboard", label: "Painel", icon: BarChart3 },

    { id: "clientes", label: "Clientes", icon: Users },

    { id: "estoque", label: "Estoque", icon: Package },

    { id: "vendedores", label: "Vendedores", icon: Award },

    { id: "catalogo", label: "Catálogo", icon: Store },

    { id: "cashback", label: "Cashback", icon: Gift },

    { id: "fiados", label: "Fiados", icon: Wallet },

    { id: "preTreino", label: "Pré-Treino", icon: Calendar },

    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },

    { id: "trafego", label: "Tráfego Pago", icon: TrendingUp },

    { id: "canais", label: "Canais de Venda", icon: Share2 },

    { id: "dre", label: "DRE", icon: Calculator },

    { id: "planos", label: "Planos", icon: Percent },

  ];

  const MOBILE_PRIMARY = ["pdv", "dashboard", "clientes", "estoque"];

  const mobileBottomItems = nav.filter((n) => MOBILE_PRIMARY.includes(n.id));

  const mobileMenuItems = nav.filter((n) => !MOBILE_PRIMARY.includes(n.id));



  const renderScreen = (screenTab = tab) => {

    if (screenTab === "dashboard")

      return (

        <Dashboard

          {...{

            sales,

            products,

            customers,

            sellers,

            card,

            border,

            subtext,

            accent,

            text,

          }}

        />

      );

    if (screenTab === "clientes")

      return (

        <Clientes

          customers={customers}

          setCustomers={handleUpdateCustomers}

          {...{ sales, card, border, subtext, accent, text }}

        />

      );



    if (screenTab === "estoque")

      return (

        <Estoque

          products={products}

          setProducts={handleUpdateProducts}

          onDeleteProduct={handleDeleteProduct}

          onEditProduct={handleEditProduct}

          {...{

            stockLocations,

            setStockLocations,

            card,

            border,

            subtext,

            accent,

            text,

          }}

        />

      );



    if (screenTab === "pdv")

      return (

        <PDV

          products={products}

          customers={customers}

          setCustomers={handleUpdateCustomers}

          sellers={sellers}

          sales={sales}

          setSales={handleUpdateSales}

          onSaleCompleted={fetchUserData}

          fiados={fiados}

          setFiados={handleUpdateFiados}

          {...{ cashbackPct, card, border, subtext, accent, text, dark }}

        />

      );

    if (screenTab === "vendedores")

      return (

        <Vendedores

          sellers={sellers}

          setSellers={handleUpdateSellers}

          {...{ sales, card, border, subtext, accent, text }}

        />

      );

    if (screenTab === "catalogo")

      return (

        <Catalogo

          products={products}

          userId={user?.id}

          apiUrl={API_URL}

          {...{ sales, card, border, subtext, accent, text, dark, device }}

        />

      );

    if (screenTab === "cashback")

      return (

        <Cashback

          customers={customers}

          setCustomers={handleUpdateCustomers}

          {...{

            cashbackPct,

            setCashbackPct,

            cashbackValidityDays,

            setCashbackValidityDays,

            card,

            border,

            subtext,

            accent,

            text,

          }}

        />

      );

    if (screenTab === "fiados")

      return (

        <Fiados

          fiados={fiados}

          setFiados={handleFiadosStateUpdate}

          apiUrl={API_URL}

          {...{ customers, card, border, subtext, accent, text }}

        />

      );



    if (screenTab === "preTreino")

      return (

        <PreTreino

          clientesPreTreino={preTreinoCustomers}

          setClientesPreTreino={(valueOrUpdater) => {

            setPreTreinoCustomers((current) => {

              const updated = typeof valueOrUpdater === "function"

                ? valueOrUpdater(current)

                : valueOrUpdater;

              const safe = Array.isArray(updated) ? updated : current;

              safeStorageSet(getStorageKey("pre_treino_customers"), JSON.stringify(safe));

              return safe;

            });

          }}

          produtosPreTreino={produtosPreTreino}

          setProdutosPreTreino={handleUpdatePreTreinoProducts}

          registros={preTreinoRecords}

          setRegistros={handleUpdatePreTreinoRecords}

          API_URL={API_URL}

          getAuthHeaders={getAuthHeaders}

          {...{ card, border, subtext, accent, text, dark }}

        />

      );



    if (screenTab === "whatsapp")

      return (

        <WhatsApp

          {...{

            waSchedule,

            setWaSchedule,

            cashbackValidityDays,

            customers,

            card,

            border,

            subtext,

            accent,

            text,

          }}

        />

      );

    if (screenTab === "trafego")

      return (

        <TrafegoPago

          {...{

            adEntries,

            setAdEntries,

            sales,

            card,

            border,

            subtext,

            accent,

            text,

          }}

        />

      );

    if (screenTab === "canais")

      return (

        <CanaisDeVenda

          {...{ sales, setSales, card, border, subtext, accent, text }}

        />

      );

    if (screenTab === "dre")

      return <DRE {...{ sales, card, border, subtext, accent, text }} />;

    if (screenTab === "planos")

      return <Planos {...{ card, border, subtext, accent, text }} />;

    if (screenTab === "menu")

      return (

        <MenuGridScreen

          items={mobileMenuItems}

          onNavigate={navigateToTab}

          card={card}

          border={border}

          subtext={subtext}

          accent={accent}

          text={text}

        />

      );

    return null;

  };



  if (device === "mobile") {

    return (

      <div className="byse-mobile-root" style={{ "--accent": accent, minHeight: "100vh", background: bg }}>

        <style>{GLOBAL_CSS}</style>

        <style>{`

          .byse-mobile-root { width:100%; min-height:100vh; min-height:100dvh; overflow:hidden; }

          .byse-mobile-shell { width:100%; max-width:560px; height:100vh; height:100dvh; min-height:0; margin:0 auto; display:flex; flex-direction:column; overflow:hidden; }

          .byse-mobile-header { min-height:48px; padding:7px 10px !important; gap:8px; }

          .byse-mobile-header button { white-space:nowrap; }

          .byse-mobile-content { flex:1 1 auto; min-height:0; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; padding:10px 10px 14px !important; }

          .byse-mobile-content > div { min-width:0; max-width:100%; }

          .byse-mobile-content img, .byse-mobile-content video, .byse-mobile-content canvas { max-width:100%; }

          .byse-mobile-nav { flex:0 0 auto; min-height:58px; padding-bottom:env(safe-area-inset-bottom); }

          .byse-mobile-nav button { min-width:0; min-height:54px; padding:7px 2px 6px !important; gap:2px !important; }

          .byse-mobile-nav button span { max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:9px !important; }

          @media (max-width:360px) {

            .byse-mobile-header { padding-left:8px !important; padding-right:8px !important; }

            .byse-mobile-header .byse-device-label { display:none; }

            .byse-mobile-content { padding:8px 8px 12px !important; }

            .byse-mobile-nav button span { font-size:8px !important; }

          }

        `}</style>

        <div

          className="byse-mobile-shell"

          style={{

            background: bg,

            color: text,

            fontFamily: FONT_BODY,

          }}

        >

          <div

            className="byse-mobile-header"

            style={{

              display: "flex",

              alignItems: "center",

              justifyContent: "space-between",

              padding: "8px 10px",

              minHeight: 48,

              background: card2,

              borderBottom: `1px solid ${border}`,

              flexShrink: 0,

            }}

          >

            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>

              <LogoMark accent={accent} size={25} />

              <span

                style={{

                  fontFamily: FONT_DISPLAY,

                  fontSize: 15,

                  letterSpacing: 1.5,

                }}

              >

                BYSE <span style={{ color: accent }}>PRO</span>

              </span>

            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

              <button

                onClick={() => setDevice("desktop")}

                style={{

                  padding: "5px 8px",

                  background: card,

                  border: `1px solid ${border}`,

                  borderRadius: 7,

                  color: subtext,

                  fontFamily: FONT_BODY,

                  fontSize: 9,

                  fontWeight: 600,

                  cursor: "pointer",

                }}

              >

                <span className="byse-device-label">💻 Notebook</span>

              </button>

              <button

                onClick={() => setDark(!dark)}

                style={{

                  width: 28,

                  height: 28,

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  background: card,

                  border: `1px solid ${border}`,

                  borderRadius: 7,

                  cursor: "pointer",

                  color: text,

                }}

              >

                {dark ? <Sun size={13} /> : <Moon size={13} />}

              </button>

              <button

                onClick={handleLogout}

                title="Sair"

                style={{

                  width: 28,

                  height: 28,

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  background: card,

                  border: `1px solid ${border}`,

                  borderRadius: 7,

                  cursor: "pointer",

                  color: "#FF5555",

                }}

              >

                <LogOut size={13} />

              </button>

            </div>

          </div>

          <div className="byse-mobile-content" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "10px 10px 14px", position: "relative" }}>

            {mobileMenuItems.some((i) => i.id === tab) && (

              <button

                onClick={() => navigateToTab("menu")}

                style={{

                  background: "none",

                  border: "none",

                  color: subtext,

                  fontSize: 11,

                  marginBottom: 8,

                  cursor: "pointer",

                  padding: 0,

                }}

              >

                ← Menu

              </button>

            )}

            {visitedTabs.map((screenTab) => (

              <div

                key={screenTab}

                style={

                  tab === screenTab

                    ? { display: "block", width: "100%" }

                    : { display: "none" }

                }

                aria-hidden={tab !== screenTab}

              >

                {renderScreen(screenTab)}

              </div>

            ))}

          </div>

          <div

            className="byse-mobile-nav"

            style={{

              display: "flex",

              borderTop: `1px solid ${border}`,

              background: card2,

              flexShrink: 0,

            }}

          >

            {mobileBottomItems.map((n) => {

              const Icon = n.icon;

              const active = tab === n.id;

              return (

                <button

                  key={n.id}

                  onClick={() => navigateToTab(n.id)}

                  style={{

                    flex: 1,

                    display: "flex",

                    flexDirection: "column",

                    alignItems: "center",

                    gap: 3,

                    padding: "9px 4px 8px",

                    border: "none",

                    cursor: "pointer",

                    background: active ? `${accent}18` : "transparent",

                    borderTop: active

                      ? `2px solid ${accent}`

                      : "2px solid transparent",

                  }}

                >

                  <Icon size={17} color={active ? accent : subtext} />

                  <span

                    style={{

                      fontSize: 9.5,

                      color: active ? accent : subtext,

                      fontWeight: active ? 700 : 500,

                    }}

                  >

                    {n.label}

                  </span>

                </button>

              );

            })}

            <button

              onClick={() => navigateToTab("menu")}

              style={{

                flex: 1,

                display: "flex",

                flexDirection: "column",

                alignItems: "center",

                gap: 3,

                padding: "9px 4px 8px",

                border: "none",

                cursor: "pointer",

                background: tab === "menu" ? `${accent}18` : "transparent",

                borderTop:

                  tab === "menu"

                    ? `2px solid ${accent}`

                    : "2px solid transparent",

              }}

            >

              <LayoutGrid size={17} color={tab === "menu" ? accent : subtext} />

              <span

                style={{

                  fontSize: 9.5,

                  color: tab === "menu" ? accent : subtext,

                  fontWeight: tab === "menu" ? 700 : 500,

                }}

              >

                Menu

              </span>

            </button>

          </div>

        </div>

      </div>

    );

  }



  return (

    <div

      style={{

        "--accent": accent,

        minHeight: "100vh",

        background: bg,

        color: text,

        fontFamily: FONT_BODY,

      }}

    >

      <style>{GLOBAL_CSS}</style>

      <div style={{ display: "flex" }}>

        <div

          style={{

            width: 224,

            minHeight: "100vh",

            background: card2,

            borderRight: `1px solid ${border}`,

            padding: "20px 12px",

            position: "sticky",

            top: 0,

            overflowY: "auto",

          }}

        >

          <div

            style={{

              display: "flex",

              alignItems: "center",

              gap: 10,

              padding: "0 8px 20px",

              borderBottom: `1px solid ${border}`,

              marginBottom: 16,

            }}

          >

            <LogoMark accent={accent} size={34} />

            <div>

              <div

                style={{

                  fontFamily: FONT_DISPLAY,

                  fontSize: 16,

                  letterSpacing: 1.5,

                }}

              >

                BYSE <span style={{ color: accent }}>PRO</span>

              </div>

              <div style={{ fontSize: 10.5, color: subtext }}>

                {user?.name || user?.email || "MVP · protótipo"}

              </div>

            </div>

          </div>

          {nav.map((n) => {

            const Icon = n.icon;

            const active = tab === n.id;

            return (

              <button

                key={n.id}

                onClick={() => navigateToTab(n.id)}

                style={{

                  width: "100%",

                  display: "flex",

                  alignItems: "center",

                  gap: 10,

                  padding: "9px 10px",

                  marginBottom: 3,

                  borderRadius: 8,

                  border: "none",

                  background: active ? accent : "transparent",

                  color: active ? "#fff" : text,

                  fontSize: 13,

                  fontWeight: active ? 600 : 500,

                  cursor: "pointer",

                  textAlign: "left",

                }}

              >

                <Icon size={15} /> {n.label}

              </button>

            );

          })}

          <div

            style={{

              marginTop: 20,

              paddingTop: 16,

              borderTop: `1px solid ${border}`,

            }}

          >

            <SLabel subtext={subtext}>Aparência & Conta</SLabel>

            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>

              <button

                onClick={() => setDevice("mobile")}

                style={{

                  flex: 1,

                  padding: "7px 4px",

                  borderRadius: 8,

                  border: `1px solid ${border}`,

                  background: "transparent",

                  color: text,

                  fontSize: 11.5,

                  fontWeight: 600,

                  cursor: "pointer",

                }}

              >

                📱 Celular

              </button>

              <button

                onClick={() => setDevice("desktop")}

                style={{

                  flex: 1,

                  padding: "7px 4px",

                  borderRadius: 8,

                  border: `1px solid ${accent}`,

                  background: accent,

                  color: "#fff",

                  fontSize: 11.5,

                  fontWeight: 600,

                  cursor: "pointer",

                }}

              >

                💻 Notebook

              </button>

            </div>

            <button

              onClick={() => setDark(!dark)}

              style={{

                width: "100%",

                display: "flex",

                alignItems: "center",

                gap: 10,

                padding: "9px 10px",

                borderRadius: 8,

                border: `1px solid ${border}`,

                background: "transparent",

                color: text,

                fontSize: 13,

                cursor: "pointer",

                marginBottom: 8,

              }}

            >

              {dark ? <Sun size={15} /> : <Moon size={15} />}{" "}

              {dark ? "Modo dia" : "Modo noite"}

            </button>

            <button

              onClick={handleLogout}

              style={{

                width: "100%",

                display: "flex",

                alignItems: "center",

                gap: 10,

                padding: "9px 10px",

                borderRadius: 8,

                border: `1px solid ${border}`,

                background: "transparent",

                color: "#FF5555",

                fontSize: 13,

                cursor: "pointer",

                marginBottom: 12,

              }}

            >

              <LogOut size={15} /> Sair do sistema

            </button>

            <div style={{ display: "flex", gap: 6, paddingLeft: 8 }}>

              {Array.isArray(PRESET_COLORS)

                ? PRESET_COLORS.map((c) => (

                    <button

                      key={c}

                      onClick={() => setAccent(c)}

                      style={{

                        width: 20,

                        height: 20,

                        borderRadius: "50%",

                        background: c,

                        border:

                          accent === c

                            ? `2px solid ${text}`

                            : "1px solid transparent",

                        cursor: "pointer",

                      }}

                    />

                  ))

                : null}

            </div>

          </div>

        </div>

        <div style={{ flex: 1, padding: "28px 32px", maxWidth: 1100, position: "relative" }}>

          {visitedTabs.map((screenTab) => (

            <div

              key={screenTab}

              style={

                tab === screenTab

                  ? { display: "block", width: "100%" }

                  : { display: "none" }

              }

              aria-hidden={tab !== screenTab}

            >

              {renderScreen(screenTab)}

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}



export default SupplementSystem;
