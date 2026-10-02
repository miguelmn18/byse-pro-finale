
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

  const [isCartOpen, setIsCartOpen] =
    useState<boolean>(false);

  const [isVipUnlocked, setIsVipUnlocked] =
    useState<boolean>(false);

  const [vipPasswordInput, setVipPasswordInput] =
    useState<string>('');

  const [showVipModal, setShowVipModal] =
    useState<boolean>(false);

  /*
   * ============================================================
   * CONTROLE DE VISIBILIDADE DO CATÁLOGO
   * ============================================================
   *
   * true  = preços aparecem normalmente
   * false = somente os preços ficam ocultos
   *
   * Nome, categoria, imagem e descrição continuam visíveis.
   */
  const [isCatalogVisible, setIsCatalogVisible] =
    useState<boolean>(true);

  /*
   * ============================================================
   * URL DA API
   * ============================================================
   *
   * Evita que seja criado:
   *
   * /api/api/catalogo/config
   *
   * caso apiUrl já contenha /api.
   */
  const cleanApiUrl = (
    apiUrl || 'http://localhost:3333'
  ).replace(/\/$/, '');

  const base = cleanApiUrl.endsWith('/api')
    ? cleanApiUrl.slice(0, -4)
    : cleanApiUrl;

  /*
   * ============================================================
   * HEADERS
   * ============================================================
   */
  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${
      localStorage.getItem('byse_token') || ''
    }`
  });

  /*
   * ============================================================
   * CARREGAR CONFIGURAÇÕES
   * ============================================================
   */
  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const response = await fetch(
          `${base}/api/catalogo/config`,
          {
            headers: headers()
          }
        );

        if (!response.ok) {
          return;
        }

        const loaded = await response.json();

        if (cancelled) {
          return;
        }

        setCfg(loaded);

        if (
          loaded.catalogVisible !== undefined &&
          loaded.catalogVisible !== null
        ) {
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
      cancelled = true;
    };
  }, [base]);

  /*
   * ============================================================
   * LINK PÚBLICO
   * ============================================================
   */
  const publicUrl =
    cfg.publicUrl ||
    `${window.location.origin}/catalogo/${userId || ''}`;

  /*
   * ============================================================
   * SALVAR CONFIGURAÇÕES
   * ============================================================
   */
  const save = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch(
        `${base}/api/catalogo/config`,
        {
          method: 'PUT',
          headers: headers(),
          body: JSON.stringify({
            ...cfg,
            catalogVisible: isCatalogVisible,
            ...(vipPassword.trim()
              ? {
                  vipPassword: vipPassword.trim()
                }
              : {})
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          'Não foi possível salvar as configurações.'
        );
      }

      const data = await response.json();

      setCfg((prev: any) => ({
        ...prev,
        ...data,
        publicUrl:
          data.publicUrl || prev.publicUrl,
        vipConfigured:
          Boolean(vipPassword.trim()) ||
          Boolean(prev.vipConfigured),
        catalogVisible:
          data.catalogVisible !== undefined
            ? data.catalogVisible
            : isCatalogVisible
      }));

      setVipPassword('');
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      console.error(
        'Erro ao salvar configurações:',
        error
      );

      alert(
        'Não foi possível salvar as configurações do catálogo.'
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ============================================================
   * COPIAR LINK
   * ============================================================
   */
  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(publicUrl);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error(
        'Erro ao copiar link:',
        error
      );
    }
  };

  /*
   * ============================================================
   * CATEGORIAS
   * ============================================================
   */
  const categories = [
    'Todos',
    ...Array.from(
      new Set(
        products.map(
          (product: any) =>
            product.category || 'Geral'
        )
      )
    )
  ];

  /*
   * ============================================================
   * FILTRO DE PRODUTOS
   * ============================================================
   */
  const filteredProducts = products.filter(
    (product: any) => {
      const matchesCategory =
        selectedCategory === 'Todos' ||
        product.category === selectedCategory;

      const searchText = query
        .trim()
        .toLowerCase();

      const matchesSearch =
        !searchText ||
        String(product.name || '')
          .toLowerCase()
          .includes(searchText) ||
        String(product.description || '')
          .toLowerCase()
          .includes(searchText);

      return (
        matchesCategory &&
        matchesSearch
      );
    }
  );

  /*
   * ============================================================
   * ADICIONAR PRODUTO AO CARRINHO
   * ============================================================
   */
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(
        item =>
          item.product.id === product.id
      );

      if (existing) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1
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

  /*
   * ============================================================
   * ALTERAR QUANTIDADE
   * ============================================================
   */
  const updateQuantity = (
    productId: string | number,
    delta: number
  ) => {
    setCart(prevCart =>
      prevCart
        .map(item => {
          if (
            item.product.id === productId
          ) {
            const newQuantity =
              item.quantity + delta;

            return newQuantity > 0
              ? {
                  ...item,
                  quantity: newQuantity
                }
              : null;
          }

          return item;
        })
        .filter(Boolean) as {
        product: Product;
        quantity: number;
      }[]
    );
  };

  /*
   * ============================================================
   * OBTER PREÇO VIP
   * ============================================================
   */
  const getVipPrice = (
    product: Product
  ) => {
    if (
      product.vip_price !== undefined &&
      product.vip_price !== null
    ) {
      return product.vip_price;
    }

    return product.vipPrice;
  };

  /*
   * ============================================================
   * OBTER PREÇO VIP 3X
   * ============================================================
   */
  const getVip3xPrice = (
    product: Product
  ) => {
    if (
      product.vip_price_3x !==
        undefined &&
      product.vip_price_3x !== null
    ) {
      return product.vip_price_3x;
    }

    return product.vipPrice3x;
  };

  /*
   * ============================================================
   * CALCULAR TOTAL
   * ============================================================
   */
  const calculateTotal = () => {
    return cart.reduce(
      (total, item) => {
        const vipPrice =
          getVipPrice(item.product);

        const price =
          isVipUnlocked &&
          vipPrice !== undefined &&
          vipPrice !== null &&
          Number(vipPrice) > 0
            ? vipPrice
            : item.product.price;

        return (
          total +
          Number(price || 0) *
            item.quantity
        );
      },
      0
    );
  };

  /*
   * ============================================================
   * FINALIZAR PEDIDO VIA WHATSAPP
   * ============================================================
   */
  const handleCheckoutWhatsApp = () => {
    if (!cfg.whatsapp) {
      alert(
        'Configure um número de WhatsApp nas configurações gerais para finalizar pedidos.'
      );
      return;
    }

    if (cart.length === 0) {
      alert(
        'Adicione pelo menos um produto ao carrinho.'
      );
      return;
    }

    let message =
      `*Pedido via Catálogo Online - ${
        cfg.storeName || 'Minha Loja'
      }*\n\n`;

    if (isVipUnlocked) {
      message +=
        '🔓 _Aplicando Condição de Preço VIP_\n\n';
    }

    cart.forEach(item => {
      const vipPrice =
        getVipPrice(item.product);

      const price =
        isVipUnlocked &&
        vipPrice !== undefined &&
        vipPrice !== null &&
        Number(vipPrice) > 0
          ? vipPrice
          : item.product.price;

      message +=
        `• ${item.quantity}x ${
          item.product.name
        } - R$ ${(
          Number(price || 0) *
          item.quantity
        ).toFixed(2)}\n`;
    });

    message +=
      `\n*Total:* R$ ${calculateTotal().toFixed(
        2
      )}`;

    const cleanPhone = String(
      cfg.whatsapp
    ).replace(/\D/g, '');

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        message
      )}`,
      '_blank'
    );
  };

  /*
   * ============================================================
   * ALTERAR VISIBILIDADE DO CATÁLOGO
   * ============================================================
   *
   * Essa configuração é salva no servidor e pode ser utilizada
   * também pelo PublicCatalog.
   *
   * Importante:
   * ocultar catálogo NÃO remove produtos.
   * Apenas oculta os preços.
   */
  const toggleCatalogVisibility =
    async () => {
      const next =
        !isCatalogVisible;

      setIsCatalogVisible(next);

      setCfg((prev: any) => ({
        ...prev,
        catalogVisible: next
      }));

      try {
        const response =
          await fetch(
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
          throw new Error(
            'Não foi possível atualizar a visibilidade.'
          );
        }

        const data =
          await response.json();

        setCfg((prev: any) => ({
          ...prev,
          ...data,
          catalogVisible:
            data.catalogVisible !==
            undefined
              ? data.catalogVisible
              : next
        }));
      } catch (error) {
        console.error(
          'Erro ao atualizar visibilidade:',
          error
        );

        setIsCatalogVisible(
          !next
        );

        setCfg((prev: any) => ({
          ...prev,
          catalogVisible: !next
        }));

        alert(
          'Não foi possível atualizar a visibilidade do catálogo.'
        );
      }
    };

  /*
   * ============================================================
   * VALIDAR SENHA VIP
   * ============================================================
   *
   * A senha digitada precisa corresponder à senha cadastrada
   * no módulo Catálogo.
   */
  const handleVipUnlock = () => {
    const enteredPassword =
      vipPasswordInput.trim();

    if (!enteredPassword) {
      alert(
        'Insira uma senha válida.'
      );
      return;
    }

    /*
     * O backend pode devolver a senha diretamente em vipPassword
     * ou somente indicar que ela foi configurada.
     *
     * Quando a senha estiver disponível no objeto cfg,
     * fazemos a comparação exata.
     */
    if (
      cfg.vipPassword !== undefined &&
      cfg.vipPassword !== null &&
      String(cfg.vipPassword) !== ''
    ) {
      if (
        enteredPassword !==
        String(cfg.vipPassword)
      ) {
        alert(
          'Senha VIP incorreta.'
        );
        return;
      }
    } else {
      /*
       * Compatibilidade com configurações onde a senha não é
       * retornada pelo endpoint.
       *
       * Nesse cenário, solicitamos ao backend uma validação.
       */
      try {
        /*
         * A validação abaixo é tratada pelo endpoint, quando
         * disponível.
         */
        fetch(
          `${base}/api/catalogo/config/validate-vip`,
          {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
              password: enteredPassword
            })
          }
        )
          .then(async response => {
            if (!response.ok) {
              throw new Error(
                'Senha VIP inválida.'
              );
            }

            setIsVipUnlocked(true);
            setShowVipModal(false);
            setVipPasswordInput('');
          })
          .catch(() => {
            alert(
              'Não foi possível validar a senha VIP. Verifique se ela corresponde à senha cadastrada no Catálogo.'
            );
          });

        return;
      } catch (error) {
        console.error(
          'Erro ao validar senha VIP:',
          error
        );

        alert(
          'Não foi possível validar a senha VIP.'
        );

        return;
      }
    }

    setIsVipUnlocked(true);
    setShowVipModal(false);
    setVipPasswordInput('');
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
        {/* ======================================================
            LINK PÚBLICO
            ====================================================== */}

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

        {/* ======================================================
            SENHA VIP
            ====================================================== */}

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
              onChange={event =>
                setVipPassword(
                  event.target.value
                )
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
                cursor: saving
                  ? 'not-allowed'
                  : 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: saving
                  ? 0.7
                  : 1
              }}
            >
              <Save size={14} />

              {saving
                ? 'Salvando...'
                : 'Salvar'}
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
        {/* ======================================================
            CABEÇALHO DA VITRINE
            ====================================================== */}

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

          {/* ====================================================
              BOTÕES DA VITRINE
              ==================================================== */}

          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            {/* ==================================================
                BOTÃO VISIBILIDADE
                ================================================== */}

            <button
              onClick={
                toggleCatalogVisibility
              }
              title={
                isCatalogVisible
                  ? 'Ocultar preços'
                  : 'Mostrar preços'
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
                background:
                  isCatalogVisible
                    ? 'transparent'
                    : `${accent}12`,
                color:
                  isCatalogVisible
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
                ? 'Ocultar preços'
                : 'Mostrar preços'}
            </button>

            {/* ==================================================
                BOTÃO VIP
                ================================================== */}

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

            {/* ==================================================
                CARRINHO
                ================================================== */}

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
            AVISO DE PREÇOS OCULTOS
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

            Preços ocultos — informações dos produtos continuam visíveis
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
              onChange={event =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Pesquisar produtos disponíveis no catálogo..."
              style={{
                width: '100%',
                boxSizing:
                  'border-box',
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
            {categories.map(
              (category: string) => (
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
                    whiteSpace:
                      'nowrap',
                    cursor: 'pointer',
                    border:
                      selectedCategory ===
                      category
                        ? 0
                        : `1px solid ${border}`,
                    background:
                      selectedCategory ===
                      category
                        ? accent
                        : 'transparent',
                    color:
                      selectedCategory ===
                      category
                        ? '#fff'
                        : text,
                    transition:
                      'all 0.2s ease'
                  }}
                >
                  {category}
                </button>
              )
            )}
          </div>
        </div>

        {/* ========================================================
            GRID DE PRODUTOS
            ======================================================== */}

        {filteredProducts.length ===
        0 ? (
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
            {filteredProducts.map(
              (product: Product) => {
                const vipPrice =
                  getVipPrice(product);

                const hasVipPrice =
                  isVipUnlocked &&
                  vipPrice !== undefined &&
                  vipPrice !== null &&
                  Number(vipPrice) > 0;

                const vip3xPrice =
                  getVip3xPrice(product);

                const hasVip3xPrice =
                  isVipUnlocked &&
                  vip3xPrice !==
                    undefined &&
                  vip3xPrice !== null &&
                  Number(vip3xPrice) > 0;

                const imageUrl =
                  product.image_url ||
                  product.imageUrl;

                return (
                  <div
                    key={product.id}
                    style={{
                      border: `1px solid ${border}`,
                      borderRadius: 14,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection:
                        'column',
                      justifyContent:
                        'space-between',
                      background: card,
                      transition:
                        'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    <div>
                      {/* =================================================
                          IMAGEM
                          ================================================= */}

                      {imageUrl ? (
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
                            src={imageUrl}
                            alt={
                              product.name
                            }
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit:
                                'cover'
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
                      )}

                      {/* =================================================
                          INFORMAÇÕES
                          ================================================= */}

                      <div
                        style={{
                          padding: 14
                        }}
                      >
                        <span
                          style={{
                            display:
                              'inline-block',
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
                          {product.category ||
                            'Geral'}
                        </span>

                        <b
                          style={{
                            display:
                              'block',
                            fontSize: 14,
                            marginTop: 8,
                            lineHeight: 1.3,
                            letterSpacing:
                              '-0.2px'
                          }}
                        >
                          {product.name}
                        </b>

                        {product.description && (
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
                            {
                              product.description
                            }
                          </p>
                        )}

                        {/* =================================================
                            PREÇOS
                            ================================================= */}

                        <div
                          style={{
                            marginTop: 12
                          }}
                        >
                          {isCatalogVisible ? (
                            hasVipPrice ? (
                              <>
                                <div
                                  style={{
                                    display:
                                      'flex',
                                    alignItems:
                                      'center',
                                    gap: 8,
                                    flexWrap:
                                      'wrap'
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: 15,
                                      fontWeight:
                                        900,
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
                                      vipPrice
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
                                        borderRadius:
                                          4,
                                        fontWeight:
                                          800
                                      }}
                                    >
                                      VIP
                                    </span>
                                  </p>
                                </div>

                                {hasVip3xPrice && (
                                  <span
                                    style={{
                                      display:
                                        'block',
                                      fontSize: 11,
                                      fontWeight:
                                        700,
                                      color:
                                        subtext,
                                      marginTop:
                                        4
                                    }}
                                  >
                                    ou 3x de{' '}
                                    {(
                                      Number(
                                        vip3xPrice
                                      ) / 3
                                    ).toLocaleString(
                                      'pt-BR',
                                      {
                                        style:
                                          'currency',
                                        currency:
                                          'BRL'
                                      }
                                    )}{' '}
                                    (VIP 3x:{' '}
                                    {Number(
                                      vip3xPrice
                                    ).toLocaleString(
                                      'pt-BR',
                                      {
                                        style:
                                          'currency',
                                        currency:
                                          'BRL'
                                      }
                                    )}
                                    )
                                  </span>
                                )}
                              </>
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
                                  product.price ||
                                    0
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
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                gap: 6,
                                color:
                                  subtext
                              }}
                            >
                              <EyeOff
                                size={14}
                              />

                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight:
                                    700
                                }}
                              >
                                Valor oculto
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* =================================================
                        BOTÃO ADICIONAR
                        ================================================= */}

                    <div
                      style={{
                        padding:
                          '0 14px 14px'
                      }}
                    >
                      <button
                        onClick={() =>
                          addToCart(
                            product
                          )
                        }
                        style={{
                          width: '100%',
                          padding:
                            '9px 12px',
                          border: 0,
                          borderRadius: 10,
                          background:
                            accent,
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
              }
            )}
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
                maxWidth: '100vw',
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
              {/* ==================================================
                  CABEÇALHO DO CARRINHO
                  ================================================== */}

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
                    cursor: 'pointer',
                    color: subtext
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* ==================================================
                  ITENS DO CARRINHO
                  ================================================== */}

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
                  cart.map(item => {
                    const vipPrice =
                      getVipPrice(
                        item.product
                      );

                    const price =
                      isVipUnlocked &&
                      vipPrice !==
                        undefined &&
                      vipPrice !== null &&
                      Number(vipPrice) >
                        0
                        ? vipPrice
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
                              item.product
                                .name
                            }
                          </span>

                          {isCatalogVisible ? (
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
                                price || 0
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
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                color:
                                  subtext,
                                fontWeight:
                                  700,
                                marginTop:
                                  3,
                                display:
                                  'block'
                              }}
                            >
                              Preço não exibido
                            </span>
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
                                item.product
                                  .id,
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
                                item.product
                                  .id,
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

              {/* ==================================================
                  RODAPÉ DO CARRINHO
                  ================================================== */}

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
                      borderRadius: 12,
                      padding: 14,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      gap: 8,
                      cursor: 'pointer',
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
            alignItems: 'center',
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
            {/* CABEÇALHO DO MODAL */}

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
                  background:
                    '#f59e0b15',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  margin:
                    '0 auto 10px auto',
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
                  margin:
                    '6px 0 0 0',
                  lineHeight: 1.4
                }}
              >
                Digite a senha fornecida pelo lojista para revelar os preços promocionais exclusivos.
              </p>
            </div>

            {/* CAMPO DE SENHA */}

            <input
              type="password"
              placeholder="Digite a senha VIP"
              value={
                vipPasswordInput
              }
              onChange={event =>
                setVipPasswordInput(
                  event.target.value
                )
              }
              onKeyDown={event => {
                if (
                  event.key ===
                  'Enter'
                ) {
                  handleVipUnlock();
                }
              }}
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

            {/* BOTÕES */}

            <div
              style={{
                display: 'flex',
                gap: 10
              }}
            >
              <button
                onClick={() => {
                  setShowVipModal(
                    false
                  );
                  setVipPasswordInput(
                    ''
                  );
                }}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border:
                    `1px solid ${border}`,
                  background:
                    'transparent',
                  color: text,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                onClick={
                  handleVipUnlock
                }
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: 0,
                  background:
                    '#f59e0b',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer'
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

