// @ts-nocheck

import React, {
  useEffect,
  useState,
} from "react";

import {
  Mail,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  DANGER,
  FONT_BODY,
  FONT_DISPLAY,
  FONT_PREMIUM,
  GLOBAL_CSS,
  SUCCESS,
  MONTH_NAMES,
  WEEKDAY_LABELS,
  WEEKDAY_SHORT,
} from "../data/constants";

import {
  getMonthGrid,
  formatDateShort,
  formatDateBadge,
  formatDateLong,
  sameOrBefore,
} from "../utils/helpers";

/* =========================================================
   VIP WELCOME
========================================================= */

function VipWelcome({
  accent,
  device,
  welcome,
  onDone,
}) {
  const [phase, setPhase] = useState(0);

  const w = welcome || {};

  const isVideo =
    w.mode === "video" &&
    w.videoUrl;

  const big = device === "desktop";

  useEffect(() => {
    if (isVideo) {
      const t = setTimeout(
        onDone,
        9000
      );

      return () =>
        clearTimeout(t);
    }

    const t1 = setTimeout(() => {
      setPhase(1);
    }, 1400);

    const t2 = setTimeout(() => {
      onDone();
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      onClick={
        !isVideo
          ? onDone
          : undefined
      }
      style={{
        position: "fixed",
        inset: 0,
        background: "#0B0B0B",
        zIndex: 80,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: isVideo
          ? "default"
          : "pointer",
        overflow: "hidden",
        textAlign: "center",
        padding: 20,
      }}
    >
      {w.audioUrl && (
        <audio
          src={w.audioUrl}
          autoPlay
        />
      )}

      {isVideo ? (
        <div
          style={{
            width: "100%",
            maxWidth: big
              ? 760
              : 420,
            position: "relative",
          }}
        >
          <video
            src={w.videoUrl}
            autoPlay
            playsInline
            onEnded={onDone}
            style={{
              width: "100%",
              borderRadius: big
                ? 16
                : 10,
              maxHeight: "80vh",
            }}
          />

          <button
            onClick={onDone}
            style={{
              position: "absolute",
              top: -34,
              right: 0,
              background: "none",
              border: "none",
              color: "#999",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            pular ›
          </button>
        </div>
      ) : phase === 0 ? (
        <div
          style={{
            animation:
              "popIn3D .9s cubic-bezier(.2,.9,.3,1.2)",
          }}
        >
          <div
            style={{
              fontSize: big
                ? 16
                : 12.5,
              color: accent,
              letterSpacing: big
                ? 7
                : 5,
              fontWeight: 700,
              marginBottom: big
                ? 16
                : 10,
            }}
          >
            {w.line1 ||
              "SEJA BEM-VINDO"}
          </div>

          <div
            style={{
              fontFamily:
                FONT_DISPLAY,
              fontSize: big
                ? 92
                : 48,
              color: "#fff",
              letterSpacing: big
                ? 4
                : 2,
              lineHeight: 1,
              textShadow: `
                0 1px 0 ${accent},
                0 2px 0 ${accent},
                0 3px 0 ${accent},
                0 4px 0 ${accent},
                0 6px 14px rgba(0,0,0,.6)
              `,
            }}
          >
            {w.line2 ||
              "CLUBE BYSE"}
          </div>
        </div>
      ) : (
        <div
          style={{
            animation:
              "fadeUpSmall .7s ease",
          }}
        >
          <div
            style={{
              width: big
                ? 70
                : 46,
              height: 1,
              background: accent,
              margin: `0 auto ${
                big
                  ? 28
                  : 20
              }px`,
            }}
          />

          <div
            style={{
              fontFamily:
                FONT_PREMIUM,
              fontStyle: "italic",
              fontSize: big
                ? 32
                : 20,
              color: "#EDEDED",
              fontWeight: 500,
            }}
          >
            {w.line3 ||
              "Você é nosso"}
          </div>

          <div
            style={{
              fontFamily:
                FONT_PREMIUM,
              fontSize: big
                ? 58
                : 36,
              color: accent,
              fontWeight: 700,
              letterSpacing: 1,
              marginTop: 4,
            }}
          >
            {w.line4 ||
              "Cliente VIP"}
          </div>

          <div
            style={{
              width: big
                ? 70
                : 46,
              height: 1,
              background: accent,
              margin: `${
                big
                  ? 28
                  : 20
              }px auto 0`,
            }}
          />
        </div>
      )}

      {!isVideo && (
        <div
          style={{
            position: "absolute",
            bottom: 26,
            fontSize: big
              ? 13
              : 11,
            color: "#666",
          }}
        >
          toque para continuar
        </div>
      )}
    </div>
  );
}

/* =========================================================
   LOGIN
========================================================= */
export function LoginScreen({
  accent,
  onLogin,
}: {
  accent?: string;
  onLogin: (user?: any) => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || password.length < 6 || (mode === 'register' && !name.trim())) {
      setError(mode === 'register' ? 'Informe nome, e-mail válido e senha com pelo menos 6 caracteres.' : 'Preencha um e-mail válido e uma senha com pelo menos 6 caracteres.');
      return;
    }
    try {
      setLoading(true);
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:3333').replace(/\/$/, '');
      const response = await fetch(`${base}/api/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'register' ? { name: name.trim(), email: cleanEmail, password } : { email: cleanEmail, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError(data.error || 'Não foi possível autenticar.'); return; }
      localStorage.setItem('byse_token', data.token);
      localStorage.setItem('byse_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch { setError('Erro ao conectar com o servidor. Verifique se o backend está rodando.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0C0C0C', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:380, textAlign:'center' }}>
        <div style={{ fontSize:30, letterSpacing:2, color:'#F0EFE9', marginBottom:4, fontWeight:'bold' }}>BYSE <span style={{color:accent}}>PRO</span></div>
        <div style={{fontSize:12.5,color:'#8A8A82',marginBottom:28}}>{mode === 'login' ? 'Entre para acessar o painel da sua loja' : 'Crie a conta da sua loja'}</div>
        <div style={{background:'#1C1C1C',border:'1px solid #2E2E2E',borderRadius:14,padding:24,textAlign:'left'}}>
          {mode === 'register' && <><label style={{fontSize:10.5,color:'#8A8A82',fontWeight:700}}>NOME DA LOJA</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Minha Loja" style={{width:'100%',boxSizing:'border-box',margin:'5px 0 14px',padding:'11px 12px',border:'1px solid #2E2E2E',borderRadius:10,background:'transparent',color:'#F0EFE9'}}/></>}
          <label style={{fontSize:10.5,color:'#8A8A82',fontWeight:700}}>E-MAIL</label>
          <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError('')}} placeholder="voce@email.com" style={{width:'100%',boxSizing:'border-box',margin:'5px 0 14px',padding:'11px 12px',border:'1px solid #2E2E2E',borderRadius:10,background:'transparent',color:'#F0EFE9'}}/>
          <label style={{fontSize:10.5,color:'#8A8A82',fontWeight:700}}>SENHA</label>
          <input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError('')}} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Mínimo 6 caracteres" style={{width:'100%',boxSizing:'border-box',margin:'5px 0 8px',padding:'11px 12px',border:'1px solid #2E2E2E',borderRadius:10,background:'transparent',color:'#F0EFE9'}}/>
          {error && <div style={{fontSize:11.5,color:'#FF5555',margin:'7px 0'}}>{error}</div>}
          <button onClick={submit} disabled={loading} style={{width:'100%',background:accent||'#3B82F6',color:'#fff',border:0,borderRadius:10,padding:12,fontWeight:700,fontSize:14,cursor:'pointer',marginTop:10,opacity:loading?.7:1}}>{loading ? 'Aguarde...' : mode==='login' ? 'Entrar' : 'Criar conta'}</button>
          <button onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}} style={{width:'100%',background:'transparent',color:'#A5A5A0',border:0,padding:12,fontSize:12,cursor:'pointer'}}>{mode==='login' ? 'Ainda não tenho conta' : 'Já tenho uma conta'}</button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PILL
========================================================= */

function Pill({
  children,
  color = "#888",
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        background: `${color}22`,
        color,
        letterSpacing: 0.4,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/* =========================================================
   SECTION LABEL
========================================================= */

function SLabel({
  children,
  subtext,
}) {
  return (
    <p
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: subtext,
        textTransform:
          "uppercase",
        letterSpacing: 1.2,
        marginBottom: 10,
      }}
    >
      {children}
    </p>
  );
}

/* =========================================================
   HORIZONTAL BAR
========================================================= */

function HBar({
  pct,
  color = "#888",
  border,
  h = 6,
}) {
  return (
    <div
      style={{
        height: h,
        background: border,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(
            Math.max(pct, 0),
            100
          )}%`,
          background: color,
          borderRadius: 3,
          transition:
            "width .6s ease",
        }}
      />
    </div>
  );
}

/* =========================================================
   WAVE CHART
========================================================= */

function WaveChart({
  data,
  color,
  height = 84,
  gradId,
}) {
  const max = Math.max(
    1,
    ...data
  );

  const n = data.length;

  const stepX =
    n > 1
      ? 100 / (n - 1)
      : 100;

  const pts = data.map(
    (v, i) => [
      i * stepX,
      96 - (v / max) * 84,
    ]
  );

  let path =
    `M ${pts[0][0]},` +
    `${pts[0][1]}`;

  for (
    let i = 1;
    i < pts.length;
    i++
  ) {
    const [
      x0,
      y0,
    ] = pts[i - 1];

    const [
      x1,
      y1,
    ] = pts[i];

    path +=
      ` Q ${x0},${y0} ` +
      `${(x0 + x1) / 2},` +
      `${(y0 + y1) / 2}`;
  }

  path +=
    ` T ${pts[pts.length - 1][0]},` +
    `${pts[pts.length - 1][1]}`;

  const area =
    `${path} ` +
    `L ${pts[pts.length - 1][0]},100 ` +
    `L 0,100 Z`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        width: "100%",
        height,
        display: "block",
        overflow: "visible",
      }}
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor={color}
            stopOpacity="0.5"
          />

          <stop
            offset="100%"
            stopColor={color}
            stopOpacity="0.02"
          />
        </linearGradient>
      </defs>

      <path
        d={area}
        fill={`url(#${gradId})`}
        stroke="none"
      />

      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   LOGO
========================================================= */

function LogoMark({
  accent,
  size = 34,
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: accent,
        clipPath:
          "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily:
            FONT_DISPLAY,
          fontSize:
            size * 0.42,
          color: "#fff",
        }}
      >
        B
      </span>
    </div>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({
  title,
  sub,
  subtext,
}) {
  return (
    <div
      style={{
        marginBottom: 20,
        animation:
          "fadeUp .3s ease",
      }}
    >
      <h1
        style={{
          fontFamily:
            FONT_DISPLAY,
          fontSize: 28,
          letterSpacing: 1.5,
          fontWeight: 400,
          margin: 0,
        }}
      >
        {title}
      </h1>

      {sub && (
        <p
          style={{
            fontSize: 13,
            color: subtext,
            margin: "4px 0 0",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  sub,
  card,
  border,
  subtext,
  accent,
}) {
  return (
    <div
      style={{
        background: card,
        border:
          `1px solid ${border}`,
        borderRadius: 12,
        padding: 16,
        flex: 1,
        minWidth: 150,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          color: subtext,
          marginBottom: 6,
          textTransform:
            "uppercase",
          letterSpacing: 0.6,
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontFamily:
            FONT_DISPLAY,
          fontSize: 26,
          letterSpacing: 0.5,
        }}
      >
        {value}
      </div>

      {sub && (
        <div
          style={{
            fontSize: 11.5,
            color: accent,
            marginTop: 4,
            fontWeight: 600,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   FINANCE ROW
========================================================= */

function FinanceRow({
  color,
  label,
  sub,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "11px 0",
      }}
    >
      <div
        style={{
          width: 3,
          borderRadius: 2,
          background: color,
          flexShrink: 0,
        }}
      />

      <div
        style={{
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {label}
        </div>

        {sub && (
          <div
            style={{
              fontSize: 11,
              color: "#888",
              marginTop: 1,
            }}
          >
            {sub}
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color,
          whiteSpace:
            "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   SINGLE DATE PICKER
========================================================= */

function SingleDatePicker({
  initial,
  onConfirm,
  onCancel,
  accent,
  border,
  card,
  text,
  subtext,
}) {
  const [sel, setSel] =
    useState(initial);

  const [viewMonth, setViewMonth] =
    useState(
      initial.getMonth()
    );

  const [viewYear, setViewYear] =
    useState(
      initial.getFullYear()
    );

  const cells = getMonthGrid(
    viewYear,
    viewMonth
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);

      setViewYear(
        (y) => y - 1
      );
    } else {
      setViewMonth(
        (m) => m - 1
      );
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);

      setViewYear(
        (y) => y + 1
      );
    } else {
      setViewMonth(
        (m) => m + 1
      );
    }
  };

  return (
    <div
      style={{
        background: card,
        borderRadius: 14,
        overflow: "hidden",
        width: 300,
        border:
          `1px solid ${border}`,
      }}
    >
      <div
        style={{
          background: accent,
          color: "#fff",
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            opacity: 0.85,
          }}
        >
          {sel.getFullYear()}
        </div>

        <div
          style={{
            fontFamily:
              FONT_DISPLAY,
            fontSize: 22,
            letterSpacing: 0.5,
          }}
        >
          {formatDateLong(sel)}
        </div>
      </div>

      <div
        style={{
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <button
            onClick={prevMonth}
            style={{
              background: "none",
              border: "none",
              color: text,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ‹
          </button>

          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {MONTH_NAMES[
              viewMonth
            ]}{" "}
            de {viewYear}
          </span>

          <button
            onClick={nextMonth}
            style={{
              background: "none",
              border: "none",
              color: text,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ›
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(7,1fr)",
            gap: 2,
            marginBottom: 4,
          }}
        >
          {WEEKDAY_LABELS.map(
            (w, i) => (
              <div
                key={i}
                style={{
                  textAlign:
                    "center",
                  fontSize: 10,
                  color: subtext,
                  fontWeight: 700,
                }}
              >
                {w}
              </div>
            )
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(7,1fr)",
            gap: 2,
          }}
        >
          {cells.map(
            (d, i) => {
              if (d === null) {
                return (
                  <div
                    key={i}
                  />
                );
              }

              const isSel =
                sel.getDate() ===
                  d &&
                sel.getMonth() ===
                  viewMonth &&
                sel.getFullYear() ===
                  viewYear;

              return (
                <button
                  key={i}
                  onClick={() =>
                    setSel(
                      new Date(
                        viewYear,
                        viewMonth,
                        d
                      )
                    )
                  }
                  style={{
                    aspectRatio:
                      "1",
                    borderRadius:
                      "50%",
                    border: "none",
                    background:
                      isSel
                        ? accent
                        : "transparent",
                    color: isSel
                      ? "#fff"
                      : text,
                    fontSize: 12,
                    cursor:
                      "pointer",
                  }}
                >
                  {d}
                </button>
              );
            }
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            gap: 18,
            marginTop: 16,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              color: accent,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            CANCELAR
          </button>

          <button
            onClick={() =>
              onConfirm(sel)
            }
            style={{
              background: "none",
              border: "none",
              color: accent,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PERIOD MODAL
========================================================= */

function PeriodModal({
  start,
  end,
  onConfirm,
  onCancel,
  accent,
  border,
  card,
  text,
  subtext,
}) {
  const [
    draftStart,
    setDraftStart,
  ] = useState(start);

  const [
    draftEnd,
    setDraftEnd,
  ] = useState(end);

  const [
    picking,
    setPicking,
  ] = useState(null);

  if (picking) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "rgba(0,0,0,.5)",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "center",
          zIndex: 60,
        }}
      >
        <SingleDatePicker
          initial={
            picking === "start"
              ? draftStart
              : draftEnd
          }
          accent={accent}
          border={border}
          card={card}
          text={text}
          subtext={subtext}
          onCancel={() =>
            setPicking(null)
          }
          onConfirm={(d) => {
            if (
              picking ===
              "start"
            ) {
              setDraftStart(d);
            } else {
              setDraftEnd(d);
            }

            setPicking(null);
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent:
          "center",
        zIndex: 55,
      }}
    >
      <div
        style={{
          background: card,
          borderRadius: 14,
          padding: 22,
          width: 300,
          border:
            `1px solid ${border}`,
        }}
      >
        <div
          style={{
            fontFamily:
              FONT_DISPLAY,
            fontSize: 17,
            letterSpacing: 0.5,
            marginBottom: 16,
          }}
        >
          SELECIONE O PERÍODO
        </div>

        <button
          onClick={() =>
            setPicking("start")
          }
          style={{
            width: "100%",
            textAlign: "left",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 14,
            padding: 0,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: subtext,
              fontWeight: 700,
              textTransform:
                "uppercase",
            }}
          >
            Data de início
          </div>

          <div
            style={{
              fontSize: 14,
              color: text,
              marginTop: 2,
            }}
          >
            {formatDateBadge(
              draftStart
            )}
          </div>
        </button>

        <button
          onClick={() =>
            setPicking("end")
          }
          style={{
            width: "100%",
            textAlign: "left",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 18,
            padding: 0,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: subtext,
              fontWeight: 700,
              textTransform:
                "uppercase",
            }}
          >
            Data de término
          </div>

          <div
            style={{
              fontSize: 14,
              color: text,
              marginTop: 2,
            }}
          >
            {formatDateBadge(
              draftEnd
            )}
          </div>
        </button>

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            gap: 18,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              color: accent,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            CANCELAR
          </button>

          <button
            onClick={() => {
              const valid =
                sameOrBefore(
                  draftStart,
                  draftEnd
                );

              onConfirm(
                valid
                  ? draftStart
                  : draftEnd,
                valid
                  ? draftEnd
                  : draftStart
              );
            }}
            style={{
              background: "none",
              border: "none",
              color: accent,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PERIOD HEADER
========================================================= */

function PeriodHeader({
  start,
  end,
  onChange,
  accent,
  card,
  border,
  text,
  subtext,
}) {
  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const spanDays =
    Math.round(
      (end - start) /
        86400000
    ) + 1;

  const shift = (dir) => {
    const ns = new Date(start);

    ns.setDate(
      ns.getDate() +
        dir * spanDays
    );

    const ne = new Date(end);

    ne.setDate(
      ne.getDate() +
        dir * spanDays
    );

    onChange(ns, ne);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          background: accent,
          borderRadius: 10,
          padding: "10px 4px",
        }}
      >
        <button
          onClick={() =>
            shift(-1)
          }
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            padding: "0 10px",
          }}
        >
          ‹
        </button>

        <button
          onClick={() =>
            setShowModal(true)
          }
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontWeight: 700,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          {formatDateShort(
            start
          )}{" "}
          –{" "}
          {formatDateShort(
            end
          )}
        </button>

        <button
          onClick={() =>
            shift(1)
          }
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            padding: "0 10px",
          }}
        >
          ›
        </button>
      </div>

      {showModal && (
        <PeriodModal
          start={start}
          end={end}
          accent={accent}
          border={border}
          card={card}
          text={text}
          subtext={subtext}
          onCancel={() =>
            setShowModal(false)
          }
          onConfirm={(s, e) => {
            onChange(s, e);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

/* =========================================================
   MENU GRID
========================================================= */

function MenuGridScreen({
  items,
  onNavigate,
  card,
  border,
  subtext,
  accent,
  text,
}) {
  return (
    <div>
      <SectionTitle
        title="Menu"
        sub="Demais funções do sistema"
        subtext={subtext}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: 10,
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() =>
                onNavigate(
                  item.id
                )
              }
              style={{
                background: card,
                border:
                  `1px solid ${border}`,
                borderRadius: 13,
                padding:
                  "18px 12px",
                display: "flex",
                flexDirection:
                  "column",
                alignItems:
                  "center",
                gap: 8,
                cursor: "pointer",
                color: text,
              }}
            >
              <Icon
                size={22}
                color={accent}
              />

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign:
                    "center",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   EXPORTS
========================================================= */

export {
  VipWelcome,
  Pill,
  SLabel,
  HBar,
  WaveChart,
  LogoMark,
  SectionTitle,
  StatCard,
  FinanceRow,
  SingleDatePicker,
  PeriodModal,
  PeriodHeader,
  MenuGridScreen,
};