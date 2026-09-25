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

  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  const [isVipUnlocked, setIsVipUnlocked] = useState<boolean>(false);
  const [vipPasswordInput, setVipPasswordInput] = useState<string>('');
  const [showVipModal, setShowVipModal] = useState<boolean>(false);

  /*
   * ============================================================
   * CONTROLE DE VISIBILIDADE DO CATÁLOGO
   * ============================================================
   *
   * true  = produtos e preços aparecem normalmente
   * false = produtos e preços ficam ocultos
   *
   * Essa configuração é somente visual e não altera os dados
   * dos produtos nem o banco de dados.
   */
  const [isCatalogVisible, setIsCatalogVisible] = useState<boolean>(true);

  // Correção: garante que a URL base não duplique o prefixo /api
  const cleanApiUrl = (apiUrl || 'http://localhost:3333').replace(/\/$/, '');

  const base = cleanApiUrl.endsWith('/api')
    ? cleanApiUrl.slice(0, -4)
    : cleanApiUrl;

  const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('byse_token') || ''}`
  });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${base}/api/catalogo/config`, {
          headers: headers()
        });

        if (r.ok) {
          const loaded = await r.json();
          setCfg(loaded);

          // Sincroniza o botão de visibilidade com o que está salvo no servidor
          if (loaded.catalogVisible !== undefined) {
            setIsCatalogVisible(Boolean(loaded.catalogVisible));
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [base]);

  const publicUrl =
    cfg.publicUrl ||
    `${window.location.origin}/catalogo/${userId || ''}`;

  const save = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const r = await fetch(`${base}/api/catalogo/config`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({
          ...cfg,
          catalogVisible: isCatalogVisible,
          vipPassword
        })
      });

      if (!r.ok) {
        throw new Error();
      }

      const d = await r.json();

      setCfg({
        ...cfg,
        publicUrl: d.publicUrl,
        vipConfigured:
          Boolean(vipPassword) || cfg.vipConfigured
      });

      setVipPassword('');
      setSaved(true);

    } catch (e) {
      alert('Não foi possível salvar as configurações do catálogo.');
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard?.writeText(publicUrl);

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const categories = [
    'Todos',
    ...Array.from(
      new Set(
        products.map(
          (p: any) => p.category || 'Geral'
        )
      )
    )
  ];

  const filteredProducts = products.filter((product: any) => {
    const matchesCategory =
      selectedCategory === 'Todos' ||
      product.category === selectedCategory;

    const matchesSearch =
      String(product.name || '')
        .toLowerCase()
        .includes(query.toLowerCase()) ||
      String(product.description || '')
        .toLowerCase()
        .includes(query.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(
        item => item.product.id === product.id
      );

      if (existing) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1
              }
            : item
        );
      }

      return [
        ...prevCart,
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
    setCart(prevCart => {
      return prevCart
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;

            return newQty > 0
              ? {
                  ...item,
                  quantity: newQty
                }
              : null;
          }

          return item;
        })
        .filter(Boolean) as {
        product: Product;
        quantity: number;
      }[];
    });
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const vipVal =
        item.product.vip_price !== undefined
          ? item.product.vip_price
          : item.product.vipPrice;

      const price =
        isVipUnlocked &&
        vipVal !== null &&
        vipVal !== undefined &&
        vipVal > 0
          ? vipVal
          : item.product.price;

      return (
        total +
        Number(price || 0) * item.quantity
      );
    }, 0);
  };

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
      message += `🔓 _Aplicando Condição de Preço VIP_\n\n`;
    }

    cart.forEach(item => {
      const vipVal =
        item.product.vip_price !== undefined
          ? item.product.vip_price
          : item.product.vipPrice;

      const price =
        isVipUnlocked &&
        vipVal !== null &&
        vipVal !== undefined &&
        Number(vipVal) > 0
          ? vipVal
          : item.product.price;

      message += `• ${item.quantity}x ${
        item.product.name
      } - R$ ${(
        Number(price || 0) * item.quantity
      ).toFixed(2)}\n`;
    });

    message += `\n*Total:* R$ ${calculateTotal().toFixed(2)}`;

    const cleanPhone = String(cfg.whatsapp).replace(
      /\D/g,
      ''
    );

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        message
      )}`,
      '_blank'
    );
  };

  /*
   * ============================================================
   * FUNÇÃO DE ALTERAÇÃO DA VISIBILIDADE
   * ============================================================
   */
  /*
   * ============================================================
   * VISIBILIDADE DO CATÁLOGO (ADMIN + VITRINE PÚBLICA)
   * ============================================================
   *
   * O botão agora grava o campo catalogVisible no servidor,
   * portanto ele controla também o que o cliente vê no
   * PublicCatalog (vitrine pública).
   */
  const toggleCatalogVisibility = async () => {
    const next = !isCatalogVisible;

    // Atualização otimista da interface
    setIsCatalogVisible(next);
    setCfg((prev: any) => ({ ...prev, catalogVisible: next }));

    try {
      const r = await fetch(`${base}/api/catalogo/config`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({
          ...cfg,
          catalogVisible: next
        })
      });

      if (!r.ok) throw new Error();
    } catch (e) {
      // Reverte caso o servidor recuse a alteração
      setIsCatalogVisible(!next);
      setCfg((prev: any) => ({ ...prev, catalogVisible: !next }));
      alert('Não foi possível atualizar a visibilidade do catálogo.');
    }
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

      {/* ========================================================
          BLOCO ADMINISTRATIVO
          ======================================================== */}

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

        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 16,
            padding: 20,
            boxShadow:
              '0 4px 20px rgba(0,0,0,0.02)'
          }}
        >
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
                flex: 1,
                padding: '10px 12px',
                border: `1px solid ${border}`,
                borderRadius: 10,
                background: 'transparent',
                color: text,
                fontSize: 12,
                outline: 0
              }}
            />

            <button
              onClick={copy}
              style={{
                padding: '0 14px',
                border: 0,
                borderRadius: 10,
                background: accent,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Copiar Link"
            >
              <Copy size={16} />
            </button>

            <button
              onClick={() =>
                window.open(
                  publicUrl,
                  '_blank'
                )
              }
              style={{
                padding: '0 14px',
                border: `1px solid ${border}`,
                borderRadius: 10,
                background: 'transparent',
                color: text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Abrir em Nova Aba"
            >
              <ExternalLink size={16} />
            </button>
          </div>
        </div>

        {/* SENHA VIP */}

        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 16,
            padding: 20,
            boxShadow:
              '0 4px 20px rgba(0,0,0,0.02)'
          }}
        >
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
                Proteja ofertas exclusivas na vitrine pública
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
              onChange={e =>
                setVipPassword(e.target.value)
              }
              placeholder={
                cfg.vipConfigured
                  ? 'Senha VIP ativa (digite para alterar)'
                  : 'Defina a senha VIP da loja'
              }
              style={{
                flex: 1,
                padding: '10px 12px',
                border: `1px solid ${border}`,
                borderRadius: 10,
                background: 'transparent',
                color: text,
                fontSize: 12,
                outline: 0
              }}
            />

            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: '0 16px',
                border: 0,
                borderRadius: 10,
                background: accent,
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Save size={14} />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

          {saved && (
            <span
              style={{
                fontSize: 11,
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 6
              }}
            >
              <CheckCircle2 size={13} />
              Configuração salva com sucesso!
            </span>
          )}
        </div>

      </div>

      {/* ========================================================
          VITRINE
          ======================================================== */}

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: 20,
          boxShadow:
            '0 4px 20px rgba(0,0,0,0.02)'
        }}
      >

        {/* CABEÇALHO DA VITRINE */}

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
              <Sparkles
                size={16}
                color={accent}
              />

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
                margin: '2px 0 0 0'
              }}
            >
              Veja como seu cliente enxergará o catálogo e teste o acesso aos preços VIP
            </p>
          </div>

          {/* BOTÕES */}

          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >

            {/* =================================================
                NOVO BOTÃO DE VISIBILIDADE
                ================================================= */}

            <button
              onClick={toggleCatalogVisibility}
              title={
                isCatalogVisible
                  ? 'Ocultar produtos e valores'
                  : 'Mostrar produtos e valores'
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                border: `1px solid ${border}`,
                background: isCatalogVisible
                  ? 'transparent'
                  : `${accent}12`,
                color: isCatalogVisible
                  ? text
                  : accent,
                cursor: 'pointer',
                transition:
                  'all 0.2s ease'
              }}
            >
              {isCatalogVisible ? (
                <Eye size={15} />
              ) : (
                <EyeOff size={15} />
              )}

              {isCatalogVisible
                ? 'Ocultar produtos'
                : 'Mostrar produtos'}
            </button>

            {/* BOTÃO VIP */}

            <button
              onClick={() =>
                setShowVipModal(true)
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                border: isVipUnlocked
                  ? '1px solid #10b981'
                  : `1px solid ${border}`,
                background: isVipUnlocked
                  ? '#ecfdf5'
                  : 'transparent',
                color: isVipUnlocked
                  ? '#047857'
                  : text,
                cursor: 'pointer'
              }}
            >
              <ShieldCheck size={14} />

              {isVipUnlocked
                ? 'Modo VIP Desbloqueado'
                : 'Inserir Senha VIP (Cliente)'}
            </button>

            {/* CARRINHO */}

            <button
              onClick={() =>
                setIsCartOpen(true)
              }
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 10,
                background: accent,
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                border: 0,
                cursor: 'pointer'
              }}
            >
              <ShoppingBag size={14} />

              Carrinho

              {cart.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
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
                    (sum, item) =>
                      sum + item.quantity,
                    0
                  )}
                </span>
              )}
            </button>

          </div>
        </div>

        {/* ======================================================
            AVISO QUANDO OS PRODUTOS ESTÃO OCULTOS
            ====================================================== */}

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
            <EyeOff
              size={16}
              color={accent}
            />

            Produtos e valores ocultos
          </div>
        )}

        {/* ========================================================
            BUSCA E CATEGORIAS
            ======================================================== */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 20
          }}
        >

          <div
            style={{
              position: 'relative',
              width: '100%'
            }}
          >
            <Search
              size={15}
              color={subtext}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform:
                  'translateY(-50%)'
              }}
            />

            <input
              value={query}
              onChange={e =>
                setQuery(e.target.value)
              }
              placeholder="Pesquisar produtos disponíveis no catálogo..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: `1px solid ${border}`,
                borderRadius: 10,
                padding:
                  '10px 12px 10px 40px',
                background: 'transparent',
                color: text,
                fontSize: 13,
                outline: 0
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
            {categories.map(category => (
              <button
                key={category}
                onClick={() =>
                  setSelectedCategory(
                    category
                  )
                }
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
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
                      : text,
                  transition:
                    'all 0.2s ease'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================
            GRID DE PRODUTOS
            ======================================================== */}

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
              style={{
                opacity: 0.3,
                marginBottom: 8
              }}
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

            {filteredProducts.map((p: any) => {

              const vipVal =
                p.vip_price !== undefined
                  ? p.vip_price
                  : p.vipPrice;

              const hasVipPrice =
                isVipUnlocked &&
                vipVal !== undefined &&
                vipVal !== null &&
                Number(vipVal) > 0;

              const vip3xVal =
                p.vip_price_3x !== undefined
                  ? p.vip_price_3x
                  : p.vipPrice3x;

              const hasVip3xPrice =
                isVipUnlocked &&
                vip3xVal !== undefined &&
                vip3xVal !== null &&
                Number(vip3xVal) > 0;

              const imgUrl =
                p.image_url || p.imageUrl;

              return (

                <div
                  key={p.id}
                  style={{
                    border: `1px solid ${border}`,
                    borderRadius: 14,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent:
                      'space-between',
                    background: card,
                    transition:
                      'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >

                  <div>

                    {/* =================================================
                        IMAGEM DO PRODUTO
                        ================================================= */}

                    {isCatalogVisible ? (

                      imgUrl ? (

                        <div
                          style={{
                            height: 150,
                            width: '100%',
                            overflow: 'hidden',
                            background:
                              'rgba(0,0,0,0.03)'
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={p.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>

                      ) : (

                        <div
                          style={{
                            height: 100,
                            width: '100%',
                            display: 'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'center',
                            background:
                              'rgba(0,0,0,0.02)',
                            color: subtext
                          }}
                        >
                          <Tag
                            size={24}
                            style={{
                              opacity: 0.4
                            }}
                          />
                        </div>

                      )

                    ) : (

                      /* =================================================
                         PLACEHOLDER QUANDO OCULTO
                         ================================================= */

                      <div
                        style={{
                          height: 150,
                          width: '100%',
                          display: 'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          flexDirection:
                            'column',
                          gap: 8,
                          background:
                            'rgba(0,0,0,0.025)',
                          color: subtext
                        }}
                      >
                        <EyeOff
                          size={28}
                          style={{
                            opacity: 0.45
                          }}
                        />

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            opacity: 0.7
                          }}
                        >
                          Produto oculto
                        </span>
                      </div>

                    )}

                    {/* =================================================
                        INFORMAÇÕES DO PRODUTO
                        ================================================= */}

                    {isCatalogVisible ? (

                      <div
                        style={{
                          padding: 14
                        }}
                      >

                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform:
                              'uppercase',
                            background:
                              `${accent}15`,
                            color: accent,
                            padding:
                              '3px 8px',
                            borderRadius: 6
                          }}
                        >
                          {p.category ||
                            'Geral'}
                        </span>

                        <b
                          style={{
                            display: 'block',
                            fontSize: 14,
                            marginTop: 8,
                            lineHeight: 1.3,
                            letterSpacing:
                              '-0.2px'
                          }}
                        >
                          {p.name}
                        </b>

                        {p.description && (
                          <p
                            style={{
                              fontSize: 12,
                              color: subtext,
                              margin:
                                '6px 0 0 0',
                              display:
                                '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient:
                                'vertical',
                              overflow:
                                'hidden',
                              lineHeight: 1.4
                            }}
                          >
                            {p.description}
                          </p>
                        )}

                      </div>

                    ) : (

                      <div
                        style={{
                          padding: 14,
                          minHeight: 75,
                          display: 'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center'
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: subtext,
                            fontWeight: 700
                          }}
                        >
                          Informações ocultas
                        </span>
                      </div>

                    )}

                  </div>

                  {/* ====================================================
                      PREÇO + ADICIONAR
                      ==================================================== */}

                  <div
                    style={{
                      padding:
                        '0 14px 14px 14px',
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'space-between',
                      marginTop: 'auto'
                    }}
                  >

                    <div>

                      {isCatalogVisible ? (

                        hasVipPrice ? (

                          <div>

                            <span
                              style={{
                                fontSize: 11,
                                color: subtext,
                                textDecoration:
                                  'line-through'
                              }}
                            >
                              {Number(
                                p.price || 0
                              ).toLocaleString(
                                'pt-BR',
                                {
                                  style:
                                    'currency',
                                  currency:
                                    'BRL'
                                }
                              )}
                            </span>

                            <p
                              style={{
                                fontSize: 15,
                                fontWeight: 900,
                                color:
                                  '#10b981',
                                margin: 0,
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                gap: 4
                              }}
                            >
                              {Number(
                                vipVal
                              ).toLocaleString(
                                'pt-BR',
                                {
                                  style:
                                    'currency',
                                  currency:
                                    'BRL'
                                }
                              )}

                              <span
                                style={{
                                  fontSize: 9,
                                  background:
                                    '#ecfdf5',
                                  color:
                                    '#047857',
                                  padding:
                                    '1px 4px',
                                  borderRadius: 4,
                                  fontWeight:
                                    800
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
                                ou 3x de{' '}
                                {(
                                  Number(vip3xVal) / 3
                                ).toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                })}{' '}
                                (VIP 3x:{' '}
                                {Number(
                                  vip3xVal
                                ).toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                })}
                                )
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
                            {Number(
                              p.price || 0
                            ).toLocaleString(
                              'pt-BR',
                              {
                                style:
                                  'currency',
                                currency:
                                  'BRL'
                              }
                            )}
                          </p>

                        )

                      ) : (

                        <div
                          style={{
                            display: 'flex',
                            alignItems:
                              'center',
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
                      onClick={() =>
                        addToCart(p)
                      }
                      style={{
                        padding:
                          '7px 12px',
                        border: 0,
                        borderRadius: 10,
                        background: accent,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
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

      {/* ==========================================================
          GAVETA LATERAL DO CARRINHO
          ========================================================== */}

      {isCartOpen && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            overflow: 'hidden'
          }}
        >

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'rgba(0,0,0,0.5)',
              backdropFilter:
                'blur(2px)'
            }}
            onClick={() =>
              setIsCartOpen(false)
            }
          />

          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              maxWidth: '100%',
              display: 'flex',
              paddingLeft: 30
            }}
          >

            <div
              style={{
                width: 380,
                background: card,
                borderLeft:
                  `1px solid ${border}`,
                boxShadow:
                  '-10px 0 30px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection:
                  'column'
              }}
            >

              {/* CABEÇALHO */}

              <div
                style={{
                  padding: 18,
                  borderBottom:
                    `1px solid ${border}`,
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'space-between'
                }}
              >

                <h4
                  style={{
                    margin: 0,
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: 8,
                    fontSize: 16,
                    fontWeight: 800
                  }}
                >
                  <ShoppingBag
                    size={18}
                    color={accent}
                  />

                  Carrinho de Compras
                </h4>

                <button
                  onClick={() =>
                    setIsCartOpen(false)
                  }
                  style={{
                    background:
                      'transparent',
                    border: 0,
                    cursor:
                      'pointer',
                    color: subtext
                  }}
                >
                  <X size={18} />
                </button>

              </div>

              {/* ITENS */}

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: 18,
                  display: 'flex',
                  flexDirection:
                    'column',
                  gap: 12
                }}
              >

                {cart.length === 0 ? (

                  <div
                    style={{
                      textAlign:
                        'center',
                      padding:
                        '48px 0',
                      color:
                        subtext
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

                  cart.map(item => {

                    const vipVal =
                      item.product
                        .vip_price !==
                      undefined
                        ? item.product
                            .vip_price
                        : item.product
                            .vipPrice;

                    const price =
                      isVipUnlocked &&
                      vipVal !== null &&
                      vipVal !==
                        undefined &&
                      Number(vipVal) >
                        0
                        ? vipVal
                        : item.product
                            .price;

                    return (

                      <div
                        key={
                          item.product
                            .id
                        }
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'space-between',
                          background:
                            'rgba(0,0,0,0.02)',
                          padding: 12,
                          borderRadius:
                            12,
                          border:
                            `1px solid ${border}`
                        }}
                      >

                        <div
                          style={{
                            flex: 1,
                            paddingRight:
                              10
                          }}
                        >

                          {isCatalogVisible ? (

                            <>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight:
                                    800,
                                  display:
                                    'block',
                                  lineHeight:
                                    1.2
                                }}
                              >
                                {
                                  item
                                    .product
                                    .name
                                }
                              </span>

                              <span
                                style={{
                                  fontSize: 11,
                                  color:
                                    accent,
                                  fontWeight:
                                    700,
                                  marginTop:
                                    2,
                                  display:
                                    'block'
                                }}
                              >
                                {Number(
                                  price ||
                                    0
                                ).toLocaleString(
                                  'pt-BR',
                                  {
                                    style:
                                      'currency',
                                    currency:
                                      'BRL'
                                  }
                                )}{' '}
                                un
                              </span>
                            </>

                          ) : (

                            <div
                              style={{
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                gap: 7,
                                color:
                                  subtext
                              }}
                            >
                              <EyeOff
                                size={14}
                              />

                              <span
                                style={{
                                  fontSize:
                                    11,
                                  fontWeight:
                                    700
                                }}
                              >
                                Produto e valor ocultos
                              </span>
                            </div>

                          )}

                        </div>

                        {/* CONTROLE DE QUANTIDADE */}

                        <div
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: 8
                          }}
                        >

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                -1
                              )
                            }
                            style={{
                              width: 26,
                              height: 26,
                              border:
                                `1px solid ${border}`,
                              borderRadius:
                                8,
                              background:
                                'transparent',
                              color:
                                text,
                              cursor:
                                'pointer',
                              display:
                                'flex',
                              alignItems:
                                'center',
                              justifyContent:
                                'center'
                            }}
                          >
                            <Minus
                              size={12}
                            />
                          </button>

                          <span
                            style={{
                              fontSize: 12,
                              fontWeight:
                                800,
                              width: 16,
                              textAlign:
                                'center'
                            }}
                          >
                            {
                              item.quantity
                            }
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                1
                              )
                            }
                            style={{
                              width: 26,
                              height: 26,
                              border:
                                `1px solid ${border}`,
                              borderRadius:
                                8,
                              background:
                                'transparent',
                              color:
                                text,
                              cursor:
                                'pointer',
                              display:
                                'flex',
                              alignItems:
                                'center',
                              justifyContent:
                                'center'
                            }}
                          >
                            <Plus
                              size={12}
                            />
                          </button>

                        </div>

                      </div>

                    );
                  })

                )}

              </div>

              {/* ====================================================
                  RODAPÉ DO CARRINHO
                  ==================================================== */}

              {cart.length > 0 && (

                <div
                  style={{
                    padding: 18,
                    borderTop:
                      `1px solid ${border}`,
                    background:
                      'rgba(0,0,0,0.01)'
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center',
                      marginBottom: 14
                    }}
                  >

                    <span
                      style={{
                        fontSize: 13,
                        color:
                          subtext,
                        fontWeight:
                          700
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
                        {calculateTotal().toLocaleString(
                          'pt-BR',
                          {
                            style:
                              'currency',
                            currency:
                              'BRL'
                          }
                        )}
                      </span>

                    ) : (

                      <span
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: 5,
                          fontSize: 12,
                          fontWeight:
                            700,
                          color:
                            subtext
                        }}
                      >
                        <EyeOff
                          size={14}
                        />

                        Total oculto
                      </span>

                    )}

                  </div>

                  <button
                    onClick={
                      handleCheckoutWhatsApp
                    }
                    style={{
                      width: '100%',
                      background:
                        '#22c55e',
                      color: '#fff',
                      border: 0,
                      borderRadius:
                        12,
                      padding: 14,
                      fontWeight:
                        800,
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      gap: 8,
                      cursor:
                        'pointer',
                      fontSize: 14
                    }}
                  >
                    <MessageCircle
                      size={18}
                    />

                    Finalizar Pedido via WhatsApp
                  </button>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

      {/* ==========================================================
          MODAL DE SENHA VIP
          ========================================================== */}

      {showVipModal && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding: 16,
            background:
              'rgba(0,0,0,0.5)',
            backdropFilter:
              'blur(2px)'
          }}
        >

          <div
            style={{
              background: card,
              borderRadius: 16,
              maxWidth: 360,
              width: '100%',
              padding: 24,
              border:
                `1px solid ${border}`,
              boxShadow:
                '0 15px 35px rgba(0,0,0,0.1)'
            }}
          >

            <div
              style={{
                textAlign:
                  'center',
                marginBottom: 16
              }}
            >

              <div
                style={{
                  width: 44,
                  height: 44,
                  background:
                    '#f59e0b15',
                  borderRadius: 12,
                  display:
                    'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  margin:
                    '0 auto 10px auto',
                  color:
                    '#f59e0b'
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
                  margin:
                    '6px 0 0 0',
                  lineHeight: 1.4
                }}
              >
                Digite a senha fornecida pelo lojista para revelar os preços promocionais exclusivos.
              </p>

            </div>

            <input
              type="password"
              placeholder="Digite a senha VIP"
              value={
                vipPasswordInput
              }
              onChange={e =>
                setVipPasswordInput(
                  e.target.value
                )
              }
              style={{
                width: '100%',
                boxSizing:
                  'border-box',
                padding:
                  '10px 14px',
                border:
                  `1px solid ${border}`,
                borderRadius: 10,
                background:
                  'transparent',
                color: text,
                fontSize: 13,
                marginBottom: 14,
                outline: 0
              }}
            />

            <div
              style={{
                display:
                  'flex',
                gap: 10
              }}
            >

              <button
                onClick={() => {
                  setShowVipModal(
                    false
                  );
                }}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius:
                    10,
                  border:
                    `1px solid ${border}`,
                  background:
                    'transparent',
                  color: text,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor:
                    'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                onClick={() => {

                  if (
                    vipPasswordInput
                      .trim()
                      .length > 0
                  ) {

                    setIsVipUnlocked(
                      true
                    );

                    setShowVipModal(
                      false
                    );

                    setVipPasswordInput(
                      ''
                    );

                  } else {

                    alert(
                      'Insira uma senha válida.'
                    );

                  }

                }}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius:
                    10,
                  border: 0,
                  background:
                    '#f59e0b',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor:
                    'pointer'
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