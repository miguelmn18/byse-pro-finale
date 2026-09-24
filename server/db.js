import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada. Copie .env.example para .env e configure o PostgreSQL.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: Number(process.env.DB_POOL_MAX || 20),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        vip_catalog_password_hash TEXT,
        whatsapp_api_url TEXT,
        whatsapp_api_key TEXT,
        whatsapp_provider VARCHAR(30) DEFAULT 'baileys',
        cashback_percentage NUMERIC DEFAULT 3,
        cashback_validity_days INT DEFAULT 30,
        cashback_message TEXT DEFAULT 'Oi {nome}, você tem {saldo} em cashback te esperando na nossa loja! Aproveite antes de vencer em {vencimento}. 🎁',
        reminder_days_1 INT DEFAULT 1,
        reminder_days_2 INT DEFAULT 7,
        reminder_days_3 INT DEFAULT 15,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_pdv_configs (
        user_id VARCHAR(255) PRIMARY KEY,
        pdv_config JSONB NOT NULL DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS user_app_states (
        user_id VARCHAR(255) NOT NULL,
        state_key VARCHAR(100) NOT NULL,
        state JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, state_key)
      );

      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        cpf VARCHAR(50),
        data_aniversario DATE,
        cashback NUMERIC DEFAULT 0,
        cashback_expiry DATE,
        cashback_expiration_date DATE,
        cashback_lost NUMERIC DEFAULT 0,
        status VARCHAR(100) DEFAULT 'Ativo',
        whatsapp_opt_in INT DEFAULT 0,
        reminders_enabled INT DEFAULT 1,
        status_mensalidade VARCHAR(100) DEFAULT 'Pendente (Não Pago)',
        data_vencimento DATE,
        valor_mensalidade NUMERIC DEFAULT 0,
        pre_treino_tipo VARCHAR(20) DEFAULT 'avulso',
        pre_treino_inicio DATE,
        pre_treino_fim DATE,
        pre_treino_valor_avulso NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);
      CREATE INDEX IF NOT EXISTS idx_customers_user_phone ON customers(user_id, phone);

      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        barcode VARCHAR(255),
        code VARCHAR(255),
        cost NUMERIC DEFAULT 0,
        price NUMERIC DEFAULT 0,
        imposto NUMERIC DEFAULT 0,
        frete NUMERIC DEFAULT 0,
        vip_price NUMERIC,
        vip_price_3x NUMERIC,
        description TEXT,
        control_stock BOOLEAN DEFAULT TRUE,
        image_url TEXT,
        stocks JSONB DEFAULT '{}',
        variations JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);

      CREATE TABLE IF NOT EXISTS stock_locations (
        id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        customer_id VARCHAR(255),
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        seller VARCHAR(255),
        payment_method VARCHAR(100),
        discount NUMERIC DEFAULT 0,
        subtotal NUMERIC DEFAULT 0,
        total NUMERIC DEFAULT 0,
        cashback_earned NUMERIC DEFAULT 0,
        earned_cashback NUMERIC DEFAULT 0,
        gender VARCHAR(50),
        sales_channel VARCHAR(100),
        delivery_type VARCHAR(100),
        items JSONB DEFAULT '[]',
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_sales_user_date ON sales(user_id, date);

      CREATE TABLE IF NOT EXISTS sellers (
        id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        commission_pct NUMERIC DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS fiados (
        id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        customer_id VARCHAR(255),
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        products TEXT,
        origin VARCHAR(50) DEFAULT 'manual',
        installments JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS pre_treino_produtos (
        id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        cost NUMERIC DEFAULT 0,
        price NUMERIC DEFAULT 0,
        stock NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS pre_treino_clientes (
        id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        tipo VARCHAR(20) DEFAULT 'mensal',
        valor_mensalidade NUMERIC DEFAULT 0,
        data_inicio DATE,
        data_fim DATE,
        valor_avulso NUMERIC DEFAULT 0,
        status_mensalidade VARCHAR(100) DEFAULT 'Pendente (Não Pago)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_pre_treino_clientes_user ON pre_treino_clientes(user_id);

      CREATE TABLE IF NOT EXISTS pre_treino_registros (
        id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        customer_id VARCHAR(255),
        nome_cliente VARCHAR(255),
        telefone_cliente VARCHAR(50),
        produto_id VARCHAR(255),
        nome_produto VARCHAR(255),
        custo NUMERIC DEFAULT 0,
        valor NUMERIC DEFAULT 0,
        tipo_consumo VARCHAR(20) DEFAULT 'avulso',
        data VARCHAR(50),
        horario VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_pre_treino_user_date ON pre_treino_registros(user_id, data);

      CREATE TABLE IF NOT EXISTS user_whatsapp_schedules (
        user_id VARCHAR(255) PRIMARY KEY,
        schedules JSONB NOT NULL DEFAULT '[]',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Banco PostgreSQL inicializado com sucesso e isolamento por user_id.');
  } catch (error) {
    console.error('[DB INIT ERROR] Erro ao criar ou atualizar tabelas no banco de dados:', error);
    throw error;
  }
}