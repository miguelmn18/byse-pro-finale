import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Users, Package, BarChart3, Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SectionTitle } from '../components/common';

const money = (v:number) => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const today = () => new Date().toISOString().slice(0,10);
const nextMonth = () => { const d=new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().slice(0,10); };

export function PreTreino({card,border,subtext,accent,text,clientesPreTreino,setClientesPreTreino,produtosPreTreino,setProdutosPreTreino,registros,setRegistros,API_URL,getAuthHeaders}:any){
 const [tab,setTab]=useState('consumo');
 const [loading,setLoading]=useState(false);
 const [customerForm,setCustomerForm]=useState({name:'',phone:'',tipo:'mensal',valorMensalidade:'90',inicio:today(),fim:nextMonth(),valorAvulso:'10'});
 const [productForm,setProductForm]=useState({name:'',cost:'',price:'',stock:'0'});
 const [consumo,setConsumo]=useState({customerId:'',guestName:'',productId:'',type:'avulso',value:'',date:today()});
 const [report,setReport]=useState<any>(null);
 const headers=()=>typeof getAuthHeaders==='function'?getAuthHeaders():{'Content-Type':'application/json'};

 // Normaliza a API_URL para evitar duplicação de barras ou de "/api"
 const cleanApiUrl = (API_URL || '').replace(/\/api\/?$/, '');
 const baseUrl = `${cleanApiUrl}/api`;

 const refreshReport=async()=>{
   try{
     const r=await fetch(`${baseUrl}/pre-treino/reports`,{headers:headers()});
     if(r.ok) setReport(await r.json());
   }catch(e){console.error('[REFRESH REPORT ERROR]', e)}
 };

 useEffect(()=>{refreshReport()},[registros]);

 // Carregar clientes de pré-treino com tratamento robusto e mapeamento duplo
 useEffect(()=>{
   const fetchPreTreinoCustomers = async () => {
     try {
       const r = await fetch(`${baseUrl}/pre-treino/customers`, { headers: headers() });
       if (r.ok) {
         const data = await r.json();
         const normalized = Array.isArray(data) ? data.map((c: any) => ({
           ...c,
           tipo: c.tipo || c.preTreinoTipo || 'mensal',
           valorMensalidade: Number(c.valorMensalidade ?? c.valor_mensalidade ?? 0),
           valorAvulso: Number(c.valorAvulso ?? c.valor_avulso ?? 0),
           statusMensalidade: c.statusMensalidade || c.status_mensalidade || 'Pendente (Não Pago)'
         })) : [];
         if (typeof setClientesPreTreino === 'function') setClientesPreTreino(normalized);
       }
     } catch (e) {
       console.error('[FETCH CUSTOMERS ERROR]', e);
     }
   };
   fetchPreTreinoCustomers();
 }, [API_URL]);

 // Carregar produtos de pré-treino
 useEffect(()=>{
   const fetchPreTreinoProducts = async () => {
     try {
       const r = await fetch(`${baseUrl}/pre-treino/products`, { headers: headers() });
       if (r.ok) {
         const data = await r.json();
         if (typeof setProdutosPreTreino === 'function') setProdutosPreTreino(data);
       }
     } catch (e) {
       console.error('[FETCH PRODUCTS ERROR]', e);
     }
   };
   fetchPreTreinoProducts();
 }, [API_URL]);

 const products=Array.isArray(produtosPreTreino)?produtosPreTreino:[];
 const customers=Array.isArray(clientesPreTreino)?clientesPreTreino.map((c:any)=>({
   ...c,
   tipo: c.tipo || c.preTreinoTipo || 'mensal',
   valorMensalidade: Number(c.valorMensalidade ?? c.valor_mensalidade ?? 0),
   valorAvulso: Number(c.valorAvulso ?? c.valor_avulso ?? 0),
   statusMensalidade: c.statusMensalidade || c.status_mensalidade || 'Pendente (Não Pago)'
 })):[];

 const selectedProduct=products.find((p:any)=>p.id===consumo.productId);
 const selectedCustomer=customers.find((c:any)=>c.id===consumo.customerId || c.id===consumo.customerId);
 const activeMonthly=customers.filter((c:any)=>c.tipo==='mensal' && c.statusMensalidade==='Pago').length;
 const totalConsumption=registros.reduce((s:number,r:any)=>s+Number(r.value||r.valor||0),0);

 const saveCustomer=async(e:any)=>{
   e.preventDefault();
   if(!customerForm.name||!customerForm.phone)return alert('Nome e telefone são obrigatórios.');
   setLoading(true);
   try{
     const payload={
       id:`ptc_${Date.now()}`,
       name:customerForm.name,
       phone:customerForm.phone,
       tipo:customerForm.tipo,
       valorMensalidade:customerForm.tipo==='mensal'?Number(customerForm.valorMensalidade):0,
       valor_mensalidade:customerForm.tipo==='mensal'?Number(customerForm.valorMensalidade):0,
       dataInicio:customerForm.tipo==='mensal' && customerForm.inicio ? customerForm.inicio : null,
       data_inicio:customerForm.tipo==='mensal' && customerForm.inicio ? customerForm.inicio : null,
       dataFim:customerForm.tipo==='mensal' && customerForm.fim ? customerForm.fim : null,
       data_fim:customerForm.tipo==='mensal' && customerForm.fim ? customerForm.fim : null,
       valorAvulso:customerForm.tipo==='avulso'?Number(customerForm.valorAvulso):0,
       valor_avulso:customerForm.tipo==='avulso'?Number(customerForm.valorAvulso):0,
       statusMensalidade:customerForm.tipo==='mensal'?'Pendente (Não Pago)':'Avulso',
       status_mensalidade:customerForm.tipo==='mensal'?'Pendente (Não Pago)':'Avulso'
     };
     const r=await fetch(`${baseUrl}/pre-treino/customers`,{method:'POST',headers:headers(),body:JSON.stringify(payload)});
     if(!r.ok) {
       const errData = await r.json().catch(() => ({}));
       throw new Error(errData.error || errData.message || 'Falha ao salvar o cliente no servidor.');
     }
     const saved=await r.json();
     const normalizedSaved = {
       ...saved,
       tipo: saved.tipo || saved.preTreinoTipo || 'mensal',
       valorMensalidade: Number(saved.valorMensalidade ?? saved.valor_mensalidade ?? 0),
       valorAvulso: Number(saved.valorAvulso ?? saved.valor_avulso ?? 0),
       statusMensalidade: saved.statusMensalidade || saved.status_mensalidade || 'Pendente (Não Pago)'
     };
     if(typeof setClientesPreTreino==='function') setClientesPreTreino([...customers.filter((c:any)=>c.id!==normalizedSaved.id),normalizedSaved]);
     setCustomerForm({name:'',phone:'',tipo:'mensal',valorMensalidade:'90',inicio:today(),fim:nextMonth(),valorAvulso:'10'});
   }catch(e:any){
     console.error('[SAVE CUSTOMER ERROR]', e);
     alert(`Não foi possível salvar o cliente: ${e.message || 'Erro desconhecido'}`);
   }finally{
     setLoading(false);
   }
 };

 const saveProduct=async(e:any)=>{
   e.preventDefault();
   if(!productForm.name)return;
   try{
     const r=await fetch(`${baseUrl}/pre-treino/products`,{
       method:'POST',
       headers:headers(),
       body:JSON.stringify({id:`ptp_${Date.now()}`,name:productForm.name,cost:Number(productForm.cost||0),price:Number(productForm.price||0),stock:Number(productForm.stock||0)})
     });
     if(!r.ok)throw new Error('Falha ao salvar produto.');
     const saved=await r.json();
     setProdutosPreTreino([...products.filter((p:any)=>p.id!==saved.id),saved]);
     setProductForm({name:'',cost:'',price:'',stock:'0'});
   }catch(e:any){
     console.error('[SAVE PRODUCT ERROR]', e);
     alert('Não foi possível salvar o produto.');
   }
 };
 
 const registerConsumption=async(e:any)=>{
   e.preventDefault();
   if(!consumo.productId)return alert('Selecione um produto.');
   if(consumo.customerId===''&&!consumo.guestName.trim())return alert('Selecione um cliente ou informe o nome do consumo avulso.');
   if(selectedProduct&&Number(selectedProduct.stock||0)<=0)return alert('Produto sem estoque.');
   const foundCustomer = customers.find((c:any)=>c.id===consumo.customerId);
   const type=foundCustomer?.tipo==='mensal'&&foundCustomer?.statusMensalidade==='Pago'?'mensal':consumo.type;
   const value=type==='mensal'?0:Number(consumo.value||selectedProduct?.price||0);
   try{
     const r=await fetch(`${baseUrl}/pre-treino/records`,{
       method:'POST',
       headers:headers(),
       body:JSON.stringify({id:`ptr_${Date.now()}`,customerId:consumo.customerId||null,customerName:foundCustomer?.name||consumo.guestName,customerPhone:foundCustomer?.phone||'',productId:consumo.productId,productName:selectedProduct?.name||'',cost:selectedProduct?.cost||0,value,type,date:consumo.date})
     });
     if(!r.ok)throw new Error('Falha ao registrar consumo.');
     const responseData=await r.json();
     const saved={id:responseData.id||`ptr_${Date.now()}`,customerId:consumo.customerId||null,customerName:foundCustomer?.name||consumo.guestName,customerPhone:foundCustomer?.phone||'',productId:consumo.productId,productName:selectedProduct?.name||'',cost:selectedProduct?.cost||0,value,type,date:consumo.date};
     setRegistros([saved,...registros]);
     setProdutosPreTreino(products.map((p:any)=>p.id===selectedProduct.id?{...p,stock:Math.max(0,Number(p.stock||0)-1)}:p));
     setConsumo({customerId:'',guestName:'',productId:'',type:'avulso',value:'',date:today()});
   }catch(e:any){
     console.error('[REGISTER CONSUMPTION ERROR]', e);
     alert('Não foi possível registrar o consumo.');
   }
 };
 
 const deleteRecord=async(id:string)=>{
   if(!confirm('Excluir este consumo?'))return;
   try {
     await fetch(`${baseUrl}/pre-treino/records/${id}`,{method:'DELETE',headers:headers()});
     setRegistros(registros.filter((r:any)=>r.id!==id));
   } catch(e) {
     console.error('[DELETE RECORD ERROR]', e);
   }
 };

 const deleteProduct=async(id:string)=>{
   if(!confirm('Excluir este produto?'))return;
   try {
     await fetch(`${baseUrl}/pre-treino/products/${id}`,{method:'DELETE',headers:headers()});
     setProdutosPreTreino(products.filter((p:any)=>p.id!==id));
   } catch(e) {
     console.error('[DELETE PRODUCT ERROR]', e);
   }
 };
 
 const deleteCustomer=async(id:string)=>{
   if(!confirm('Excluir este cliente?'))return;
   try {
     await fetch(`${baseUrl}/pre-treino/customers/${id}`,{method:'DELETE',headers:headers()});
     if(typeof setClientesPreTreino==='function') setClientesPreTreino(customers.filter((c:any)=>c.id!==id));
   } catch(e) {
     console.error('[DELETE CUSTOMER ERROR]', e);
   }
 };

 const toggleMonthly=async(c:any)=>{
   const next=c.statusMensalidade==='Pago'?'Pendente (Não Pago)':'Pago';
   try {
     const payload = {
       ...c,
       statusMensalidade: next,
       status_mensalidade: next
     };
     const r=await fetch(`${baseUrl}/pre-treino/customers`,{method:'POST',headers:headers(),body:JSON.stringify(payload)});
     if(r.ok){
       const saved=await r.json();
       const normalizedSaved = {
         ...saved,
         tipo: saved.tipo || saved.preTreinoTipo || 'mensal',
         valorMensalidade: Number(saved.valorMensalidade ?? saved.valor_mensalidade ?? 0),
         valorAvulso: Number(saved.valorAvulso ?? saved.valor_avulso ?? 0),
         statusMensalidade: saved.statusMensalidade || saved.status_mensalidade || 'Pendente (Não Pago)'
       };
       if(typeof setClientesPreTreino==='function') setClientesPreTreino(customers.map((x:any)=>x.id===c.id?normalizedSaved:x));
     }
   } catch(e) {
     console.error('[TOGGLE MONTHLY ERROR]', e);
   }
 };

 const tabs=[['consumo','Consumo',Calendar],['clientes','Clientes',Users],['produtos','Produtos',Package],['relatorios','Relatórios',BarChart3]];
 return (
   <div>
     <SectionTitle title="Pré-Treino" sub="Clientes, produtos, consumo e relatórios com persistência no banco" subtext={subtext}/>
     <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
       {tabs.map(([id,label,Icon]:any)=>(
         <button key={id} onClick={()=>setTab(id)} style={{border:`1px solid ${tab===id?accent:border}`,background:tab===id?accent:'transparent',color:tab===id?'#fff':text,borderRadius:9,padding:'9px 12px',fontWeight:700,cursor:'pointer'}}>
           <Icon size={14} style={{verticalAlign:'middle',marginRight:5}}/>{label}
         </button>
       ))}
     </div>
     {tab==='consumo'&&(
       <div style={{display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:16}}>
         <form onSubmit={registerConsumption} style={{background:card,border:`1px solid ${border}`,borderRadius:14,padding:18}}>
           <h3>Registrar consumo</h3>
           <label>Cliente cadastrado</label>
           <select value={consumo.customerId} onChange={e=>setConsumo({...consumo,customerId:e.target.value})} style={{width:'100%',padding:10,margin:'6px 0 10px'}}>
             <option value="">Consumo avulso</option>
             {customers.map((c:any)=><option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
           </select>
           {!consumo.customerId&&<input placeholder="Nome do cliente avulso" value={consumo.guestName} onChange={e=>setConsumo({...consumo,guestName:e.target.value})} style={{width:'100%',padding:10,marginBottom:10}}/>}
           <label>Produto</label>
           <select value={consumo.productId} onChange={e=>{const p=products.find((x:any)=>x.id===e.target.value);setConsumo({...consumo,productId:e.target.value,value:String(p?.price||'')})}} style={{width:'100%',padding:10,margin:'6px 0 10px'}}>
             <option value="">Selecione</option>
             {products.map((p:any)=><option key={p.id} value={p.id}>{p.name} — estoque {p.stock??0}</option>)}
           </select>
           <input type="date" value={consumo.date} onChange={e=>setConsumo({...consumo,date:e.target.value})} style={{width:'100%',padding:10,marginBottom:10}}/>
           <input type="number" step="0.01" placeholder="Valor avulso" value={consumo.value} onChange={e=>setConsumo({...consumo,value:e.target.value})} disabled={selectedCustomer?.tipo==='mensal'&&selectedCustomer?.statusMensalidade==='Pago'} style={{width:'100%',padding:10,marginBottom:12}}/>
           <button disabled={loading} style={{width:'100%',padding:11,border:0,borderRadius:9,background:accent,color:'#fff',fontWeight:800}}><Plus size={15}/> Registrar</button>
         </form>
         <div style={{display:'grid',gap:10}}>
           <div style={{background:card,border:`1px solid ${border}`,borderRadius:14,padding:18}}>
             <b>Clientes mensais ativos</b>
             <div style={{fontSize:28,fontWeight:900,color:accent}}>{activeMonthly}</div>
           </div>
           <div style={{background:card,border:`1px solid ${border}`,borderRadius:14,padding:18}}>
             <b>Consumo registrado</b>
             <div style={{fontSize:28,fontWeight:900}}>{registros.length}</div>
             <small style={{color:subtext}}>Receita avulsa: {money(totalConsumption)}</small>
           </div>
         </div>
       </div>
     )}
     {tab==='clientes'&&(
       <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:16}}>
         <form onSubmit={saveCustomer} style={{background:card,border:`1px solid ${border}`,borderRadius:14,padding:18}}>
           <h3>Cadastrar cliente</h3>
           {[['name','Nome'],['phone','Telefone']].map(([k,l])=><input key={k} placeholder={l} value={(customerForm as any)[k]} onChange={e=>setCustomerForm({...customerForm,[k]:e.target.value})} style={{width:'100%',padding:10,margin:'6px 0'}}/>)}
           <div style={{display:'flex',gap:8,margin:'8px 0'}}>
             <button type="button" onClick={()=>setCustomerForm({...customerForm,tipo:'mensal'})} style={{flex:1,padding:9,border:`1px solid ${customerForm.tipo==='mensal'?accent:border}`,background:customerForm.tipo==='mensal'?`${accent}22`:'transparent',color:text,borderRadius:8}}>Mensal</button>
             <button type="button" onClick={()=>setCustomerForm({...customerForm,tipo:'avulso'})} style={{flex:1,padding:9,border:`1px solid ${customerForm.tipo==='avulso'?accent:border}`,background:customerForm.tipo==='avulso'?`${accent}22`:'transparent',color:text,borderRadius:8}}>Avulso</button>
           </div>
           {customerForm.tipo==='mensal'?<>
             <input type="number" step="0.01" placeholder="Mensalidade" value={customerForm.valorMensalidade} onChange={e=>setCustomerForm({...customerForm,valorMensalidade:e.target.value})} style={{width:'100%',padding:10,margin:'6px 0'}}/>
             <input type="date" value={customerForm.inicio} onChange={e=>setCustomerForm({...customerForm,inicio:e.target.value})} style={{width:'100%',padding:10,margin:'6px 0'}}/>
             <input type="date" value={customerForm.fim} onChange={e=>setCustomerForm({...customerForm,fim:e.target.value})} style={{width:'100%',padding:10,margin:'6px 0'}}/>
           </>:<input type="number" step="0.01" placeholder="Valor por consumo" value={customerForm.valorAvulso} onChange={e=>setCustomerForm({...customerForm,valorAvulso:e.target.value})} style={{width:'100%',padding:10,margin:'6px 0'}}/>}
           <button style={{width:'100%',padding:11,marginTop:8,border:0,borderRadius:9,background:accent,color:'#fff',fontWeight:800}}>Salvar cliente</button>
         </form>
         <div style={{background:card,border:`1px solid ${border}`,borderRadius:14,padding:18}}>
           <h3>Clientes do pré-treino</h3>
           {customers.length===0?<p style={{color:subtext}}>Nenhum cliente cadastrado.</p>:customers.map((c:any)=>(
             <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${border}`}}>
               <div>
                 <b>{c.name}</b>
                 <div style={{fontSize:12,color:subtext}}>{c.phone} · {c.tipo==='mensal'?`Mensal ${money(c.valorMensalidade)} · `: `Avulso · ${money(c.valorAvulso)}`}
                   <button onClick={()=>toggleMonthly(c)} style={{marginLeft:8,background:'transparent',border:'none',color:accent,cursor:'pointer',textDecoration:'underline'}}>{c.statusMensalidade || 'Pendente'}</button>
                 </div>
               </div>
               <button onClick={()=>deleteCustomer(c.id)} style={{border:0,background:'transparent',color:'#ef4444'}}><Trash2 size={15}/></button>
             </div>
           ))}
         </div>
       </div>
     )}
     {tab==='produtos'&&(
       <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:16}}>
         <form onSubmit={saveProduct} style={{background:card,border:`1px solid ${border}`,borderRadius:14,padding:18}}>
           <h3>Cadastrar produto</h3>
           {[['name','Nome'],['cost','Custo'],['price','Preço de consumo'],['stock','Estoque']].map(([k,l])=><input key={k} type={k==='name'?'text':'number'} step="0.01" placeholder={l} value={(productForm as any)[k]} onChange={e=>setProductForm({...productForm,[k]:e.target.value})} style={{width:'100%',padding:10,margin:'6px 0'}}/>)}
           <button style={{width:'100%',padding:11,marginTop:8,border:0,borderRadius:9,background:accent,color:'#fff',fontWeight:800}}>Salvar produto</button>
         </form>
         <div style={{background:card,border:`1px solid ${border}`,borderRadius:14,padding:18}}>
           <h3>Estoque de pré-treino</h3>
           {products.map((p:any)=>(
             <div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${border}`}}>
               <span><b>{p.name}</b><small style={{display:'block',color:subtext}}>Custo {money(p.cost)} · Venda {money(p.price)}</small></span>
               <span><b>{p.stock??0}</b><button onClick={()=>deleteProduct(p.id)} style={{border:0,background:'transparent',color:'#ef4444',marginLeft:12}}><Trash2 size={15}/></button></span>
             </div>
           ))}
         </div>
       </div>
     )}
     {tab==='relatorios'&&(
       <div style={{display:'grid',gap:16}}>
         <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
           {[['Consumos',report?.summary?.totalConsumos??registros.length],['Faturamento',money(report?.summary?.faturamento??totalConsumption)],['Custo',money(report?.summary?.custo??0)],['Lucro',money(report?.summary?.lucro??0)]].map(([l,v]:any)=>(
             <div key={l} style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:16}}>
               <small style={{color:subtext}}>{l}</small>
               <div style={{fontSize:22,fontWeight:900}}>{v}</div>
             </div>
           ))}
         </div>
         <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
           <div style={{background:card,border:`1px solid ${border}`,borderRadius:14,padding:18}}>
             <h3>Clientes que mais consumiram</h3>
             {(report?.topClients||[]).map((x:any,i:number)=>(
               <div key={i} style={{padding:9,borderBottom:`1px solid ${border}`}}>
                 <b>{i+1}. {x.nome_cliente}</b><span style={{float:'right'}}>{x.consumos} consumo(s)</span>
                 <small style={{display:'block',color:subtext}}>{x.telefone_cliente}</small>
               </div>
             ))}
           </div>
           <div style={{background:card,border:`1px solid ${border}`,borderRadius:14,padding:18}}>
             <h3>Produtos mais consumidos</h3>
             {(report?.topProducts||[]).map((x:any,i:number)=>(
               <div key={i} style={{padding:9,borderBottom:`1px solid ${border}`}}>
                 <b>{i+1}. {x.nome_produto}</b><span style={{float:'right'}}>{x.consumos} consumo(s)</span>
               </div>
             ))}
           </div>
         </div>
       </div>
     )}
   </div>
 );
}