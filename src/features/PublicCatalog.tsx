
 // @ts-nocheck

import React, { useEffect, useState, useRef } from 'react';
import vipAnimation from '../Animation_for_VIP.mp4';
import logoByse from '../logobyse.jpeg';

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
  Sparkles
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

  const catalogSettings = data?.catalogConfig || data?.config || data?.settings || data || {};

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
  const addToCart = (product: any, flavor = '') => {
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
                quantity: item.quantity + 1
              }
            : item
        );
      }

      return [
        ...prev,
        {
          product,
          quantity: 1,
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
    const flavors = getProductFlavors(product);

    if (flavors.length > 0) {
      setSelectedFlavorProduct(product);
      setSelectedFlavor('');
      setFlavorNotice(
        'Atenção: escolha o sabor desejado antes de adicionar este produto ao carrinho.'
      );
      return;
    }

    addToCart(product);
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
    let effectivePrice = offer.valid ? offer.offerPrice : regularPrice;

    if (vip) {
      const vipValue = product.vip_price !== undefined ? product.vip_price : product.vipPrice;
      const vipPrice = Number(vipValue);
      if (vipValue !== null && vipValue !== undefined && Number.isFinite(vipPrice) && vipPrice > 0) {
        effectivePrice = effectivePrice > 0 ? Math.min(effectivePrice, vipPrice) : vipPrice;
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

  /*
   * FINALIZAR PEDIDO PELO WHATSAPP
   */
  const handleCheckoutWhatsApp = () => {
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
      alert(
        'Adicione pelo menos um produto ao pedido antes de finalizar.'
      );
      return;
    }

    const activeProducts =
      Array.isArray(data?.products) && data.products.length > 0
        ? data.products
        : fallbackProductsRef.current;

    let message =
      `*Pedido via Catálogo Online - ${
        data?.storeName || 'Loja'
      }*\n\n`;

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
      '_blank'
    );
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
  const weeklyOffers = getConfiguredProducts(weeklyOfferIds).filter((product: any) => getOfferDetails(product).valid);
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
                <div className="catalog-featured-card" key={`${title}-${product.id}-${index}`}>
                  {image ? <img src={image} alt={product.name} /> : <div className="catalog-featured-image-placeholder"><Tag size={20} /></div>}
                  <div className="catalog-featured-card-content">
                    <div className="featured-name" title={product.name} style={{ color: vip ? '#F5EBD3' : '#F0EFE9', fontSize: 11, fontWeight: 750, lineHeight: 1.25, minHeight: 27, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</div>
                    <div className="featured-price" style={{ color: vip ? '#E6C982' : '#F0EFE9', fontSize: 11, fontWeight: 800, margin: '4px 0 6px' }}>
                      {pricesVisible ? (
                        <>
                          {getOfferDetails(product).valid && (
                            <span style={{ display: 'block', color: '#8A8A82', fontSize: 9, textDecoration: 'line-through', fontWeight: 500 }}>
                              {formatCurrency(getOfferDetails(product).originalPrice)}
                            </span>
                          )}
                          <span>{formatCurrency(getProductPrice(product))}</span>
                          {getOfferDetails(product).valid && (
                            <span style={{ display: 'block', color: '#FCA5A5', fontSize: 9, fontWeight: 800 }}>
                              {getOfferDetails(product).discountPercent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% OFF
                            </span>
                          )}
                        </>
                      ) : 'Sob consulta'}
                    </div>
                    <button onClick={() => handleProductClick(product)}>Adicionar</button>
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
        .catalog-featured-card { flex: 0 0 clamp(132px, 15vw, 168px); width: clamp(132px, 15vw, 168px); min-width: 0; overflow: hidden; border-radius: 10px; border: 1px solid #2E2E2E; background: #1C1C1C; }
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
        .catalog-products-grid { grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:18px !important; }
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

      `}</style>
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
      <div className="shop-announcement">Confira nossas novidades e ofertas especiais</div>
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
            <img src={logoByse} alt="Logo M-BYSE" className="catalog-brand-emblem" />
            <div className="catalog-brand-copy">
              <h1 className="catalog-header-title catalog-brand-name">M-BYSE</h1>
              <div className="catalog-brand-tagline">NUTRIÇÃO ESPORTIVA <span>•</span> PERFORMANCE</div>
              {data?.storeName && String(data.storeName).trim().toUpperCase() !== 'M-BYSE' && (
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

        <nav className="shop-category-nav" aria-label="Categorias do catálogo">
          <button type="button" className={selectedCategory === 'Todos' ? 'active' : ''} onClick={() => { setSelectedCategory('Todos'); setQuery(''); setShowAllProducts(false); }}>Início</button>
          {categories.map((cat: string) => (
            <button type="button" key={`nav-${cat}`} className={selectedCategory === cat ? 'active' : ''} onClick={() => { setSelectedCategory(cat); setQuery(''); setShowAllProducts(true); }}>{cat}</button>
          ))}
          <button type="button" onClick={() => { setSelectedCategory('Todos'); setQuery(''); setShowAllProducts(true); }}>Todos os produtos</button>
        </nav>

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
                  onClick={() => {
                    if (flavors.length > 0) {
                      handleProductClick(p);
                    }
                  }}
                  style={{
                    background: '#1C1C1C',
                    border: '1px solid #2E2E2E',
                    borderRadius: 12,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: flavors.length > 0 ? 'pointer' : 'default'
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
                      {flavors.length > 0
                        ? 'Escolher sabor'
                        : 'Adicionar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}

        {/* MODAL DE SELEÇÃO DE SABORES */}
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
                    onClick={handleCheckoutWhatsApp}
                    style={{
                      width: '100%',
                      background: '#16a34a',
                      color: '#fff',
                      border: 0,
                      borderRadius: 10,
                      padding: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      fontSize: 13
                    }}
                  >
                    <MessageCircle size={18} />
                    Finalizar Pedido via WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
