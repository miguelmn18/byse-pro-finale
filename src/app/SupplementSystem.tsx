// @ts-nocheck
import React, { useEffect, useState } from "react";
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

function SupplementSystem() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(true);
  const [accent, setAccent] = useState("#DC2626");
  const [device, setDevice] = useState("mobile");
  const [tab, setTab] = useState("dashboard");

  const [publicStoreData, setPublicStoreData] = useState<any>(null);
  const [isPublicCatalog, setIsPublicCatalog] = useState(false);

  const [products, setProducts] = useState([]);

  const [customers, setCustomers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [sales, setSales] = useState([]);

  const [fiados, setFiados] = useState([]);
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

  const fetchUserData = async (targetUser = user) => {
    const headers = getAuthHeaders();

    try {
      const resCustomers = await fetch(`${API_URL}/customers`, { headers });
      if (resCustomers.ok) {
        const data = await resCustomers.json();
        if (Array.isArray(data)) {
          setCustomers([...data]);
          localStorage.setItem(
            getStorageKey("customers", targetUser),
            JSON.stringify(data),
          );
        }
      }

      const resSales = await fetch(`${API_URL}/sales`, { headers });
      if (resSales.ok) {
        const data = await resSales.json();
        if (Array.isArray(data)) {
          const normalizedSales = data.map((s) => ({
            ...s,
            customerId: s.customerId || s.customer_id || s.customer || null,
            customer_id: s.customer_id || s.customerId || s.customer || null,
            customerName: s.customerName || s.customer_name || "Cliente Geral",
            customer_name: s.customer_name || s.customerName || "Cliente Geral",
            gender: s.gender || s.genders || "Prefiro não informar",
          }));
          setSales([...normalizedSales]);
        }
      }

      const resProducts = await fetch(`${API_URL}/products`, { headers });
      if (resProducts.ok) {
        const data = await resProducts.json();
        if (Array.isArray(data)) {
          setProducts([...data]);
          localStorage.setItem(
            getStorageKey("products", targetUser),
            JSON.stringify(data),
          );
        }
      }

      const resSellers = await fetch(`${API_URL}/sellers`, { headers });
      if (resSellers.ok) {
        const data = await resSellers.json();
        if (Array.isArray(data)) {
          setSellers([...data]);
          localStorage.setItem(
            getStorageKey("sellers", targetUser),
            JSON.stringify(data),
          );
        }
      }

      const resFiados = await fetch(`${API_URL}/fiados`, { headers });
      if (resFiados.ok) {
        const data = await resFiados.json();
        if (Array.isArray(data)) {
          setFiados([...data]);
          localStorage.setItem(
            getStorageKey("fiados", targetUser),
            JSON.stringify(data),
          );
        }
      }

      const resPtRecs = await fetch(`${API_URL}/pre-treino/records`, {
        headers,
      });
      if (resPtRecs.ok) {
        const data = await resPtRecs.json();
        if (Array.isArray(data)) {
          setPreTreinoRecords([...data]);
          localStorage.setItem(
            getStorageKey("pre_treino_records", targetUser),
            JSON.stringify(data),
          );
        }
      }

      const resPtProds = await fetch(`${API_URL}/pre-treino/products`, {
        headers,
      });
      if (resPtProds.ok) {
        const data = await resPtProds.json();
        if (Array.isArray(data)) {
          setProdutosPreTreino([...data]);
          localStorage.setItem(
            getStorageKey("pre_treino_products", targetUser),
            JSON.stringify(data),
          );
        }
      }

      const resPtCusts = await fetch(`${API_URL}/pre-treino/customers`, {
        headers,
      });
      if (resPtCusts.ok) {
        const data = await resPtCusts.json();
        if (Array.isArray(data)) {
          setPreTreinoCustomers([...data]);
          localStorage.setItem(
            getStorageKey("pre_treino_customers", targetUser),
            JSON.stringify(data),
          );
        }
      }
    } catch (err) {
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
    const path = window.location.pathname.replace(/\/+$/, "");

    // Aceita o link público atual e mantém compatibilidade com links antigos.
    const publicCatalogMatch =
      path.match(/^\/publicCatalog\/([^/]+)$/i) ||
      path.match(/^\/catalogo\/([^/]+)$/i);

    if (publicCatalogMatch) {
      const storeUserId = decodeURIComponent(publicCatalogMatch[1]);
      setIsPublicCatalog(true);
      setPublicStoreData(null);
      setLoading(true);

      fetch(`${API_URL}/public/catalogo/${encodeURIComponent(storeUserId)}`)
        .then(async (res) => {
          if (!res.ok) {
            let message = "Não foi possível carregar o catálogo.";
            try {
              const errorData = await res.json();
              message = errorData?.error || message;
            } catch (_) {}
            throw new Error(message);
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
        const localProd = localStorage.getItem(`byse_products_${uKey}`);
        const localSellers = localStorage.getItem(`byse_sellers_${uKey}`);
        const localFiados = localStorage.getItem(`byse_fiados_${uKey}`);
        const localPtRecs = localStorage.getItem(
          `byse_pre_treino_records_${uKey}`,
        );
        const localPtProds = localStorage.getItem(
          `byse_pre_treino_products_${uKey}`,
        );
        const localPtCusts = localStorage.getItem(
          `byse_pre_treino_customers_${uKey}`,
        );

        if (localCust) setCustomers(JSON.parse(localCust));
        if (localProd) setProducts(JSON.parse(localProd));
        if (localSellers) setSellers(JSON.parse(localSellers));
        if (localFiados) setFiados(JSON.parse(localFiados));
        if (localPtRecs) setPreTreinoRecords(JSON.parse(localPtRecs));
        if (localPtProds) setProdutosPreTreino(JSON.parse(localPtProds));
        if (localPtCusts) setPreTreinoCustomers(JSON.parse(localPtCusts));

        setLoading(true);
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
    if (token) localStorage.setItem("byse_token", token);
    localStorage.setItem("byse_user", JSON.stringify(userData));

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
    const localProd = localStorage.getItem(`byse_products_${uKey}`);
    const localSellers = localStorage.getItem(`byse_sellers_${uKey}`);
    const localFiados = localStorage.getItem(`byse_fiados_${uKey}`);
    const localPtRecs = localStorage.getItem(`byse_pre_treino_records_${uKey}`);
    const localPtProds = localStorage.getItem(
      `byse_pre_treino_products_${uKey}`,
    );
    const localPtCusts = localStorage.getItem(
      `byse_pre_treino_customers_${uKey}`,
    );

    if (localCust) setCustomers(JSON.parse(localCust));
    if (localProd) setProducts(JSON.parse(localProd));
    if (localSellers) setSellers(JSON.parse(localSellers));
    if (localFiados) setFiados(JSON.parse(localFiados));
    if (localPtRecs) setPreTreinoRecords(JSON.parse(localPtRecs));
    if (localPtProds) setProdutosPreTreino(JSON.parse(localPtProds));
    if (localPtCusts) setPreTreinoCustomers(JSON.parse(localPtCusts));

    fetchUserData(userData).finally(() => setLoading(false));
  };

  const handleLogout = () => {
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
    localStorage.setItem(
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

  const handleUpdateProducts = async (product) => {
  try {
    const token = localStorage.getItem("byse_token");

    if (!token) {
      throw new Error(
        "Sessão não encontrada. Faça login novamente."
      );
    }

    const API_URL = (
      import.meta.env.VITE_API_URL ||
      "http://localhost:3333"
    ).replace(/\/$/, "");

    /*
     * Aceita tanto:
     * product.name
     * quanto:
     * product.nome
     */
    const productName = String(
      product?.name ??
      product?.nome ??
      ""
    ).trim();

    /*
     * Aceita também preço em diferentes formatos.
     */
    const productPrice = Number(
      product?.price ??
      product?.preco ??
      0
    );

    if (!productName) {
      console.error(
        "[HANDLE UPDATE PRODUCT] Produto recebido:",
        product
      );

      throw new Error(
        "Informe o nome do produto."
      );
    }

    if (
      !Number.isFinite(productPrice) ||
      productPrice <= 0
    ) {
      throw new Error(
        "Informe um preço de venda válido."
      );
    }

    const isEditing = Boolean(
      product?.id
    );

    const url = isEditing
      ? `${API_URL}/api/products/${encodeURIComponent(
          product.id
        )}`
      : `${API_URL}/api/products`;

    /*
     * Monta o objeto exatamente no formato
     * esperado pelo backend.
     */
    const payload = {
      ...(isEditing && product.id
        ? { id: product.id }
        : {}),

      name: productName,

      category: String(
        product?.category ??
        product?.categoria ??
        "Sem categoria"
      ).trim(),

      barcode:
        product?.barcode ??
        product?.codigoBarras ??
        null,

      code:
        product?.code ??
        product?.codigo ??
        null,

      cost: Number(
        product?.cost ??
        product?.custo ??
        0
      ),

      price: productPrice,

      imposto: Number(
        product?.imposto ?? 0
      ),

      frete: Number(
        product?.frete ?? 0
      ),

      vipPrice:
        product?.vipPrice !== undefined &&
        product?.vipPrice !== null &&
        product?.vipPrice !== ""
          ? Number(product.vipPrice)
          : product?.vip_price !== undefined &&
            product?.vip_price !== null &&
            product?.vip_price !== ""
          ? Number(product.vip_price)
          : null,

      vipPrice3x:
        product?.vipPrice3x !== undefined &&
        product?.vipPrice3x !== null &&
        product?.vipPrice3x !== ""
          ? Number(product.vipPrice3x)
          : product?.vip_price_3x !== undefined &&
            product?.vip_price_3x !== null &&
            product?.vip_price_3x !== ""
          ? Number(product.vip_price_3x)
          : null,

      description:
        product?.description ??
        product?.descricao ??
        "",

      controlStock:
        product?.controlStock !== undefined
          ? Boolean(product.controlStock)
          : product?.control_stock !== undefined
          ? Boolean(product.control_stock)
          : true,

      imageUrl:
        product?.imageUrl ??
        product?.image_url ??
        null,

      stocks:
        product?.stocks &&
        typeof product.stocks === "object"
          ? product.stocks
          : {},

      variations:
        Array.isArray(product?.variations)
          ? product.variations
          : [],
    };

    console.log(
      "[HANDLE UPDATE PRODUCT] Enviando produto:",
      payload
    );

    const response = await fetch(
      url,
      {
        method: isEditing
          ? "PUT"
          : "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      }
    );

    const data =
      await response
        .json()
        .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.error ||
        data?.message ||
        `Erro ao salvar produto (${response.status}).`
      );
    }

    /*
     * O backend retorna o produto
     * efetivamente salvo.
     */
    const savedProduct = data;

    if (!savedProduct?.id) {
      throw new Error(
        "O servidor não retornou corretamente o produto salvo."
      );
    }

    /*
     * Atualiza o estado React.
     */
    setProducts(
      (previousProducts) => {
        const current =
          Array.isArray(
            previousProducts
          )
            ? previousProducts
            : [];

        const index =
          current.findIndex(
            (p) =>
              String(p.id) ===
              String(savedProduct.id)
          );

        if (index >= 0) {
          const updated = [
            ...current,
          ];

          updated[index] =
            savedProduct;

          return updated;
        }

        return [
          savedProduct,
          ...current,
        ];
      }
    );

    return savedProduct;

  } catch (error) {
    console.error(
      "[HANDLE UPDATE PRODUCT]",
      error
    );

    alert(
      error?.message ||
      "Não foi possível salvar o produto."
    );

    throw error;
  }
};


const handleDeleteProduct = async (productId) => {
  try {
    if (!productId) {
      throw new Error("Produto inválido.");
    }

    const token =
      localStorage.getItem("byse_token");

    if (!token) {
      throw new Error(
        "Sessão não encontrada. Faça login novamente."
      );
    }

    const API_URL = (
      import.meta.env.VITE_API_URL ||
      "http://localhost:3333"
    ).replace(/\/$/, "");

    const response = await fetch(
      `${API_URL}/api/products/${encodeURIComponent(productId)}`,
      {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data =
      await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.error ||
        data?.message ||
        `Erro ao excluir produto (${response.status}).`
      );
    }

    setProducts((previousProducts) => {
      const current = Array.isArray(previousProducts)
        ? previousProducts
        : [];

      return current.filter(
        (p) =>
          String(p.id) !== String(productId)
      );
    });

  } catch (error) {
    console.error(
      "[HANDLE DELETE PRODUCT]",
      error
    );

    alert(
      error?.message ||
      "Não foi possível excluir o produto."
    );

    throw error;
  }
};


const handleEditProduct = async (updatedProduct) => {
  /*
   * Não precisamos fazer outro fetch aqui.
   *
   * handleUpdateProducts já sabe diferenciar:
   * POST = novo produto
   * PUT  = produto existente
   */
  return await handleUpdateProducts(
    updatedProduct
  );
};

  const handleUpdateFiados = async (newFiados) => {
    const latestFiado =
      Array.isArray(newFiados) && newFiados.length > 0
        ? newFiados[newFiados.length - 1]
        : null;

    setFiados([...newFiados]);
    localStorage.setItem(getStorageKey("fiados"), JSON.stringify(newFiados));

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

  const handleUpdatePreTreinoRecords = async (newRecords) => {
    const latest =
      Array.isArray(newRecords) && newRecords.length > 0
        ? newRecords[newRecords.length - 1]
        : null;

    setPreTreinoRecords([...newRecords]);
    localStorage.setItem(
      getStorageKey("pre_treino_records"),
      JSON.stringify(newRecords),
    );

    if (latest) {
      try {
        await fetch(`${API_URL}/pre-treino/records`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(latest),
        });
      } catch (err) {
        console.error("Erro ao salvar registro de pré-treino:", err);
      }
    }
  };

  const handleUpdatePreTreinoProducts = async (newProds) => {
    const latest =
      Array.isArray(newProds) && newProds.length > 0
        ? newProds[newProds.length - 1]
        : null;

    setProdutosPreTreino([...newProds]);
    localStorage.setItem(
      getStorageKey("pre_treino_products"),
      JSON.stringify(newProds),
    );

    if (latest) {
      try {
        await fetch(`${API_URL}/pre-treino/products`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(latest),
        });
      } catch (err) {
        console.error("Erro ao salvar produto de pré-treino:", err);
      }
    }
  };

  // Padrões originais de cores preservados
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
    return <PublicCatalog />;
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
    { id: "dashboard", label: "Painel", icon: BarChart3 },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "estoque", label: "Estoque", icon: Package },
    { id: "pdv", label: "PDV", icon: ShoppingCart },
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
  const MOBILE_PRIMARY = ["dashboard", "pdv", "clientes", "estoque"];
  const mobileBottomItems = nav.filter((n) => MOBILE_PRIMARY.includes(n.id));
  const mobileMenuItems = nav.filter((n) => !MOBILE_PRIMARY.includes(n.id));

  const renderScreen = () => {
    if (tab === "dashboard")
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
    if (tab === "clientes")
      return (
        <Clientes
          customers={customers}
          setCustomers={handleUpdateCustomers}
          {...{ sales, card, border, subtext, accent, text }}
        />
      );

    if (tab === "estoque")
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

    if (tab === "pdv")
      return (
        <PDV
          products={products}
          customers={customers}
          setCustomers={handleUpdateCustomers}
          sellers={sellers}
          sales={sales}
          setSales={setSales}
          onSaleCompleted={fetchUserData}
          fiados={fiados}
          setFiados={handleUpdateFiados}
          {...{ cashbackPct, card, border, subtext, accent, text, dark }}
        />
      );
    if (tab === "vendedores")
      return (
        <Vendedores
          sellers={sellers}
          setSellers={setSellers}
          {...{ sales, card, border, subtext, accent, text }}
        />
      );
    if (tab === "catalogo")
      return (
        <Catalogo
          products={products}
          userId={user?.id}
          apiUrl={API_URL}
          {...{ sales, card, border, subtext, accent, text, dark, device }}
        />
      );
    if (tab === "cashback")
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
    if (tab === "fiados")
      return (
        <Fiados
          fiados={fiados}
          setFiados={handleUpdateFiados}
          {...{ customers, card, border, subtext, accent, text }}
        />
      );

    if (tab === "preTreino")
      return (
        <PreTreino
          clientesPreTreino={preTreinoCustomers}
          setClientesPreTreino={(newCusts) => {
            setPreTreinoCustomers(newCusts);
            localStorage.setItem(
              getStorageKey("pre_treino_customers"),
              JSON.stringify(newCusts),
            );
          }}
          produtosPreTreino={produtosPreTreino}
          setProdutosPreTreino={(newProds) => {
            setProdutosPreTreino(newProds);
            localStorage.setItem(
              getStorageKey("pre_treino_products"),
              JSON.stringify(newProds),
            );
            handleUpdatePreTreinoProducts(newProds);
          }}
          registros={preTreinoRecords}
          setRegistros={(newRecs) => {
            setPreTreinoRecords(newRecs);
            localStorage.setItem(
              getStorageKey("pre_treino_records"),
              JSON.stringify(newRecs),
            );
            handleUpdatePreTreinoRecords(newRecs);
          }}
          API_URL={API_URL}
          getAuthHeaders={getAuthHeaders}
          {...{ card, border, subtext, accent, text, dark }}
        />
      );

    if (tab === "whatsapp")
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
    if (tab === "trafego")
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
    if (tab === "canais")
      return (
        <CanaisDeVenda
          {...{ sales, setSales, card, border, subtext, accent, text }}
        />
      );
    if (tab === "dre")
      return <DRE {...{ sales, card, border, subtext, accent, text }} />;
    if (tab === "planos")
      return <Planos {...{ card, border, subtext, accent, text }} />;
    if (tab === "menu")
      return (
        <MenuGridScreen
          items={mobileMenuItems}
          onNavigate={setTab}
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
      <div style={{ "--accent": accent, minHeight: "100vh", background: bg }}>
        <style>{GLOBAL_CSS}</style>
        <div
          style={{
            maxWidth: 430,
            margin: "0 auto",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            background: bg,
            color: text,
            fontFamily: FONT_BODY,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px 10px",
              background: card2,
              borderBottom: `1px solid ${border}`,
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <LogoMark accent={accent} size={28} />
              <span
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 17,
                  letterSpacing: 2,
                }}
              >
                BYSE <span style={{ color: accent }}>PRO</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setDevice("desktop")}
                style={{
                  padding: "5px 10px",
                  background: card,
                  border: `1px solid ${border}`,
                  borderRadius: 7,
                  color: subtext,
                  fontFamily: FONT_BODY,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                💻 Notebook
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
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
            {mobileMenuItems.some((i) => i.id === tab) && (
              <button
                onClick={() => setTab("menu")}
                style={{
                  background: "none",
                  border: "none",
                  color: subtext,
                  fontSize: 12.5,
                  marginBottom: 12,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                ← Menu
              </button>
            )}
            {renderScreen()}
          </div>
          <div
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
                  onClick={() => setTab(n.id)}
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
              onClick={() => setTab("menu")}
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
                onClick={() => setTab(n.id)}
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
        <div style={{ flex: 1, padding: "28px 32px", maxWidth: 1100 }}>
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}

export default SupplementSystem;
