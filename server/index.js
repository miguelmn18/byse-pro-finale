import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { pool, initDb } from './db.js';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3333);
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET deve existir e ter pelo menos 32 caracteres.');
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({ origin: true, credentials: true }));

const sessions = new Map();
const authRoot = path.resolve(__dirname, '../whatsapp-sessions');
fs.mkdirSync(authRoot, { recursive: true });

const json = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

const normalizeCustomer = (c) => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  cpf: c.cpf || '',
  birthDate: c.data_aniversario || '',
  cashback: Number(c.cashback || 0),
  cashbackExpirationDate: c.cashback_expiration_date || c.cashback_expiry || null,
  cashbackLost: Number(c.cashback_lost || 0),
  status: c.status || 'Ativo',
  whatsappOptIn: Boolean(c.whatsapp_opt_in),
  remindersEnabled: c.reminders_enabled !== 0,
  statusMensalidade: c.status_mensalidade || 'Pendente (Não Pago)',
  status_mensalidade: c.status_mensalidade || 'Pendente (Não Pago)',
  dataVencimento: c.data_vencimento || '',
  data_vencimento: c.data_vencimento || '',
  valorMensalidade: Number(c.valor_mensalidade || 0),
  valor_mensalidade: Number(c.valor_mensalidade || 0),
  preTreinoTipo: c.pre_treino_tipo || 'avulso',
  preTreinoInicio: c.pre_treino_inicio || '',
  preTreinoFim: c.pre_treino_fim || '',
  preTreinoValorAvulso: Number(c.pre_treino_valor_avulso || 0),
});

const normalizeProduct = (p) => ({
  ...p,
  cost: Number(p.cost || 0), price: Number(p.price || 0),
  imposto: Number(p.imposto || 0), frete: Number(p.frete || 0),
  controlStock: p.control_stock, control_stock: p.control_stock,
  vipPrice: p.vip_price == null ? null : Number(p.vip_price),
  vip_price: p.vip_price == null ? null : Number(p.vip_price),
  vipPrice3x: p.vip_price_3x == null ? null : Number(p.vip_price_3x),
  vip_price_3x: p.vip_price_3x == null ? null : Number(p.vip_price_3x),
  imageUrl: p.image_url || null,
  image_url: p.image_url || null,
  stocks: json(p.stocks, {})
});

const signToken = (user) => jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d', issuer: 'byse-pro' });

function authMiddleware(req, res, next) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Usuário não autenticado.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET, { issuer: 'byse-pro' });
    req.user = { id: String(payload.sub), email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada ou token inválido.' });
  }
}

async function userExists(userId) {
  const r = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  return r.rows.length > 0;
}

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, service: 'byse-pro-api' }); }
  catch { res.status(503).json({ ok: false }); }
});

app.post('/api/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !email.includes('@') || password.length < 6) return res.status(400).json({ error: 'Informe nome, e-mail válido e senha com pelo menos 6 caracteres.' });
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 12);
    await pool.query('INSERT INTO users (id,name,email,password) VALUES ($1,$2,$3,$4)', [id, name, email, hash]);
    const user = { id, name, email };
    res.status(201).json({ token: signToken(user), user });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao criar usuário.' }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    const r = await pool.query('SELECT id,name,email,password FROM users WHERE email = $1', [email]);
    if (!r.rows.length) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    const valid = await bcrypt.compare(password, r.rows[0].password);
    if (!valid) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    const user = { id: r.rows[0].id, name: r.rows[0].name, email: r.rows[0].email };
    res.json({ token: signToken(user), user });
  } catch (e) { console.error('[LOGIN]', e); res.status(500).json({ error: 'Erro interno no servidor.' }); }
});

app.get('/api/me', authMiddleware, async (req, res) => {
  const r = await pool.query('SELECT id,name,email FROM users WHERE id = $1', [req.user.id]);
  if (!r.rows.length) return res.status(401).json({ error: 'Usuário não encontrado.' });
  res.json(r.rows[0]);
});

// ---------- Generic per-user state ----------
app.get('/api/app-state/:key', authMiddleware, async (req, res) => {
  const r = await pool.query('SELECT state FROM user_app_states WHERE user_id=$1 AND state_key=$2', [req.user.id, req.params.key]);
  res.json(r.rows[0] ? json(r.rows[0].state, {}) : {});
});
app.put('/api/app-state/:key', authMiddleware, async (req, res) => {
  await pool.query(`INSERT INTO user_app_states(user_id,state_key,state,updated_at) VALUES($1,$2,$3,NOW()) ON CONFLICT(user_id,state_key) DO UPDATE SET state=EXCLUDED.state,updated_at=NOW()`, [req.user.id, req.params.key, JSON.stringify(req.body ?? {})]);
  res.json({ success: true });
});

