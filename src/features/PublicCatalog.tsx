
 // @ts-nocheck

import React, { useEffect, useState, useRef } from 'react';

import {
  Lock,
  ShoppingBag,
  MessageCircle,
  CheckCircle2,
  Tag,
  X,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';

export function PublicCatalog() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [vip, setVip] = useState(false);
  const [showVip, setShowVip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(false);

  const [cart, setCart] = useState<
    { product: any; quantity: number; flavor?: string }[]
  >([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [query, setQuery] = useState('');

  // Controle da seleção de sabores.
  const [selectedFlavorProduct, setSelectedFlavorProduct] =
    useState<any>(null);
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [flavorNotice, setFlavorNotice] = useState('');

  const fallbackProductsRef = useRef<any[]>([]);

  const base = (
    import.meta.env.VITE_API_URL ||
    'http://localhost:3333'
  ).replace(/\/$/, '');

  const id = window.location.pathname.split('/')[2];

  const catalogVisible =
    data?.catalogVisible !== undefined
      ? Boolean(data.catalogVisible)
      : data?.productsVisible !== undefined
        ? Boolean(data.productsVisible)
        : data?.visibility !== undefined
          ? Boolean(data.visibility)
          : true;

  /*
   * CARREGAMENTO DO CATÁLOGO
   */
  useEffect(() => {
    const token = localStorage.getItem(`vip_token_${id}`);
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(`${base}/api/public/catalogo/${id}`, { headers })
      .then(async r => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(resData => {
        if (resData && Array.isArray(resData.products)) {
          fallbackProductsRef.current = resData.products;
        }

        setData(resData);
        setVip(Boolean(resData.isVip || token));
      })
      .catch(() => {
        setError('Catálogo não encontrado.');
      })
      .finally(() => {
        setLoading(false);
      });
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
   * VALIDAÇÃO VIP
   */
  const verify = async () => {
    try {
      const r = await fetch(
        `${base}/api/public/catalogo/${id}/vip/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password })
        }
      );

      const resData = await r.json();

      if (!r.ok) {
        alert(resData.error || 'Senha VIP inválida.');
        return;
      }

      const newToken = resData.accessToken;

      if (newToken) {
        localStorage.setItem(`vip_token_${id}`, newToken);
      }

      setShowVip(false);
      setPassword('');
      setVip(true);

      const activeToken =
        newToken || localStorage.getItem(`vip_token_${id}`);

      const headers: HeadersInit = activeToken
        ? { Authorization: `Bearer ${activeToken}` }
        : {};

      const catalogRes = await fetch(
        `${base}/api/public/catalogo/${id}`,
        { headers }
      );

      if (catalogRes.ok) {
        const freshData = await catalogRes.json();

        if (
          freshData &&
          Array.isArray(freshData.products) &&
          freshData.products.length > 0
        ) {
          fallbackProductsRef.current = freshData.products;
          setData(freshData);
        } else if (freshData) {
          setData({
            ...freshData,
            products:
              freshData.products ||
              fallbackProductsRef.current
          });
        }

        if (freshData?.isVip !== undefined) {
          setVip(Boolean(freshData.isVip));
        }
      }

      setShowIntro(true);
      window.setTimeout(() => setShowIntro(false), 4000);
    } catch (e) {
      alert('Erro ao validar senha VIP.');
    }
  };

  /*
   * SAÍDA DO VIP
   */
  const handleLogoutVip = async () => {
    localStorage.removeItem(`vip_token_${id}`);
    setVip(false);

    try {
      const res = await fetch(
        `${base}/api/public/catalogo/${id}`
      );

      if (res.ok) {
        const freshData = await res.json();

        if (
          freshData &&
          Array.isArray(freshData.products) &&
          freshData.products.length > 0
        ) {
          fallbackProductsRef.current = freshData.products;
          setData(freshData);
        } else if (freshData) {
          setData({
            ...freshData,
            products:
              freshData.products ||
              fallbackProductsRef.current
          });
        } else {
          setData((prev: any) => ({
            ...(prev || {}),
            products: fallbackProductsRef.current
          }));
        }
      } else {
        setData((prev: any) => ({
          ...(prev || {}),
          products: fallbackProductsRef.current
        }));
      }
    } catch (e) {
      console.error(
        'Erro ao atualizar catálogo ao sair do VIP',
        e
      );

      setData((prev: any) => ({
        ...(prev || {}),
        products: fallbackProductsRef.current
      }));
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
   * PREÇO ATUAL DO PRODUTO
   */
  const getProductPrice = (product: any) => {
    const vipVal =
      product?.vip_price !== undefined
        ? product.vip_price
        : product?.vipPrice;

    return vip &&
      vipVal !== null &&
      vipVal !== undefined &&
      Number(vipVal) > 0
      ? Number(vipVal)
      : Number(product?.price || 0);
  };

  /*
   * TOTAL DO CARRINHO
   */
  const calculateTotal = () => {
    const activeProducts =
      data?.products || fallbackProductsRef.current;

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
      data?.products || fallbackProductsRef.current;

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

      message += catalogVisible
        ? `• ${item.quantity}x ${productName} - R$ ${(price * item.quantity).toFixed(2)}\n`
        : `• ${item.quantity}x ${productName}\n`;
    });

    if (catalogVisible) {
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

  const categories = [
    'Todos',
    ...Array.from(
      new Set(
        productsList.map(
          (p: any) => p.category || 'Geral'
        )
      )
    )
  ];

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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0C0C0C',
        color: '#F0EFE9',
        padding: '24px 16px',
        fontFamily: 'sans-serif',
        position: 'relative'
      }}
    >
      {/* INTRODUÇÃO VIP */}
      {showIntro && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#0c0c0c',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeOutContainer 0.8s ease 3.2s forwards'
          }}
        >
          <style>{`
            @keyframes fadeOutContainer {
              to { opacity: 0; visibility: hidden; }
            }

            @keyframes seqStep {
              0% { opacity: 0; transform: translateY(15px); }
              20% { opacity: 1; transform: translateY(0); }
              80% { opacity: 1; transform: translateY(0); }
              100% { opacity: 0; transform: translateY(-15px); }
            }

            .intro-step-1 {
              animation: seqStep 1.2s ease forwards;
            }

            .intro-step-2 {
              opacity: 0;
              animation: seqStep 1.2s ease 1.1s forwards;
            }

            .intro-step-3 {
              opacity: 0;
              animation: seqStep 1.2s ease 2.2s forwards;
            }
          `}</style>

          <div
            style={{
              textAlign: 'center',
              padding: 20,
              minHeight: 150,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              className="intro-step-1"
              style={{ position: 'absolute' }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  background: 'rgba(220, 38, 38, 0.1)',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                  border: '1px solid rgba(220, 38, 38, 0.3)'
                }}
              >
                <Sparkles size={24} color="#DC2626" />
              </div>

              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  color: '#DC2626',
                  background: 'rgba(220, 38, 38, 0.1)',
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1px solid rgba(220, 38, 38, 0.2)'
                }}
              >
                Área VIP
              </span>
            </div>

            <div
              className="intro-step-2"
              style={{ position: 'absolute' }}
            >
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: '#F0EFE9',
                  margin: 0,
                  letterSpacing: '-0.5px'
                }}
              >
                Sejam Bem-Vindos
              </h1>
            </div>

            <div
              className="intro-step-3"
              style={{ position: 'absolute' }}
            >
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#DC2626',
                  margin: 0,
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}
              >
                BYSE PRO
              </h2>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* CABEÇALHO */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
            background: '#1C1C1C',
            padding: 20,
            borderRadius: 16,
            border: '1px solid #2E2E2E'
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: '#F0EFE9'
              }}
            >
              {data?.storeName || 'Catálogo da Loja'}
            </h1>

            <p
              style={{
                color: '#8A8A82',
                margin: '4px 0 0 0',
                fontSize: 13
              }}
            >
              {catalogVisible
                ? 'Confira nossos produtos disponíveis em estoque'
                : 'Confira nossos produtos — valores sob consulta'}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center'
              }}
            >
              <button
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

        {/* PESQUISA */}
        <div
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

          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4
            }}
          >
            {categories.map((cat: string) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border:
                    selectedCategory === cat
                      ? 0
                      : '1px solid #2E2E2E',
                  background:
                    selectedCategory === cat
                      ? '#DC2626'
                      : '#1C1C1C',
                  color:
                    selectedCategory === cat
                      ? '#fff'
                      : '#8A8A82'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* PRODUTOS */}
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16
            }}
          >
            {filteredProducts.map((p: any) => {
              const vipVal =
                p.vip_price !== undefined
                  ? p.vip_price
                  : p.vipPrice;

              const hasVipPrice =
                catalogVisible &&
                vip &&
                vipVal !== undefined &&
                vipVal !== null &&
                Number(vipVal) > 0;

              const vip3xVal =
                p.vip_price_3x !== undefined
                  ? p.vip_price_3x
                  : p.vipPrice3x;

              const hasVip3xPrice =
                catalogVisible &&
                vip &&
                vip3xVal !== undefined &&
                vip3xVal !== null &&
                Number(vip3xVal) > 0;

              const imageUrl = p.image_url || p.imageUrl;
              const flavors = getProductFlavors(p);

              return (
                <div
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

                    <div style={{ padding: 14 }}>
                      <span
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
                    style={{
                      padding: '0 14px 14px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                  >
                    <div>
                      {catalogVisible ? (
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
                              style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              {Number(vipVal).toLocaleString(
                                'pt-BR',
                                { style: 'currency', currency: 'BRL' }
                              )}
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

                            {hasVip3xPrice && (
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: '#A3A39B',
                                  marginTop: 2
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
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: '#F0EFE9'
                            }}
                          >
                            {Number(p.price || 0).toLocaleString(
                              'pt-BR',
                              { style: 'currency', currency: 'BRL' }
                            )}
                          </div>
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
                  Desbloquear
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
                      data?.products ||
                      fallbackProductsRef.current;

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
                            {price.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })}{' '}
                            un.
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

                    {catalogVisible ? (
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
