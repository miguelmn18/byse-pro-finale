
 // @ts-nocheck

import React, { useEffect, useState, useRef } from 'react';
import vipAnimation from '../Animation_for_VIP.mp4';

import {
  Lock,
  ShoppingBag,
  MessageCircle,
  Phone,
  CheckCircle2,
  Tag,
  X,
  Plus,
  Minus,
  Sparkles,
  Info,
  CreditCard,
  Truck,
  FileText,
  MapPin,
  Instagram,
  ChevronLeft
} from 'lucide-react';

export function PublicCatalog({ accent: accentProp, dark: darkProp }: any = {}) {
  // A vitrine pública reaproveita a identidade visual definida no BYSE PRO.
  const accent = accentProp || (typeof window !== 'undefined' && localStorage.getItem('byse_accent')) || '#DC2626';
  const dark = typeof darkProp === 'boolean' ? darkProp : (typeof window !== 'undefined' && localStorage.getItem('byse_dark') !== null ? localStorage.getItem('byse_dark') === 'true' : false);
  const shopTheme = dark ? { bg: '#111214', surface: '#191a1d', surfaceAlt: '#222429', text: '#f5f5f5', muted: '#a1a1aa', border: '#34363b', accent } : { bg: '#f7f7f7', surface: '#ffffff', surfaceAlt: '#f1f1f1', text: '#171717', muted: '#737373', border: '#e5e5e5', accent };
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [vipLoading, setVipLoading] = useState(false);
  const [vip, setVip] = useState(false);
  const [showVip, setShowVip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  // Após liberar o VIP, abre a listagem completa em vez de deixar o cliente
  // apenas na tela de categorias, o que podia parecer que os produtos sumiram.
  const [showAllProducts, setShowAllProducts] = useState(false);

  const [cart, setCart] = useState<
    { product: any; quantity: number; flavor?: string }[]
  >([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const [consultMessage, setConsultMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [detailFlavor, setDetailFlavor] = useState('');
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [infoPanel, setInfoPanel] = useState('');
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutDdd, setCheckoutDdd] = useState('');
  const [checkoutNumber, setCheckoutNumber] = useState('');
  const [checkoutPhoneError, setCheckoutPhoneError] = useState('');
  const [checkoutSaving, setCheckoutSaving] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro / espécie');
  const [orderDelivery, setOrderDelivery] = useState('Retirada');
  const [detailAddedNotice, setDetailAddedNotice] = useState('');

  // Controle da seleção de sabores.
  const [selectedFlavorProduct, setSelectedFlavorProduct] =
    useState<any>(null);
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [flavorNotice, setFlavorNotice] = useState('');

  const fallbackProductsRef = useRef<any[]>([]);

  // Aceita VITE_API_URL com ou sem o sufixo /api.
  const configuredApiUrl = (
    import.meta.env.VITE_API_URL ||
    'http://localhost:3333'
  ).replace(/\/+$/, '');
  const base = configuredApiUrl.replace(/\/api$/i, '');
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const id = pathParts.length >= 2 ? decodeURIComponent(pathParts[1]) : '';

  const catalogVisible =
    data?.catalogVisible !== undefined
      ? Boolean(data.catalogVisible)
      : data?.productsVisible !== undefined
        ? Boolean(data.productsVisible)
        : data?.visibility !== undefined
          ? Boolean(data.visibility)
          : true;

  // A senha VIP libera a visualização dos preços mesmo quando o lojista
  // configurou o catálogo público como restrito no Catalogo.tsx.
  // catalogVisible continua preservado como configuração original da loja.
  const pricesVisible = catalogVisible || vip;

  /*
   * NORMALIZAÇÃO DOS DADOS DO CATÁLOGO E DAS OFERTAS
   */
  const mergeProducts = (previousProducts: any[], incomingProducts: any[]) => {
    const previous = Array.isArray(previousProducts) ? previousProducts : [];
    const incoming = Array.isArray(incomingProducts) ? incomingProducts : [];
    const previousById = new Map(previous.map(product => [String(product.id), product]));
    const incomingIds = new Set(incoming.map(product => String(product.id)));
    const mergedIncoming = incoming.map(product => ({
      ...(previousById.get(String(product.id)) || {}),
      ...product
    }));
    // Preserva itens já carregados se uma resposta parcial da API vier sem algum produto.
    const preservedPrevious = previous.filter(product => !incomingIds.has(String(product.id)));
    return [...mergedIncoming, ...preservedPrevious];
  };

  // A rota pública pode devolver as configurações em diferentes níveis,
  // dependendo da versão do backend. Procura o campo do banner em todos eles.
  const catalogSettings =
    data?.catalogConfig || data?.catalog_config || data?.config ||
    data?.settings || data?.catalogSettings || data?.catalog_settings ||
    data?.catalog?.config || data?.catalog || data || {};
  const catalogBrandBannerImage = String(
    catalogSettings?.catalogBrandBannerImage ??
    catalogSettings?.catalog_brand_banner_image ??
    catalogSettings?.bannerImage ??
    catalogSettings?.banner_image ??
    data?.catalogBrandBannerImage ??
    data?.catalog_brand_banner_image ??
    data?.bannerImage ??
    data?.banner_image ??
    ''
  ).trim();

  const publicBrandName = String(
    catalogSettings?.publicBrandName ??
    catalogSettings?.public_brand_name ??
    data?.publicBrandName ??
    data?.public_brand_name ??
    'M-BYSE'
  ).trim() || 'M-BYSE';

  const storeSlogan = String(
    catalogSettings?.storeSlogan ??
    catalogSettings?.store_slogan ??
    data?.storeSlogan ??
    data?.store_slogan ??
    ''
  ).trim();

  const configuredPaymentMethods =
    catalogSettings?.paymentMethods ??
    catalogSettings?.payment_methods ??
    data?.paymentMethods ??
    data?.payment_methods ??
    [];

  const deliveryMode = String(
    catalogSettings?.deliveryMode ??
    catalogSettings?.delivery_mode ??
    data?.deliveryMode ??
    data?.delivery_mode ??
    'delivery'
  ).toLowerCase();

  const deliveryCoverage = String(
    catalogSettings?.deliveryCoverage ??
    catalogSettings?.delivery_coverage ??
    data?.deliveryCoverage ??
    data?.delivery_coverage ??
    'local'
  ).toLowerCase();

  const deliveryDisplayMessage = deliveryMode === 'pickup'
    ? 'Apenas retirada.'
    : deliveryCoverage === 'brazil'
      ? 'Entregamos em todo o Brasil.'
      : 'Entrega disponível somente na região da loja.';

  // Imagens cadastradas em Catalogo.tsx. A API pode entregar o campo na raiz
  // da resposta ou dentro de catalogConfig/config/settings.
  const categoryImages =
    catalogSettings?.categoryImages ||
    catalogSettings?.category_images ||
    data?.categoryImages ||
    data?.category_images ||
    {};

  const getCategoryImage = (category: string) => {
    if (!categoryImages) return '';

    let image = categoryImages?.[category];

    // Compatibilidade com categorias que diferem apenas em maiúsculas,
    // espaços ou acentuação entre o cadastro e o produto.
    if (!image && typeof categoryImages === 'object' && !Array.isArray(categoryImages)) {
      const normalize = (value: any) => String(value || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      const matchedKey = Object.keys(categoryImages).find(
        key => normalize(key) === normalize(category)
      );
      if (matchedKey) image = categoryImages[matchedKey];
    }

    if (typeof image === 'string') return image.trim();
    if (image && typeof image === 'object') {
      return String(
        image.url || image.imageUrl || image.image_url ||
        image.src || image.data || image.base64 || ''
      ).trim();
    }
    return '';
  };

  const getOfferDetails = (product: any) => {
    const details = catalogSettings?.weeklyOfferDetails || catalogSettings?.weekly_offer_details || {};
    const detail = details?.[String(product?.id ?? '')] || {};
    const originalPrice = Number(detail.originalPrice ?? detail.original_price ?? product?.price ?? 0);
    const offerPrice = Number(detail.offerPrice ?? detail.offer_price ?? detail.promotionalPrice ?? detail.promotional_price ?? detail.price ?? 0);
    const valid = Number.isFinite(originalPrice) && Number.isFinite(offerPrice) && originalPrice > 0 && offerPrice > 0 && offerPrice < originalPrice;
    return {
      valid,
      originalPrice,
      offerPrice: valid ? offerPrice : 0,
      discountAmount: valid ? Number((originalPrice - offerPrice).toFixed(2)) : 0,
      discountPercent: valid ? Number((((originalPrice - offerPrice) / originalPrice) * 100).toFixed(2)) : 0
    };
  };

  const getConfiguredIds = (...values: any[]) => {
    const selectedArray = values.find(value => Array.isArray(value) && value.length > 0);
    if (!selectedArray) return [];
    return selectedArray.map((item: any) => item && typeof item === 'object'
      ? String(item.id ?? item.product_id ?? item.productId ?? item.value ?? '')
      : String(item)).filter(Boolean);
  };

  const formatCurrency = (value: any) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  /*
   * CARREGAMENTO DO CATÁLOGO
   */
  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      if (!id) {
        setError('Identificador da loja não encontrado no endereço.');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem(`vip_token_${id}`);
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      try {
        const response = await fetch(`${base}/api/public/catalogo/${encodeURIComponent(id)}`, { headers });
        if (!response.ok) {
          if (response.status === 401 && token) localStorage.removeItem(`vip_token_${id}`);
          throw new Error('Catálogo não encontrado.');
        }

        const responseData = await response.json();
        if (!active) return;

        const incoming = Array.isArray(responseData?.products) ? responseData.products : [];
        const currentProducts = Array.isArray(data?.products) ? data.products : [];
        const merged = mergeProducts([...fallbackProductsRef.current, ...currentProducts], incoming);
        if (merged.length) fallbackProductsRef.current = merged;

        setData({ ...responseData, products: merged });
        const isVipFromServer = Boolean(responseData?.isVip);
        setVip(isVipFromServer);
        if (token && !isVipFromServer) localStorage.removeItem(`vip_token_${id}`);
      } catch (loadError) {
        if (active) setError('Catálogo não encontrado ou indisponível no momento.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCatalog();
    return () => { active = false; };
  }, [id, base]);

  /*
   * IDENTIFICA OS SABORES DO PRODUTO
   *
   * Aceita diferentes nomes de campos para compatibilidade
   * com os produtos cadastrados no BYSE PRO.
   */
  const getProductFlavors = (product: any): string[] => {
    if (!product) return [];

    const possibleOptions =
      product.flavors ??
      product.sabores ??
      product.flavorOptions ??
      product.saborOptions ??
      product.variations ??
      product.variacoes ??
      product.variationsList ??
      product.options ??
      [];

    if (!Array.isArray(possibleOptions)) {
      return [];
    }

    const flavors = possibleOptions
      .map((option: any) => {
        if (typeof option === 'string') {
          return option.trim();
        }

        if (option && typeof option === 'object') {
          if (
            option.enabled === false ||
            option.active === false ||
            option.ativo === false
          ) {
            return '';
          }

          return String(
            option.flavor ??
            option.sabor ??
            option.name ??
            option.nome ??
            option.label ??
            option.value ??
            option.title ??
            ''
          ).trim();
        }

        return '';
      })
      .filter(Boolean);

    return Array.from(new Set(flavors));
  };

  /*
   * VALIDAÇÃO VIP — o acesso só é liberado após confirmação do backend.
   */
  const verify = async () => {
    if (vipLoading) return;
    const cleanPassword = String(password || '').trim();
    if (!cleanPassword) {
      alert('Digite a senha VIP fornecida pela loja.');
      return;
    }

    setVipLoading(true);
    try {
      const response = await fetch(`${base}/api/public/catalogo/${encodeURIComponent(id)}/vip/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: cleanPassword })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.accessToken) {
        alert(result?.error || 'Senha VIP inválida.');
        return;
      }

      const newToken = result.accessToken;
      localStorage.setItem(`vip_token_${id}`, newToken);
      const catalogResponse = await fetch(`${base}/api/public/catalogo/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${newToken}` }
      });
      if (!catalogResponse.ok) {
        localStorage.removeItem(`vip_token_${id}`);
        throw new Error('Não foi possível carregar os preços VIP.');
      }

      const freshData = await catalogResponse.json();
      const freshProducts = Array.isArray(freshData?.products) ? freshData.products : [];
      const currentProducts = Array.isArray(data?.products) ? data.products : [];
      const mergedProducts = mergeProducts(
        [...fallbackProductsRef.current, ...currentProducts],
        freshProducts
      );
      if (mergedProducts.length) fallbackProductsRef.current = mergedProducts;

      if (!freshData?.isVip) {
        localStorage.removeItem(`vip_token_${id}`);
        throw new Error('A API não confirmou a liberação VIP. Verifique a rota pública no backend.');
      }

      setData((previous: any) => ({
        ...(previous || {}),
        ...freshData,
        products: mergedProducts.length ? mergedProducts : (previous?.products || fallbackProductsRef.current)
      }));
      setVip(true);
      setShowVip(false);
      setPassword('');
      setSelectedCategory('Todos');
      setQuery('');
      setShowAllProducts(true);
      // A animação deve iniciar somente depois que o backend confirmar o VIP
      // e os produtos atualizados já estiverem no estado do catálogo.
      setShowIntro(true);
    } catch (e: any) {
      console.error('Erro ao validar acesso VIP:', e);
      alert(e?.message || 'Erro ao validar senha VIP. Tente novamente.');
    } finally {
      setVipLoading(false);
    }
  };

  /*
   * SAÍDA DO VIP — mantém a vitrine carregada e remove apenas a autorização.
   */
  const handleLogoutVip = async () => {
    localStorage.removeItem(`vip_token_${id}`);
    setVip(false);
    setShowIntro(false);
    setShowAllProducts(false);

    try {
      const response = await fetch(`${base}/api/public/catalogo/${encodeURIComponent(id)}`);
      if (response.ok) {
        const freshData = await response.json();
        const freshProducts = Array.isArray(freshData?.products) ? freshData.products : [];
        const mergedProducts = mergeProducts(fallbackProductsRef.current, freshProducts);
        if (mergedProducts.length) fallbackProductsRef.current = mergedProducts;
        setData((previous: any) => ({
          ...(previous || {}), ...freshData, isVip: false,
          products: mergedProducts.length ? mergedProducts : (previous?.products || fallbackProductsRef.current)
        }));
      } else {
        setData((previous: any) => ({ ...(previous || {}), isVip: false, products: previous?.products || fallbackProductsRef.current }));
      }
    } catch (e) {
      console.error('Erro ao atualizar catálogo ao sair do VIP:', e);
      setData((previous: any) => ({ ...(previous || {}), isVip: false, products: previous?.products || fallbackProductsRef.current }));
    }
  };

  /*
   * ADICIONAR AO CARRINHO
   *
   * Produtos com sabores são identificados também pelo sabor,
   * permitindo comprar o mesmo produto com sabores diferentes.
   */
  const addToCart = (product: any, flavor = '', quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(
        item =>
          String(item.product.id) === String(product.id) &&
          (item.flavor || '') === flavor
      );

      if (existing) {
        return prev.map(item =>
          String(item.product.id) === String(product.id) &&
          (item.flavor || '') === flavor
            ? {
                ...item,
                quantity: item.quantity + quantity
              }
            : item
        );
      }

      return [
        ...prev,
        {
          product,
          quantity,
          flavor
        }
      ];
    });

    setSelectedFlavorProduct(null);
    setSelectedFlavor('');
    setFlavorNotice('');
  };

  /*
   * ABRIR A SELEÇÃO DE SABORES
   */
  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setDetailFlavor('');
    setDetailQuantity(1);
    setDetailAddedNotice('');
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
    setDetailFlavor('');
    setDetailQuantity(1);
  };

  const addProductDetailsToCart = () => {
    if (!selectedProduct) return;
    const flavors = getProductFlavors(selectedProduct);
    if (flavors.length && !detailFlavor) {
      alert('Selecione uma variação/sabor antes de adicionar ao carrinho.');
      return;
    }
    addToCart(selectedProduct, detailFlavor, Math.max(1, Number(detailQuantity) || 1));
    setDetailAddedNotice('Produto adicionado ao carrinho!');
    window.setTimeout(() => setDetailAddedNotice(''), 2200);
  };

  /*
   * CONFIRMAR SABOR
   */
  const confirmFlavor = () => {
    if (!selectedFlavorProduct) return;

    if (!selectedFlavor) {
      setFlavorNotice(
        'Você precisa selecionar um sabor para continuar.'
      );
      return;
    }

    addToCart(selectedFlavorProduct, selectedFlavor);
  };

  /*
   * ALTERAR QUANTIDADE
   *
   * Identifica produto e sabor para não alterar outra opção.
   */
  const updateQuantity = (
    productId: any,
    delta: number,
    flavor = ''
  ) => {
    setCart(prev =>
      prev
        .map(item => {
          if (
            String(item.product.id) === String(productId) &&
            (item.flavor || '') === flavor
          ) {
            const newQty = item.quantity + delta;

            return newQty > 0
              ? { ...item, quantity: newQty }
              : null;
          }

          return item;
        })
        .filter(Boolean)
    );
  };

  /*
   * PREÇO ATUAL — combina oferta semanal e preço VIP sem acumular descontos.
   */
  const getProductPrice = (product: any) => {
    if (!product) return 0;
    const offer = getOfferDetails(product);
    const regularPrice = Number(product.price || 0);
    // No modo VIP, o preço VIP é independente das promoções públicas.
    // Nunca combina os dois descontos nem utiliza a oferta como fallback.
    let effectivePrice = vip ? regularPrice : (offer.valid ? offer.offerPrice : regularPrice);

    if (vip) {
      const vipValue = product.vip_price !== undefined ? product.vip_price : product.vipPrice;
      const vipPrice = Number(vipValue);
      if (vipValue !== null && vipValue !== undefined && Number.isFinite(vipPrice) && vipPrice > 0) {
        effectivePrice = vipPrice;
      }
    }

    return Number.isFinite(effectivePrice) && effectivePrice > 0
      ? effectivePrice
      : Math.max(0, regularPrice);
  };

  /*
   * ECONOMIA POR PRODUTO — diferença entre o preço normal e o preço efetivo.
   */
  const getProductSavings = (product: any) => {
    if (!product) return 0;
    const regularPrice = Number(product.price || 0);
    const effectivePrice = getProductPrice(product);
    if (!Number.isFinite(regularPrice) || !Number.isFinite(effectivePrice) || regularPrice <= effectivePrice) return 0;
    return Number((regularPrice - effectivePrice).toFixed(2));
  };

  /*
   * TOTAL DO CARRINHO
   */
  const calculateTotal = () => {
    const activeProducts =
      Array.isArray(data?.products) && data.products.length > 0
        ? data.products
        : fallbackProductsRef.current;

    return cart.reduce((total, item) => {
      const currentProduct =
        activeProducts?.find(
          (p: any) =>
            String(p.id) === String(item.product.id)
        ) || item.product;

      return (
        total +
        getProductPrice(currentProduct) * item.quantity
      );
    }, 0);
  };

  /*
   * ECONOMIA TOTAL DO CARRINHO
   * Multiplica a economia unitária pela quantidade de cada item.
   */
  const calculateCartSavings = () => {
    if (!vip) return 0;

    const activeProducts =
      Array.isArray(data?.products) && data.products.length > 0
        ? data.products
        : fallbackProductsRef.current;

    return cart.reduce((total, item) => {
      const currentProduct =
        activeProducts?.find(
          (p: any) =>
            String(p.id) === String(item.product.id)
        ) || item.product;

      return total + getProductSavings(currentProduct) * item.quantity;
    }, 0);
  };

  /*
   * CONSULTAR PELO WHATSAPP
   * Usa exatamente o número configurado para finalizar o pedido no carrinho.
   */
  const handleConsultWhatsApp = () => {
    if (!data?.whatsapp) {
      alert('Esta loja ainda não configurou um número de WhatsApp para atendimento.');
      return;
    }

    const digits = String(data.whatsapp).replace(/\\D/g, '');
    const cleanPhone = digits.startsWith('55') ? digits : `55${digits}`;

    if (cleanPhone.length < 12 || cleanPhone.length > 13) {
      alert('O WhatsApp desta loja está inválido. Avise o lojista para corrigir o número no Catálogo.');
      return;
    }

    const message = consultMessage.trim()
      ? `Olá! Gostaria de consultar sobre os produtos deste catálogo.\n\nMinha dúvida: ${consultMessage.trim()}`
      : 'Olá! Gostaria de consultar sobre os produtos disponíveis neste catálogo.';

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const formatCheckoutNumber = (value: string) => {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
    return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
  };

  const cartQuantity = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);

  /*
   * FINALIZAR PEDIDO PELO WHATSAPP
   * Registra o cliente na base da loja antes de abrir a conversa.
   */
  const handleCheckoutWhatsApp = async () => {
    if (!data?.whatsapp) {
      alert(
        'Esta loja ainda não configurou um número de WhatsApp para pedidos.'
      );
      return;
    }

    const digits = String(data.whatsapp).replace(/\D/g, '');
    const cleanPhone = digits.startsWith('55')
      ? digits
      : `55${digits}`;

    if (
      cleanPhone.length < 12 ||
      cleanPhone.length > 13
    ) {
      alert(
        'O WhatsApp desta loja está inválido. Avise o lojista para corrigir o número no Catálogo.'
      );
      return;
    }

    if (!cart.length) {
      alert('Adicione pelo menos um produto ao pedido antes de finalizar.');
      return;
    }

    const customerName = String(checkoutName || '').trim();
    const ddd = String(checkoutDdd || '').replace(/\D/g, '');
    const phoneNumber = String(checkoutNumber || '').replace(/\D/g, '');

    if (!customerName) {
      alert('Informe o nome do cliente para continuar.');
      return;
    }
    if (ddd.length !== 2) {
      setCheckoutPhoneError('Informe o DDD com exatamente 2 números.');
      return;
    }
    if (phoneNumber.length !== 8) {
      setCheckoutPhoneError('Informe exatamente 8 números no WhatsApp.');
      return;
    }

    setCheckoutPhoneError('');
    if (checkoutSaving) return;
    setCheckoutSaving(true);

    try {
      const customerResponse = await fetch(
        `${base}/api/public/catalogo/${encodeURIComponent(id)}/customers`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: customerName, phone: `55${ddd}${phoneNumber}` })
        }
      );
      const customerResult = await customerResponse.json().catch(() => ({}));
      if (!customerResponse.ok) {
        throw new Error(customerResult?.error || 'Não foi possível registrar seus dados. Tente novamente.');
      }
    } catch (customerError: any) {
      alert(customerError?.message || 'Erro ao registrar seus dados.');
      setCheckoutSaving(false);
      return;
    }

    const activeProducts =
      Array.isArray(data?.products) && data.products.length > 0
        ? data.products
        : fallbackProductsRef.current;

    let message =
      `*Pedido via Catálogo Online - ${
        data?.storeName || 'Loja'
      }*\n\n` +
      `*Cliente:* ${customerName}\n` +
      `*WhatsApp:* 55 ${ddd} ${formatCheckoutNumber(phoneNumber)}\n` +
      `*Forma de pagamento:* ${paymentMethod}\n` +
      `*Entrega:* ${orderDelivery}\n\n`;

    if (vip) {
      message += '🔓 _Condição de Preço VIP Ativa_\n\n';
    }

    cart.forEach(item => {
      const currentProduct =
        activeProducts?.find(
          (p: any) =>
            String(p.id) === String(item.product.id)
        ) || item.product;

      const price = getProductPrice(currentProduct);

      const productName = item.flavor
        ? `${currentProduct.name} — Sabor: ${item.flavor}`
        : currentProduct.name;

      message += pricesVisible
        ? `• ${item.quantity}x ${productName} - R$ ${(price * item.quantity).toFixed(2)}\n`
        : `• ${item.quantity}x ${productName}\n`;
    });

    if (pricesVisible) {
      message += `\n*Total:* R$ ${calculateTotal().toFixed(2)}`;
    } else {
      message += '\n*Valores:* sob consulta';
    }

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
    setCheckoutSaving(false);
    setShowCheckout(false);
    setCheckoutStep(1);
    setIsCartOpen(false);
  };

  const continueCheckout = () => {
    if (checkoutStep === 1) {
      const ddd = String(checkoutDdd || '').replace(/\D/g, '');
      const number = String(checkoutNumber || '').replace(/\D/g, '');
      if (!String(checkoutName || '').trim()) {
        alert('Informe seu nome para continuar.');
        return;
      }
      if (ddd.length !== 2 || number.length !== 8) {
        setCheckoutPhoneError(ddd.length !== 2 ? 'Informe o DDD com exatamente 2 números.' : 'Informe exatamente 8 números no WhatsApp.');
        return;
      }
      setCheckoutPhoneError('');
    }
    setCheckoutStep(current => Math.min(3, current + 1));
  };

  /*
   * CARREGAMENTO
   */
  if (loading && !data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0C0C0C',
          color: '#F0EFE9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif'
        }}
      >
        Carregando catálogo...
      </div>
    );
  }

  /*
   * ERRO
   */
  if (error && !data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0C0C0C',
          color: '#F0EFE9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          fontFamily: 'sans-serif'
        }}
      >
        <h2 style={{ color: '#DC2626' }}>
          Ops! Catálogo Indisponível
        </h2>

        <p style={{ color: '#8A8A82', marginBottom: 16 }}>
          {error || 'Identificador da loja não encontrado.'}
        </p>
      </div>
    );
  }

  const productsList =
    Array.isArray(data?.products) &&
    data.products.length > 0
      ? data.products
      : fallbackProductsRef.current;

  // Categorias reais da loja. 'Todos' fica apenas como estado interno
  // para retornar à vitrine de categorias, não como um cartão.
  const categories = Array.from(
    new Set(
      productsList.map((p: any) => p.category || 'Geral')
    )
  );

  const filteredProducts = productsList.filter(
    (product: any) => {
      const matchesCategory =
        selectedCategory === 'Todos' ||
        (product.category || 'Geral') === selectedCategory;

      const searchText = query.toLowerCase();

      const matchesSearch =
        String(product.name || '')
          .toLowerCase()
          .includes(searchText) ||
        String(product.description || '')
          .toLowerCase()
          .includes(searchText);

      return matchesCategory && matchesSearch;
    }
  );

  const getConfiguredProducts = (ids: any[]) => {
    const safeIds = Array.isArray(ids) ? ids.map((item: any) => item && typeof item === 'object'
      ? String(item.id ?? item.product_id ?? item.productId ?? item.value ?? '')
      : String(item)).filter(Boolean) : [];
    return safeIds
      .map(productId => productsList.find((product: any) =>
        String(product.id) === productId || String(product.name || '').trim().toLowerCase() === productId.trim().toLowerCase()
      ))
      .filter(Boolean);
  };

  const weeklyOfferIds = getConfiguredIds(catalogSettings?.weeklyOfferProductIds, catalogSettings?.weekly_offer_product_ids, catalogSettings?.weeklyOffers);
  const weeklyNewIds = getConfiguredIds(catalogSettings?.weeklyNewProductIds, catalogSettings?.weekly_new_product_ids, catalogSettings?.weeklyNewProducts);
  const bestSellerIds = getConfiguredIds(data?.bestSellingProductIds, data?.best_selling_product_ids, data?.bestSellerProductIds, data?.best_sellers, data?.bestSellingProducts, catalogSettings?.bestSellingProductIds);

  const bestSellingProducts = getConfiguredProducts(bestSellerIds);
  const weeklyOffers = vip ? [] : getConfiguredProducts(weeklyOfferIds).filter((product: any) => getOfferDetails(product).valid);
  const weeklyNewProducts = getConfiguredProducts(weeklyNewIds);

  const renderFeaturedShelf = (title: string, subtitle: string, items: any[], marker: string) => {
    if (!items.length) return null;

    const isBestSelling = title === 'Mais vendidos';
    const isWeeklyNew = title === 'Novidades da semana';
    const visibleItems = isBestSelling ? items.slice(0, 10) : items;
    const shouldAnimate = isBestSelling && visibleItems.length > 1;
    const carouselItems = shouldAnimate
      ? [...visibleItems, ...visibleItems, ...visibleItems, ...visibleItems]
      : visibleItems;

    return (
      <section className={`catalog-featured-section${isWeeklyNew ? ' catalog-new-arrivals-glow' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 8, marginBottom: 10 }}>
          <div>
            <h2 className="vip-accent-text" style={{ margin: 0, fontSize: 17, fontWeight: 850 }}>{title}</h2>
            <p style={{ margin: '3px 0 0', color: vip ? '#B9A77D' : '#8A8A82', fontSize: 11 }}>{subtitle}</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, color: vip ? '#E6C982' : '#DC2626', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{marker}</span>
        </div>
        <div className={`catalog-featured-viewport${shouldAnimate ? ' is-animated' : ''}`}>
          <div className={`catalog-featured-track${shouldAnimate ? ' catalog-best-sellers-track' : ''}`}>
            {carouselItems.map((product: any, index: number) => {
              const image = product.image_url || product.imageUrl;
              return (
                <div
                  className="catalog-featured-card"
                  key={`${title}-${product.id}-${index}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver detalhes de ${product.name}`}
                  onClick={() => handleProductClick(product)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleProductClick(product);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {image ? <img src={image} alt={product.name} /> : <div className="catalog-featured-image-placeholder"><Tag size={20} /></div>}
                  <div className="catalog-featured-card-content">
                    <div className="featured-name" title={product.name} style={{ color: vip ? '#F5EBD3' : '#F0EFE9', fontSize: 11, fontWeight: 750, lineHeight: 1.25, minHeight: 27, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</div>
                    <div className="featured-price" style={{ color: vip ? '#E6C982' : '#F0EFE9', fontSize: 11, fontWeight: 800, margin: '4px 0 6px' }}>
                      {pricesVisible ? (
                        <>
                          {!vip && getOfferDetails(product).valid && (
                            <span style={{ display: 'block', color: '#8A8A82', fontSize: 9, textDecoration: 'line-through', fontWeight: 500 }}>
                              {formatCurrency(getOfferDetails(product).originalPrice)}
                            </span>
                          )}
                          <span>{formatCurrency(getProductPrice(product))}</span>
                          {!vip && getOfferDetails(product).valid && (
                            <span style={{ display: 'block', color: '#FCA5A5', fontSize: 9, fontWeight: 800 }}>
                              {getOfferDetails(product).discountPercent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% OFF
                            </span>
                          )}
                        </>
                      ) : 'Sob consulta'}
                    </div>
                    <button
                      onClick={event => {
                        event.stopPropagation();
                        handleProductClick(product);
                      }}
                    >
                      Ver produto
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div
      className={vip ? 'vip-theme' : ''}
      style={{
        minHeight: '100vh',
        background: vip ? (dark ? '#17130b' : '#fbf7ec') : shopTheme.bg,
        color: vip ? (dark ? '#F5EBD3' : '#342a18') : shopTheme.text,
        padding: '0 0 48px',
        '--shop-accent': accent,
        '--shop-bg': shopTheme.bg,
        '--shop-surface': shopTheme.surface,
        '--shop-surface-alt': shopTheme.surfaceAlt,
        '--shop-text': shopTheme.text,
        '--shop-muted': shopTheme.muted,
        '--shop-border': shopTheme.border,
        '--shop-accent-soft': `${accent}18`,
        fontFamily: 'sans-serif',
        position: 'relative'
      }}
    >
      {/* INTRODUÇÃO VIP COM VÍDEO */}
      {showIntro && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100dvh',
            background: '#000',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <video
            key={`vip-intro-${id}`}
            src={vipAnimation}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={() => setShowIntro(false)}
            onError={() => setShowIntro(false)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
          <button
            type="button"
            onClick={() => setShowIntro(false)}
            style={{
              position: 'absolute',
              right: 18,
              top: 18,
              zIndex: 2,
              border: '1px solid rgba(255,255,255,.35)',
              borderRadius: 999,
              padding: '9px 14px',
              background: 'rgba(18,18,18,.78)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)'
            }}
          >
            Pular animação
          </button>
        </div>
      )}

      <style>{`
        .public-catalog-root { width: 100%; }
        .catalog-header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
        .catalog-vip-group { display: flex; gap: 6px; align-items: center; }
        .catalog-action-btn { min-height: 42px; justify-content: center; transition: transform .16s ease, filter .16s ease, box-shadow .16s ease; }
        .catalog-action-btn:active { transform: translateY(1px) scale(.985); filter: brightness(.94); }
        .catalog-vip-btn { background: linear-gradient(135deg, #E13A4C, #A91F36) !important; box-shadow: 0 7px 18px rgba(24,0,7,.24), inset 0 1px 0 rgba(255,255,255,.18) !important; letter-spacing: .1px; }
        .catalog-consult-btn { background: linear-gradient(135deg, #20B86A, #12864C) !important; box-shadow: 0 6px 16px rgba(0,0,0,.18); }
        .catalog-cart-btn { background: rgba(255,255,255,.09) !important; border: 1px solid rgba(255,255,255,.2) !important; box-shadow: 0 6px 16px rgba(0,0,0,.16); }
        .catalog-brand-lockup { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .catalog-brand-emblem { width: 48px; height: 48px; flex: 0 0 48px; display: block; object-fit: contain; object-position: center; border-radius: 10px; background: transparent; border: 0; box-shadow: none; transform: none; }
        .catalog-brand-copy { min-width: 0; }
        .catalog-brand-name { margin: 0; color: #FFF7F5 !important; font-size: 27px !important; line-height: .98; font-weight: 950 !important; letter-spacing: 1.8px; text-shadow: 0 2px 14px rgba(0,0,0,.24); }
        .catalog-brand-tagline { margin-top: 5px; color: #F3C7CE; font-size: 9px; font-weight: 850; letter-spacing: 1.45px; }
        .catalog-brand-tagline span { color: #FF6577; padding: 0 2px; }
        .catalog-store-name { margin-top: 5px; color: #F8DDE1; font-size: 11px; font-weight: 750; letter-spacing: .25px; }
        .catalog-brand-description { color: #E3BFC6 !important; margin: 6px 0 0 !important; font-size: 11px !important; line-height: 1.35; }
        .catalog-products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 13px; align-items: start; }
        .catalog-product-image { width: 100%; height: 176px; max-height: 176px; aspect-ratio: 4 / 3 !important; object-fit: contain !important; background: #141414; }
        .catalog-product-price { font-size: 19px !important; line-height: 1.15; font-weight: 900 !important; letter-spacing: -.35px; }
        .catalog-product-price-vip { color: #34D399 !important; }
        .catalog-product-price-offer { color: #FCA5A5 !important; }
        .catalog-product-price-regular { color: #F0EFE9 !important; }
        .catalog-falling-background { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
        .catalog-falling-product { position: absolute; top: -24vh; width: clamp(54px, 8vw, 112px); height: clamp(68px, 10vw, 142px); object-fit: cover; border-radius: 12px; opacity: 0; filter: grayscale(.12) brightness(.78) saturate(1.12) contrast(1.08); box-shadow: 0 8px 28px rgba(20,0,5,.30); animation: catalogProductFall 19s linear infinite, catalogProductTint 7s ease-in-out infinite alternate; }
        @keyframes catalogProductFall { 0% { transform: translate3d(0,-5vh,0) rotate(-12deg); opacity: 0; } 10% { opacity: .19; } 80% { opacity: .15; } 100% { transform: translate3d(35px,125vh,0) rotate(18deg); opacity: 0; } }
        @keyframes catalogProductTint { 0% { filter: grayscale(.22) brightness(.58) saturate(.9) contrast(1.08); } 100% { filter: grayscale(.04) sepia(.18) saturate(1.35) hue-rotate(-8deg) brightness(.9); } }
        .public-catalog-root { position: relative; z-index: 1; }
        .catalog-product-card > div:first-child > div:not(.catalog-product-content) { max-height: 176px; }
        .vip-theme .catalog-header, .vip-theme .catalog-product-card { background: #19160F !important; border-color: #806B3D !important; }
        .vip-theme .catalog-product-category { background: #342B19 !important; color: #E6C982 !important; }
        .vip-theme .catalog-header-title { color: #F5EBD3 !important; }
        .vip-theme .catalog-brand-name { color: #FFF7F5 !important; }
        .vip-theme .catalog-vip-btn { background: linear-gradient(135deg, #D9B765, #A98232) !important; color: #211707 !important; border: 1px solid rgba(255,235,180,.55) !important; }
        .vip-theme .catalog-consult-btn { background: linear-gradient(135deg, #20B86A, #12864C) !important; color: #fff !important; border: 0 !important; }
        .vip-theme .catalog-cart-btn { background: rgba(255,255,255,.08) !important; color: #F5EBD3 !important; border: 1px solid #806B3D !important; }
        .vip-theme .catalog-header p { color: #B9A77D !important; }
        .vip-theme .catalog-product-name { color: #F5EBD3 !important; }
        .vip-theme .catalog-products-grid button, .vip-theme .catalog-header button:not(:nth-child(2)) { background: #B8954B !important; color: #17130A !important; border-color: #D6B96F !important; }
        .vip-theme .catalog-search-section button { background: #2C2415 !important; color: #E6C982 !important; border: 1px solid #806B3D !important; }
        .vip-theme .catalog-search-section button[aria-pressed="true"] { background: #B8954B !important; color: #17130A !important; }
        .vip-theme .vip-accent-text { color: #E6C982 !important; }
        .catalog-featured-section { margin: 0 0 19px; min-width: 0; }
        .catalog-featured-viewport { width: 100%; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; scrollbar-color: #454545 transparent; }
        .catalog-featured-viewport.is-animated { overflow: hidden; }
        .catalog-featured-track { display: flex; align-items: stretch; gap: 9px; width: max-content; min-width: 100%; }
        .catalog-featured-card { flex: 0 0 clamp(132px, 15vw, 168px); width: clamp(132px, 15vw, 168px); min-width: 0; overflow: hidden; border-radius: 10px; border: 1px solid #2E2E2E; background: #1C1C1C; cursor: pointer; transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; }
        .catalog-featured-card:hover { transform: translateY(-3px); border-color: var(--shop-accent); box-shadow: 0 8px 22px rgba(0,0,0,.16); }
        .catalog-featured-card:focus-visible { outline: 3px solid var(--shop-accent); outline-offset: 3px; }
        .vip-theme .catalog-featured-card { background: #19160F; border-color: #806B3D; }
        .catalog-featured-card img, .catalog-featured-image-placeholder { width: 100%; height: 88px; object-fit: cover; display: block; }
        .catalog-featured-image-placeholder { display: grid; place-items: center; color: #8A8A82; background: #141414; }
        .vip-theme .catalog-featured-image-placeholder { color: #C8AD6A; background: #211B10; }
        .catalog-featured-card-content { padding: 7px 8px 8px; }
        .catalog-featured-card button { width: 100%; border: 0; padding: 6px; border-radius: 7px; background: #DC2626; color: white; font-size: 10px; font-weight: 700; cursor: pointer; }
        .catalog-best-sellers-track { animation: catalogBestSellersMarquee 34s linear infinite; will-change: transform; }
        .catalog-featured-viewport:hover .catalog-best-sellers-track { animation-play-state: paused; }
        @keyframes catalogBestSellersMarquee { from { transform: translateX(0); } to { transform: translateX(-25%); } }
        .catalog-new-arrivals-glow { position: relative; padding: 11px 12px 12px; border: 1px solid rgba(220, 38, 38, .28); border-radius: 14px; background: linear-gradient(110deg, rgba(220, 38, 38, .055), rgba(28, 28, 28, .12) 48%, rgba(220, 38, 38, .035)); box-shadow: 0 0 14px rgba(220, 38, 38, .09), inset 0 0 12px rgba(220, 38, 38, .035); }
        .vip-theme .catalog-new-arrivals-glow { border-color: rgba(214, 185, 111, .38); background: linear-gradient(110deg, rgba(184, 149, 75, .10), rgba(25, 22, 15, .16) 48%, rgba(184, 149, 75, .055)); box-shadow: 0 0 16px rgba(184, 149, 75, .12), inset 0 0 12px rgba(184, 149, 75, .045); }
        .catalog-new-arrivals-glow::before { content: ''; position: absolute; inset: -1px; border-radius: inherit; pointer-events: none; opacity: .55; box-shadow: 0 0 18px rgba(220, 38, 38, .12); }
        .vip-theme .catalog-new-arrivals-glow::before { box-shadow: 0 0 18px rgba(214, 185, 111, .14); }
        @media (prefers-reduced-motion: reduce) { .catalog-best-sellers-track { animation: none; } }
        .vip-theme .catalog-featured-card button { background: #B8954B; color: #17130A; }
        .catalog-categories-section { margin: 28px 0 24px; }
        .catalog-categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(145px, 1fr)); gap: 12px; }
        .catalog-category-card { min-width: 0; padding: 0; overflow: hidden; border-radius: 13px; border: 1px solid #303030; background: #1C1C1C; color: #F0EFE9; text-align: left; cursor: pointer; transition: transform .18s ease, border-color .18s ease; }
        .catalog-category-card:active { transform: scale(.98); }
        .catalog-category-image-placeholder { width: 100%; aspect-ratio: 1 / 1; position: relative; display: block; overflow: hidden; background: var(--shop-surface-alt); color: var(--shop-accent); }
        .catalog-category-image { display: block; width: 100%; height: 100%; aspect-ratio: 1 / 1; object-fit: cover; object-position: center; }
        .catalog-category-image-fallback { position: absolute; inset: 0; align-items: center; justify-content: center; background: var(--shop-surface-alt); color: var(--shop-accent); }
        .catalog-category-name { display: block; padding: 10px 10px 2px; font-size: 13px; font-weight: 800; }
        .catalog-category-count { display: block; padding: 0 10px 11px; color: #8A8A82; font-size: 10px; }
        .vip-theme .catalog-category-card { background: #19160F; border-color: #806B3D; color: #F5EBD3; }
        .vip-theme .catalog-category-image-placeholder { background: linear-gradient(135deg, #342B19, #17130A); color: #C8AD6A; }
        .vip-theme .catalog-category-count { color: #B9A77D; }
        @media (max-width: 600px) {
          .public-catalog-root { padding: 12px 9px !important; }
          .catalog-products-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 7px !important; }
          .catalog-featured-track { gap: 7px; }
          .catalog-featured-card { flex-basis: 112px; width: 112px; border-radius: 8px; }
          .catalog-featured-card img, .catalog-featured-image-placeholder { height: 72px; }
          .catalog-categories-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
          .catalog-category-card { border-radius: 10px; }
          .catalog-category-image-placeholder { aspect-ratio: 5 / 4; }
          .catalog-category-name { font-size: 12px; padding: 8px 8px 2px; }
          .catalog-category-count { font-size: 9px; padding: 0 8px 9px; }
          .catalog-featured-card button { padding: 6px 3px; font-size: 9px; }
          .catalog-featured-card-content { padding: 6px; }
          .catalog-new-arrivals-glow { padding: 9px; border-radius: 11px; }
          .catalog-featured-card .featured-name { font-size: 10px !important; }
          .catalog-featured-card .featured-price { font-size: 10px !important; }
          .catalog-product-card { border-radius: 8px !important; }
          .catalog-product-image { aspect-ratio: 1 / 1 !important; }
          .catalog-product-content { padding: 6px !important; }
          .catalog-product-name { font-size: 10px !important; }
          .catalog-product-description { font-size: 9px !important; }
          .catalog-product-footer { padding: 0 6px 6px !important; }
          .catalog-product-category { font-size: 8px !important; padding: 2px 5px !important; }
          .catalog-product-name { font-size: 12px !important; line-height: 1.25 !important; margin: 6px 0 3px !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .catalog-product-description { font-size: 10px !important; line-height: 1.3 !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .catalog-product-footer { padding: 0 8px 8px !important; gap: 5px !important; align-items: flex-end !important; }
          .catalog-product-price { font-size: 15px !important; line-height: 1.15 !important; }
          .catalog-product-price-vip { font-size: 15px !important; }
          .catalog-product-action { padding: 7px !important; font-size: 10px !important; border-radius: 7px !important; }
          .catalog-header { padding: 13px !important; margin-bottom: 14px !important; }
          .catalog-header-title { font-size: 18px !important; }
          .catalog-search-section { gap: 8px !important; margin-bottom: 14px !important; }
          .catalog-consult-box { gap: 8px !important; padding: 10px !important; margin-bottom: 14px !important; }
          .catalog-consult-input { flex: 1 1 100% !important; }
          .catalog-header { align-items: stretch !important; gap: 14px !important; background: linear-gradient(145deg, rgba(39,20,26,.98), rgba(52,20,32,.97)) !important; }
          .catalog-brand-lockup { gap: 10px; align-items: center; }
          .catalog-brand-emblem { width: 42px; height: 42px; flex-basis: 42px; border-radius: 9px; object-fit: contain; }
          .catalog-brand-name { font-size: 24px !important; letter-spacing: 1.5px; }
          .catalog-brand-tagline { font-size: 8px; letter-spacing: 1.05px; }
          .catalog-brand-description { font-size: 10px !important; }
          .catalog-header-actions { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); width: 100%; gap: 9px !important; }
          .catalog-vip-group { grid-column: 1 / -1; display: grid !important; grid-template-columns: minmax(0, 1fr) auto; gap: 8px !important; width: 100%; }
          .catalog-action-btn { min-height: 46px; padding: 11px 10px !important; border-radius: 12px !important; font-size: 12px !important; font-weight: 800 !important; white-space: nowrap; }
          .catalog-vip-btn { width: 100%; }
          .catalog-vip-logout { min-width: 58px; }
          .catalog-consult-btn, .catalog-cart-btn { width: 100%; }
        }

        /* LAYOUT E-COMMERCE — referência visual: Moda Surf */
        .public-catalog-root { max-width: 1240px !important; padding: 0 24px 42px !important; color: var(--shop-text); }
        .shop-announcement { width: 100%; min-height: 34px; display:flex; align-items:center; justify-content:center; padding:7px 12px; box-sizing:border-box; background:var(--shop-accent); color:#fff; font-size:11px; font-weight:800; letter-spacing:.75px; text-align:center; text-transform:uppercase; }
        .catalog-header { background:var(--shop-surface) !important; color:var(--shop-text) !important; border:0 !important; border-bottom:1px solid var(--shop-border) !important; border-radius:0 !important; margin:0 -24px 0 !important; padding:22px 24px !important; min-height:100px; }
        .catalog-brand-emblem { background:transparent !important; border:0 !important; border-radius:10px !important; transform:none !important; box-shadow:none !important; object-fit:contain !important; }
        .catalog-brand-name { color:var(--shop-text) !important; text-shadow:none !important; letter-spacing:1px !important; }
        .catalog-brand-tagline,.catalog-store-name,.catalog-brand-description { color:var(--shop-muted) !important; }
        .catalog-brand-tagline span { color:var(--shop-accent) !important; }
        .catalog-action-btn { border-radius:5px !important; box-shadow:none !important; }
        .catalog-vip-btn,.catalog-products-grid .catalog-product-action,.catalog-featured-card button { background:var(--shop-accent) !important; color:#fff !important; border:1px solid var(--shop-accent) !important; }
        .catalog-consult-btn { background:#16834a !important; }
        .catalog-cart-btn { background:var(--shop-surface) !important; color:var(--shop-text) !important; border:1px solid var(--shop-border) !important; }
        .shop-category-nav { display:flex; align-items:center; gap:25px; overflow-x:auto; white-space:nowrap; padding:14px 2px; margin:0 0 18px; border-bottom:1px solid var(--shop-border); scrollbar-width:none; }
        .shop-category-nav::-webkit-scrollbar { display:none; }
        .shop-category-nav button { flex:0 0 auto; border:0; background:transparent; color:var(--shop-text); padding:5px 0; font-size:12px; font-weight:750; cursor:pointer; text-transform:uppercase; letter-spacing:.25px; border-bottom:2px solid transparent; }
        .shop-category-nav button.active,.shop-category-nav button:hover { color:var(--shop-accent); border-bottom-color:var(--shop-accent); }
        .catalog-header { max-width:none; }
        .catalog-brand-lockup { display:flex; align-items:center; gap:15px; min-width:0; }
        .catalog-brand-emblem { width:64px !important; height:64px !important; flex:0 0 64px; }
        .catalog-brand-name { font-size:30px !important; font-weight:950 !important; letter-spacing:1.2px !important; }
        .catalog-header-actions { display:flex; align-items:center; justify-content:flex-end; flex-wrap:wrap; gap:9px; }
        .shop-announcement { min-height:36px; font-size:10px; letter-spacing:1.1px; }
        .catalog-promo-hero { position:relative; isolation:isolate; overflow:hidden; display:flex; align-items:center; justify-content:flex-start; min-height:218px; margin:24px 0 30px; padding:clamp(26px,4.5vw,48px); border-radius:14px; color:#fff; background:radial-gradient(ellipse at 88% 48%,rgba(125,15,27,.24) 0%,rgba(45,8,13,.12) 34%,transparent 66%),linear-gradient(112deg,#070809 0%,#0b0b0d 58%,#10090b 100%); border:1px solid rgba(210,35,48,.28); box-shadow:0 18px 46px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.045); }
        .catalog-promo-hero::before { content:''; position:absolute; z-index:0; inset:-1px; pointer-events:none; background:linear-gradient(90deg,rgba(0,0,0,.30) 0%,rgba(0,0,0,.08) 48%,rgba(0,0,0,.12) 100%),radial-gradient(ellipse at 82% 50%,rgba(190,25,42,.20),transparent 46%); }
        /* Marca integrada à composição: grande, monocromática e suavizada para parecer parte da arte do banner. */
        .catalog-promo-hero::after { content:''; position:absolute; z-index:1; top:0; right:0; bottom:0; width:42%; background:radial-gradient(ellipse at 70% 50%,rgba(190,25,42,.22),transparent 68%); pointer-events:none; }
        .catalog-promo-hero-content { position:relative; z-index:2; max-width:min(720px,72%); min-width:0; }
        .catalog-promo-kicker { display:inline-flex; align-items:center; gap:9px; margin-bottom:14px; color:#f06a75; font-size:10px; font-weight:900; letter-spacing:2.4px; text-shadow:0 2px 12px rgba(0,0,0,.7); }
        .catalog-promo-kicker::before { content:''; display:inline-block; width:24px; height:2px; border-radius:2px; background:linear-gradient(90deg,#f04452,#8f111d); box-shadow:0 0 12px rgba(240,68,82,.5); }
        .catalog-promo-hero h2 { margin:0 !important; color:#fff !important; font-size:clamp(27px,4.2vw,46px) !important; line-height:1.06; font-weight:950 !important; letter-spacing:-1.35px !important; text-transform:uppercase; text-shadow:0 3px 22px rgba(0,0,0,.65); }
        .catalog-promo-announcement { display:flex; align-items:flex-start; gap:10px; width:fit-content; max-width:100%; margin-top:19px; padding:11px 15px; border:1px solid rgba(255,255,255,.13); border-left:2px solid #d83242; border-radius:7px; background:linear-gradient(100deg,rgba(255,255,255,.085),rgba(255,255,255,.035)); box-shadow:0 8px 24px rgba(0,0,0,.20); backdrop-filter:blur(8px); color:#f5f5f5; font-size:12px; line-height:1.5; font-weight:650; }
        .catalog-promo-announcement svg { flex:0 0 auto; color:#ff7777; margin-top:1px; }
        .catalog-promo-decoration { display:flex; align-items:center; gap:10px; color:rgba(255,255,255,.15); font-size:10px; font-weight:900; letter-spacing:3px; transform:rotate(-90deg); white-space:nowrap; }
        .catalog-promo-decoration strong { color:rgba(255,255,255,.22); font-size:78px; line-height:1; }
        .catalog-search-section { margin:0 auto 26px !important; max-width:560px; }
        .catalog-search-section input { border:1px solid var(--shop-border) !important; border-radius:4px !important; background:var(--shop-surface) !important; color:var(--shop-text) !important; padding:13px 16px !important; }
        .catalog-featured-section { margin:0 0 34px !important; }
        .catalog-featured-section h2,.catalog-categories-section h2,.public-catalog-root h2 { color:var(--shop-text) !important; font-size:22px !important; font-weight:800 !important; letter-spacing:-.4px; }
        .catalog-featured-section p,.catalog-categories-section p { color:var(--shop-muted) !important; }
        .catalog-featured-card,.catalog-category-card,.catalog-product-card { background:var(--shop-surface) !important; color:var(--shop-text) !important; border:1px solid var(--shop-border) !important; border-radius:5px !important; box-shadow:none !important; }
        .catalog-featured-card img { background:var(--shop-surface-alt); object-fit:contain !important; }
        .catalog-featured-card-content { padding:10px !important; }
        .catalog-featured-card .featured-name,.catalog-product-name { color:var(--shop-text) !important; }
        .catalog-featured-card .featured-price,.catalog-product-price-regular { color:var(--shop-text) !important; }
        .catalog-product-category { background:var(--shop-accent-soft) !important; color:var(--shop-accent) !important; }
        .catalog-categories-grid { grid-template-columns:repeat(auto-fill,minmax(155px,1fr)) !important; }
        .catalog-category-image-placeholder { background:var(--shop-surface-alt) !important; color:var(--shop-accent) !important; aspect-ratio: 1 / 1 !important; }
        .catalog-category-name { color:var(--shop-text) !important; }
        .catalog-category-count { color:var(--shop-muted) !important; }
        .catalog-products-grid { grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:18px !important; align-items:stretch; }
        .catalog-product-card { overflow:hidden; transition:transform .2s ease,border-color .2s ease !important; }
        .catalog-product-card:hover { transform:translateY(-3px); border-color:var(--shop-accent) !important; }
        .catalog-product-image { height:auto !important; max-height:none !important; aspect-ratio:1/1 !important; object-fit:contain !important; background:var(--shop-surface-alt) !important; padding:8px; box-sizing:border-box; }
        .catalog-product-card > div:first-child > div:not(.catalog-product-content) { max-height:none !important; }
        .catalog-product-content { padding:12px 13px 8px !important; }
        .catalog-product-name { font-size:14px !important; line-height:1.35 !important; font-weight:650 !important; min-height:38px; }
        .catalog-product-description { color:var(--shop-muted) !important; }
        .catalog-product-footer { padding:8px 13px 14px !important; align-items:center !important; }
        .catalog-product-price { font-size:19px !important; color:var(--shop-text) !important; }
        .catalog-product-price-offer { color:var(--shop-accent) !important; }
        .catalog-product-action { padding:10px 13px !important; border-radius:4px !important; font-weight:800 !important; }
        .catalog-falling-background { display:none !important; }
        .catalog-new-arrivals-glow { background:var(--shop-surface) !important; border:1px solid var(--shop-border) !important; box-shadow:none !important; }
        .vip-theme .catalog-header,.vip-theme .catalog-product-card,.vip-theme .catalog-featured-card { background:var(--shop-surface) !important; border-color:var(--shop-border) !important; }
        .vip-theme .catalog-header-title,.vip-theme .catalog-product-name { color:var(--shop-text) !important; }
        .vip-theme .catalog-brand-name { color:var(--shop-text) !important; }
        .vip-theme .catalog-vip-btn,.vip-theme .catalog-products-grid button,.vip-theme .catalog-featured-card button { background:var(--shop-accent) !important; color:#fff !important; border-color:var(--shop-accent) !important; }
        .vip-theme .catalog-header p,.vip-theme .catalog-category-count { color:var(--shop-muted) !important; }
        .vip-theme .catalog-category-card { background:var(--shop-surface) !important; border-color:var(--shop-border) !important; color:var(--shop-text) !important; }
        @media (max-width:900px) { .catalog-products-grid { grid-template-columns:repeat(3,minmax(0,1fr)) !important; } }
        @media (max-width:600px) {
          .public-catalog-root { padding:0 12px 32px !important; }
          .catalog-header { margin:0 -12px 0 !important; padding:16px 12px !important; }
          .catalog-brand-emblem { width:48px !important; height:48px !important; flex-basis:48px; }
          .catalog-brand-name { font-size:23px !important; }
          .catalog-promo-hero { min-height:176px; margin:16px 0 22px; padding:23px 18px; border-radius:11px; }
          .catalog-promo-hero::after { top:0; right:0; bottom:0; width:45%; opacity:.20; }
          .catalog-promo-hero-content { max-width:82%; }
          .catalog-promo-hero h2 { font-size:clamp(23px,7vw,30px) !important; letter-spacing:-.7px !important; }
          .catalog-promo-kicker { font-size:8px; letter-spacing:1.5px; }
          .catalog-promo-announcement { margin-top:13px; font-size:11px; padding:9px 10px; }
          .catalog-promo-decoration { display:none; }

          .catalog-brand-name { font-size:22px !important; }
          .catalog-header-actions { grid-template-columns:1fr 1fr !important; }
          .shop-category-nav { gap:18px; padding:12px 0; margin-bottom:14px; }
          .shop-category-nav button { font-size:10px; }
          .catalog-search-section { margin-bottom:20px !important; }
          .catalog-products-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:10px !important; }
          .catalog-product-card { border-radius:4px !important; }
          .catalog-product-content { padding:8px 9px 5px !important; }
          .catalog-product-name { font-size:12px !important; min-height:34px; }
          .catalog-product-footer { padding:6px 9px 10px !important; gap:5px !important; flex-wrap:wrap; }
          .catalog-product-price { font-size:16px !important; }
          .catalog-product-action { width:100%; padding:9px 6px !important; font-size:10px !important; }
          .catalog-featured-section h2,.catalog-categories-section h2,.public-catalog-root h2 { font-size:19px !important; }
          .catalog-categories-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
        }
        @media (prefers-reduced-motion:reduce) { .catalog-product-card { transition:none !important; } }


        /* UX responsiva: hierarquia clara entre marca, campanha, navegação e produtos. */
        .public-catalog-root { width:100%; max-width:1240px !important; margin:0 auto !important; padding:0 24px 48px !important; overflow:visible !important; box-sizing:border-box; }
        .catalog-header { margin:0 -24px 0 !important; padding:20px 24px !important; border-radius:0 !important; }
        .catalog-promo-hero { margin:18px 0 16px !important; min-height:210px; }
        .catalog-store-banner-wrap { width:100%; margin:0 0 14px; overflow:hidden; border-radius:8px; background:var(--shop-surface); }
        .catalog-store-banner { display:block; width:100%; aspect-ratio:4 / 1; max-height:none; min-height:0; object-fit:cover; object-position:center; }
        .shop-category-nav { position:-webkit-sticky !important; position:sticky !important; top:0 !important; align-self:flex-start; z-index:9999; display:flex; align-items:center; gap:22px; width:100%; overflow-x:auto; overflow-y:hidden; white-space:nowrap; padding:13px 14px 14px; margin:0 0 22px; border:1px solid var(--shop-border); border-top:0; background:var(--shop-surface); box-shadow:0 7px 18px rgba(0,0,0,.10); scrollbar-width:thin; scrollbar-color:var(--shop-border) transparent; -webkit-overflow-scrolling:touch; }
        .shop-category-nav button { flex:0 0 auto; min-height:40px; padding:7px 2px; font-size:12px; letter-spacing:.2px; }
        .shop-category-nav button:focus-visible,.catalog-category-card:focus-visible { outline:3px solid var(--shop-accent); outline-offset:4px; }
        .catalog-search-section { width:100%; max-width:620px; margin:0 auto 28px !important; }
        .catalog-search-section input { min-height:48px; border-radius:12px !important; }
        .catalog-categories-section { margin:34px 0 28px; }
        .catalog-categories-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(118px,1fr)); justify-items:center; align-items:start; gap:22px 16px; width:100%; }
        .catalog-category-card { display:flex; flex-direction:column; align-items:center; justify-content:flex-start; width:100%; max-width:142px; min-width:0; padding:5px 5px 9px !important; border:1px solid transparent !important; border-radius:16px !important; background:transparent !important; text-align:center !important; box-shadow:none !important; transition:transform .2s ease,border-color .2s ease,background .2s ease !important; }
        .catalog-category-card:hover { transform:translateY(-3px); border-color:var(--shop-border) !important; background:var(--shop-surface) !important; }
        .catalog-category-image-placeholder { width:clamp(82px,8.5vw,112px); height:clamp(82px,8.5vw,112px); aspect-ratio:1/1 !important; flex:0 0 auto; overflow:hidden; border-radius:50% !important; border:3px solid var(--shop-surface); outline:1px solid var(--shop-border); background:var(--shop-surface-alt) !important; box-shadow:0 5px 18px rgba(0,0,0,.12); }
        .catalog-category-image { width:100%; height:100%; aspect-ratio:1/1 !important; border-radius:50%; object-fit:cover; }
        .catalog-category-image-fallback { border-radius:50%; }
        .catalog-category-name { width:100%; padding:11px 2px 3px !important; color:var(--shop-text) !important; font-size:12px !important; line-height:1.3; font-weight:800 !important; overflow-wrap:anywhere; }
        .catalog-category-count { padding:0 2px 2px !important; color:var(--shop-muted) !important; font-size:10px !important; }
        .catalog-featured-section { margin-bottom:28px; }
        .catalog-products-grid { gap:16px !important; }
        @media (min-width:1200px) { .catalog-categories-grid { grid-template-columns:repeat(auto-fill,minmax(132px,1fr)); gap:26px 18px; } }
        @media (max-width:900px) {
          .public-catalog-root { padding-left:18px !important; padding-right:18px !important; }
          .catalog-header { margin-left:-18px !important; margin-right:-18px !important; padding-left:18px !important; padding-right:18px !important; }
          .catalog-promo-hero { min-height:190px; }
          .catalog-categories-grid { grid-template-columns:repeat(4,minmax(0,1fr)); gap:20px 10px; }
          .catalog-products-grid { grid-template-columns:repeat(3,minmax(0,1fr)) !important; }
        }
        @media (max-width:600px) {
          .public-catalog-root { padding:0 14px 34px !important; }
          .catalog-header { margin:0 -14px 0 !important; padding:15px 14px 14px !important; gap:13px !important; align-items:flex-start !important; }
          .catalog-brand-lockup { gap:10px; flex:1 1 100%; }
          .catalog-brand-emblem { width:44px !important; height:44px !important; flex-basis:44px !important; }
          .catalog-brand-name { font-size:22px !important; }
          .catalog-brand-tagline { font-size:8px; letter-spacing:1.1px; }
          .catalog-brand-description { font-size:10px !important; margin-top:5px !important; }
          .catalog-header-actions { display:grid !important; grid-template-columns:repeat(2,minmax(0,1fr)) !important; width:100%; gap:7px !important; }
          .catalog-header-actions > *, .catalog-vip-group { min-width:0; }
          .catalog-header-actions .catalog-action-btn { width:100%; min-height:42px; padding:8px 5px !important; gap:4px !important; font-size:10px !important; white-space:normal !important; }
          .catalog-vip-group { grid-column:1 / -1 !important; display:flex !important; justify-content:center !important; align-items:center !important; width:100% !important; margin:0 auto !important; }
          .catalog-vip-btn { width:min(100%, 280px) !important; min-width:0 !important; justify-content:center !important; margin:0 auto !important; }
          .catalog-vip-logout { min-width:64px !important; }
          .catalog-promo-hero { min-height:158px !important; margin:13px 0 10px !important; padding:20px 16px !important; border-radius:14px !important; }
          .catalog-promo-hero::after { top:0; right:0; bottom:0; width:45%; opacity:.17; }
          .catalog-promo-hero-content { max-width:88% !important; }
          .catalog-promo-kicker { margin-bottom:10px; font-size:8px; letter-spacing:1.2px; }
          .catalog-promo-hero h2 { font-size:clamp(22px,7vw,29px) !important; line-height:1.08; letter-spacing:-.65px !important; }
          .catalog-promo-announcement { margin-top:12px; padding:9px 10px; font-size:10px; line-height:1.45; border-radius:9px; }
          .shop-category-nav { gap:18px; margin:0 -14px 17px; padding:9px 14px 11px; width:calc(100% + 28px); border-bottom:1px solid var(--shop-border); top:0; }
          .shop-category-nav button { min-height:42px; font-size:11px; }
          .catalog-search-section { margin:0 0 22px !important; max-width:none; }
          .catalog-search-section input { min-height:46px; padding:12px 14px !important; font-size:14px !important; border-radius:12px !important; }
          .catalog-featured-section { margin-bottom:24px !important; }
          .catalog-featured-section h2,.catalog-categories-section h2,.public-catalog-root h2 { font-size:19px !important; }
          .catalog-featured-viewport { margin-right:-14px; padding-right:14px; }
          .catalog-featured-card { flex-basis:132px; width:132px; border-radius:12px; }
          .catalog-featured-card img,.catalog-featured-image-placeholder { height:92px; }
          .catalog-featured-card-content { padding:8px !important; }
          .catalog-featured-card .featured-name { font-size:11px !important; }
          .catalog-featured-card .featured-price { font-size:12px !important; }
          .catalog-categories-section { margin:28px 0 24px; }
          .catalog-categories-grid { grid-template-columns:repeat(3,minmax(0,1fr)) !important; gap:17px 7px !important; }
          .catalog-category-card { max-width:116px; padding:4px 2px 7px !important; border-radius:13px !important; }
          .catalog-category-image-placeholder { width:clamp(76px,23vw,94px); height:clamp(76px,23vw,94px); border-width:2px; }
          .catalog-category-name { padding:9px 1px 3px !important; font-size:11px !important; line-height:1.25; }
          .catalog-category-count { font-size:9px !important; }
          .catalog-products-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:11px !important; }
          .catalog-product-card { border-radius:11px !important; }
          .catalog-product-image { aspect-ratio:1/1 !important; padding:6px; }
          .catalog-product-content { padding:9px !important; }
          .catalog-product-name { font-size:12px !important; line-height:1.3 !important; min-height:32px; }
          .catalog-product-description { font-size:10px !important; line-height:1.35 !important; }
          .catalog-product-footer { padding:5px 9px 10px !important; gap:7px !important; }
          .catalog-product-price { font-size:15px !important; }
          .catalog-product-action { min-height:38px; padding:8px !important; font-size:10px !important; border-radius:8px !important; }
        }
        @media (max-width:360px) {
          .catalog-categories-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:18px 10px !important; }
          .catalog-category-image-placeholder { width:88px; height:88px; }
          .catalog-header-actions { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
        }
        @media (prefers-reduced-motion:reduce) {
          .catalog-category-card,.catalog-product-card { transition:none !important; }
          .catalog-best-sellers-track { animation:none !important; }
        }

        /* Correção definitiva de largura e faixa branca lateral em celulares */
        html, body, #root { width:100%; max-width:100%; min-width:0; margin:0; overflow-x:clip; overflow-y:visible; }
        *, *::before, *::after { box-sizing:border-box; }
        .public-catalog-root, .vip-theme, .catalog-header, .catalog-products-grid { min-width:0; max-width:100%; }
        .public-catalog-root { width:100%; overflow-x:clip; }
        .catalog-info-nav { display:flex; flex-wrap:wrap; gap:8px; padding:12px 0 18px; }
        .catalog-info-nav button, .catalog-info-nav a { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:38px; padding:8px 12px; border:1px solid var(--shop-border); border-radius:999px; background:var(--shop-surface); color:var(--shop-text); text-decoration:none; font-size:12px; font-weight:700; cursor:pointer; }
        .catalog-info-panel { position:relative; margin:0 0 20px; padding:20px 48px 20px 20px; border:1px solid var(--shop-border); border-radius:14px; background:var(--shop-surface); color:var(--shop-text); box-shadow:0 10px 30px rgba(0,0,0,.08); }
        .catalog-info-panel h3 { margin:0 0 10px; font-size:18px; }
        .catalog-info-panel p { margin:0; white-space:pre-line; line-height:1.65; color:var(--shop-muted); font-size:14px; }
        .catalog-info-panel h4 { margin:14px 0 6px; }
        .catalog-info-close { position:absolute; top:12px; right:12px; border:0; background:transparent; color:var(--shop-text); cursor:pointer; }
        .catalog-product-detail-backdrop { position:fixed; inset:0; z-index:10000; display:flex; align-items:center; justify-content:center; padding:18px; background:rgba(0,0,0,.78); backdrop-filter:blur(5px); overflow-y:auto; }
        .catalog-product-detail { position:relative; width:min(900px,100%); max-height:92vh; overflow:auto; padding:22px; border:1px solid var(--shop-border); border-radius:18px; background:var(--shop-surface); color:var(--shop-text); box-shadow:0 24px 80px rgba(0,0,0,.4); }
        .catalog-detail-back { display:inline-flex; align-items:center; gap:5px; padding:8px 10px; margin-bottom:14px; border:1px solid var(--shop-border); border-radius:8px; background:transparent; color:var(--shop-text); cursor:pointer; }
        .catalog-detail-close { position:absolute; top:18px; right:18px; border:0; background:transparent; color:var(--shop-text); cursor:pointer; }
        .catalog-detail-layout { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:24px; }
        .catalog-detail-image-wrap { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; align-content:start; }
        .catalog-detail-image-wrap img { display:block; width:100%; max-height:340px; aspect-ratio:1/1; object-fit:contain; border-radius:12px; background:var(--shop-surface-alt); }
        .catalog-detail-copy h2 { margin:8px 0 12px; font-size:26px; line-height:1.15; }
        .catalog-detail-category { color:var(--shop-muted); font-size:11px; text-transform:uppercase; font-weight:800; letter-spacing:.08em; }
        .catalog-detail-description { color:var(--shop-muted); line-height:1.65; white-space:pre-line; }
        .catalog-detail-price { margin:18px 0; font-size:27px; font-weight:900; }
        .catalog-detail-price small { display:inline-block; margin-left:6px; color:#16a34a; font-size:10px; }
        .catalog-detail-field { display:grid; gap:8px; margin:16px 0; font-size:13px; font-weight:700; }
        .catalog-detail-field select { width:100%; min-height:44px; padding:10px; border:1px solid var(--shop-border); border-radius:9px; background:var(--shop-surface-alt); color:var(--shop-text); }
        .catalog-detail-quantity { display:flex; align-items:center; justify-content:space-between; margin:20px 0; }
        .catalog-detail-quantity div { display:flex; align-items:center; gap:16px; }
        .catalog-detail-quantity button { width:36px; height:36px; display:grid; place-items:center; border:1px solid var(--shop-border); border-radius:9px; background:var(--shop-surface-alt); color:var(--shop-text); cursor:pointer; }
        .catalog-detail-cart-actions { display:flex; align-items:stretch; gap:8px; width:100%; margin-top:9px; }
        .catalog-detail-cart-actions .catalog-detail-add { flex:1; margin-top:0; }
        .catalog-detail-cart-indicator { position:relative; min-width:54px; border:1px solid rgba(220,38,38,.55); border-radius:11px; background:rgba(220,38,38,.13); color:#fff; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer; font-weight:850; }
        .catalog-detail-cart-indicator span { min-width:19px; height:19px; padding:0 4px; display:inline-flex; align-items:center; justify-content:center; border-radius:20px; background:#DC2626; color:#fff; font-size:10px; }
        .catalog-detail-added-notice { display:flex; align-items:center; gap:6px; margin-top:7px; color:#34d399; font-size:12px; font-weight:700; }
        .catalog-detail-add, .catalog-detail-whatsapp { width:100%; min-height:46px; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:9px; border:0; border-radius:10px; background:var(--shop-accent); color:white; font-weight:800; cursor:pointer; }
        .catalog-detail-whatsapp { background:#16864a; }
        @media(max-width:650px) { .catalog-detail-layout { grid-template-columns:1fr; gap:14px; } .catalog-detail-image-wrap { grid-template-columns:repeat(2,minmax(0,1fr)); } .catalog-detail-image-wrap img { max-height:210px; } .catalog-detail-copy h2 { font-size:21px; } .catalog-product-detail { padding:16px; } .catalog-info-nav { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); } .catalog-info-nav button,.catalog-info-nav a { min-width:0; font-size:11px; padding:8px 6px; } }
        /* Ajustes finais: navegação sticky e centralização do acesso VIP no celular. */
        .public-catalog-root {
          overflow:visible !important;
          contain:none !important;
          transform:none !important;
        }
        .shop-category-nav {
          position:-webkit-sticky !important;
          position:sticky !important;
          top:0 !important;
          z-index:99999 !important;
          align-self:stretch;
          width:100%;
          max-width:100%;
          min-width:0;
          flex-wrap:nowrap;
          background:rgba(15,15,15,.98) !important;
          backdrop-filter:blur(14px);
          -webkit-backdrop-filter:blur(14px);
          box-shadow:0 8px 18px rgba(0,0,0,.22);
          isolation:isolate;
          scroll-margin-top:0;
        }
        .catalog-payment-options { display:flex; flex-wrap:wrap; gap:9px; }
        .catalog-payment-chip { display:inline-flex; align-items:center; gap:8px; padding:9px 12px; border:1px solid #3a3a3a; border-radius:10px; background:#202020; color:#F0EFE9; font-size:12px; font-weight:700; }
        .catalog-payment-chip b { font-size:17px; font-weight:400; }
        .catalog-store-banner { width:100% !important; aspect-ratio:4 / 1 !important; height:auto !important; max-height:none !important; object-fit:cover !important; }
        @media (max-width:600px) {
          /* Os três controles formam um único grupo centralizado no mobile. */
          .catalog-header-actions {
            display:flex !important;
            flex-direction:row !important;
            flex-wrap:wrap !important;
            justify-content:center !important;
            align-items:center !important;
            align-content:center !important;
            width:100% !important;
            margin:0 auto !important;
            gap:9px !important;
          }
          .catalog-header-actions > *,
          .catalog-header-actions .catalog-vip-group {
            flex:0 0 auto !important;
            width:auto !important;
            min-width:0 !important;
            margin:0 !important;
          }
          .catalog-vip-group {
            display:flex !important;
            flex-direction:row !important;
            justify-content:center !important;
            align-items:center !important;
            gap:7px !important;
          }
          .catalog-header-actions .catalog-action-btn,
          .catalog-vip-btn {
            display:inline-flex !important;
            width:auto !important;
            min-width:0 !important;
            max-width:100% !important;
            min-height:42px !important;
            justify-content:center !important;
            align-items:center !important;
            margin:0 !important;
            padding:9px 11px !important;
            white-space:nowrap !important;
            font-size:11px !important;
          }

          /* Centraliza o cartão inteiro da marca no celular, não apenas os botões. */
          .catalog-header {
            display:flex !important;
            flex-direction:column !important;
            align-items:center !important;
            justify-content:center !important;
            text-align:center !important;
            box-sizing:border-box !important;
            width:calc(100% + 28px) !important;
            max-width:none !important;
            margin-left:-14px !important;
            margin-right:-14px !important;
            padding:18px 14px 17px !important;
            gap:13px !important;
          }
          .catalog-header .catalog-brand-lockup {
            display:flex !important;
            flex:0 0 auto !important;
            flex-direction:column !important;
            align-items:center !important;
            justify-content:center !important;
            width:100% !important;
            max-width:100% !important;
            margin:0 auto !important;
            text-align:center !important;
          }
          .catalog-header .catalog-brand-copy {
            width:100% !important;
            max-width:100% !important;
            min-width:0 !important;
            margin:0 auto !important;
            text-align:center !important;
          }
          .catalog-header .catalog-brand-name,
          .catalog-header .catalog-brand-tagline,
          .catalog-header .catalog-store-name,
          .catalog-header .catalog-brand-description {
            width:100% !important;
            text-align:center !important;
            overflow-wrap:anywhere !important;
          }
          .catalog-header .catalog-header-actions {
            display:flex !important;
            flex:0 0 auto !important;
            flex-direction:row !important;
            flex-wrap:wrap !important;
            justify-content:center !important;
            align-items:center !important;
            width:100% !important;
            max-width:100% !important;
            margin:0 auto !important;
          }
        }

        /* MOBILE: ocupa toda a largura real da tela e compacta o topo. */
        @media (max-width: 600px) {
          html, body, #root {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            margin: 0 !important;
            overflow-x: clip !important;
          }

          .shop-announcement {
            width: 100% !important;
            min-height: 27px !important;
            padding: 5px 8px !important;
            font-size: 8px !important;
            line-height: 1.25 !important;
            letter-spacing: .55px !important;
            overflow-wrap: anywhere;
          }

          .public-catalog-root {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 0 10px 28px !important;
            box-sizing: border-box !important;
            overflow-x: clip !important;
          }

          .catalog-header {
            width: calc(100% + 20px) !important;
            max-width: none !important;
            min-height: 0 !important;
            margin: 0 -10px 0 !important;
            padding: 12px 10px 11px !important;
            gap: 8px !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
          }

          .catalog-header .catalog-brand-lockup,
          .catalog-header .catalog-brand-copy {
            width: 100% !important;
            min-width: 0 !important;
            margin: 0 !important;
          }

          .catalog-header .catalog-brand-name,
          .catalog-header-title {
            margin: 0 !important;
            font-size: clamp(17px, 5vw, 21px) !important;
            line-height: 1.1 !important;
            letter-spacing: .5px !important;
          }

          .catalog-header .catalog-brand-tagline {
            margin-top: 3px !important;
            font-size: 8px !important;
            line-height: 1.2 !important;
            letter-spacing: .65px !important;
          }

          .catalog-header .catalog-store-name {
            margin-top: 3px !important;
            font-size: 10px !important;
            line-height: 1.2 !important;
          }

          .catalog-header .catalog-brand-description {
            margin: 4px 0 0 !important;
            font-size: 9px !important;
            line-height: 1.25 !important;
          }

          .catalog-header-actions {
            width: 100% !important;
            max-width: 100% !important;
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 6px !important;
            margin: 2px auto 0 !important;
          }

          .catalog-header-actions .catalog-action-btn,
          .catalog-vip-btn {
            min-height: 34px !important;
            padding: 6px 9px !important;
            font-size: 10px !important;
            line-height: 1.1 !important;
            border-radius: 7px !important;
          }

          .catalog-info-nav {
            display: flex !important;
            flex-wrap: nowrap !important;
            align-items: center !important;
            gap: 6px !important;
            width: calc(100% + 20px) !important;
            margin: 0 -10px !important;
            padding: 8px 10px 9px !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            white-space: nowrap !important;
            scrollbar-width: none !important;
            -webkit-overflow-scrolling: touch;
          }

          .catalog-info-nav::-webkit-scrollbar { display: none !important; }

          .catalog-info-nav button,
          .catalog-info-nav a {
            flex: 0 0 auto !important;
            min-height: 31px !important;
            padding: 6px 9px !important;
            gap: 5px !important;
            font-size: 10px !important;
            line-height: 1 !important;
            border-radius: 8px !important;
          }

          .catalog-info-nav svg {
            width: 13px !important;
            height: 13px !important;
          }

          .catalog-info-panel {
            margin: 0 0 10px !important;
            padding: 12px 36px 12px 12px !important;
            border-radius: 10px !important;
          }

          .catalog-info-panel h3 {
            margin: 0 0 6px !important;
            font-size: 14px !important;
          }

          .catalog-info-panel p {
            font-size: 11px !important;
            line-height: 1.45 !important;
          }

          .catalog-info-close {
            top: 7px !important;
            right: 7px !important;
          }

          .shop-category-nav {
            width: calc(100% + 20px) !important;
            max-width: none !important;
            margin: 0 -10px 12px !important;
            padding: 7px 10px 8px !important;
            gap: 16px !important;
            border-left: 0 !important;
            border-right: 0 !important;
            border-radius: 0 !important;
            top: 0 !important;
          }

          .shop-category-nav button {
            min-height: 35px !important;
            font-size: 10px !important;
            padding: 5px 0 !important;
          }

          .catalog-store-banner-wrap {
            width: 100% !important;
            margin: 0 0 12px !important;
            overflow: hidden !important;
          }

          .catalog-store-banner {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            aspect-ratio: 16 / 5 !important;
            object-fit: cover !important;
            border-radius: 8px !important;
          }

          .catalog-search-section {
            width: 100% !important;
            margin: 0 0 15px !important;
            gap: 7px !important;
          }

          .catalog-search-section input {
            min-height: 40px !important;
            padding: 9px 11px !important;
            font-size: 12px !important;
          }
        }

      `}


</style>
      <div className="catalog-falling-background" aria-hidden="true">
        {productsList
          .filter((product: any) => Boolean(product.image_url || product.imageUrl))
          .slice(0, 14)
          .map((product: any, index: number) => (
            <img
              key={`falling-${product.id}`}
              className="catalog-falling-product"
              src={product.image_url || product.imageUrl}
              alt=""
              loading="lazy"
              style={{
                left: `${(index * 23 + 7) % 96}%`,
                animationDelay: `${-(index * 1.7) % 19}s, ${-(index * 0.8) % 7}s`,
                animationDuration: `${17 + (index % 5) * 2}s, ${6 + (index % 4)}s`
              }}
            />
          ))}
      </div>
      <div className="shop-announcement">COMPRA FÁCIL • ATENDIMENTO DIRETO PELO WHATSAPP • {publicBrandName.toLocaleUpperCase('pt-BR')}</div>
      <div className="public-catalog-root" style={{ maxWidth: 1240, margin: '0 auto' }}>
        {/* CABEÇALHO */}
        <div
          className="catalog-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
            background: 'linear-gradient(135deg, rgba(39,20,26,.97), rgba(47,19,29,.96))',
            padding: 20,
            borderRadius: 16,
            border: '1px solid rgba(255,220,226,.16)'
          }}
        >
          <div className="catalog-brand-lockup">
            <div className="catalog-brand-copy">
              <h1 className="catalog-header-title catalog-brand-name">{publicBrandName}</h1>
              <div className="catalog-brand-tagline">NUTRIÇÃO ESPORTIVA <span>•</span> PERFORMANCE</div>
              {data?.storeName && String(data.storeName).trim().toUpperCase() !== publicBrandName.toUpperCase() && (
                <div className="catalog-store-name">{data.storeName}</div>
              )}
              <p className="catalog-brand-description">
                {pricesVisible
                  ? 'Confira nossos produtos disponíveis em estoque'
                  : 'Confira nossos produtos — valores sob consulta'}
              </p>
            </div>
          </div>

          <div className="catalog-header-actions">
            <div className="catalog-vip-group">
              <button
                className="catalog-action-btn catalog-vip-btn"
                onClick={() => setShowVip(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 14px',
                  border: 0,
                  borderRadius: 10,
                  background: vip ? '#10b981' : '#DC2626',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
                }}
              >
                {vip ? (
                  <>
                    <CheckCircle2 size={15} />
                    VIP Ativo
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    Desbloquear VIP
                  </>
                )}
              </button>

              {vip && (
                <button
                  className="catalog-action-btn catalog-vip-logout"
                  onClick={handleLogoutVip}
                  title="Sair do modo VIP"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '9px 12px',
                    borderRadius: 10,
                    background: '#2E2E2E',
                    color: '#ef4444',
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid #3E3E3E',
                    cursor: 'pointer'
                  }}
                >
                  Sair
                </button>
              )}
            </div>

            <button
              className="catalog-action-btn catalog-consult-btn"
              onClick={handleConsultWhatsApp}
              title="Consultar pelo WhatsApp"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 12px',
                border: 0,
                borderRadius: 10,
                background: '#16a34a',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <MessageCircle size={15} />
              Consultar
            </button>

            <button
              className="catalog-action-btn catalog-cart-btn"
              onClick={() => setIsCartOpen(true)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 10,
                background: '#2E2E2E',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #3E3E3E',
                cursor: 'pointer'
              }}
            >
              <ShoppingBag size={15} />
              Carrinho

              {cart.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: '#DC2626',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #1C1C1C'
                  }}
                >
                  {cart.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  )}
                </span>
              )}
            </button>
          </div>
        </div>

        <nav className="catalog-info-nav" aria-label="Informações da loja">
          <button onClick={() => setInfoPanel(infoPanel === 'loja' ? '' : 'loja')}><Info size={16}/> Loja</button>
          <button onClick={() => setInfoPanel(infoPanel === 'pagamento' ? '' : 'pagamento')}><CreditCard size={16}/> Pagamento</button>
          <button onClick={() => setInfoPanel(infoPanel === 'entrega' ? '' : 'entrega')}><Truck size={16}/> Entrega</button>
          <button onClick={() => setInfoPanel(infoPanel === 'politicas' ? '' : 'politicas')}><FileText size={16}/> Termos e privacidade</button>
          {data?.address && <button onClick={() => setInfoPanel(infoPanel === 'localizacao' ? '' : 'localizacao')}><MapPin size={16}/> Localização</button>}
          {data?.instagram && <a href={String(data.instagram).startsWith('http') ? data.instagram : `https://instagram.com/${String(data.instagram).replace(/^@/, '')}`} target="_blank" rel="noreferrer"><Instagram size={16}/> Instagram</a>}
        </nav>

        {infoPanel && (
          <section className="catalog-info-panel" aria-live="polite">
            <button className="catalog-info-close" onClick={() => setInfoPanel('')} aria-label="Fechar painel"><X size={18}/></button>
            <h3>{infoPanel === 'loja' ? 'Sobre a loja' : infoPanel === 'pagamento' ? 'Formas de pagamento' : infoPanel === 'entrega' ? 'Entrega e retirada' : infoPanel === 'localizacao' ? 'Localização' : 'Termos e privacidade'}</h3>
            {infoPanel === 'loja' && (
              <div>
                {storeSlogan && <p style={{ fontWeight: 800, color: '#F0EFE9' }}>{storeSlogan}</p>}
                <p>{data?.storeDescription || data?.description || `Bem-vindo(a) à ${data?.storeName || publicBrandName}. Entre em contato pelo WhatsApp para mais informações.`}</p>
              </div>
            )}
            {infoPanel === 'pagamento' && (
              <div className="catalog-payment-options">
                {(Array.isArray(configuredPaymentMethods) ? configuredPaymentMethods : [])
                  .map((item: any) => typeof item === 'string' ? item : item?.name || item?.label)
                  .filter(Boolean)
                  .map((method: string) => {
                    const normalized = String(method).toLowerCase();
                    const icon = normalized.includes('pix') ? '📱'
                      : normalized.includes('dinheiro') ? '💵'
                      : normalized.includes('cart') ? '💳'
                      : normalized.includes('boleto') ? '🧾' : '✓';
                    return <span className="catalog-payment-chip" key={method}><b>{icon}</b>{method}</span>;
                  })}
                {(!Array.isArray(configuredPaymentMethods) || configuredPaymentMethods.length === 0) && (
                  <p>{data?.paymentInfo || catalogSettings?.paymentInfo || 'Consulte as formas de pagamento disponíveis diretamente com a loja pelo WhatsApp.'}</p>
                )}
              </div>
            )}
            {infoPanel === 'entrega' && (
              <div>
                <p style={{ fontWeight: 800, color: '#F0EFE9' }}>{deliveryDisplayMessage}</p>
                {deliveryMode !== 'pickup' && <p>{data?.deliveryInfo || data?.delivery_info || catalogSettings?.deliveryInfo || catalogSettings?.delivery_info || 'Consulte prazos e valores pelo WhatsApp.'}</p>}
              </div>
            )}
            {infoPanel === 'localizacao' && (
              <div>
                <p>{data?.address || 'Endereço não informado.'}</p>
                {storeSlogan && <p>{storeSlogan}</p>}
                {deliveryMode !== 'pickup' && <p>{deliveryCoverage === 'brazil' ? 'Entrega para todo o Brasil.' : 'Entrega somente na região da loja.'}</p>}
              </div>
            )}
            {infoPanel === 'politicas' && <div className="catalog-policy-content"><h4>Termos e condições</h4><p>{data?.termsAndConditions || data?.terms_and_conditions || catalogSettings?.termsAndConditions || catalogSettings?.terms_and_conditions || 'Consulte as condições de compra e atendimento diretamente com a loja.'}</p><h4>Política de privacidade</h4><p>{data?.privacyPolicy || data?.privacy_policy || catalogSettings?.privacyPolicy || catalogSettings?.privacy_policy || 'Os dados fornecidos durante o atendimento são utilizados para dar continuidade à sua solicitação e ao seu pedido.'}</p></div>}
          </section>
        )}

        <nav className="shop-category-nav" aria-label="Categorias do catálogo">
          <button type="button" className={selectedCategory === 'Todos' ? 'active' : ''} onClick={() => { setSelectedCategory('Todos'); setQuery(''); setShowAllProducts(false); }}>Início</button>
          {categories.map((cat: string) => (
            <button type="button" key={`nav-${cat}`} className={selectedCategory === cat ? 'active' : ''} onClick={() => { setSelectedCategory(cat); setQuery(''); setShowAllProducts(true); }}>{cat}</button>
          ))}
          <button type="button" onClick={() => { setSelectedCategory('Todos'); setQuery(''); setShowAllProducts(true); }}>Todos os produtos</button>
        </nav>

        {/* BANNER DA MARCA: fica logo depois da navegação por categorias */}
        {catalogBrandBannerImage && (
          <div className="catalog-store-banner-wrap">
            <img
              src={catalogBrandBannerImage}
              alt={`Banner de ${publicBrandName}`}
              className="catalog-store-banner"
            />
          </div>
        )}

        {/* PESQUISA */}
        <div
          className="catalog-search-section"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 24
          }}
        >
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pesquisar produtos..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: '1px solid #2E2E2E',
              borderRadius: 10,
              padding: '12px 16px',
              background: '#1C1C1C',
              color: '#F0EFE9',
              fontSize: 14,
              outline: 0
            }}
          />

        </div>

        {/* VITRINE DE DESTAQUES */}
        {selectedCategory === 'Todos' && !query.trim() && !showAllProducts && (
          <>
            {renderFeaturedShelf('Mais vendidos', 'Os favoritos dos clientes desta loja', bestSellingProducts, 'MAIS PEDIDOS')}
            {renderFeaturedShelf('Novidades da semana', 'Confira os produtos que acabaram de chegar', weeklyNewProducts, 'NOVIDADES')}
            {renderFeaturedShelf('Ofertas da semana', 'Condições especiais selecionadas pela loja', weeklyOffers, 'OFERTAS')}
          </>
        )}

        {/* CATEGORIAS: aparecem após os destaques, sem filtros no topo */}
        {selectedCategory === 'Todos' && !query.trim() && !showAllProducts && (
          <section className="catalog-categories-section">
            <div style={{ marginBottom: 13 }}>
              <h2 className="vip-accent-text" style={{ margin: 0, fontSize: 18, fontWeight: 850 }}>
                Explore por categorias
              </h2>
              <p style={{ margin: '4px 0 0', color: vip ? '#B9A77D' : '#8A8A82', fontSize: 12 }}>
                Escolha uma categoria para visualizar os produtos
              </p>
            </div>

            {categories.length === 0 ? (
              <p style={{ color: '#8A8A82', fontSize: 13 }}>Nenhuma categoria cadastrada.</p>
            ) : (
              <div className="catalog-categories-grid">
                {categories.map((cat: string) => (
                  <button
                    type="button"
                    key={cat}
                    className="catalog-category-card"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setQuery('');
                      setShowAllProducts(false);
                    }}
                    aria-label={`Ver produtos da categoria ${cat}`}
                  >
                    {(() => {
                      const categoryImage = getCategoryImage(cat);
                      return (
                        <div className="catalog-category-image-placeholder">
                          {categoryImage ? (
                            <img
                              src={categoryImage}
                              alt={`Categoria ${cat}`}
                              className="catalog-category-image"
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                                const fallback = event.currentTarget.parentElement?.querySelector('.catalog-category-image-fallback');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="catalog-category-image-fallback"
                            style={{ display: categoryImage ? 'none' : 'flex' }}
                          >
                            <Tag size={30} />
                          </div>
                        </div>
                      );
                    })()}
                    <span className="catalog-category-name">{cat}</span>
                    <span className="catalog-category-count">
                      {productsList.filter((p: any) => (p.category || 'Geral') === cat).length} produtos
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* PRODUTOS ORGANIZADOS POR CATEGORIA */}
            {categories.map((cat: string) => {
              const categoryProducts = productsList.filter(
                (product: any) => (product.category || 'Geral') === cat
              );

              return renderFeaturedShelf(
                cat,
                `Produtos da categoria ${cat}`,
                categoryProducts,
                ''
              );
            })}
          </section>
        )}

        {/* PRODUTOS: aparecem após selecionar uma categoria ou pesquisar */}
        {(showAllProducts || selectedCategory !== 'Todos' || Boolean(query.trim())) && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
              <div>
                <h2 className="vip-accent-text" style={{ margin: 0, fontSize: 18, fontWeight: 850 }}>
                  {showAllProducts && !query.trim() ? 'Todos os produtos' : selectedCategory === 'Todos' ? 'Resultados da pesquisa' : selectedCategory}
                </h2>
                <p style={{ margin: '4px 0 0', color: vip ? '#B9A77D' : '#8A8A82', fontSize: 11 }}>
                  {filteredProducts.length} produto(s) encontrado(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('Todos');
                  setQuery('');
                  setShowAllProducts(false);
                }}
                style={{ border: `1px solid ${vip ? '#806B3D' : '#3A3A3A'}`, borderRadius: 9, padding: '8px 11px', background: vip ? '#2C2415' : '#1C1C1C', color: vip ? '#E6C982' : '#F0EFE9', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Ver categorias
              </button>
            </div>

            {filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#8A8A82'
            }}
          >
            <ShoppingBag
              size={40}
              style={{ opacity: 0.3, marginBottom: 10 }}
            />
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              Nenhum produto encontrado.
            </p>
          </div>
        ) : (
          <div className="catalog-products-grid">
            {filteredProducts.map((p: any) => {
              const vipVal =
                p.vip_price !== undefined
                  ? p.vip_price
                  : p.vipPrice;

              const hasVipPrice =
                pricesVisible &&
                vip &&
                vipVal !== undefined &&
                vipVal !== null &&
                Number(vipVal) > 0;

              const productSavings = hasVipPrice
                ? getProductSavings(p)
                : 0;

              const vip3xVal =
                p.vip_price_3x !== undefined
                  ? p.vip_price_3x
                  : p.vipPrice3x;

              const hasVip3xPrice =
                pricesVisible &&
                vip &&
                vip3xVal !== undefined &&
                vip3xVal !== null &&
                Number(vip3xVal) > 0;

              const imageUrl = p.image_url || p.imageUrl;
              const flavors = getProductFlavors(p);

              return (
                <div
                  className="catalog-product-card"
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  style={{
                    background: '#1C1C1C',
                    border: '1px solid #2E2E2E',
                    borderRadius: 12,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={p.name}
                        className="catalog-product-image"
                        style={{
                          width: '100%',
                          aspectRatio: '4/5',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '4/5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#141414',
                          color: '#8A8A82'
                        }}
                      >
                        <Tag size={24} style={{ opacity: 0.3 }} />
                      </div>
                    )}

                    <div className="catalog-product-content" style={{ padding: 14 }}>
                      <span
                        className="catalog-product-category"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: '#2E2E2E',
                          color: '#8A8A82',
                          padding: '2px 8px',
                          borderRadius: 6
                        }}
                      >
                        {p.category || 'Geral'}
                      </span>

                      <h3
                        className="catalog-product-name"
                        style={{
                          fontSize: 14,
                          margin: '8px 0 4px 0',
                          fontWeight: 600,
                          color: '#F0EFE9'
                        }}
                      >
                        {p.name}
                      </h3>

                      {p.description && (
                        <p
                          className="catalog-product-description"
                          style={{
                            fontSize: 12,
                            color: '#8A8A82',
                            margin: 0,
                            lineHeight: 1.4
                          }}
                        >
                          {p.description}
                        </p>
                      )}

                      {flavors.length > 0 && (
                        <p
                          style={{
                            fontSize: 11,
                            color: '#FCA5A5',
                            margin: '9px 0 0',
                            fontWeight: 600
                          }}
                        >
                          <Sparkles
                            size={12}
                            style={{
                              display: 'inline',
                              verticalAlign: 'middle',
                              marginRight: 4
                            }}
                          />
                          Clique para escolher o sabor
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className="catalog-product-footer"
                    style={{
                      padding: '0 14px 14px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                  >
                    <div>
                      {pricesVisible ? (
                        hasVipPrice ? (
                          <div>
                            <span
                              style={{
                                fontSize: 11,
                                color: '#8A8A82',
                                textDecoration: 'line-through'
                              }}
                            >
                              {Number(p.price || 0).toLocaleString(
                                'pt-BR',
                                { style: 'currency', currency: 'BRL' }
                              )}
                            </span>

                            <div
                              className="catalog-product-price catalog-product-price-vip"
                              style={{
                                fontSize: 19,
                                fontWeight: 900,
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              {formatCurrency(getProductPrice(p))}
                              <span
                                style={{
                                  fontSize: 9,
                                  background: '#064e3b',
                                  color: '#34d399',
                                  padding: '1px 4px',
                                  borderRadius: 4
                                }}
                              >
                                VIP
                              </span>
                            </div>

                            {productSavings > 0 && (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  marginTop: 6,
                                  padding: '4px 7px',
                                  borderRadius: 6,
                                  background: 'rgba(16,185,129,0.12)',
                                  border: '1px solid rgba(16,185,129,0.28)',
                                  color: '#34d399',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  lineHeight: 1.3
                                }}
                              >
                                <Sparkles size={11} />
                                Você economiza{' '}
                                {productSavings.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                })}
                              </div>
                            )}

                            {hasVip3xPrice && (
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: '#A3A39B',
                                  marginTop: 4
                                }}
                              >
                                ou 3x de{' '}
                                {(Number(vip3xVal) / 3).toLocaleString(
                                  'pt-BR',
                                  { style: 'currency', currency: 'BRL' }
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const offer = getOfferDetails(p);
                            const displayPrice = offer.valid ? offer.offerPrice : Number(p.price || 0);
                            return (
                              <div>
                                {offer.valid && (
                                  <span style={{ display: 'block', fontSize: 11, color: '#8A8A82', textDecoration: 'line-through' }}>
                                    {formatCurrency(offer.originalPrice)}
                                  </span>
                                )}
                                <div className={`catalog-product-price ${offer.valid ? 'catalog-product-price-offer' : 'catalog-product-price-regular'}`} style={{ fontSize: 19, fontWeight: 900, color: offer.valid ? '#FCA5A5' : '#F0EFE9' }}>
                                  {formatCurrency(displayPrice)}
                                </div>
                                {offer.valid && (
                                  <span style={{ display: 'block', color: '#FCA5A5', fontSize: 10, fontWeight: 700, marginTop: 3 }}>
                                    {offer.discountPercent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% OFF
                                  </span>
                                )}
                              </div>
                            );
                          })()
                        )
                      ) : (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#8A8A82'
                          }}
                        >
                          Valor sob consulta
                        </span>
                      )}
                    </div>

                    <button
                      className="catalog-product-action"
                      onClick={e => {
                        e.stopPropagation();
                        handleProductClick(p);
                      }}
                      style={{
                        background: '#DC2626',
                        color: '#fff',
                        border: 0,
                        padding: '8px 10px',
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}

        {/* DETALHES DO PRODUTO — modal interno, sem recarregar a página */}
        {selectedProduct && (
          <div className="catalog-product-detail-backdrop" onClick={closeProductDetails}>
            <section className="catalog-product-detail" role="dialog" aria-modal="true" aria-label={`Detalhes de ${selectedProduct.name}`} onClick={e => e.stopPropagation()}>
              <button className="catalog-detail-back" onClick={closeProductDetails}><ChevronLeft size={18}/> Voltar à loja</button>
              <button className="catalog-detail-close" onClick={closeProductDetails} aria-label="Fechar detalhes"><X size={20}/></button>
              <div className="catalog-detail-layout">
                <div className="catalog-detail-image-wrap">
                  {(Array.isArray(selectedProduct.images) ? selectedProduct.images : Array.isArray(selectedProduct.gallery) ? selectedProduct.gallery : [selectedProduct.image_url || selectedProduct.imageUrl]).filter(Boolean).map((image: any, index: number) => {
                    const src = typeof image === 'string' ? image : image?.url || image?.src || image?.imageUrl || image?.image_url;
                    return src ? <img key={`${selectedProduct.id}-${index}`} src={src} alt={`${selectedProduct.name} ${index + 1}`} /> : null;
                  })}
                </div>
                <div className="catalog-detail-copy">
                  <span className="catalog-detail-category">{selectedProduct.category || 'Geral'}</span>
                  <h2>{selectedProduct.name}</h2>
                  {selectedProduct.description && <p className="catalog-detail-description">{selectedProduct.description}</p>}
                  {pricesVisible ? <div className="catalog-detail-price">{formatCurrency(getProductPrice(selectedProduct))}{vip && <small> PREÇO VIP</small>}</div> : <div className="catalog-detail-price">Valor sob consulta</div>}
                  {getProductFlavors(selectedProduct).length > 0 && <label className="catalog-detail-field">Escolha a variação / sabor<select value={detailFlavor} onChange={e => setDetailFlavor(e.target.value)}><option value="">Selecione uma opção</option>{getProductFlavors(selectedProduct).map((flavor: string) => <option key={flavor} value={flavor}>{flavor}</option>)}</select></label>}
                  <div className="catalog-detail-quantity"><span>Quantidade</span><div><button onClick={() => setDetailQuantity(q => Math.max(1, q - 1))}><Minus size={16}/></button><strong>{detailQuantity}</strong><button onClick={() => setDetailQuantity(q => q + 1)}><Plus size={16}/></button></div></div>
                  <div className="catalog-detail-cart-actions">
                    <button className="catalog-detail-add" onClick={addProductDetailsToCart}><ShoppingBag size={17}/> Adicionar ao carrinho</button>
                    <button type="button" className="catalog-detail-cart-indicator" onClick={() => { closeProductDetails(); setIsCartOpen(true); }} aria-label={`Abrir carrinho com ${cartQuantity} itens`} title="Ver carrinho">
                      <ShoppingBag size={19}/><span>{cartQuantity}</span>
                    </button>
                  </div>
                  {detailAddedNotice && <div className="catalog-detail-added-notice"><CheckCircle2 size={15}/> {detailAddedNotice}</div>}
                  <button className="catalog-detail-whatsapp" onClick={() => { closeProductDetails(); setConsultMessage(`Tenho interesse no produto ${selectedProduct.name}.`); handleConsultWhatsApp(); }}><MessageCircle size={17}/> Consultar pelo WhatsApp</button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* MODAL DE SELEÇÃO DE SABORES (compatibilidade) */}
        {selectedFlavorProduct && (
          <div
            onClick={() => {
              setSelectedFlavorProduct(null);
              setSelectedFlavor('');
              setFlavorNotice('');
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 300,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              backdropFilter: 'blur(3px)'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 400,
                maxHeight: '90vh',
                overflowY: 'auto',
                boxSizing: 'border-box',
                background: '#1C1C1C',
                border: '1px solid #3E3E3E',
                borderRadius: 16,
                padding: 22,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 14
                }}
              >
                <h3
                  style={{
                    color: '#F0EFE9',
                    fontSize: 18,
                    margin: 0
                  }}
                >
                  Escolha o sabor
                </h3>

                <button
                  onClick={() => {
                    setSelectedFlavorProduct(null);
                    setSelectedFlavor('');
                    setFlavorNotice('');
                  }}
                  aria-label="Fechar seleção de sabores"
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: '#F0EFE9',
                    cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <p
                style={{
                  color: '#B8B8B0',
                  fontSize: 13,
                  margin: '0 0 14px'
                }}
              >
                Produto:{' '}
                <strong>{selectedFlavorProduct.name}</strong>
              </p>

              {/* AVISO AO CLIENTE */}
              <div
                style={{
                  background: 'rgba(220,38,38,0.12)',
                  border: '1px solid rgba(220,38,38,0.45)',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 18,
                  color: '#FCA5A5',
                  fontSize: 13,
                  lineHeight: 1.5
                }}
              >
                <strong>Importante!</strong>
                <br />
                {flavorNotice ||
                  'Selecione o sabor desejado antes de adicionar o produto ao carrinho.'}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9,
                  maxHeight: 250,
                  overflowY: 'auto',
                  marginBottom: 20
                }}
              >
                {getProductFlavors(selectedFlavorProduct).map(
                  (flavor: string) => (
                    <button
                      key={flavor}
                      onClick={() => {
                        setSelectedFlavor(flavor);
                        setFlavorNotice(
                          `Sabor selecionado: ${flavor}. Confirme para adicionar ao carrinho.`
                        );
                      }}
                      style={{
                        width: '100%',
                        padding: 13,
                        borderRadius: 9,
                        textAlign: 'left',
                        cursor: 'pointer',
                        background:
                          selectedFlavor === flavor
                            ? 'rgba(220,38,38,0.16)'
                            : '#0C0C0C',
                        border:
                          selectedFlavor === flavor
                            ? '1px solid #DC2626'
                            : '1px solid #3E3E3E',
                        color: '#F0EFE9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <span>{flavor}</span>

                      {selectedFlavor === flavor && (
                        <CheckCircle2
                          size={18}
                          color="#10b981"
                        />
                      )}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={confirmFlavor}
                style={{
                  width: '100%',
                  padding: 13,
                  background: '#DC2626',
                  color: '#fff',
                  border: 0,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Confirmar sabor e adicionar
              </button>
            </div>
          </div>
        )}

        {/* MODAL VIP */}
        {showVip && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              zIndex: 200,
              backdropFilter: 'blur(2px)'
            }}
          >
            <div
              style={{
                background: '#1C1C1C',
                padding: 24,
                borderRadius: 16,
                width: '100%',
                maxWidth: 360,
                border: '1px solid #2E2E2E',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: 'rgba(220,38,38,0.15)',
                    color: '#DC2626',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px auto'
                  }}
                >
                  <Lock size={20} />
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    color: '#F0EFE9',
                    fontWeight: 600
                  }}
                >
                  Acesso VIP Exclusivo
                </h3>

                <p
                  style={{
                    color: '#8A8A82',
                    fontSize: 12,
                    margin: '6px 0 0 0'
                  }}
                >
                  Digite a senha fornecida pelo lojista para desbloquear preços especiais.
                </p>
              </div>

              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verify()}
                placeholder="Senha VIP"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px',
                  border: '1px solid #2E2E2E',
                  borderRadius: 9,
                  background: '#0C0C0C',
                  color: '#F0EFE9',
                  fontSize: 13,
                  outline: 0,
                  marginBottom: 14
                }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowVip(false)}
                  style={{
                    flex: 1,
                    padding: 10,
                    border: '1px solid #2E2E2E',
                    borderRadius: 9,
                    background: 'transparent',
                    color: '#8A8A82',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  onClick={verify}
                  disabled={vipLoading}
                  style={{
                    flex: 1,
                    padding: 10,
                    border: 0,
                    borderRadius: 9,
                    background: '#DC2626',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {vipLoading ? 'Validando...' : 'Desbloquear'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CARRINHO */}
        {isCartOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 250,
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => setIsCartOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(2px)'
              }}
            />

            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 0,
                width: 380,
                maxWidth: '100%',
                background: '#1C1C1C',
                borderLeft: '1px solid #2E2E2E',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  padding: 18,
                  borderBottom: '1px solid #2E2E2E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    color: '#F0EFE9',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <ShoppingBag size={18} color="#DC2626" />
                  Carrinho
                </h3>

                <button
                  onClick={() => setIsCartOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                    color: '#8A8A82'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                {cart.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px 0',
                      color: '#8A8A82',
                      fontSize: 13
                    }}
                  >
                    Seu carrinho está vazio.
                  </div>
                ) : (
                  cart.map(item => {
                    const activeProducts =
                      Array.isArray(data?.products) && data.products.length > 0
                        ? data.products
                        : fallbackProductsRef.current;

                    const currentProduct =
                      activeProducts?.find(
                        (p: any) =>
                          String(p.id) === String(item.product.id)
                      ) || item.product;

                    const price = getProductPrice(currentProduct);

                    return (
                      <div
                        key={`${item.product.id}-${item.flavor || 'sem-sabor'}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          background: '#0C0C0C',
                          padding: 12,
                          borderRadius: 10,
                          border: '1px solid #2E2E2E'
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <b
                            style={{
                              fontSize: 13,
                              display: 'block',
                              color: '#F0EFE9',
                              fontWeight: 600,
                              overflowWrap: 'anywhere'
                            }}
                          >
                            {currentProduct.name}
                          </b>

                          {item.flavor && (
                            <span
                              style={{
                                display: 'block',
                                fontSize: 11,
                                color: '#FCA5A5',
                                marginTop: 4
                              }}
                            >
                              Sabor: {item.flavor}
                            </span>
                          )}

                          <span
                            style={{
                              display: 'block',
                              fontSize: 11,
                              color: '#ef4444',
                              fontWeight: 600,
                              marginTop: 4
                            }}
                          >
                            {pricesVisible
                              ? `${formatCurrency(price)} un.`
                              : 'Valor sob consulta'}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexShrink: 0
                          }}
                        >
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                -1,
                                item.flavor || ''
                              )
                            }
                            style={{
                              width: 26,
                              height: 26,
                              border: '1px solid #2E2E2E',
                              borderRadius: 8,
                              background: 'transparent',
                              color: '#F0EFE9',
                              cursor: 'pointer'
                            }}
                          >
                            <Minus size={12} />
                          </button>

                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700
                            }}
                          >
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                1,
                                item.flavor || ''
                              )
                            }
                            style={{
                              width: 26,
                              height: 26,
                              border: '1px solid #2E2E2E',
                              borderRadius: 8,
                              background: 'transparent',
                              color: '#F0EFE9',
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {cart.length > 0 && (
                <div
                  style={{
                    padding: 18,
                    borderTop: '1px solid #2E2E2E',
                    background: '#0C0C0C'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      marginBottom: 14
                    }}
                  >
                    <span
                      style={{
                        color: '#8A8A82',
                        fontSize: 13
                      }}
                    >
                      Total:
                    </span>

                    {pricesVisible ? (
                      <span
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          color: '#F0EFE9'
                        }}
                      >
                        {calculateTotal().toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#8A8A82'
                        }}
                      >
                        Valores sob consulta
                      </span>
                    )}
                  </div>

                  {vip && pricesVisible && calculateCartSavings() > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        marginTop: 10,
                        marginBottom: 14,
                        padding: '11px 12px',
                        borderRadius: 10,
                        background: 'rgba(16,185,129,0.10)',
                        border: '1px solid rgba(16,185,129,0.30)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sparkles size={17} color="#34d399" />
                        <div>
                          <span
                            style={{
                              display: 'block',
                              color: '#A7F3D0',
                              fontSize: 12,
                              fontWeight: 700
                            }}
                          >
                            Sua economia VIP
                          </span>
                          <span
                            style={{
                              display: 'block',
                              color: '#6ee7b7',
                              fontSize: 10,
                              marginTop: 2
                            }}
                          >
                            Desconto total dos produtos no carrinho
                          </span>
                        </div>
                      </div>
                      <strong
                        style={{
                          color: '#34d399',
                          fontSize: 15,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {calculateCartSavings().toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </strong>
                    </div>
                  )}

                  <button
                    onClick={() => { setCheckoutStep(1); setShowCheckout(true); setIsCartOpen(false); }}
                    style={{
                      width: '100%', background: '#16a34a', color: '#fff', border: 0,
                      borderRadius: 10, padding: 13, fontWeight: 700, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: 8,
                      cursor: 'pointer', fontSize: 14
                    }}
                  >
                    <CheckCircle2 size={18} /> Finalizar venda
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHECKOUT EM ETAPAS DENTRO DO CATÁLOGO */}
        {showCheckout && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.76)', backdropFilter: 'blur(5px)' }}>
            <div role="dialog" aria-modal="true" aria-labelledby="checkout-title" style={{ width: '100%', maxWidth: 430, maxHeight: '90vh', overflowY: 'auto', borderRadius: 18, background: '#191919', border: '1px solid #3b3b3b', boxShadow: '0 24px 80px rgba(0,0,0,.5)', color: '#fff' }}>
              <div style={{ padding: '17px 19px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#a3a3a3', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>Finalização do pedido</div>
                  <h3 id="checkout-title" style={{ margin: '5px 0 0', fontSize: 18 }}> {checkoutStep === 1 ? 'Informações pessoais' : checkoutStep === 2 ? 'Pagamento e entrega' : 'Enviar pedido'} </h3>
                </div>
                <button type="button" onClick={() => setShowCheckout(false)} aria-label="Fechar finalização" style={{ width: 34, height: 34, border: '1px solid #414141', borderRadius: 9, background: '#252525', color: '#ddd', cursor: 'pointer' }}><X size={17} /></button>
              </div>

              <div style={{ display: 'flex', gap: 7, padding: '15px 19px 5px' }}>
                {[1, 2, 3].map(step => (
                  <div key={step} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 25, height: 25, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', background: checkoutStep >= step ? accent : '#333', color: '#fff', fontSize: 12, fontWeight: 800 }}>{step}</div>
                    <span style={{ color: checkoutStep === step ? '#fff' : '#888', fontSize: 10, fontWeight: checkoutStep === step ? 700 : 500 }}>{step === 1 ? 'Dados' : step === 2 ? 'Pagamento' : 'WhatsApp'}</span>
                    {step < 3 && <div style={{ height: 1, flex: 1, background: checkoutStep > step ? accent : '#3a3a3a' }} />}
                  </div>
                ))}
              </div>

              <div style={{ padding: 19 }}>
                {checkoutStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ margin: '0 0 2px', color: '#bdbdbd', fontSize: 12, lineHeight: 1.5 }}>Informe seus dados para identificarmos seu pedido.</p>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#ddd' }}>Nome completo
                      <input type="text" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} placeholder="Digite seu nome" aria-label="Nome do cliente" style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 9, border: '1px solid #414141', background: '#101010', color: '#fff', outline: 'none' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#ddd' }}>WhatsApp
                      <div style={{ display: 'grid', gridTemplateColumns: '60px 68px minmax(0, 1fr)', gap: 7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #414141', borderRadius: 9, background: '#292929', color: '#fff', fontWeight: 700, fontSize: 13 }}>+55</div>
                        <input type="text" inputMode="numeric" maxLength={2} value={checkoutDdd} onChange={e => setCheckoutDdd(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="DDD" aria-label="DDD do WhatsApp" style={{ minWidth: 0, width: '100%', boxSizing: 'border-box', padding: 11, textAlign: 'center', borderRadius: 9, border: '1px solid #414141', background: '#101010', color: '#fff', outline: 'none' }} />
                        <input type="text" inputMode="numeric" value={formatCheckoutNumber(checkoutNumber)} onChange={e => { const raw = e.target.value.replace(/\D/g, ''); if (raw.length > 8) setCheckoutPhoneError('Você ultrapassou a quantidade de números. São necessários apenas 8 dígitos.'); else setCheckoutPhoneError(''); setCheckoutNumber(raw.slice(0, 8)); }} placeholder="8171-9857" aria-label="Número do WhatsApp" style={{ minWidth: 0, width: '100%', boxSizing: 'border-box', padding: 11, borderRadius: 9, border: `1px solid ${checkoutPhoneError ? '#ef4444' : '#414141'}`, background: '#101010', color: '#fff', outline: 'none' }} />
                      </div>
                    </label>
                    {checkoutPhoneError && <small role="alert" style={{ color: '#f87171', fontSize: 11 }}>{checkoutPhoneError}</small>}
                    <small style={{ color: '#929292', fontSize: 10 }}>Formato: 55 83 8171-9857. O código do Brasil já está incluído.</small>
                  </div>
                )}

                {checkoutStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 17 }}>
                    <div>
                      <strong style={{ display: 'block', marginBottom: 9, fontSize: 13 }}>Forma de pagamento</strong>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {['Dinheiro / espécie', 'Cartão', 'Pix'].map(option => (
                          <button key={option} type="button" onClick={() => setPaymentMethod(option)} style={{ padding: 12, borderRadius: 10, border: `1px solid ${paymentMethod === option ? accent : '#414141'}`, background: paymentMethod === option ? `${accent}22` : '#101010', color: '#fff', cursor: 'pointer', fontWeight: paymentMethod === option ? 700 : 500, fontSize: 12 }}>{paymentMethod === option ? '✓ ' : ''}{option}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <strong style={{ display: 'block', marginBottom: 9, fontSize: 13 }}>Como deseja receber?</strong>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {['Retirada', 'Delivery'].map(option => (
                          <button key={option} type="button" onClick={() => setOrderDelivery(option)} style={{ padding: 12, borderRadius: 10, border: `1px solid ${orderDelivery === option ? accent : '#414141'}`, background: orderDelivery === option ? `${accent}22` : '#101010', color: '#fff', cursor: 'pointer', fontWeight: orderDelivery === option ? 700 : 500, fontSize: 12 }}>{option === 'Retirada' ? '🏬 ' : '🛵 '}{option === orderDelivery ? '✓ ' : ''}{option}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 3 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 58, height: 58, margin: '0 auto 12px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(34,197,94,.14)', color: '#4ade80' }}><MessageCircle size={27} /></div>
                    <h4 style={{ margin: '0 0 8px', fontSize: 16 }}>Tudo pronto, {checkoutName.trim()}!</h4>
                    <p style={{ margin: '0 0 15px', color: '#aaa', fontSize: 12, lineHeight: 1.5 }}>Confira os dados. Ao tocar no botão, seu pedido será preparado e direcionado ao WhatsApp do vendedor.</p>
                    <div style={{ textAlign: 'left', padding: 13, borderRadius: 10, background: '#101010', border: '1px solid #383838', fontSize: 12, lineHeight: 1.9, color: '#ddd' }}>
                      <div><b>Cliente:</b> {checkoutName.trim()}</div>
                      <div><b>WhatsApp:</b> +55 ({checkoutDdd}) {formatCheckoutNumber(checkoutNumber)}</div>
                      <div><b>Pagamento:</b> {paymentMethod}</div>
                      <div><b>Recebimento:</b> {orderDelivery}</div>
                      <div><b>Itens:</b> {cartQuantity}</div>
                      <div><b>Total:</b> {pricesVisible ? calculateTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sob consulta'}</div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
                  {checkoutStep > 1 && <button type="button" onClick={() => setCheckoutStep(step => step - 1)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #454545', background: '#252525', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Voltar</button>}
                  {checkoutStep < 3 ? (
                    <button type="button" onClick={continueCheckout} style={{ flex: 1, padding: 12, borderRadius: 10, border: 0, borderRadius: 10, background: accent, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Continuar</button>
                  ) : (
                    <button type="button" onClick={handleCheckoutWhatsApp} disabled={checkoutSaving} style={{ flex: 1, padding: 14, borderRadius: 10, border: 0, background: '#16a34a', color: '#fff', cursor: checkoutSaving ? 'wait' : 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><MessageCircle size={18} />{checkoutSaving ? 'Preparando pedido...' : 'Enviar pedido para WhatsApp'}</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