// ---------- Public catalog + VIP ----------
app.get('/api/public/catalogo/:userId', async (req, res) => {
  const userId = String(req.params.userId);
  if (!(await userExists(userId))) return res.status(404).json({ error: 'Loja não encontrada.' });
  const u = await pool.query('SELECT id,name FROM users WHERE id=$1', [userId]);
  const products = await pool.query(`SELECT * FROM products WHERE user_id=$1 AND (control_stock=false OR COALESCE((SELECT SUM((value)::numeric) FROM jsonb_each_text(stocks)),0)>0 OR stocks='{}'::jsonb) ORDER BY name`, [userId]);
  const state = await pool.query('SELECT state FROM user_app_states WHERE user_id=$1 AND state_key=$2', [userId, 'catalogo']);
  const cfg = json(state.rows[0]?.state, {});
  res.json({ storeName: u.rows[0].name, whatsapp: cfg.whatsapp || '', address: cfg.address || '', instagram: cfg.instagram || '', bannerUrl: cfg.bannerUrl || '', products: products.rows.map(normalizeProduct), vipEnabled: Boolean((await pool.query('SELECT vip_catalog_password_hash FROM users WHERE id=$1',[userId])).rows[0]?.vip_catalog_password_hash) });
});

app.post('/api/public/catalogo/:userId/vip/verify', async (req, res) => {
  const userId = String(req.params.userId);
  const password = String(req.body.password || '');
  const r = await pool.query('SELECT vip_catalog_password_hash FROM users WHERE id=$1', [userId]);
  if (!r.rows.length || !r.rows[0].vip_catalog_password_hash) return res.status(404).json({ error: 'Acesso VIP não configurado.' });
  const ok = await bcrypt.compare(password, r.rows[0].vip_catalog_password_hash);
  if (!ok) return res.status(401).json({ error: 'Senha VIP inválida.' });
  res.json({ success: true, accessToken: jwt.sign({ sub: userId, scope: 'catalog-vip' }, JWT_SECRET, { expiresIn: '12h', issuer: 'byse-pro-catalog' }) });
});

app.get('/api/catalogo/config', authMiddleware, async (req,res)=>{
  const r=await pool.query('SELECT vip_catalog_password_hash FROM users WHERE id=$1',[req.user.id]);
  const state=await pool.query('SELECT state FROM user_app_states WHERE user_id=$1 AND state_key=$2',[req.user.id,'catalogo']);
  const cfg=json(state.rows[0]?.state,{});
  res.json({ ...cfg, vipConfigured:Boolean(r.rows[0]?.vip_catalog_password_hash), publicUrl:`${FRONTEND_URL.replace(/\/$/,'')}/catalogo/${req.user.id}` });
});
app.put('/api/catalogo/config', authMiddleware, async (req,res)=>{
  const { vipPassword, ...cfg }=req.body || {};
  await pool.query(`INSERT INTO user_app_states(user_id,state_key,state,updated_at) VALUES($1,'catalogo',$2,NOW()) ON CONFLICT(user_id,state_key) DO UPDATE SET state=EXCLUDED.state,updated_at=NOW()`,[req.user.id,JSON.stringify(cfg)]);
  if (vipPassword !== undefined) {
    if (!String(vipPassword).trim()) await pool.query('UPDATE users SET vip_catalog_password_hash=NULL WHERE id=$1',[req.user.id]);
    else await pool.query('UPDATE users SET vip_catalog_password_hash=$1 WHERE id=$2',[await bcrypt.hash(String(vipPassword),12),req.user.id]);
  }
  res.json({success:true, publicUrl:`${FRONTEND_URL.replace(/\/$/,'')}/catalogo/${req.user.id}`});
});

