
import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar, Users, Package, BarChart3, Plus, Trash2,
  ChevronDown, ChevronUp, Clock, Pencil, X, Save
} from 'lucide-react';
import { SectionTitle } from '../components/common';

const money = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

const today = () => new Date().toISOString().slice(0, 10);

const calculateDaysCounter = (createdAt: any) => {
  const start = createdAt ? new Date(createdAt) : new Date();
  if (isNaN(start.getTime())) return 0;

  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

export function PreTreino({
  card,
  border,
  subtext,
  accent,
  text,
  clientesPreTreino,
  setClientesPreTreino,
  produtosPreTreino,
  setProdutosPreTreino,
  registros,
  setRegistros,
  API_URL,
  getAuthHeaders
}: any) {
  const [tab, setTab] = useState('consumo');
  const [loading, setLoading] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    tipo: 'mensal',
    valorMensalidade: '90',
    valorAvulso: '10'
  });

  // Produto sem controle de estoque.
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    cost: '',
    price: ''
  });

  const [editingProduct, setEditingProduct] = useState(false);

  const [consumo, setConsumo] = useState({
    customerId: '',
    guestName: '',
    productId: '',
    type: 'avulso',
    value: '',
    date: today()
  });

  const [report, setReport] = useState<any>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [showAllCustomers, setShowAllCustomers] = useState(false);
  const [customerPage, setCustomerPage] = useState(1);

  const pageSize = 15;

  const headers = () =>
    typeof getAuthHeaders === 'function'
      ? getAuthHeaders()
      : { 'Content-Type': 'application/json' };

  const cleanApiUrl = (API_URL || '').replace(/\/api\/?$/, '');
  const baseUrl = `${cleanApiUrl}/api`;

  const products = Array.isArray(produtosPreTreino)
    ? produtosPreTreino
    : [];

  const rawCustomers = Array.isArray(clientesPreTreino)
    ? clientesPreTreino
    : [];

  const rawRecords = Array.isArray(registros)
    ? registros
    : [];

  const refreshReport = async () => {
    try {
      const r = await fetch(`${baseUrl}/pre-treino/reports`, {
        headers: headers()
      });

      if (r.ok) setReport(await r.json());
    } catch (e) {
      console.error('[REFRESH REPORT ERROR]', e);
    }
  };

  useEffect(() => {
    refreshReport();
  }, [registros, API_URL]);

  // Carregar clientes.
  useEffect(() => {
    const fetchPreTreinoCustomers = async () => {
      try {
        const r = await fetch(`${baseUrl}/pre-treino/customers`, {
          headers: headers()
        });

        if (!r.ok) return;

        const data = await r.json();

        const normalized = Array.isArray(data)
          ? data.map((c: any) => {
              const createdAtDate = c.created_at
                ? new Date(c.created_at)
                : new Date();

              const year = createdAtDate.getFullYear();
              const month = String(createdAtDate.getMonth() + 1).padStart(2, '0');
              const fixedVencimento = `${year}-${month}-01`;

              return {
                ...c,
                tipo: c.tipo || c.preTreinoTipo || 'mensal',
                valorMensalidade: Number(
                  c.valorMensalidade ?? c.valor_mensalidade ?? 0
                ),
                valorAvulso: Number(
                  c.valorAvulso ?? c.valor_avulso ?? 0
                ),
                statusMensalidade:
                  c.statusMensalidade ||
                  c.status_mensalidade ||
                  'Pendente (Não Pago)',
                dataVencimento: fixedVencimento,
                data_vencimento: fixedVencimento,
                diasContadorVencimento: calculateDaysCounter(c.created_at)
              };
            })
          : [];

        if (typeof setClientesPreTreino === 'function') {
          setClientesPreTreino(normalized);
        }
      } catch (e) {
        console.error('[FETCH CUSTOMERS ERROR]', e);
      }
    };

    fetchPreTreinoCustomers();
  }, [API_URL]);

  // Carregar produtos. O estoque não é mais utilizado.
  useEffect(() => {
    const fetchPreTreinoProducts = async () => {
      try {
        const r = await fetch(`${baseUrl}/pre-treino/products`, {
          headers: headers()
        });

        if (!r.ok) return;

        const data = await r.json();

        if (typeof setProdutosPreTreino === 'function') {
          setProdutosPreTreino(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('[FETCH PRODUCTS ERROR]', e);
      }
    };

    fetchPreTreinoProducts();
  }, [API_URL]);

  const customers = rawCustomers.map((c: any) => {
    const createdAtDate = c.created_at
      ? new Date(c.created_at)
      : new Date();

    const year = createdAtDate.getFullYear();
    const month = String(createdAtDate.getMonth() + 1).padStart(2, '0');
    const fixedVencimento = `${year}-${month}-01`;

    return {
      ...c,
      tipo: c.tipo || c.preTreinoTipo || 'mensal',
      valorMensalidade: Number(
        c.valorMensalidade ?? c.valor_mensalidade ?? 0
      ),
      valorAvulso: Number(
        c.valorAvulso ?? c.valor_avulso ?? 0
      ),
      statusMensalidade:
        c.statusMensalidade ||
        c.status_mensalidade ||
        'Pendente (Não Pago)',
      dataVencimento:
        c.dataVencimento || c.data_vencimento || fixedVencimento,
      data_vencimento:
        c.data_vencimento || c.dataVencimento || fixedVencimento,
      diasContadorVencimento: calculateDaysCounter(c.created_at)
    };
  });

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a: any, b: any) => {
      const countA = rawRecords.filter(
        (r: any) =>
          r.customerId === a.id || r.customerName === a.name
      ).length;

      const countB = rawRecords.filter(
        (r: any) =>
          r.customerId === b.id || r.customerName === b.name
      ).length;

      return countB - countA;
    });
  }, [customers, registros]);

  const selectedProduct = products.find(
    (p: any) => p.id === consumo.productId
  );

  const selectedCustomer = customers.find(
    (c: any) => c.id === consumo.customerId
  );

  const activeMonthly = customers.filter(
    (c: any) =>
      c.tipo === 'mensal' &&
      c.statusMensalidade === 'Pago'
  ).length;

  const totalConsumption = rawRecords.reduce((s: number, r: any) => {
    const prodMatch = products.find(
      (p: any) => p.id === r.productId || p.id === r.produto_id
    );

    return s + Number(
      r.value || r.valor || prodMatch?.price || 0
    );
  }, 0);

  // Cadastro e atualização de cliente.
  const saveCustomer = async (e: any) => {
    e.preventDefault();

    if (!customerForm.name || !customerForm.phone) {
      return alert('Nome e telefone são obrigatórios.');
    }

    setLoading(true);

    try {
      const now = new Date();

      const nextVencimentoDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      ).toISOString().slice(0, 10);

      const payload = {
        id: `ptc_${Date.now()}`,
        name: customerForm.name,
        phone: customerForm.phone,
        tipo: customerForm.tipo,
        valorMensalidade:
          customerForm.tipo === 'mensal'
            ? Number(customerForm.valorMensalidade)
            : 0,
        valor_mensalidade:
          customerForm.tipo === 'mensal'
            ? Number(customerForm.valorMensalidade)
            : 0,
        dataInicio: nextVencimentoDate,
        data_inicio: nextVencimentoDate,
        dataFim: nextVencimentoDate,
        data_fim: nextVencimentoDate,
        valorAvulso:
          customerForm.tipo === 'avulso'
            ? Number(customerForm.valorAvulso)
            : 0,
        valor_avulso:
          customerForm.tipo === 'avulso'
            ? Number(customerForm.valorAvulso)
            : 0,
        statusMensalidade:
          customerForm.tipo === 'mensal'
            ? 'Pendente (Não Pago)'
            : 'Avulso',
        status_mensalidade:
          customerForm.tipo === 'mensal'
            ? 'Pendente (Não Pago)'
            : 'Avulso'
      };

      const r = await fetch(`${baseUrl}/pre-treino/customers`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload)
      });

      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(
          errData.error ||
          errData.message ||
          'Falha ao salvar o cliente.'
        );
      }

      const saved = await r.json();

      const normalizedSaved = {
        ...saved,
        tipo: saved.tipo || 'mensal',
        valorMensalidade: Number(
          saved.valorMensalidade ?? saved.valor_mensalidade ?? 0
        ),
        valorAvulso: Number(
          saved.valorAvulso ?? saved.valor_avulso ?? 0
        ),
        statusMensalidade:
          saved.statusMensalidade ||
          saved.status_mensalidade ||
          'Pendente (Não Pago)',
        dataVencimento: nextVencimentoDate,
        data_vencimento: nextVencimentoDate,
        diasContadorVencimento: calculateDaysCounter(saved.created_at)
      };

      if (typeof setClientesPreTreino === 'function') {
        setClientesPreTreino([
          ...customers.filter((c: any) => c.id !== normalizedSaved.id),
          normalizedSaved
        ]);
      }

      setCustomerForm({
        name: '',
        phone: '',
        tipo: 'mensal',
        valorMensalidade: '90',
        valorAvulso: '10'
      });
    } catch (e: any) {
      console.error('[SAVE CUSTOMER ERROR]', e);
      alert(`Não foi possível salvar o cliente: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Limpar formulário de produto.
  const resetProductForm = () => {
    setProductForm({
      id: '',
      name: '',
      cost: '',
      price: ''
    });

    setEditingProduct(false);
  };

  // Abrir produto para edição.
  const startEditProduct = (p: any) => {
    setProductForm({
      id: p.id,
      name: p.name || p.nome || '',
      cost: String(p.cost ?? p.custo ?? 0),
      price: String(p.price ?? p.preco ?? 0)
    });

    setEditingProduct(true);
    setTab('produtos');
  };

  // Cadastrar produto ou atualizar produto existente.
  // O mesmo endpoint POST realiza o upsert pelo ID.
  const saveProduct = async (e: any) => {
    e.preventDefault();

    if (!productForm.name.trim()) {
      return alert('Informe o nome do produto.');
    }

    const cost = Number(productForm.cost || 0);
    const price = Number(productForm.price || 0);

    if (!Number.isFinite(cost) || cost < 0) {
      return alert('Informe um custo válido.');
    }

    if (!Number.isFinite(price) || price < 0) {
      return alert('Informe um preço válido.');
    }

    try {
      setLoading(true);

      const payload = {
        id: editingProduct
          ? productForm.id
          : `ptp_${Date.now()}`,
        name: productForm.name.trim(),
        cost,
        price
      };

      const r = await fetch(`${baseUrl}/pre-treino/products`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload)
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao salvar produto.');
      }

      const saved = await r.json();

      setProdutosPreTreino((current: any[]) => {
        const list = Array.isArray(current) ? current : [];

        return [
          saved,
          ...list.filter((p: any) => p.id !== saved.id)
        ];
      });

      resetProductForm();

      alert(
        editingProduct
          ? 'Produto atualizado com sucesso!'
          : 'Produto cadastrado com sucesso!'
      );
    } catch (e: any) {
      console.error('[SAVE PRODUCT ERROR]', e);
      alert(e.message || 'Não foi possível salvar o produto.');
    } finally {
      setLoading(false);
    }
  };

  // Registrar consumo sem verificar ou descontar estoque.
  const registerConsumption = async (e: any) => {
    e.preventDefault();

    if (!consumo.productId) {
      return alert('Selecione um produto.');
    }

    if (
      consumo.customerId === '' &&
      !consumo.guestName.trim()
    ) {
      return alert(
        'Selecione um cliente ou informe o nome do consumo avulso.'
      );
    }

    if (!selectedProduct) {
      return alert('Produto não encontrado. Atualize a página e tente novamente.');
    }

    const foundCustomer = customers.find(
      (c: any) => c.id === consumo.customerId
    );

    const type =
      foundCustomer?.tipo === 'mensal' &&
      foundCustomer?.statusMensalidade === 'Pago'
        ? 'mensal'
        : consumo.type;

    const resolvedValue =
      type === 'mensal'
        ? 0
        : Number(consumo.value || selectedProduct.price || 0);

    const nowTime = new Date();
    const timeString = nowTime.toTimeString().slice(0, 5);

    try {
      setLoading(true);

      const payload = {
        id: `ptr_${Date.now()}`,
        customerId: consumo.customerId || null,
        customerName: foundCustomer?.name || consumo.guestName,
        customerPhone: foundCustomer?.phone || '',
        productId: consumo.productId,
        productName: selectedProduct.name || '',
        cost: Number(selectedProduct.cost || 0),
        value: resolvedValue,
        valor: resolvedValue,
        type,
        date: consumo.date,
        time: timeString
      };

      const r = await fetch(`${baseUrl}/pre-treino/records`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload)
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao registrar consumo.');
      }

      const responseData = await r.json();

      const saved = {
        id: responseData.id || payload.id,
        customerId: payload.customerId,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        productId: payload.productId,
        productName: payload.productName,
        cost: payload.cost,
        value: payload.value,
        valor: payload.valor,
        type: payload.type,
        date: payload.date,
        time: responseData.time || timeString
      };

      setRegistros((current: any[]) => [
        saved,
        ...(Array.isArray(current) ? current : [])
      ]);

      // Não existe mais alteração de estoque aqui.

      setConsumo({
        customerId: '',
        guestName: '',
        productId: '',
        type: 'avulso',
        value: '',
        date: today()
      });
    } catch (e: any) {
      console.error('[REGISTER CONSUMPTION ERROR]', e);
      alert(e.message || 'Não foi possível registrar o consumo.');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!confirm('Excluir este consumo?')) return;

    try {
      const r = await fetch(`${baseUrl}/pre-treino/records/${id}`, {
        method: 'DELETE',
        headers: headers()
      });

      if (!r.ok) throw new Error('Falha ao excluir consumo.');

      setRegistros(
        rawRecords.filter((r: any) => r.id !== id)
      );
    } catch (e) {
      console.error('[DELETE RECORD ERROR]', e);
      alert('Não foi possível excluir o consumo.');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;

    try {
      const r = await fetch(`${baseUrl}/pre-treino/products/${id}`, {
        method: 'DELETE',
        headers: headers()
      });

      if (!r.ok) throw new Error('Falha ao excluir produto.');

      setProdutosPreTreino(
        products.filter((p: any) => p.id !== id)
      );

      if (productForm.id === id) resetProductForm();
    } catch (e) {
      console.error('[DELETE PRODUCT ERROR]', e);
      alert('Não foi possível excluir o produto.');
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('Excluir este cliente?')) return;

    try {
      const r = await fetch(`${baseUrl}/pre-treino/customers/${id}`, {
        method: 'DELETE',
        headers: headers()
      });

      if (!r.ok) throw new Error('Falha ao excluir cliente.');

      if (typeof setClientesPreTreino === 'function') {
        setClientesPreTreino(
          customers.filter((c: any) => c.id !== id)
        );
      }
    } catch (e) {
      console.error('[DELETE CUSTOMER ERROR]', e);
      alert('Não foi possível excluir o cliente.');
    }
  };

  const toggleMonthly = async (c: any) => {
    const next =
      c.statusMensalidade === 'Pago'
        ? 'Pendente (Não Pago)'
        : 'Pago';

    try {
      const payload = {
        ...c,
        statusMensalidade: next,
        status_mensalidade: next
      };

      const r = await fetch(`${baseUrl}/pre-treino/customers`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload)
      });

      if (!r.ok) throw new Error('Falha ao atualizar mensalidade.');

      const saved = await r.json();

      const normalizedSaved = {
        ...saved,
        tipo: saved.tipo || 'mensal',
        valorMensalidade: Number(
          saved.valorMensalidade ?? saved.valor_mensalidade ?? 0
        ),
        valorAvulso: Number(
          saved.valorAvulso ?? saved.valor_avulso ?? 0
        ),
        statusMensalidade:
          saved.statusMensalidade ||
          saved.status_mensalidade ||
          'Pendente (Não Pago)',
        diasContadorVencimento: calculateDaysCounter(saved.created_at)
      };

      if (typeof setClientesPreTreino === 'function') {
        setClientesPreTreino(
          customers.map((x: any) =>
            x.id === c.id ? normalizedSaved : x
          )
        );
      }
    } catch (e) {
      console.error('[TOGGLE MONTHLY ERROR]', e);
      alert('Não foi possível atualizar a mensalidade.');
    }
  };

  const tabs = [
    ['consumo', 'Consumo', Calendar],
    ['clientes', 'Clientes', Users],
    ['produtos', 'Produtos', Package],
    ['relatorios', 'Relatórios', BarChart3]
  ];

  return (
    <div>
      <SectionTitle
        title="Pré-Treino"
        sub="Clientes, produtos, consumo e relatórios com persistência no banco"
        subtext={subtext}
      />

      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 16
      }}>
        {tabs.map(([id, label, Icon]: any) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              border: `1px solid ${tab === id ? accent : border}`,
              background: tab === id ? accent : 'transparent',
              color: tab === id ? '#fff' : text,
              borderRadius: 9,
              padding: '9px 12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Icon
              size={14}
              style={{ verticalAlign: 'middle', marginRight: 5 }}
            />
            {label}
          </button>
        ))}
      </div>

      {tab === 'consumo' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr .8fr',
          gap: 16
        }}>
          <form
            onSubmit={registerConsumption}
            style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: 18
            }}
          >
            <h3>Registrar consumo</h3>

            <label>Cliente cadastrado</label>

            <select
              value={consumo.customerId}
              onChange={e =>
                setConsumo({
                  ...consumo,
                  customerId: e.target.value
                })
              }
              style={{
                width: '100%',
                padding: 10,
                margin: '6px 0 10px'
              }}
            >
              <option value="">Consumo avulso</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.phone}
                </option>
              ))}
            </select>

            {!consumo.customerId && (
              <input
                placeholder="Nome do cliente avulso"
                value={consumo.guestName}
                onChange={e =>
                  setConsumo({
                    ...consumo,
                    guestName: e.target.value
                  })
                }
                style={{
                  width: '100%',
                  padding: 10,
                  marginBottom: 10
                }}
              />
            )}

            <label>Produto</label>

            <select
              value={consumo.productId}
              onChange={e => {
                const p = products.find(
                  (x: any) => x.id === e.target.value
                );

                setConsumo({
                  ...consumo,
                  productId: e.target.value,
                  value: String(p?.price ?? '')
                });
              }}
              style={{
                width: '100%',
                padding: 10,
                margin: '6px 0 10px'
              }}
            >
              <option value="">Selecione</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={consumo.date}
              onChange={e =>
                setConsumo({
                  ...consumo,
                  date: e.target.value
                })
              }
              style={{
                width: '100%',
                padding: 10,
                marginBottom: 10
              }}
            />

            <input
              type="number"
              step="0.01"
              placeholder="Valor avulso"
              value={consumo.value}
              onChange={e =>
                setConsumo({
                  ...consumo,
                  value: e.target.value
                })
              }
              disabled={
                selectedCustomer?.tipo === 'mensal' &&
                selectedCustomer?.statusMensalidade === 'Pago'
              }
              style={{
                width: '100%',
                padding: 10,
                marginBottom: 12
              }}
            />

            <button
              disabled={loading}
              style={{
                width: '100%',
                padding: 11,
                border: 0,
                borderRadius: 9,
                background: accent,
                color: '#fff',
                fontWeight: 800
              }}
            >
              <Plus size={15} /> Registrar
            </button>
          </form>

          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: 18
            }}>
              <b>Clientes mensais ativos</b>
              <div style={{
                fontSize: 28,
                fontWeight: 900,
                color: accent
              }}>
                {activeMonthly}
              </div>
            </div>

            {(() => {
              const avulsoRecords = rawRecords.filter(
                (r: any) => (r.type || r.tipo_consumo) === 'avulso'
              );

              const avulsoTotalConsumption = avulsoRecords.reduce(
                (s: number, r: any) => {
                  const pMatch = products.find(
                    (p: any) =>
                      p.id === r.productId ||
                      p.id === r.produto_id
                  );

                  return s + Number(
                    r.value || r.valor || pMatch?.price || 0
                  );
                },
                0
              );

              return (
                <div style={{
                  background: card,
                  border: `1px solid ${border}`,
                  borderRadius: 14,
                  padding: 18
                }}>
                  <b>Consumo registrado (Avulso)</b>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>
                    {avulsoRecords.length}
                  </div>
                  <small style={{ color: subtext }}>
                    Receita avulsa: {money(avulsoTotalConsumption)}
                  </small>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {tab === 'clientes' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr',
          gap: 16
        }}>
          <form
            onSubmit={saveCustomer}
            style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: 18
            }}
          >
            <h3>Cadastrar cliente</h3>

            {[
              ['name', 'Nome'],
              ['phone', 'Telefone']
            ].map(([k, l]) => (
              <input
                key={k}
                placeholder={l}
                value={(customerForm as any)[k]}
                onChange={e =>
                  setCustomerForm({
                    ...customerForm,
                    [k]: e.target.value
                  })
                }
                style={{
                  width: '100%',
                  padding: 10,
                  margin: '6px 0'
                }}
              />
            ))}

            <div style={{
              display: 'flex',
              gap: 8,
              margin: '8px 0'
            }}>
              <button
                type="button"
                onClick={() =>
                  setCustomerForm({
                    ...customerForm,
                    tipo: 'mensal'
                  })
                }
                style={{
                  flex: 1,
                  padding: 9,
                  border: `1px solid ${
                    customerForm.tipo === 'mensal' ? accent : border
                  }`,
                  background:
                    customerForm.tipo === 'mensal'
                      ? `${accent}22`
                      : 'transparent',
                  color: text,
                  borderRadius: 8
                }}
              >
                Mensal
              </button>

              <button
                type="button"
                onClick={() =>
                  setCustomerForm({
                    ...customerForm,
                    tipo: 'avulso'
                  })
                }
                style={{
                  flex: 1,
                  padding: 9,
                  border: `1px solid ${
                    customerForm.tipo === 'avulso' ? accent : border
                  }`,
                  background:
                    customerForm.tipo === 'avulso'
                      ? `${accent}22`
                      : 'transparent',
                  color: text,
                  borderRadius: 8
                }}
              >
                Avulso
              </button>
            </div>

            {customerForm.tipo === 'mensal' ? (
              <input
                type="number"
                step="0.01"
                placeholder="Mensalidade"
                value={customerForm.valorMensalidade}
                onChange={e =>
                  setCustomerForm({
                    ...customerForm,
                    valorMensalidade: e.target.value
                  })
                }
                style={{
                  width: '100%',
                  padding: 10,
                  margin: '6px 0'
                }}
              />
            ) : (
              <input
                type="number"
                step="0.01"
                placeholder="Valor por consumo"
                value={customerForm.valorAvulso}
                onChange={e =>
                  setCustomerForm({
                    ...customerForm,
                    valorAvulso: e.target.value
                  })
                }
                style={{
                  width: '100%',
                  padding: 10,
                  margin: '6px 0'
                }}
              />
            )}

            <button
              disabled={loading}
              style={{
                width: '100%',
                padding: 11,
                marginTop: 8,
                border: 0,
                borderRadius: 9,
                background: accent,
                color: '#fff',
                fontWeight: 800
              }}
            >
              Salvar cliente
            </button>
          </form>

          <div style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 14,
            padding: 18
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10
            }}>
              <h3 style={{ margin: 0 }}>
                Clientes do pré-treino
              </h3>

              {sortedCustomers.length > 3 && (
                <button
                  onClick={() => {
                    setShowAllCustomers(!showAllCustomers);
                    setCustomerPage(1);
                  }}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${accent}`,
                    color: accent,
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {showAllCustomers
                    ? 'Ver apenas top 3'
                    : 'Ver mais clientes'}
                </button>
              )}
            </div>

            {sortedCustomers.length === 0 ? (
              <p style={{ color: subtext }}>
                Nenhum cliente cadastrado.
              </p>
            ) : (
              (() => {
                let displayedList = sortedCustomers;
                let totalPages = 1;

                if (!showAllCustomers) {
                  displayedList = sortedCustomers.slice(0, 3);
                } else if (sortedCustomers.length > pageSize) {
                  totalPages = Math.ceil(
                    sortedCustomers.length / pageSize
                  );

                  const start = (customerPage - 1) * pageSize;
                  displayedList = sortedCustomers.slice(
                    start,
                    start + pageSize
                  );
                }

                return (
                  <>
                    {displayedList.map((c: any) => {
                      const isExpanded = expandedCustomerId === c.id;

                      const clientRecords = rawRecords.filter(
                        (r: any) =>
                          r.customerId === c.id ||
                          r.customerName === c.name
                      );

                      const recordsByDate = clientRecords.reduce(
                        (acc: any, r: any) => {
                          const d = r.date || today();
                          if (!acc[d]) acc[d] = [];
                          acc[d].push(r);
                          return acc;
                        },
                        {}
                      );

                      const sortedDates = Object.keys(recordsByDate).sort(
                        (a, b) =>
                          new Date(b).getTime() - new Date(a).getTime()
                      );

                      const clientTotalSpent = clientRecords.reduce(
                        (sum: number, r: any) => {
                          const pMatch = products.find(
                            (p: any) =>
                              p.id === r.productId ||
                              p.id === r.produto_id
                          );

                          return sum + Number(
                            r.value || r.valor || pMatch?.cost || 0
                          );
                        },
                        0
                      );

                      return (
                        <div
                          key={c.id}
                          style={{
                            borderBottom: `1px solid ${border}`,
                            padding: '10px 0'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div
                              style={{ cursor: 'pointer', flex: 1 }}
                              onClick={() =>
                                setExpandedCustomerId(
                                  isExpanded ? null : c.id
                                )
                              }
                            >
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                              }}>
                                <b>{c.name}</b>
                                {isExpanded
                                  ? <ChevronUp size={14} color={accent} />
                                  : <ChevronDown size={14} color={subtext} />}
                              </div>

                              <div style={{
                                fontSize: 12,
                                color: subtext
                              }}>
                                {c.phone} · {c.tipo === 'mensal'
                                  ? `Mensal ${money(c.valorMensalidade)} · `
                                  : `Avulso · ${money(c.valorAvulso)}`}

                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    toggleMonthly(c);
                                  }}
                                  style={{
                                    marginLeft: 8,
                                    background: 'transparent',
                                    border: 'none',
                                    color: accent,
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                  }}
                                >
                                  {c.statusMensalidade || 'Pendente'}
                                </button>
                              </div>

                              {c.tipo === 'mensal' && (
                                <div style={{
                                  fontSize: 11,
                                  color: accent,
                                  marginTop: 3
                                }}>
                                  ⏳ Contador: <b>
                                    {c.diasContadorVencimento ?? 0}
                                  </b> dias restantes para o vencimento (Dia 01)
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => deleteCustomer(c.id)}
                              style={{
                                border: 0,
                                background: 'transparent',
                                color: '#ef4444',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {isExpanded && (
                            <div style={{
                              marginTop: 10,
                              padding: 10,
                              background: `${accent}08`,
                              borderRadius: 8,
                              border: `1px dashed ${border}`
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8
                              }}>
                                <small style={{
                                  fontWeight: 700,
                                  color: accent
                                }}>
                                  Histórico e Valores de Consumo
                                </small>

                                <small style={{
                                  fontWeight: 700,
                                  color: text
                                }}>
                                  Total Gasto: <span style={{ color: accent }}>
                                    {money(clientTotalSpent)}
                                  </span>
                                </small>
                              </div>

                              {sortedDates.length === 0 ? (
                                <p style={{
                                  fontSize: 12,
                                  color: subtext,
                                  margin: 0
                                }}>
                                  Nenhum consumo registrado para este cliente.
                                </p>
                              ) : (
                                sortedDates.map(dateStr => {
                                  const dayItems = recordsByDate[dateStr];
                                  const formattedDate = dateStr
                                    .split('-')
                                    .reverse()
                                    .join('/');

                                  const dayTotal = dayItems.reduce(
                                    (accDay: number, item: any) =>
                                      accDay + Number(
                                        item.cost || item.valor || 0
                                      ),
                                    0
                                  );

                                  return (
                                    <div
                                      key={dateStr}
                                      style={{
                                        marginBottom: 10,
                                        fontSize: 12,
                                        background: card,
                                        padding: 8,
                                        borderRadius: 6,
                                        border: `1px solid ${border}`
                                      }}
                                    >
                                      <div style={{
                                        fontWeight: 600,
                                        color: text,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: 4
                                      }}>
                                        <span style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 4
                                        }}>
                                          <Calendar size={12} />
                                          {formattedDate}
                                        </span>

                                        <span style={{
                                          color: accent,
                                          fontSize: 11
                                        }}>
                                          Total do dia: {money(dayTotal)}
                                        </span>
                                      </div>

                                      <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 4
                                      }}>
                                        {dayItems.map((item: any, idx: number) => {
                                          const pMatch = products.find(
                                            (p: any) =>
                                              p.id === item.productId ||
                                              p.id === item.produto_id
                                          );

                                          const displayName =
                                            item.productName ||
                                            item.product_name ||
                                            item.nome_produto ||
                                            pMatch?.name ||
                                            'Produto';

                                          return (
                                            <div
                                              key={item.id || idx}
                                              style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '4px 6px',
                                                borderBottom: `1px solid ${border}`
                                              }}
                                            >
                                              <span style={{
                                                fontWeight: 600,
                                                color: text
                                              }}>
                                                📦 {displayName}
                                              </span>

                                              <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                color: subtext,
                                                fontSize: 11
                                              }}>
                                                <Clock size={11} />
                                                {item.time || '00:00'}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {showAllCustomers && totalPages > 1 && (
                      <div style={{
                        display: 'flex',
                        gap: 6,
                        justifyContent: 'center',
                        marginTop: 14
                      }}>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map(pageNum => (
                          <button
                            key={pageNum}
                            onClick={() => setCustomerPage(pageNum)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              border: `1px solid ${
                                customerPage === pageNum ? accent : border
                              }`,
                              background:
                                customerPage === pageNum
                                  ? accent
                                  : 'transparent',
                              color:
                                customerPage === pageNum
                                  ? '#fff'
                                  : text,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: 12
                            }}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {tab === 'produtos' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr',
          gap: 16
        }}>
          <form
            onSubmit={saveProduct}
            style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: 18
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8
            }}>
              <h3>
                {editingProduct ? 'Editar produto' : 'Cadastrar produto'}
              </h3>

              {editingProduct && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  title="Cancelar edição"
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: subtext,
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Nome do produto"
              value={productForm.name}
              onChange={e =>
                setProductForm({
                  ...productForm,
                  name: e.target.value
                })
              }
              style={{
                width: '100%',
                padding: 10,
                margin: '6px 0'
              }}
            />

            <label style={{
              display: 'block',
              fontSize: 13,
              color: subtext,
              marginTop: 8
            }}>
              Custo do produto
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Custo"
              value={productForm.cost}
              onChange={e =>
                setProductForm({
                  ...productForm,
                  cost: e.target.value
                })
              }
              style={{
                width: '100%',
                padding: 10,
                margin: '6px 0'
              }}
            />

            <label style={{
              display: 'block',
              fontSize: 13,
              color: subtext,
              marginTop: 8
            }}>
              Preço de consumo
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Preço de consumo"
              value={productForm.price}
              onChange={e =>
                setProductForm({
                  ...productForm,
                  price: e.target.value
                })
              }
              style={{
                width: '100%',
                padding: 10,
                margin: '6px 0'
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: 11,
                marginTop: 8,
                border: 0,
                borderRadius: 9,
                background: accent,
                color: '#fff',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {editingProduct ? (
                <>
                  <Save size={15} /> Salvar alterações
                </>
              ) : (
                <>
                  <Plus size={15} /> Salvar produto
                </>
              )}
            </button>

            {editingProduct && (
              <button
                type="button"
                onClick={resetProductForm}
                style={{
                  width: '100%',
                  padding: 10,
                  marginTop: 8,
                  border: `1px solid ${border}`,
                  borderRadius: 9,
                  background: 'transparent',
                  color: text,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancelar edição
              </button>
            )}
          </form>

          <div style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 14,
            padding: 18
          }}>
            <h3>Produtos cadastrados</h3>

            {products.length === 0 ? (
              <p style={{ color: subtext }}>
                Nenhum produto cadastrado.
              </p>
            ) : (
              products.map((p: any) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 0',
                    borderBottom: `1px solid ${border}`
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <b>{p.name || p.nome}</b>

                    <small style={{
                      display: 'block',
                      color: subtext,
                      marginTop: 3
                    }}>
                      Custo: {money(p.cost ?? p.custo)}
                      {' · '}
                      Venda: {money(p.price ?? p.preco)}
                    </small>
                  </span>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <button
                      type="button"
                      onClick={() => startEditProduct(p)}
                      title="Editar produto e custo"
                      style={{
                        border: `1px solid ${border}`,
                        background: 'transparent',
                        color: accent,
                        borderRadius: 7,
                        padding: 7,
                        cursor: 'pointer'
                      }}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteProduct(p.id)}
                      title="Excluir produto"
                      style={{
                        border: 0,
                        background: 'transparent',
                        color: '#ef4444',
                        padding: 7,
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'relatorios' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 10
          }}>
            {[
              ['Consumos', report?.summary?.totalConsumos ?? rawRecords.length],
              ['Faturamento', money(report?.summary?.faturamento ?? totalConsumption)],
              ['Custo', money(report?.summary?.custo ?? 0)],
              ['Lucro', money(report?.summary?.lucro ?? 0)]
            ].map(([l, v]: any) => (
              <div
                key={l}
                style={{
                  background: card,
                  border: `1px solid ${border}`,
                  borderRadius: 12,
                  padding: 16
                }}
              >
                <small style={{ color: subtext }}>{l}</small>
                <div style={{ fontSize: 22, fontWeight: 900 }}>
                  {v}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16
          }}>
            <div style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: 18
            }}>
              <h3>Clientes que mais consumiram</h3>

              {(report?.topClients || []).map((x: any, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: 9,
                    borderBottom: `1px solid ${border}`
                  }}
                >
                  <b>{i + 1}. {x.nome_cliente}</b>
                  <span style={{ float: 'right' }}>
                    {x.consumos} consumo(s)
                  </span>
                  <small style={{
                    display: 'block',
                    color: subtext
                  }}>
                    {x.telefone_cliente}
                  </small>
                </div>
              ))}
            </div>

            <div style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: 18
            }}>
              <h3>Produtos mais consumidos</h3>

              {(report?.topProducts || []).map((x: any, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: 9,
                    borderBottom: `1px solid ${border}`
                  }}
                >
                  <b>{i + 1}. {x.nome_produto}</b>
                  <span style={{ float: 'right' }}>
                    {x.consumos} consumo(s)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
