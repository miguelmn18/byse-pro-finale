// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Lock, ShoppingBag, MessageCircle, CheckCircle2, Tag, X, Plus, Minus } from 'lucide-react';

export function PublicCatalog() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [vip, setVip] = useState(false);
  const [showVip, setShowVip] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [query, setQuery] = useState('');

  const base = (import.meta.env.VITE_API_URL || 'http://localhost:3333').replace(/\/$/, '');
  const id = window.location.pathname.split('/')[2];

  useEffect(() => {
    fetch(`${base}/api/public/catalogo/${id}`)
      .then(async r => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError('Catálogo não encontrado.'))
      .finally(() => setLoading(false));
  }, [id, base]);

  const verify = async () => {
    try {
      const r = await fetch(`${base}/api/public/catalogo/${id}/vip/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const resData = await r.json();
      if (!r.ok) {
        alert(resData.error || 'Senha VIP inválida.');
        return;
      }
      setVip(true);
      setShowVip(false);
      setPassword('');
    } catch (e) {
      alert('Erro ao validar senha VIP.');
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: any, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const vipVal = item.product.vip_price !== undefined ? item.product.vip_price : item.product.vipPrice;
      const price = (vip && vipVal !== null && vipVal !== undefined && Number(vipVal) > 0) ? vipVal : item.product.price;
      return total + (Number(price || 0) * item.quantity);
    }, 0);
  };

  const handleCheckoutWhatsApp = () => {
    const cleanPhone = '5583981932137';

    let message = `*Pedido via Catálogo Online - ${data?.storeName || 'Loja'}*\n\n`;
    if (vip) message += `🔓 _Condição de Preço VIP Ativa_\n\n`;

    cart.forEach(item => {
      const vipVal = item.product.vip_price !== undefined ? item.product.vip_price : item.product.vipPrice;
      const price = (vip && vipVal !== null && vipVal !== undefined && Number(vipVal) > 0) ? vipVal : item.product.price;
      message += `• ${item.quantity}x ${item.product.name} - R$ ${(Number(price || 0) * item.quantity).toFixed(2)}\n`;
    });
    message += `\n*Total:* R$ ${calculateTotal().toFixed(2)}`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0C0C0C', color: '#F0EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        Carregando catálogo...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0C0C0C', color: '#F0EFE9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#DC2626' }}>Ops! Catálogo Indisponível</h2>
        <p style={{ color: '#8A8A82', marginBottom: 16 }}>{error || 'Identificador da loja não encontrado.'}</p>
      </div>
    );
  }

  const categories = ['Todos', ...Array.from(new Set((data.products || []).map((p: any) => p.category || 'Geral')))];
  const filteredProducts = (data.products || []).filter((product: any) => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = String(product.name || '').toLowerCase().includes(query.toLowerCase()) ||
                          String(product.description || '').toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0C0C0C', color: '#F0EFE9', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Cabeçalho da Loja com padrão unificado e Botão VIP garantido */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12, background: '#1C1C1C', padding: 20, borderRadius: 16, border: '1px solid #2E2E2E' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F0EFE9' }}>{data.storeName || 'Catálogo da Loja'}</h1>
            <p style={{ color: '#8A8A82', margin: '4px 0 0 0', fontSize: 13 }}>Confira nossos produtos disponíveis em estoque</p>
          </div>
          
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button 
              onClick={() => setShowVip(true)} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: 0, borderRadius: 10, 
                background: vip ? '#10b981' : '#f59e0b', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)' 
              }}
            >
              {vip ? <><CheckCircle2 size={15}/> VIP Ativo</> : <><Lock size={15}/> Desbloquear VIP</>}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                borderRadius: 10, background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 600, border: 0, cursor: 'pointer'
              }}
            >
              <ShoppingBag size={15} /> Carrinho
              {cart.length > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, background: '#f43f5e', color: '#fff', fontSize: 10, fontWeight: 700, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1C1C1C' }}>
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Barra de Pesquisa e Filtros */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Pesquisar produtos..." 
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #2E2E2E', borderRadius: 10, padding: '12px 16px', background: '#1C1C1C', color: '#F0EFE9', fontSize: 14, outline: 0 }} 
          />
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
                  border: selectedCategory === cat ? 0 : '1px solid #2E2E2E',
                  background: selectedCategory === cat ? '#DC2626' : '#1C1C1C',
                  color: selectedCategory === cat ? '#fff' : '#8A8A82'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Produtos */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A8A82' }}>
            <ShoppingBag size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {filteredProducts.map((p: any) => {
              const vipVal = p.vip_price !== undefined ? p.vip_price : p.vipPrice;
              const hasVipPrice = vip && vipVal !== undefined && vipVal !== null && Number(vipVal) > 0;

              return (
                <div key={p.id} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#141414', color: '#8A8A82' }}>
                        <Tag size={24} style={{ opacity: 0.3 }} />
                      </div>
                    )}
                    <div style={{ padding: 14 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: '#2E2E2E', color: '#8A8A82', padding: '2px 8px', borderRadius: 6 }}>
                        {p.category || 'Geral'}
                      </span>
                      <h3 style={{ fontSize: 14, margin: '8px 0 4px 0', fontWeight: 600, color: '#F0EFE9' }}>{p.name}</h3>
                      {p.description && <p style={{ fontSize: 12, color: '#8A8A82', margin: 0, lineHeight: 1.3 }}>{p.description}</p>}
                    </div>
                  </div>

                  <div style={{ padding: '0 14px 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      {hasVipPrice ? (
                        <div>
                          <span style={{ fontSize: 11, color: '#8A8A82', textDecoration: 'line-through' }}>
                            {Number(p.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {Number(vipVal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            <span style={{ fontSize: 9, background: '#064e3b', color: '#34d399', padding: '1px 4px', borderRadius: 4 }}>VIP</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#F0EFE9' }}>
                          {Number(p.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => addToCart(p)}
                      style={{ background: '#DC2626', color: '#fff', border: 0, padding: '7px 12px', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Senha VIP */}
        {showVip && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100, backdropFilter: 'blur(2px)' }}>
            <div style={{ background: '#1C1C1C', padding: 24, borderRadius: 16, width: '100%', maxWidth: 360, border: '1px solid #2E2E2E' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, background: '#78350f', color: '#f59e0b', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
                  <Lock size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, color: '#F0EFE9', fontWeight: 600 }}>Acesso VIP Exclusivo</h3>
                <p style={{ color: '#8A8A82', fontSize: 12, margin: '6px 0 0 0' }}>Digite a senha fornecida pelo lojista para desbloquear preços especiais.</p>
              </div>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && verify()}
                placeholder="Senha VIP"
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', border: '1px solid #2E2E2E', borderRadius: 9, background: '#0C0C0C', color: '#F0EFE9', fontSize: 13, outline: 0, marginBottom: 14 }} 
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowVip(false)} style={{ flex: 1, padding: 10, border: '1px solid #2E2E2E', borderRadius: 9, background: 'transparent', color: '#8A8A82', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={verify} style={{ flex: 1, padding: 10, border: 0, borderRadius: 9, background: '#f59e0b', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Desbloquear</button>
              </div>
            </div>
          </div>
        )}

        {/* Carrinho Lateral */}
        {isCartOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(2px)' }} onClick={() => setIsCartOpen(false)} />
            <div style={{ position: 'absolute', insetY: 0, right: 0, width: 380, background: '#1C1C1C', borderLeft: '1px solid #2E2E2E', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 18, borderBottom: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 15, color: '#F0EFE9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingBag size={18} color="#DC2626" /> Carrinho</h3>
                <button onClick={() => setIsCartOpen(false)} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: '#8A8A82' }}><X size={18} /></button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#8A8A82', fontSize: 13 }}>Seu carrinho está vazio.</div>
                ) : (
                  cart.map(item => {
                    const vipVal = item.product.vip_price !== undefined ? item.product.vip_price : item.product.vipPrice;
                    const price = (vip && vipVal !== null && vipVal !== undefined && Number(vipVal) > 0) ? vipVal : item.product.price;
                    return (
                      <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0C0C0C', padding: 12, borderRadius: 10, border: '1px solid #2E2E2E' }}>
                        <div>
                          <b style={{ fontSize: 13, display: 'block', color: '#F0EFE9', fontWeight: 600 }}>{item.product.name}</b>
                          <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>{Number(price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} un</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => updateQuantity(item.product.id, -1)} style={{ width: 26, height: 26, border: '1px solid #2E2E2E', borderRadius: 8, background: 'transparent', color: '#F0EFE9', cursor: 'pointer' }}><Minus size={12} /></button>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, 1)} style={{ width: 26, height: 26, border: '1px solid #2E2E2E', borderRadius: 8, background: 'transparent', color: '#F0EFE9', cursor: 'pointer' }}><Plus size={12} /></button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {cart.length > 0 && (
                <div style={{ padding: 18, borderTop: '1px solid #2E2E2E', background: '#0C0C0C' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ color: '#8A8A82', fontSize: 13 }}>Total:</span>
                    <span style={{ fontSize: 17, fontWeight: 700, color: '#F0EFE9' }}>{calculateTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <button onClick={handleCheckoutWhatsApp} style={{ width: '100%', background: '#16a34a', color: '#fff', border: 0, borderRadius: 10, padding: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <MessageCircle size={18} /> Finalizar Pedido via WhatsApp
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