// ---------- Customers ----------
async function getCustomers(req,res){
  try { const r=await pool.query('SELECT * FROM customers WHERE user_id=$1 ORDER BY created_at DESC',[req.user.id]); res.json(r.rows.map(normalizeCustomer)); }
  catch(e){ console.error(e); res.status(500).json({error:'Erro ao buscar clientes.'}); }
}
async function saveCustomer(req,res){
  try {
    const c=req.body||{}, id=c.id||`cli_${crypto.randomUUID()}`;
    const name=String(c.name||c.nome||'').trim(), phone=String(c.phone||c.telefone||'').trim();
    if(!name||!phone) return res.status(400).json({error:'Nome e telefone são obrigatórios.'});
    await pool.query(`INSERT INTO customers(id,user_id,name,phone,cpf,data_aniversario,cashback,cashback_expiration_date,cashback_expiry,cashback_lost,status,whatsapp_opt_in,reminders_enabled,status_mensalidade,data_vencimento,valor_mensalidade,pre_treino_tipo,pre_treino_inicio,pre_treino_fim,pre_treino_valor_avulso) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) ON CONFLICT(id,user_id) DO UPDATE SET name=$3,phone=$4,cpf=$5,data_aniversario=$6,cashback=$7,cashback_expiration_date=$8,cashback_expiry=$8,cashback_lost=$9,status=$10,whatsapp_opt_in=$11,reminders_enabled=$12,status_mensalidade=$13,data_vencimento=$14,valor_mensalidade=$15,pre_treino_tipo=$16,pre_treino_inicio=$17,pre_treino_fim=$18,pre_treino_valor_avulso=$19`,[
      id,req.user.id,name,phone,c.cpf||null,c.birthDate||c.data_aniversario||null,Number(c.cashback||0),c.cashbackExpirationDate||c.cashback_expiration_date||c.cashback_expiry||null,Number(c.cashbackLost||c.cashback_lost||0),c.status||'Ativo',c.whatsappOptIn?1:Number(c.whatsapp_opt_in||0),c.remindersEnabled===false?0:1,c.statusMensalidade||c.status_mensalidade||'Pendente (Não Pago)',c.dataVencimento||c.data_vencimento||null,Number(c.valorMensalidade??c.valor_mensalidade??0),c.preTreinoTipo||c.pre_treino_tipo||'avulso',c.preTreinoInicio||c.pre_treino_inicio||null,c.preTreinoFim||c.pre_treino_fim||c.dataVencimento||c.data_vencimento||null,Number(c.preTreinoValorAvulso??c.pre_treino_valor_avulso??0)
    ]);
    const r=await pool.query('SELECT * FROM customers WHERE id=$1 AND user_id=$2',[id,req.user.id]); res.status(201).json(normalizeCustomer(r.rows[0]));
  } catch(e){console.error('[CUSTOMER]',e);res.status(500).json({error:'Erro ao salvar cliente.'});}
}
app.get('/api/customers',authMiddleware,getCustomers); app.get('/api/clientes',authMiddleware,getCustomers);
app.post('/api/customers',authMiddleware,saveCustomer); app.post('/api/clientes',authMiddleware,saveCustomer);
app.delete('/api/customers/:id',authMiddleware,async(req,res)=>{await pool.query('DELETE FROM customers WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.json({success:true});});
app.delete('/api/clientes/:id',authMiddleware,async(req,res)=>{await pool.query('DELETE FROM customers WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.json({success:true});});

// ---------- Products / stock ----------
async function getProducts(req,res){ const r=await pool.query('SELECT * FROM products WHERE user_id=$1 ORDER BY created_at DESC',[req.user.id]); res.json(r.rows.map(normalizeProduct)); }
async function saveProduct(req,res){
  try { const p=req.body||{}, id=p.id||`prod_${crypto.randomUUID()}`; await pool.query(`INSERT INTO products(id,user_id,name,category,barcode,code,cost,price,imposto,frete,vip_price,vip_price_3x,description,control_stock,image_url,stocks) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT(id,user_id) DO UPDATE SET name=$3,category=$4,barcode=$5,code=$6,cost=$7,price=$8,imposto=$9,frete=$10,vip_price=$11,vip_price_3x=$12,description=$13,control_stock=$14,image_url=$15,stocks=$16`,[id,req.user.id,p.name||'Produto',p.category||'Sem categoria',p.barcode||null,p.code||null,Number(p.cost||0),Number(p.price||0),Number(p.imposto||0),Number(p.frete||0),p.vipPrice??p.vip_price??null,p.vipPrice3x??p.vip_price_3x??null,p.description||null,p.controlStock??p.control_stock??true,p.imageUrl??p.image_url??null,JSON.stringify(p.stocks||{})]); const r=await pool.query('SELECT * FROM products WHERE id=$1 AND user_id=$2',[id,req.user.id]);res.status(201).json(normalizeProduct(r.rows[0])); } catch(e){console.error(e);res.status(500).json({error:'Erro ao salvar produto.'});}
}
app.get('/api/products',authMiddleware,getProducts); app.get('/api/produtos',authMiddleware,getProducts);
app.post('/api/products',authMiddleware,saveProduct); app.post('/api/produtos',authMiddleware,saveProduct);
app.put('/api/products/:id',authMiddleware,saveProduct); app.put('/api/produtos/:id',authMiddleware,saveProduct);
app.delete('/api/products/:id',authMiddleware,async(req,res)=>{await pool.query('DELETE FROM products WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.json({success:true});});
app.delete('/api/produtos/:id',authMiddleware,async(req,res)=>{await pool.query('DELETE FROM products WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.json({success:true});});

app.get('/api/locais',authMiddleware,async(req,res)=>{let r=await pool.query('SELECT id,name FROM stock_locations WHERE user_id=$1 ORDER BY name',[req.user.id]); if(!r.rows.length){const id=`loc_${req.user.id}`;await pool.query('INSERT INTO stock_locations(id,user_id,name) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[id,req.user.id,'Loja Física']);r=await pool.query('SELECT id,name FROM stock_locations WHERE user_id=$1',[req.user.id]);}res.json(r.rows);});
app.post('/api/locais',authMiddleware,async(req,res)=>{const {id,name}=req.body||{};if(!name)return res.status(400).json({error:'Nome obrigatório.'});if(id)await pool.query('UPDATE stock_locations SET name=$1 WHERE id=$2 AND user_id=$3',[name,id,req.user.id]);else await pool.query('INSERT INTO stock_locations(id,user_id,name) VALUES($1,$2,$3)',[`loc_${crypto.randomUUID()}`,req.user.id,name]);const r=await pool.query('SELECT id,name FROM stock_locations WHERE user_id=$1 ORDER BY name',[req.user.id]);res.json(r.rows);});

// ---------- Sales with transaction and stock isolation ----------
app.get('/api/sales',authMiddleware,async(req,res)=>{const r=await pool.query('SELECT * FROM sales WHERE user_id=$1 ORDER BY date DESC',[req.user.id]);res.json(r.rows.map(s=>({...s,customerId:s.customer_id,customerName:s.customer_name,customerPhone:s.customer_phone,total:Number(s.total||0),subtotal:Number(s.subtotal||0),discount:Number(s.discount||0),cashbackEarned:Number(s.cashback_earned||s.earned_cashback||0),items:json(s.items,[])})));});
app.post('/api/sales',authMiddleware,async(req,res)=>{
  const client=await pool.connect();
  try { await client.query('BEGIN'); const s=req.body||{}, id=s.id||`sale_${crypto.randomUUID()}`; const customerId=s.customerId||s.customer_id||null; let customerPhone=s.customerPhone||s.customer_phone||null; let customerName=s.customerName||s.customer_name||'Cliente Geral';
    if(customerId){const cr=await client.query('SELECT name,phone FROM customers WHERE id=$1 AND user_id=$2',[customerId,req.user.id]);if(cr.rows[0]){customerName=cr.rows[0].name;customerPhone=cr.rows[0].phone;}}
    const items=Array.isArray(s.items)?s.items:[]; const subtotal=Number(s.subtotal??s.total??0); const total=Number(s.total??0); const cashback=Number(s.cashbackEarned??s.earned_cashback??0);
    await client.query(`INSERT INTO sales(id,user_id,customer_id,customer_name,customer_phone,seller,payment_method,discount,subtotal,total,cashback_earned,earned_cashback,gender,sales_channel,delivery_type,items,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11,$12,$13,$14,$15,$16) ON CONFLICT(id,user_id) DO UPDATE SET customer_id=$3,customer_name=$4,customer_phone=$5,seller=$6,payment_method=$7,discount=$8,subtotal=$9,total=$10,cashback_earned=$11,earned_cashback=$11,gender=$12,sales_channel=$13,delivery_type=$14,items=$15,date=$16`,[id,req.user.id,customerId,customerName,customerPhone,s.seller||null,s.paymentMethod||s.payment_method||'Pix',Number(s.discount||0),subtotal,total,cashback,s.gender||'Prefiro não informar',s.salesChannel||s.sales_channel||'Loja física',s.deliveryType||s.delivery_type||'Retirada',JSON.stringify(items),s.date||new Date().toISOString()]);
    if(customerId && cashback>0) await client.query('UPDATE customers SET cashback=COALESCE(cashback,0)+$1 WHERE id=$2 AND user_id=$3',[cashback,customerId,req.user.id]);
    for(const item of items){const pid=item.productId||item.id||item.product_id;const qty=Number(item.quantity||item.qty||1);if(!pid||qty<=0)continue;const pr=await client.query('SELECT id,stocks,control_stock FROM products WHERE id=$1 AND user_id=$2 FOR UPDATE',[pid,req.user.id]);if(!pr.rows[0]||!pr.rows[0].control_stock)continue;const stocks=json(pr.rows[0].stocks,{});const loc=item.stockLocation||item.stock_location||Object.keys(stocks)[0];if(loc){stocks[loc]=Math.max(0,Number(stocks[loc]||0)-qty);await client.query('UPDATE products SET stocks=$1 WHERE id=$2 AND user_id=$3',[JSON.stringify(stocks),pid,req.user.id]);}}
    await client.query('COMMIT');res.status(201).json({success:true,saleId:id,customerPhone,earnedCashback:cashback});
  } catch(e){await client.query('ROLLBACK');console.error('[SALE]',e);res.status(500).json({error:'Erro ao registrar venda.'});}finally{client.release();}
});

// ---------- Sellers / Fiados ----------
app.get('/api/sellers',authMiddleware,async(req,res)=>{const r=await pool.query('SELECT id,name,commission_pct FROM sellers WHERE user_id=$1 ORDER BY created_at',[req.user.id]);res.json(r.rows.map(s=>({id:s.id,name:s.name,commissionPct:Number(s.commission_pct||0)})));});
app.get('/api/vendedores',authMiddleware,async(req,res)=>{const r=await pool.query('SELECT id,name,commission_pct FROM sellers WHERE user_id=$1 ORDER BY created_at',[req.user.id]);res.json(r.rows.map(s=>({id:s.id,name:s.name,commissionPct:Number(s.commission_pct||0)})));});
app.post('/api/sellers',authMiddleware,async(req,res)=>{const s=req.body||{},id=s.id||`sel_${crypto.randomUUID()}`;await pool.query(`INSERT INTO sellers(id,user_id,name,commission_pct) VALUES($1,$2,$3,$4) ON CONFLICT(id,user_id) DO UPDATE SET name=$3,commission_pct=$4`,[id,req.user.id,s.name||'Vendedor',Number(s.commissionPct||s.commission_pct||5)]);res.status(201).json({success:true,id});});
app.post('/api/vendedores',authMiddleware,async(req,res)=>{const x=req.body||{},id=x.id||`sel_${crypto.randomUUID()}`;await pool.query(`INSERT INTO sellers(id,user_id,name,commission_pct) VALUES($1,$2,$3,$4) ON CONFLICT(id,user_id) DO UPDATE SET name=$3,commission_pct=$4`,[id,req.user.id,x.name||'Vendedor',Number(x.commissionPct||x.commission_pct||5)]);res.status(201).json({success:true,id});});
app.delete('/api/sellers/:id',authMiddleware,async(req,res)=>{await pool.query('DELETE FROM sellers WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.json({success:true});});
app.delete('/api/vendedores/:id',authMiddleware,async(req,res)=>{await pool.query('DELETE FROM sellers WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.json({success:true});});
app.get('/api/fiados',authMiddleware,async(req,res)=>{const r=await pool.query('SELECT * FROM fiados WHERE user_id=$1 ORDER BY created_at DESC',[req.user.id]);res.json(r.rows.map(f=>({...f,id:f.id,customerId:f.customer_id,customerName:f.customer_name,customerPhone:f.customer_phone,installments:json(f.installments,[]),date:f.created_at})));});
app.post('/api/fiados',authMiddleware,async(req,res)=>{const f=req.body||{},id=f.id||`fiado_${crypto.randomUUID()}`;let phone=f.customerPhone||f.customer_phone||null;if(f.customerId||f.customer_id){const c=await pool.query('SELECT phone FROM customers WHERE id=$1 AND user_id=$2',[f.customerId||f.customer_id,req.user.id]);phone=c.rows[0]?.phone||phone;}await pool.query(`INSERT INTO fiados(id,user_id,customer_id,customer_name,customer_phone,products,origin,installments) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id,user_id) DO UPDATE SET customer_id=$3,customer_name=$4,customer_phone=$5,products=$6,origin=$7,installments=$8`,[id,req.user.id,f.customerId||f.customer_id||null,f.customerName||f.customer_name||'Cliente',phone,typeof f.products==='string'?f.products:JSON.stringify(f.products||[]),f.origin||'manual',JSON.stringify(f.installments||[])]);res.status(201).json({success:true,id});});
app.delete('/api/fiados/:id',authMiddleware,async(req,res)=>{await pool.query('DELETE FROM fiados WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.json({success:true});});

// ---------- PDV / cashback ----------
const defaultPdv={messageTemplate:'Olá {nome}, você realizou uma compra e ganhou R$ {cashback} de cashback!',reminderDays1:1,reminderDays2:7,reminderDays3:15,cashbackPercentage:3,cashbackValidityDays:30,activeReminderButton:false};
app.get('/api/pdv/config',authMiddleware,async(req,res)=>{const r=await pool.query('SELECT pdv_config FROM user_pdv_configs WHERE user_id=$1',[req.user.id]);res.json({...defaultPdv,...json(r.rows[0]?.pdv_config,{})});});
app.post('/api/pdv/config',authMiddleware,async(req,res)=>{await pool.query(`INSERT INTO user_pdv_configs(user_id,pdv_config) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET pdv_config=$2`,[req.user.id,JSON.stringify(req.body||{})]);res.json({success:true});});
app.get('/api/cashback-config',authMiddleware,async(req,res)=>{const r=await pool.query('SELECT pdv_config FROM user_pdv_configs WHERE user_id=$1',[req.user.id]);const c={...defaultPdv,...json(r.rows[0]?.pdv_config,{})};res.json({cashbackPercentage:c.cashbackPercentage,cashbackValidityDays:c.cashbackValidityDays,cashbackMessage:c.cashbackMessage||c.messageTemplate});});
app.put('/api/cashback-config',authMiddleware,async(req,res)=>{const r=await pool.query('SELECT pdv_config FROM user_pdv_configs WHERE user_id=$1',[req.user.id]);const c={...json(r.rows[0]?.pdv_config,{}),...req.body};await pool.query(`INSERT INTO user_pdv_configs(user_id,pdv_config) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET pdv_config=$2`,[req.user.id,JSON.stringify(c)]);res.json({success:true});});

// ---------- Pre-treino ----------
app.get('/api/pre-treino/products',authMiddleware,async(req,res)=>{const r=await pool.query('SELECT id,name,cost,price,stock FROM pre_treino_produtos WHERE user_id=$1 ORDER BY created_at DESC',[req.user.id]);res.json(r.rows.map(p=>({id:p.id,name:p.name,nome:p.name,cost:Number(p.cost||0),custo:Number(p.cost||0),price:Number(p.price||0),stock:Number(p.stock||0)})));});
app.post('/api/pre-treino/products',authMiddleware,async(req,res)=>{const p=req.body||{},id=p.id||`ptp_${crypto.randomUUID()}`;await pool.query(`INSERT INTO pre_treino_produtos(id,user_id,name,cost,price,stock) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id,user_id) DO UPDATE SET name=$3,cost=$4,price=$5,stock=$6`,[id,req.user.id,p.name||p.nome||'Produto',Number(p.cost??p.custo??0),Number(p.price??p.preco??0),Number(p.stock??p.estoque??0)]);const r=await pool.query('SELECT id,name,cost,price,stock FROM pre_treino_produtos WHERE id=$1 AND user_id=$2',[id,req.user.id]);res.status(201).json({...r.rows[0],cost:Number(r.rows[0].cost||0),price:Number(r.rows[0].price||0),stock:Number(r.rows[0].stock||0)});});
app.delete('/api/pre-treino/products/:id',authMiddleware,async(req,res)=>{await pool.query('DELETE FROM pre_treino_produtos WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.json({success:true});});
app.get('/api/pre-treino/records',authMiddleware,async(req,res)=>{const r=await pool.query('SELECT * FROM pre_treino_registros WHERE user_id=$1 ORDER BY created_at DESC',[req.user.id]);res.json(r.rows.map(x=>({id:x.id,customerId:x.customer_id,customerName:x.nome_cliente,customerPhone:x.telefone_cliente,productId:x.produto_id,productName:x.nome_produto,cost:Number(x.custo||0),value:Number(x.valor||0),type:x.tipo_consumo||'avulso',date:x.data,time:x.horario,createdAt:x.created_at})));});
app.post('/api/pre-treino/records',authMiddleware,async(req,res)=>{const r=req.body||{},id=r.id||`ptr_${crypto.randomUUID()}`;let customerName=r.customerName||r.nomeCliente||r.nome_cliente||'Cliente avulso',phone=r.customerPhone||r.telefoneCliente||r.telefone_cliente||null;const cid=r.customerId||r.customer_id||null;if(cid){const c=await pool.query('SELECT name,phone FROM customers WHERE id=$1 AND user_id=$2',[cid,req.user.id]);if(c.rows[0]){customerName=c.rows[0].name;phone=c.rows[0].phone;}}
  await pool.query(`INSERT INTO pre_treino_registros(id,user_id,customer_id,nome_cliente,telefone_cliente,produto_id,nome_produto,custo,valor,tipo_consumo,data,horario) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id,user_id) DO UPDATE SET customer_id=$3,nome_cliente=$4,telefone_cliente=$5,produto_id=$6,nome_produto=$7,custo=$8,valor=$9,tipo_consumo=$10,data=$11,horario=$12`,[id,req.user.id,cid,customerName,phone,r.productId||r.produto_id||null,r.productName||r.nomeProduto||r.nome_produto||'',Number(r.cost??r.custo??0),Number(r.value??r.valor??0),r.type||r.tipo_consumo||'avulso',r.date||r.data||new Date().toISOString().slice(0,10),r.time||r.horario||new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})]);if(r.productId||r.produto_id) await pool.query('UPDATE pre_treino_produtos SET stock=GREATEST(0,COALESCE(stock,0)-1) WHERE id=$1 AND user_id=$2 AND COALESCE(stock,0)>0',[r.productId||r.produto_id,req.user.id]);res.status(201).json({success:true,id});});
app.delete('/api/pre-treino/records/:id',authMiddleware,async(req,res)=>{await pool.query('DELETE FROM pre_treino_registros WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.json({success:true});});
app.get('/api/pre-treino/reports',authMiddleware,async(req,res)=>{const base=await pool.query('SELECT COUNT(*)::int AS total_consumos,COALESCE(SUM(valor),0) AS faturamento,COALESCE(SUM(custo),0) AS custo FROM pre_treino_registros WHERE user_id=$1',[req.user.id]);const clients=await pool.query(`SELECT nome_cliente,telefone_cliente,COUNT(*)::int AS consumos,COALESCE(SUM(valor),0) AS valor FROM pre_treino_registros WHERE user_id=$1 GROUP BY nome_cliente,telefone_cliente ORDER BY consumos DESC,valor DESC LIMIT 20`,[req.user.id]);const products=await pool.query(`SELECT produto_id,nome_produto,COUNT(*)::int AS consumos,COALESCE(SUM(valor),0) AS valor FROM pre_treino_registros WHERE user_id=$1 GROUP BY produto_id,nome_produto ORDER BY consumos DESC,valor DESC LIMIT 20`,[req.user.id]);res.json({summary:{totalConsumos:base.rows[0].total_consumos,faturamento:Number(base.rows[0].faturamento||0),custo:Number(base.rows[0].custo||0),lucro:Number(base.rows[0].faturamento||0)-Number(base.rows[0].custo||0)},topClients:clients.rows,topProducts:products.rows});});

// ---------- WhatsApp per-user Baileys sessions ----------
async function createWhatsAppSession(userId){
  if(sessions.has(userId)) return sessions.get(userId);
  const dir=path.join(authRoot,crypto.createHash('sha256').update(userId).digest('hex'));
  fs.mkdirSync(dir,{recursive:true});
  const {state,saveCreds}=await useMultiFileAuthState(dir);
  const sock=makeWASocket({auth:state,printQRInTerminal:false,browser:['BYSE PRO','Chrome','1.0']});
  const session={sock,status:'connecting',qr:null,phone:null}; sessions.set(userId,session);
  sock.ev.on('creds.update',saveCreds);
  sock.ev.on('connection.update',async({connection,lastDisconnect,qr})=>{
    if(qr){session.status='qr_needed';session.qr=await QRCode.toDataURL(qr,{margin:2,scale:6});}
    if(connection==='open'){session.status='connected';session.qr=null;session.phone=sock.user?.id||null;}
    if(connection==='close'){
      const code=lastDisconnect?.error?.output?.statusCode;
      session.status='disconnected';session.qr=null;
      if(code!==DisconnectReason.loggedOut){sessions.delete(userId);setTimeout(()=>createWhatsAppSession(userId).catch(console.error),3000);}
    }
  });
  return session;
}
app.get('/api/whatsapp/status',authMiddleware,async(req,res)=>{const s=await createWhatsAppSession(req.user.id);res.json({status:s.status,qr:s.qr,phone:s.phone});});
app.get('/api/whatsapp/qr',authMiddleware,async(req,res)=>{const s=await createWhatsAppSession(req.user.id);if(s.status==='connected')return res.status(409).json({error:'WhatsApp já está conectado.'});res.json({success:Boolean(s.qr),qr:s.qr,message:s.qr?'QR pronto.':'QR ainda não foi gerado; aguarde alguns segundos.'});});
app.post('/api/whatsapp/reset',authMiddleware,async(req,res)=>{const uid=req.user.id,s=sessions.get(uid);try{if(s?.sock)await s.sock.logout().catch(()=>{});sessions.delete(uid);const dir=path.join(authRoot,crypto.createHash('sha256').update(uid).digest('hex'));fs.rmSync(dir,{recursive:true,force:true});await createWhatsAppSession(uid);res.json({success:true});}catch(e){console.error(e);res.status(500).json({error:'Não foi possível reiniciar a sessão.'});}});
app.get('/api/whatsapp',authMiddleware,async(req,res)=>{const r=await pool.query('SELECT schedules FROM user_whatsapp_schedules WHERE user_id=$1',[req.user.id]);res.json(json(r.rows[0]?.schedules,[]));});
app.post('/api/whatsapp',authMiddleware,async(req,res)=>{const schedules=Array.isArray(req.body)?req.body:[];await pool.query(`INSERT INTO user_whatsapp_schedules(user_id,schedules,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(user_id) DO UPDATE SET schedules=$2,updated_at=NOW()`,[req.user.id,JSON.stringify(schedules)]);res.json({success:true});});
app.post('/api/whatsapp/send-batch',authMiddleware,async(req,res)=>{const s=await createWhatsAppSession(req.user.id);if(s.status!=='connected')return res.status(409).json({error:'Conecte o WhatsApp deste usuário antes de enviar mensagens.'});const q=req.body||{};let sql='SELECT id,name,phone,cashback FROM customers WHERE user_id=$1 AND phone<>\'\' AND whatsapp_opt_in=1 AND reminders_enabled=1';const params=[req.user.id];if(!q.sendToAll&&Array.isArray(q.customerIds)&&q.customerIds.length){sql+=' AND id=ANY($2)';params.push(q.customerIds);}const customers=await pool.query(sql,params);let sent=0;for(const c of customers.rows){const phone=String(c.phone).replace(/\D/g,'');if(!phone)continue;const msg=String(q.text||'').replaceAll('{nome}',c.name||'Cliente').replaceAll('{saldo}',`R$ ${Number(c.cashback||0).toFixed(2)}`);try{await s.sock.sendMessage(`${phone.startsWith('55')?phone:'55'+phone}@s.whatsapp.net`,{text:msg});sent++;await new Promise(r=>setTimeout(r,1500));}catch(e){console.error('[WA SEND]',e.message);}}res.json({success:true,message:`${sent} mensagem(ns) enviada(s).`,sent});});

// ---------- Scheduler: each schedule belongs to user, sends only on that user's session ----------
cron.schedule('* * * * *',async()=>{
  try{
    const rows=await pool.query('SELECT user_id,schedules FROM user_whatsapp_schedules');
    const now=new Date();const day=['domingo','segunda','terça','quarta','quinta','sexta','sábado'][now.getDay()];const time=now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Sao_Paulo'});
    for(const row of rows.rows){for(const sch of json(row.schedules,[])){if(!sch.enabled||sch.time!==time||!Array.isArray(sch.days)||!sch.days.includes(day))continue;const s=sessions.get(row.user_id);if(!s||s.status!=='connected')continue;let sql='SELECT name,phone,cashback FROM customers WHERE user_id=$1 AND phone<>\'\' AND whatsapp_opt_in=1 AND reminders_enabled=1';const params=[row.user_id];if(!sch.sendToAll&&Array.isArray(sch.customerIds)&&sch.customerIds.length){sql+=' AND id=ANY($2)';params.push(sch.customerIds);}const cs=await pool.query(sql,params);for(const c of cs.rows){const phone=String(c.phone).replace(/\D/g,'');if(!phone)continue;const msg=String(sch.text||'').replaceAll('{nome}',c.name||'Cliente').replaceAll('{saldo}',`R$ ${Number(c.cashback||0).toFixed(2)}`);await s.sock.sendMessage(`${phone.startsWith('55')?phone:'55'+phone}@s.whatsapp.net`,{text:msg}).catch(e=>console.error(e.message));await new Promise(r=>setTimeout(r,1200));}}}
  }catch(e){console.error('[WA CRON]',e);}
},{timezone:'America/Sao_Paulo'});

await initDb();
const httpServer = app.listen(PORT,()=>console.log(`BYSE PRO API em http://localhost:${PORT} | frontend esperado: ${FRONTEND_URL}`));
const shutdown = async (signal) => { console.log(`Encerrando servidor (${signal})...`); for (const [uid, session] of sessions) { try { session.sock.end(undefined); } catch {} sessions.delete(uid); } httpServer.close(async () => { await pool.end(); process.exit(0); }); };
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
