
// @ts-nocheck

import React, { useEffect, useState } from 'react';

import {
  Copy,
  ExternalLink,
  Lock,
  Save,
  Search,
  Store,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
  MessageCircle,
  X,
  Plus,
  Minus,
  ShieldCheck,
  Tag,
  Eye,
  EyeOff
} from 'lucide-react';

import { SectionTitle } from '../components/common';

interface Product {
  id: string | number;
  name: string;
  category: string;
  price: number;
  vip_price?: number;
  vipPrice?: number;
  vip_price_3x?: number;
  vipPrice3x?: number;
  description?: string;
  image_url?: string;
  imageUrl?: string;
}

export default function Catalogo({
  products = [],
  userId,
  apiUrl,
  card,
  border,
  subtext,
  accent,
  text
}: any) {
  const [cfg, setCfg] = useState<any>({});
  const [vipPassword, setVipPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState('');

  const [selectedCategory, setSelectedCategory] =
    useState<string>('Todos');

  const [cart, setCart] = useState<
    { product: Product; quantity: number }[]
  >([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isVipUnlocked, setIsVipUnlocked] = useState(false);
  const [vipPasswordInput, setVipPasswordInput] = useState('');
  const [showVipModal, setShowVipModal] = useState(false);

  // true: preços visíveis
  // false: somente os preços ficam ocultos.
  const [isCatalogVisible, setIsCatalogVisible] = useState(true);

  const cleanApiUrl = (
    apiUrl || 'http://localhost:3333'
  ).replace(/\/$/, '');

  const base = cleanApiUrl.endsWith('/api')
    ? cleanApiUrl.slice(0, -4)
    : cleanApiUrl;

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${
      localStorage.getItem('byse_token') || ''
    }`
  });

  useEffect(() => {
    let active = true;

    const loadConfig = async () => {
      try {
        const response = await fetch(
          `${base}/api/catalogo/config`,
          { headers: headers() }
        );

        if (!response.ok) return;

        const loaded = await response.json();

        if (!active) return;

        setCfg(loaded);

        if (loaded.catalogVisible !== undefined) {
          setIsCatalogVisible(
            Boolean(loaded.catalogVisible)
          );
        }
      } catch (error) {
        console.error(
          'Erro ao carregar configurações do catálogo:',
          error
        );
      }
    };

    loadConfig();

    return () => {
      active = false;
    };
  }, [base]);

  const publicUrl =
    cfg.publicUrl ||
    `${window.location.origin}/publicCatalog/${userId || ''}`;

  const save = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const payload = {
        ...cfg,
        catalogVisible: isCatalogVisible,
        ...(vipPassword.trim()
          ? { vipPassword: vipPassword.trim() }
          : {})
      };

      const response = await fetch(
        `${base}/api/catalogo/config`,
        {
          method: 'PUT',
          headers: headers(),
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error('Falha ao salvar configurações');
      }

      const data = await response.json();

      setCfg((prev: any) => ({
        ...prev,
        ...data,
        whatsapp: payload.whatsapp,
        catalogVisible: isCatalogVisible,
        vipConfigured:
          Boolean(vipPassword.trim()) ||
          prev.vipConfigured
      }));

      setVipPassword('');
      setSaved(true);
    } catch (error) {
      console.error(error);
      alert(
        'Não foi possível salvar as configurações do catálogo.'
      );
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Não foi possível copiar o link.');
    }
  };

  const toggleCatalogVisibility = async () => {
    const previous = isCatalogVisible;
    const next = !previous;

    setIsCatalogVisible(next);
    setCfg((prev: any) => ({
      ...prev,
      catalogVisible: next
    }));

    try {
      const response = await fetch(
        `${base}/api/catalogo/config`,
        {
          method: 'PUT',
          headers: headers(),
          body: JSON.stringify({
            ...cfg,
            catalogVisible: next
          })
        }
      );

      if (!response.ok) {
        throw new Error('Falha ao salvar visibilidade');
      }

      const data = await response.json();

      setCfg((prev: any) => ({
        ...prev,
        ...data,
        catalogVisible: next
      }));
    } catch (error) {
      console.error(error);

      setIsCatalogVisible(previous);
      setCfg((prev: any) => ({
        ...prev,
        catalogVisible: previous
      }));

      alert(
        'Não foi possível atualizar a visibilidade dos preços.'
      );
    }
  };

  const categories = [
    'Todos',
    ...Array.from(
      new Set(
        products.map((product: any) =>
          product.category || 'Geral'
        )
      )
    )
  ];

  const filteredProducts = products.filter(
    (product: any) => {
      const matchesCategory =
        selectedCategory === 'Todos' ||
        (product.category || 'Geral') === selectedCategory;

      const search = query.toLowerCase();

      const matchesSearch =
        String(product.name || '')
          .toLowerCase()
          .includes(search) ||
        String(product.description || '')
          .toLowerCase()
          .includes(search) ||
        String(product.category || '')
          .toLowerCase()
          .includes(search);

      return matchesCategory && matchesSearch;
    }
  );

  const getVipPrice = (product: any) =>
    product.vip_price !== undefined
      ? product.vip_price
      : product.vipPrice;

  const getVipPrice3x = (product: any) =>
    product.vip_price_3x !== undefined
      ? product.vip_price_3x
      : product.vipPrice3x;

  const getEffectivePrice = (product: any) => {
    const vipPrice = getVipPrice(product);

    if (
      isVipUnlocked &&
      vipPrice !== undefined &&
      vipPrice !== null &&
      Number(vipPrice) > 0
    ) {
      return Number(vipPrice);
    }

    return Number(product.price || 0);
  };

  const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

  const addToCart = (product: Product) => {
    setCart((previous) => {
      const existing = previous.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return previous.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1
              }
            : item
        );
      }

      return [
        ...previous,
        {
          product,
          quantity: 1
        }
      ];
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (
    productId: string | number,
    delta: number
  ) => {
    setCart((previous) =>
      previous
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }

          const quantity = item.quantity + delta;

          return quantity > 0
            ? { ...item, quantity }
            : null;
        })
        .filter(Boolean) as {
        product: Product;
        quantity: number;
      }[]
    );
  };

  const calculateTotal = () =>
    cart.reduce(
      (total, item) =>
        total +
        getEffectivePrice(item.product) * item.quantity,
      0
    );

  const handleCheckoutWhatsApp = () => {
    if (!cfg.whatsapp) {
      alert(
        'Configure um número de WhatsApp nas configurações gerais para finalizar pedidos.'
      );
      return;
    }

    let message = `*Pedido via Catálogo Online - ${
      cfg.storeName || 'Minha Loja'
    }*\n\n`;

    if (isVipUnlocked) {
      message +=
        '🔓 _Aplicando Condição de Preço VIP_\n\n';
    }

    cart.forEach((item) => {
      const price = getEffectivePrice(item.product);

      message += `• ${item.quantity}x ${
        item.product.name
      } - ${formatCurrency(price * item.quantity)}\n`;
    });

    message += `\n*Total:* ${formatCurrency(calculateTotal())}`;

    const digits = String(cfg.whatsapp).replace(/\D/g, '');
    const cleanPhone = digits.startsWith('55')
      ? digits
      : `55${digits}`;

    if (
      cleanPhone.length < 12 ||
      cleanPhone.length > 13
    ) {
      alert(
        'Informe um WhatsApp válido com código do país, DDD e número.'
      );
      return;
    }

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        message
      )}`,
      '_blank'
    );
  };

  const cardStyle: React.CSSProperties = {
    background: card,
    border: `1px solid ${border}`,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
  };

  const inputStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    width: '100%',
    padding: '11px 12px',
    border: `1px solid ${border}`,
    borderRadius: 10,
    background: 'transparent',
    color: text,
    fontSize: 13,
    outline: 0
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: '9px 14px',
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: 'transparent',
    color: text,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700
  };

  return (
    <div
      style={{
        color: text,
        paddingBottom: 40
      }}
    >
      <SectionTitle
        title="Catálogo & Vitrine Digital"
        sub="Gerencie seu link público e configure a senha de acesso VIP para os seus clientes"
        subtext={subtext}
      />

      {/* CONFIGURAÇÕES DO CATÁLOGO */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}
      >
        {/* LINK PÚBLICO */}

        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8
            }}
          >
            <div
              style={{
                padding: 8,
                borderRadius: 10,
                background: `${accent}15`,
                color: accent
              }}
            >
              <Store size={18} />
            </div>

            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 800
                }}
              >
                Link Público da Loja
              </h4>

              <p
                style={{
                  fontSize: 11,
                  color: subtext,
                  margin: 0
                }}
              >
                Compartilhe com seus clientes
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 14
            }}
          >
            <input
              readOnly
              value={publicUrl}
              style={{
                ...inputStyle,
                flex: 1,
                minWidth: 0,
                fontSize: 12
              }}
            />

            <button
              onClick={copy}
              title="Copiar link"
              style={{
                ...buttonStyle,
                background: accent,
                border: 0,
                color: '#fff'
              }}
            >
              <Copy size={16} />
            </button>

            <button
              onClick={() => window.open(publicUrl, '_blank')}
              title="Abrir em nova aba"
              style={buttonStyle}
            >
              <ExternalLink size={16} />
            </button>
          </div>
        </div>

        {/* WHATSAPP DA LOJA */}

        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8
            }}
          >
            <div
              style={{
                padding: 8,
                borderRadius: 10,
                background: '#22c55e18',
                color: '#22c55e'
              }}
            >
              <MessageCircle size={18} />
            </div>

            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 800
                }}
              >
                WhatsApp para receber pedidos
              </h4>

              <p
                style={{
                  fontSize: 11,
                  color: subtext,
                  margin: 0
                }}
              >
                Número que receberá os pedidos desta loja.
              </p>
            </div>
          </div>

          <label
            htmlFor="catalog-store-whatsapp"
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              margin: '14px 0 6px'
            }}
          >
            Número do WhatsApp com DDD
          </label>

          <input
            id="catalog-store-whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={cfg.whatsapp || ''}
            onChange={(event) =>
              setCfg((previous: any) => ({
                ...previous,
                whatsapp: event.target.value
              }))
            }
            placeholder="Ex.: +55 83 99999-9999"
            style={inputStyle}
          />

          <p
            style={{
              fontSize: 11,
              color: subtext,
              lineHeight: 1.5,
              margin: '8px 0 12px'
            }}
          >
            Informe o código do país, DDD e número. A
            configuração será salva para este login.
          </p>

          <button
            onClick={save}
            disabled={saving}
            style={{
              ...buttonStyle,
              width: '100%',
              padding: 11,
              border: 0,
              background: '#16a34a',
              color: '#fff',
              opacity: saving ? 0.7 : 1,
              cursor: saving ? 'wait' : 'pointer'
            }}
          >
            <Save size={14} />
            {saving ? 'Salvando...' : 'Salvar WhatsApp da loja'}
          </button>

          {saved && (
            <p
              style={{
                fontSize: 11,
                color: '#22c55e',
                margin: '8px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <CheckCircle2 size={13} />
              Configuração salva com sucesso.
            </p>
          )}
        </div>

        {/* SENHA VIP */}

        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8
            }}
          >
            <div
              style={{
                padding: 8,
                borderRadius: 10,
                background: '#f59e0b15',
                color: '#f59e0b'
              }}
            >
              <Lock size={18} />
            </div>

            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 800
                }}
              >
                Registro de Senha VIP
              </h4>

              <p
                style={{
                  fontSize: 11,
                  color: subtext,
                  margin: 0
                }}
              >
                Configure o acesso às ofertas VIP.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 14
            }}
          >
            <input
              type="password"
              value={vipPassword}
              onChange={(event) =>
                setVipPassword(event.target.value)
              }
              placeholder={
                cfg.vipConfigured
                  ? 'Digite para alterar a senha VIP'
                  : 'Defina a senha VIP da loja'
              }
              style={{
                ...inputStyle,
                flex: 1,
                minWidth: 0
              }}
            />

            <button
              onClick={save}
              disabled={saving}
              style={{
                ...buttonStyle,
                background: accent,
                border: 0,
                color: '#fff',
                whiteSpace: 'nowrap'
              }}
            >
              <Save size={14} />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

          {saved && (
            <p
              style={{
                fontSize: 11,
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 8
              }}
            >
              <CheckCircle2 size={13} />
              Configuração salva com sucesso!
            </p>
          )}
        </div>
      </div>

      {/* SIMULADOR DA VITRINE */}

      <div style={cardStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Sparkles size={16} color={accent} />

              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 800
                }}
              >
                Simulador da Vitrine Pública
              </h3>
            </div>

            <p
              style={{
                fontSize: 12,
                color: subtext,
                margin: '4px 0 0'
              }}
            >
              Teste a vitrine e o acesso aos preços VIP.
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
            <button
              onClick={toggleCatalogVisibility}
              title={
                isCatalogVisible
                  ? 'Ocultar somente os valores'
                  : 'Mostrar os valores'
              }
              style={{
                ...buttonStyle,
                background: isCatalogVisible
                  ? 'transparent'
                  : `${accent}12`,
                color: isCatalogVisible ? text : accent
              }}
            >
              {isCatalogVisible ? (
                <Eye size={15} />
              ) : (
                <EyeOff size={15} />
              )}

              {isCatalogVisible
                ? 'Ocultar valores'
                : 'Mostrar valores'}
            </button>

            <button
              onClick={() => setShowVipModal(true)}
              style={{
                ...buttonStyle,
                border: isVipUnlocked
                  ? '1px solid #10b981'
                  : `1px solid ${border}`,
                background: isVipUnlocked
                  ? '#ecfdf5'
                  : 'transparent',
                color: isVipUnlocked ? '#047857' : text
              }}
            >
              <ShieldCheck size={14} />

              {isVipUnlocked
                ? 'Modo VIP Desbloqueado'
                : 'Inserir Senha VIP (Cliente)'}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              style={{
                ...buttonStyle,
                position: 'relative',
                padding: '9px 16px',
                background: accent,
                border: 0,
                color: '#fff'
              }}
            >
              <ShoppingBag size={14} />
              Carrinho

              {cart.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -7,
                    right: -7,
                    background: '#f43f5e',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${card}`
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

        {!isCatalogVisible && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 16px',
              marginBottom: 18,
              borderRadius: 12,
              border: `1px solid ${border}`,
              background: `${accent}08`,
              color: subtext,
              fontSize: 12,
              fontWeight: 700
            }}
          >
            <EyeOff size={16} color={accent} />
            Os preços estão ocultos. Imagens e informações dos
            produtos continuam visíveis.
          </div>
        )}

        {/* BUSCA */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 20
          }}
        >
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={15}
              color={subtext}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar produtos no catálogo..."
              style={{
                ...inputStyle,
                padding: '10px 12px 10px 40px'
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4
            }}
          >
            {categories.map((category: string) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  ...buttonStyle,
                  padding: '7px 14px',
                  whiteSpace: 'nowrap',
                  border:
                    selectedCategory === category
                      ? 0
                      : `1px solid ${border}`,
                  background:
                    selectedCategory === category
                      ? accent
                      : 'transparent',
                  color:
                    selectedCategory === category
                      ? '#fff'
                      : text
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* PRODUTOS
            Importante: as informações e imagens não dependem
            mais de isCatalogVisible. Somente os preços dependem. */}

        {filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
              color: subtext
            }}
          >
            <ShoppingBag
              size={36}
              style={{ opacity: 0.3, marginBottom: 8 }}
            />

            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                margin: 0
              }}
            >
              Nenhum produto encontrado nesta categoria.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16
            }}
          >
            {filteredProducts.map((product: any) => {
              const vipVal = getVipPrice(product);
              const vip3xVal = getVipPrice3x(product);

              const hasVipPrice =
                isVipUnlocked &&
                vipVal !== undefined &&
                vipVal !== null &&
                Number(vipVal) > 0;

              const hasVip3xPrice =
                isVipUnlocked &&
                vip3xVal !== undefined &&
                vip3xVal !== null &&
                Number(vip3xVal) > 0;

              const imgUrl =
                product.image_url || product.imageUrl;

              return (
                <div
                  key={product.id}
                  style={{
                    border: `1px solid ${border}`,
                    borderRadius: 14,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: card,
                    minWidth: 0
                  }}
                >
                  <div>
                    {/* IMAGEM SEMPRE VISÍVEL */}

                    {imgUrl ? (
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '4 / 5',
                          overflow: 'hidden',
                          background: 'rgba(0,0,0,0.03)'
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt={product.name || 'Produto'}
                          loading="lazy"
                          style={{
                            display: 'block',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center'
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          height: 150,
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0,0,0,0.02)',
                          color: subtext
                        }}
                      >
                        <Tag
                          size={28}
                          style={{ opacity: 0.4 }}
                        />
                      </div>
                    )}

                    {/* NOME, CATEGORIA E DESCRIÇÃO SEMPRE VISÍVEIS */}

                    <div style={{ padding: 14 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background: `${accent}15`,
                          color: accent,
                          padding: '3px 8px',
                          borderRadius: 6
                        }}
                      >
                        {product.category || 'Geral'}
                      </span>

                      <b
                        style={{
                          display: 'block',
                          fontSize: 14,
                          marginTop: 8,
                          lineHeight: 1.3,
                          letterSpacing: '-0.2px',
                          overflowWrap: 'anywhere'
                        }}
                      >
                        {product.name || 'Produto sem nome'}
                      </b>

                      {product.description && (
                        <p
                          style={{
                            fontSize: 12,
                            color: subtext,
                            margin: '6px 0 0',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4
                          }}
                        >
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SOMENTE OS VALORES SÃO OCULTADOS */}

                  <div
                    style={{
                      padding: '0 14px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginTop: 'auto'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      {isCatalogVisible ? (
                        hasVipPrice ? (
                          <div>
                            <span
                              style={{
                                fontSize: 11,
                                color: subtext,
                                textDecoration: 'line-through'
                              }}
                            >
                              {formatCurrency(
                                Number(product.price || 0)
                              )}
                            </span>

                            <p
                              style={{
                                fontSize: 15,
                                fontWeight: 900,
                                color: '#10b981',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 4
                              }}
                            >
                              {formatCurrency(Number(vipVal))}

                              <span
                                style={{
                                  fontSize: 9,
                                  background: '#ecfdf5',
                                  color: '#047857',
                                  padding: '1px 4px',
                                  borderRadius: 4,
                                  fontWeight: 800
                                }}
                              >
                                VIP
                              </span>
                            </p>

                            {hasVip3xPrice && (
                              <span
                                style={{
                                  display: 'block',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: subtext,
                                  marginTop: 2
                                }}
                              >
                                3x de{' '}
                                {formatCurrency(
                                  Number(vip3xVal) / 3
                                )}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p
                            style={{
                              fontSize: 15,
                              fontWeight: 900,
                              margin: 0,
                              color: text
                            }}
                          >
                            {formatCurrency(
                              Number(product.price || 0)
                            )}
                          </p>
                        )
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            color: subtext
                          }}
                        >
                          <EyeOff size={14} />

                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700
                            }}
                          >
                            Valor oculto
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        ...buttonStyle,
                        flexShrink: 0,
                        padding: '8px 12px',
                        border: 0,
                        background: accent,
                        color: '#fff'
                      }}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CARRINHO */}

      {isCartOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          <div
            onClick={() => setIsCartOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(2px)'
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '100%',
              maxWidth: 420,
              background: card,
              borderLeft: `1px solid ${border}`,
              boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* CABEÇALHO DO CARRINHO */}

            <div
              style={{
                padding: 18,
                borderBottom: `1px solid ${border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <h4
                style={{
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 16,
                  fontWeight: 800
                }}
              >
                <ShoppingBag size={18} color={accent} />
                Carrinho de Compras
              </h4>

              <button
                onClick={() => setIsCartOpen(false)}
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  color: subtext
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* ITENS DO CARRINHO */}

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
                    padding: '48px 0',
                    color: subtext
                  }}
                >
                  <ShoppingBag
                    size={40}
                    style={{
                      opacity: 0.3,
                      marginBottom: 8
                    }}
                  />

                  <p
                    style={{
                      fontSize: 13,
                      margin: 0,
                      fontWeight: 600
                    }}
                  >
                    O carrinho está vazio
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      background: 'rgba(0,0,0,0.02)',
                      padding: 12,
                      borderRadius: 12,
                      border: `1px solid ${border}`
                    }}
                  >
                    {/* NOME SEMPRE VISÍVEL */}

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        paddingRight: 4
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          display: 'block',
                          lineHeight: 1.3,
                          overflowWrap: 'anywhere'
                        }}
                      >
                        {item.product.name}
                      </span>

                      {/* SOMENTE O PREÇO É OCULTADO */}

                      {isCatalogVisible ? (
                        <span
                          style={{
                            fontSize: 11,
                            color: accent,
                            fontWeight: 700,
                            marginTop: 4,
                            display: 'block'
                          }}
                        >
                          {formatCurrency(
                            getEffectivePrice(item.product)
                          )}{' '}
                          por unidade
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            color: subtext,
                            fontWeight: 700,
                            marginTop: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          <EyeOff size={12} />
                          Valor oculto
                        </span>
                      )}
                    </div>

                    {/* QUANTIDADE */}

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
                          updateQuantity(item.product.id, -1)
                        }
                        style={{
                          width: 28,
                          height: 28,
                          border: `1px solid ${border}`,
                          borderRadius: 8,
                          background: 'transparent',
                          color: text,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Minus size={12} />
                      </button>

                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          width: 18,
                          textAlign: 'center'
                        }}
                      >
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, 1)
                        }
                        style={{
                          width: 28,
                          height: 28,
                          border: `1px solid ${border}`,
                          borderRadius: 8,
                          background: 'transparent',
                          color: text,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* TOTAL E FINALIZAÇÃO */}

            {cart.length > 0 && (
              <div
                style={{
                  padding: 18,
                  borderTop: `1px solid ${border}`,
                  background: 'rgba(0,0,0,0.01)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 14
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: subtext,
                      fontWeight: 700
                    }}
                  >
                    Total do Pedido:
                  </span>

                  {isCatalogVisible ? (
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: text
                      }}
                    >
                      {formatCurrency(calculateTotal())}
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 700,
                        color: subtext
                      }}
                    >
                      <EyeOff size={14} />
                      Total oculto
                    </span>
                  )}
                </div>

                <button
                  onClick={handleCheckoutWhatsApp}
                  style={{
                    width: '100%',
                    background: '#22c55e',
                    color: '#fff',
                    border: 0,
                    borderRadius: 12,
                    padding: 14,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 14
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

      {/* MODAL VIP */}

      {showVipModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)'
          }}
        >
          <div
            style={{
              background: card,
              borderRadius: 16,
              maxWidth: 360,
              width: '100%',
              padding: 24,
              border: `1px solid ${border}`,
              boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
            }}
          >
            <div
              style={{
                textAlign: 'center',
                marginBottom: 16
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: '#f59e0b15',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  color: '#f59e0b'
                }}
              >
                <Lock size={22} />
              </div>

              <h4
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 800
                }}
              >
                Área de Acesso VIP
              </h4>

              <p
                style={{
                  fontSize: 12,
                  color: subtext,
                  margin: '6px 0 0',
                  lineHeight: 1.5
                }}
              >
                Digite a senha VIP fornecida pelo lojista
                para acessar os preços promocionais.
              </p>
            </div>

            <input
              type="password"
              placeholder="Digite a senha VIP"
              value={vipPasswordInput}
              onChange={(event) =>
                setVipPasswordInput(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  alert(
                    'A validação da senha VIP precisa ser realizada pelo servidor.'
                  );
                }
              }}
              style={{
                ...inputStyle,
                marginBottom: 14
              }}
            />

            <div
              style={{
                display: 'flex',
                gap: 10
              }}
            >
              <button
                onClick={() => {
                  setShowVipModal(false);
                  setVipPasswordInput('');
                }}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  padding: 10
                }}
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  if (!vipPasswordInput.trim()) {
                    alert('Insira uma senha válida.');
                    return;
                  }

                  // Mantém o comportamento visual anterior.
                  // Para segurança real, valide a senha no backend.
                  setIsVipUnlocked(true);
                  setShowVipModal(false);
                  setVipPasswordInput('');
                }}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  padding: 10,
                  border: 0,
                  background: '#f59e0b',
                  color: '#fff'
                }}
              >
                Desbloquear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
