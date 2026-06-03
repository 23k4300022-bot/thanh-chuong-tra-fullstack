import { useState, useRef, useEffect } from "react";

/* ─────────────────────────────────────────────
   CSS nhúng thẳng – không cần file .css riêng
───────────────────────────────────────────── */
const STYLES = `
/* ===== CHECKOUT MODAL OVERLAY ===== */
.co-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.62);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  backdrop-filter: blur(6px);
  animation: coFadeIn .2s ease;
}
@keyframes coFadeIn { from { opacity:0 } to { opacity:1 } }

.co-modal {
  background: #fff; width: 100%; max-width: 900px;
  max-height: 93vh; border-radius: 28px;
  overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 32px 80px rgba(0,0,0,0.28);
  animation: coSlideUp .3s cubic-bezier(.34,1.2,.64,1);
  position: relative;
}
@keyframes coSlideUp { from { transform:translateY(40px);opacity:0 } to { transform:translateY(0);opacity:1 } }

/* ===== HEADER ===== */
.co-hdr {
  background: linear-gradient(135deg,#174421,#1f7a36);
  color: #fff; padding: 18px 26px;
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
}
.co-hdr-left { display:flex; align-items:center; gap:12px }
.co-hdr-icon {
  width:40px; height:40px; border-radius:50%;
  background: rgba(255,255,255,.15);
  display:flex; align-items:center; justify-content:center; font-size:20px;
}
.co-hdr h2 { margin:0 0 2px; font-size:17px; font-weight:800 }
.co-hdr p  { margin:0; font-size:12px; opacity:.8 }
.co-hdr-close {
  width:34px; height:34px; border:none;
  background: rgba(255,255,255,.15); color:#fff;
  border-radius:50%; cursor:pointer; font-size:20px;
  display:flex; align-items:center; justify-content:center;
  transition: background .15s;
}
.co-hdr-close:hover { background: rgba(255,255,255,.28) }

/* ===== STEPS ===== */
.co-steps {
  display:flex; align-items:center; padding:14px 26px 0;
  flex-shrink:0; gap:0;
}
.co-step { display:flex; align-items:center; gap:7px; font-size:12px; font-weight:700; color:#bbb }
.co-step.active { color:#1f7a36 }
.co-step.done   { color:#68b87a }
.co-step-dot {
  width:26px; height:26px; border-radius:50%;
  background:#eee; display:flex; align-items:center;
  justify-content:center; font-size:12px; font-weight:800; flex-shrink:0;
}
.co-step.active .co-step-dot { background:#1f7a36; color:#fff }
.co-step.done   .co-step-dot { background:#c8ecd1; color:#174421 }
.co-step-line { flex:1; height:2px; background:#eee; margin:0 8px }
.co-step.done ~ .co-step-line { background:#c8ecd1 }

/* ===== BODY LAYOUT ===== */
.co-body { overflow-y:auto; flex:1 }
.co-layout {
  display:grid; grid-template-columns:1.05fr .95fr; min-height:100%;
}

/* ===== LEFT PANEL ===== */
.co-left { padding:20px 22px; border-right:1px solid #f0f0f0 }
.co-sec-title {
  font-size:11px; font-weight:800; color:#1f7a36;
  text-transform:uppercase; letter-spacing:.09em;
  margin:0 0 12px; display:flex; align-items:center; gap:6px;
}

/* Cart items */
.co-cart-list { display:flex; flex-direction:column; gap:9px; margin-bottom:16px }
.co-cart-item {
  display:grid; grid-template-columns:1fr auto auto;
  align-items:center; gap:10px;
  padding:11px 13px; background:#f7fcf5;
  border-radius:13px; border:1px solid #dff0d8;
}
.co-item-name { font-size:13px; font-weight:700; color:#174421; margin-bottom:3px }
.co-item-price { font-size:12px; color:#b96b00; font-weight:700 }
.co-qty-ctrl { display:flex; align-items:center; gap:5px }
.co-qty-btn {
  width:26px; height:26px; border:none; border-radius:7px;
  background:#e8f6e0; color:#1f7a36;
  font-weight:900; font-size:15px; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition: background .15s;
}
.co-qty-btn:hover { background:#d0ecbf }
.co-qty-num { font-weight:700; font-size:13px; min-width:16px; text-align:center; color:#174421 }
.co-remove {
  width:26px; height:26px; border:none;
  background:#fff0f0; color:#b00020;
  border-radius:7px; cursor:pointer; font-size:14px;
  display:flex; align-items:center; justify-content:center;
  transition: background .15s;
}
.co-remove:hover { background:#ffd7d7 }

/* Total box */
.co-total-box {
  background:linear-gradient(135deg,#fffcf0,#fff8e0);
  border:1px solid #e8d48a; border-radius:13px;
  padding:13px 16px; margin-bottom:18px;
}
.co-total-row {
  display:flex; justify-content:space-between;
  align-items:center; font-size:12px; color:#777; margin-bottom:5px;
}
.co-total-row .free { color:#1f7a36; font-weight:700 }
.co-total-big {
  display:flex; justify-content:space-between; align-items:center;
  border-top:1px dashed #d4b86a; padding-top:9px; margin-top:4px;
}
.co-total-big .lbl { font-size:14px; font-weight:800; color:#174421 }
.co-total-big .amt { font-size:20px; font-weight:900; color:#b96b00 }

/* Payment methods */
.co-pay-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-bottom:0 }
.co-pay-opt {
  border:2px solid #e0e0e0; border-radius:11px;
  padding:9px 11px; cursor:pointer;
  display:flex; align-items:center; gap:7px;
  font-size:12px; font-weight:700; color:#666;
  transition:all .18s; background:#fff;
}
.co-pay-opt:hover { border-color:#1f7a36; color:#1f7a36; background:#f4fbf0 }
.co-pay-opt.active { border-color:#1f7a36; background:#e8f6e0; color:#174421 }
.co-pay-icon { font-size:18px }

/* QR / bank info box */
.co-qr-box {
  margin-top:12px; background:#fff8e5;
  border:1px dashed #d4b86a; border-radius:13px;
  padding:14px; text-align:center; display:none;
}
.co-qr-box.show { display:block }
.co-qr-placeholder {
  width:110px; height:110px; background:#f0f0f0;
  border-radius:10px; margin:0 auto 10px;
  display:flex; align-items:center; justify-content:center;
  font-size:36px; border:2px dashed #ddd;
}
.co-qr-info { font-size:12px; color:#555; line-height:1.75 }
.co-qr-info strong { color:#174421 }

/* ===== RIGHT PANEL ===== */
.co-right {
  padding:20px 22px; background:#fafffe;
  display:flex; flex-direction:column; gap:13px;
}

/* Form fields */
.co-field { display:flex; flex-direction:column; gap:4px }
.co-label {
  font-size:11px; font-weight:700; color:#444;
  display:flex; align-items:center; gap:3px;
}
.co-label .req { color:#c00 }
.co-label .hint { color:#999; font-weight:400 }
.co-inp {
  padding:11px 13px; border:1.5px solid #ddd; border-radius:11px;
  font-size:13px; outline:none; background:#fff; color:#1f2d20;
  font-family:"Segoe UI",Arial,sans-serif;
  transition: border .18s, box-shadow .18s;
}
.co-inp:focus { border-color:#1f7a36; box-shadow:0 0 0 3px rgba(31,122,54,.1) }
.co-inp.err { border-color:#c00; background:#fff8f8 }
.co-err { font-size:11px; color:#c00; display:none; margin-top:1px }
.co-err.show { display:block }
.co-inp-row { display:grid; grid-template-columns:1fr 1fr; gap:9px }

/* Map */
.co-map-search { display:flex; gap:7px; margin-bottom:7px }
.co-map-search-inp {
  flex:1; padding:9px 12px; border:1.5px solid #ddd;
  border-radius:10px; font-size:12px; outline:none;
  font-family:"Segoe UI",Arial,sans-serif;
  transition: border .18s;
}
.co-map-search-inp:focus { border-color:#1f7a36 }
.co-map-search-btn {
  padding:9px 13px; background:#1f7a36; color:#fff;
  border:none; border-radius:10px; font-size:12px;
  font-weight:700; cursor:pointer; white-space:nowrap;
  transition: background .15s;
}
.co-map-search-btn:hover { background:#174421 }
.co-map-wrap {
  border-radius:13px; overflow:hidden;
  border:1.5px solid #ddd; height:160px;
  background:#e8f4e8; position:relative;
}
.co-map-placeholder {
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  height:100%; gap:6px; color:#1f7a36;
}
.co-map-placeholder .ico { font-size:32px }
.co-map-placeholder p { font-size:11px; color:#666; text-align:center; line-height:1.5; margin:0 }
.co-map-label {
  position:absolute; top:7px; left:7px;
  background:#fff; border-radius:7px; padding:3px 8px;
  font-size:11px; font-weight:700; color:#1f7a36;
  box-shadow:0 2px 8px rgba(0,0,0,.13);
  display:none; align-items:center; gap:3px;
}
.co-map-label.show { display:flex }
.co-map-frame { width:100%; height:100%; border:none; display:none }
.co-map-frame.show { display:block }
.co-map-addr {
  background:#f0fbf4; border-radius:9px;
  padding:8px 11px; border:1px solid #c8e6bc;
  font-size:11px; color:#333; line-height:1.5;
  display:none; align-items:flex-start; gap:5px; margin-top:6px;
}
.co-map-addr.show { display:flex }

/* Bank box */
.co-bank-box {
  background:#fff8e5; border:1px solid #e3d3a3;
  border-radius:13px; padding:16px; margin-top:4px;
}
.co-bank-box h4 { margin:0 0 10px; color:#174421; font-size:14px; text-align:center }
.co-bank-label { font-size:11px; font-weight:700; color:#555; display:block; margin-bottom:4px }

/* Submit button */
.co-submit {
  background:linear-gradient(135deg,#1f7a36,#2d9e4e);
  color:#fff; border:none; border-radius:14px;
  padding:14px; font-size:15px; font-weight:900;
  cursor:pointer; width:100%; display:flex;
  align-items:center; justify-content:center; gap:9px;
  transition:all .18s; margin-top:2px;
}
.co-submit:hover {
  background:linear-gradient(135deg,#174421,#1f7a36);
  transform:translateY(-1px);
  box-shadow:0 8px 22px rgba(31,122,54,.28);
}
.co-submit:active { transform:translateY(0) }

/* ===== SUCCESS SCREEN ===== */
.co-success {
  display:none; flex-direction:column;
  align-items:center; justify-content:center;
  padding:36px 28px; text-align:center; min-height:480px;
}
.co-success.show { display:flex }
.co-success-ring {
  width:88px; height:88px;
  background:linear-gradient(135deg,#1f7a36,#2d9e4e);
  border-radius:50%; display:flex; align-items:center;
  justify-content:center; font-size:42px; margin-bottom:18px;
  animation:coPopIn .5s cubic-bezier(.34,1.56,.64,1);
}
@keyframes coPopIn {
  from { transform:scale(0); opacity:0 }
  to   { transform:scale(1); opacity:1 }
}
.co-success h2 { font-size:22px; color:#174421; font-weight:900; margin:0 0 8px }
.co-success .sub { color:#667; font-size:14px; line-height:1.6; max-width:380px; margin-bottom:18px }
.co-order-card {
  background:#f7fcf5; border:1px solid #c8e6bc;
  border-radius:16px; padding:18px 20px;
  width:100%; max-width:420px; text-align:left; margin-bottom:18px;
}
.co-order-row {
  display:flex; justify-content:space-between;
  align-items:flex-start; padding:6px 0;
  border-bottom:1px solid #e8f5e0; font-size:12px;
}
.co-order-row:last-child { border:none; padding-top:9px; margin-top:3px }
.co-order-row .lbl { color:#777; font-weight:600 }
.co-order-row .val { color:#174421; font-weight:800; text-align:right; max-width:220px }
.co-order-row.big .val { color:#b96b00; font-size:16px; font-weight:900 }
.co-success-btn {
  background:#1f7a36; color:#fff; border:none;
  border-radius:12px; padding:12px 34px;
  font-size:14px; font-weight:800; cursor:pointer;
  transition: background .15s;
}
.co-success-btn:hover { background:#174421 }

/* Confetti */
.co-confetti { position:absolute; pointer-events:none; inset:0; overflow:hidden; border-radius:28px; z-index:10 }
.co-cf { position:absolute; border-radius:50%; animation:coFall linear forwards }
@keyframes coFall {
  0%   { transform:translateY(-10px) rotate(0deg); opacity:1 }
  100% { transform:translateY(640px) rotate(720deg); opacity:0 }
}

/* ===== RESPONSIVE ===== */
@media (max-width:700px) {
  .co-layout { grid-template-columns:1fr }
  .co-left { border-right:none; border-bottom:1px solid #f0f0f0 }
  .co-cart-item { grid-template-columns:1fr }
  .co-inp-row { grid-template-columns:1fr }
}
`;

/* ─────────────── helpers ─────────────── */
const fmt = n => Number(n || 0).toLocaleString("vi-VN") + "đ";
const orderId = () => "TAM" + String(Date.now()).slice(-6);

const PAY_OPTS = [
  { id: "COD",               label: "Tiền mặt (COD)",  icon: "💵" },
  { id: "Chuyển khoản test", label: "Chuyển khoản",    icon: "🏦" },
  { id: "VNPay Sandbox",     label: "VNPay QR",        icon: "🔵" },
  { id: "MoMo",              label: "MoMo",             icon: "💜" },
];

const STEP_LABELS = ["Giỏ hàng", "Thông tin", "Hoàn tất"];
const CF_COLORS   = ["#1f7a36","#b96b00","#ffe57a","#2d9e4e","#ff6b6b","#4ecdc4"];

/* ─────────────── sub-components ─────────────── */
function Steps({ done, active }) {
  return (
    <div className="co-steps">
      {STEP_LABELS.map((lbl, i) => {
        const idx  = i + 1;
        const cls  = done >= idx ? "co-step done" : active === idx ? "co-step active" : "co-step";
        return (
          <div key={idx} style={{ display:"flex", alignItems:"center", flex: i < 2 ? 1 : "none" }}>
            <div className={cls}>
              <div className="co-step-dot">{done >= idx ? "✓" : idx}</div>
              {lbl}
            </div>
            {i < 2 && <div className="co-step-line" />}
          </div>
        );
      })}
    </div>
  );
}

function CartItem({ item, onInc, onDec, onRemove }) {
  return (
    <div className="co-cart-item">
      <div>
        <div className="co-item-name">{item.name}</div>
        <div className="co-item-price">
          {fmt(item.price)} × {item.quantity} = <strong>{fmt(item.price * item.quantity)}</strong>
        </div>
      </div>
      <div className="co-qty-ctrl">
        <button className="co-qty-btn" type="button" onClick={onDec}>−</button>
        <span className="co-qty-num">{item.quantity}</span>
        <button className="co-qty-btn" type="button" onClick={onInc}>+</button>
      </div>
      <button className="co-remove" type="button" onClick={onRemove}>✕</button>
    </div>
  );
}

function MapPicker({ onAddressSelect }) {
  const [query, setQuery]   = useState("");
  const [loaded, setLoaded] = useState(false);
  const [addr, setAddr]     = useState("");

  const search = () => {
    const q = query.trim();
    if (!q) return;
    setLoaded(true);
    setAddr(q);
    onAddressSelect(q);
  };

  return (
    <>
      <div className="co-map-search">
        <input
          className="co-map-search-inp"
          placeholder="Nhập địa chỉ để xem trên bản đồ…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
        />
        <button className="co-map-search-btn" type="button" onClick={search}>🗺 Tìm</button>
      </div>

      <div className="co-map-wrap">
        {!loaded ? (
          <div className="co-map-placeholder">
            <span className="ico">🗺</span>
            <p>Nhập địa chỉ và bấm <strong>Tìm</strong><br/>để hiển thị vị trí</p>
          </div>
        ) : (
          <>
            <iframe
              title="map"
              className="co-map-frame show"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(addr + ", Việt Nam")}&z=15&output=embed&hl=vi`}
              allowFullScreen
              loading="lazy"
            />
            <div className="co-map-label show">📍 Vị trí đã chọn</div>
          </>
        )}
      </div>

      {addr && (
        <div className="co-map-addr show">
          <span>📍</span>
          <span>{addr}</span>
        </div>
      )}
    </>
  );
}

/* ─────────────── main component ─────────────── */
export default function CheckoutModal({
  cart, onClose, onInc, onDec, onRemove,
  customer, setCustomer,
  onSubmit,          // async fn(e) – gọi API đặt hàng
  onVnpay,           // async fn() – redirect VNPay
  currentUser,
}) {
  const [success, setSuccess] = useState(false);
  const [ordNum,  setOrdNum]  = useState("");
  const [errors,  setErrors]  = useState({});
  const confettiRef = useRef(null);

  const totalAmount = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  /* ── inject styles once ── */
  useEffect(() => {
    if (document.getElementById("co-styles")) return;
    const tag = document.createElement("style");
    tag.id = "co-styles";
    tag.textContent = STYLES;
    document.head.appendChild(tag);
  }, []);

  /* ── validation ── */
  const validate = () => {
    const e = {};
    if (!customer.customer_name?.trim() || customer.customer_name.trim().length < 2)
      e.name = "Vui lòng nhập họ tên (ít nhất 2 ký tự)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.customer_email))
      e.email = "Email không hợp lệ";
    if (!/^0\d{9}$/.test(customer.phone))
      e.phone = "SĐT phải đúng 10 số, bắt đầu bằng 0";
    if (!customer.address?.trim() || customer.address.trim().length < 10)
      e.address = "Vui lòng nhập địa chỉ chi tiết (ít nhất 10 ký tự)";
    if (customer.payment_method === "Chuyển khoản test") {
      if (!customer.bank_name)    e.bank_name    = "Vui lòng chọn ngân hàng";
      if (!customer.bank_account) e.bank_account = "Vui lòng nhập số tài khoản";
      if (!customer.account_holder) e.account_holder = "Vui lòng nhập tên chủ tài khoản";
      if (!customer.otp)          e.otp          = "Vui lòng nhập OTP";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── confetti ── */
  const shootConfetti = () => {
    const box = confettiRef.current;
    if (!box) return;
    for (let i = 0; i < 44; i++) {
      const d = document.createElement("div");
      d.className = "co-cf";
      const size = 6 + Math.random() * 8;
      d.style.cssText = [
        `left:${Math.random() * 100}%`,
        `background:${CF_COLORS[i % CF_COLORS.length]}`,
        `width:${size}px`, `height:${size}px`,
        `border-radius:${Math.random() > .5 ? "50%" : "3px"}`,
        `animation-duration:${1.6 + Math.random() * 2}s`,
        `animation-delay:${Math.random() * .4}s`,
      ].join(";");
      box.appendChild(d);
      setTimeout(() => d.remove(), 4000);
    }
  };

  /* ── submit ── */
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    if (cart.length === 0) { alert("Giỏ hàng đang trống"); return; }

    if (customer.payment_method === "VNPay Sandbox") {
      await onVnpay(); return;
    }

    try {
      await onSubmit(e);          // gọi hàm submitOrder của App.jsx
      const num = orderId();
      setOrdNum(num);
      setSuccess(true);
      setTimeout(shootConfetti, 200);
    } catch {
      /* lỗi đã được xử lý trong onSubmit */
    }
  };

  const payMethod = customer.payment_method;
  const showQR = ["Chuyển khoản test", "VNPay Sandbox", "MoMo"].includes(payMethod);
  const qrLabel = payMethod === "MoMo"
    ? "Ví MoMo — 0900 000 000"
    : payMethod === "VNPay Sandbox"
    ? "VNPay QR — Quét để thanh toán"
    : "Chuyển khoản — MB Bank 0123456789";

  const field = (id, label, extra = {}) => {
    const { req = true, hint = "", type = "text", placeholder = "", maxLength, rows } = extra;
    const isArea = !!rows;
    const Tag    = isArea ? "textarea" : "input";
    return (
      <div className="co-field" key={id}>
        <div className="co-label">
          {label}
          {req  && <span className="req">*</span>}
          {hint && <span className="hint">({hint})</span>}
        </div>
        <Tag
          className={`co-inp${errors[id] ? " err" : ""}`}
          type={!isArea ? type : undefined}
          placeholder={placeholder}
          value={customer[id] || ""}
          maxLength={maxLength}
          rows={rows}
          style={isArea ? { minHeight: 72, resize: "vertical" } : {}}
          onChange={e => {
            setCustomer(prev => ({ ...prev, [id]: e.target.value }));
            if (errors[id]) setErrors(prev => { const n = {...prev}; delete n[id]; return n; });
          }}
          onKeyDown={id === "phone"
            ? e => { if (!/[0-9]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) e.preventDefault(); }
            : undefined}
        />
        {errors[id] && <div className="co-err show">{errors[id]}</div>}
      </div>
    );
  };

  return (
    <div className="co-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="co-modal">
        <div className="co-confetti" ref={confettiRef} />

        {/* HEADER */}
        <div className="co-hdr">
          <div className="co-hdr-left">
            <div className="co-hdr-icon">🛒</div>
            <div>
              <h2>Giỏ hàng &amp; Thanh toán</h2>
              <p>Trà Thanh Chương Tâm An</p>
            </div>
          </div>
          <button className="co-hdr-close" type="button" onClick={onClose}>✕</button>
        </div>

        {/* STEPS */}
        {!success && <Steps done={0} active={cart.length > 0 ? 2 : 1} />}

        {/* ─── SUCCESS SCREEN ─── */}
        <div className={`co-success${success ? " show" : ""}`}>
          <div className="co-success-ring">✓</div>
          <h2>Đặt hàng thành công! 🎉</h2>
          <p className="sub">
            Cảm ơn bạn đã tin tưởng Thanh Chương Trà. Chúng tôi sẽ liên hệ xác nhận trong vòng <strong>30 phút</strong>.
          </p>
          <div className="co-order-card">
            <div className="co-order-row"><span className="lbl">Mã đơn hàng</span><span className="val">#{ordNum}</span></div>
            <div className="co-order-row"><span className="lbl">Khách hàng</span><span className="val">{customer.customer_name}</span></div>
            <div className="co-order-row"><span className="lbl">Điện thoại</span><span className="val">{customer.phone}</span></div>
            <div className="co-order-row"><span className="lbl">Địa chỉ</span><span className="val">{customer.address}</span></div>
            <div className="co-order-row"><span className="lbl">Thanh toán</span><span className="val">{customer.payment_method === "COD" ? "Tiền mặt (COD)" : customer.payment_method}</span></div>
            <div className="co-order-row big"><span className="lbl">Tổng tiền</span><span className="val">{fmt(totalAmount)}</span></div>
          </div>
          <button className="co-success-btn" type="button" onClick={onClose}>Tiếp tục mua sắm 🍃</button>
        </div>

        {/* ─── MAIN BODY ─── */}
        {!success && (
          <div className="co-body">
            {cart.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <p>Giỏ hàng đang trống.</p>
              </div>
            ) : (
              <form className="co-layout" onSubmit={handleSubmit} noValidate>

                {/* ── LEFT ── */}
                <div className="co-left">
                  <div className="co-sec-title">🛒 Sản phẩm</div>
                  <div className="co-cart-list">
                    {cart.map(item => (
                      <CartItem
                        key={item.id} item={item}
                        onInc={() => onInc(item.id)}
                        onDec={() => onDec(item.id)}
                        onRemove={() => onRemove(item.id)}
                      />
                    ))}
                  </div>

                  {/* Tổng tiền */}
                  <div className="co-total-box">
                    <div className="co-total-row"><span>Tạm tính</span><span>{fmt(totalAmount)}</span></div>
                    <div className="co-total-row"><span>Phí vận chuyển</span><span className="free">Miễn phí</span></div>
                    <div className="co-total-big">
                      <span className="lbl">Tổng thanh toán</span>
                      <span className="amt">{fmt(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Phương thức thanh toán */}
                  <div className="co-sec-title">💳 Phương thức thanh toán</div>
                  <div className="co-pay-grid">
                    {PAY_OPTS.map(opt => (
                      <div
                        key={opt.id}
                        className={`co-pay-opt${payMethod === opt.id ? " active" : ""}`}
                        onClick={() => setCustomer(prev => ({
                          ...prev,
                          payment_method: opt.id,
                          bank_name: "", bank_account: "", account_holder: "", otp: "",
                          vnp_bank_code: "", vnp_card_number: "", vnp_card_holder: "", vnp_issue_date: "", vnp_otp: "",
                        }))}
                      >
                        <span className="co-pay-icon">{opt.icon}</span>
                        {opt.label}
                      </div>
                    ))}
                  </div>

                  {/* QR / thông tin chuyển khoản */}
                  <div className={`co-qr-box${showQR ? " show" : ""}`}>
                    <div className="co-qr-placeholder">📱</div>
                    <div className="co-qr-info">
                      <strong>{qrLabel}</strong><br />
                      {payMethod === "Chuyển khoản test" && <>STK: <strong>9704360000000000</strong> — MB Bank<br />Tên: <strong>NGUYEN VAN A</strong><br />OTP test: <strong>123456</strong></>}
                      {payMethod !== "Chuyển khoản test" && <>Quét mã QR để thanh toán<br />Nội dung: <strong>Tên + SĐT</strong></>}
                    </div>
                  </div>
                </div>

                {/* ── RIGHT ── */}
                <div className="co-right">
                  <div className="co-sec-title">📋 Thông tin giao hàng</div>

                  {field("customer_name", "Họ và tên", { placeholder: "Nguyễn Văn A" })}
                  {field("customer_email", "Email", { type: "email", placeholder: "email@gmail.com" })}
                  {field("phone", "Số điện thoại", { placeholder: "0912 345 678", maxLength: 10, hint: "10 số" })}

                  {/* Map picker */}
                  <div className="co-field">
                    <div className="co-label">📍 Địa chỉ nhận hàng <span className="req">*</span></div>
                    <MapPicker
                      onAddressSelect={addr =>
                        setCustomer(prev => ({ ...prev, address: addr }))
                      }
                    />
                    <textarea
                      className={`co-inp${errors.address ? " err" : ""}`}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                      value={customer.address || ""}
                      rows={2}
                      style={{ marginTop: 7, minHeight: 60, resize: "vertical" }}
                      onChange={e => {
                        setCustomer(prev => ({ ...prev, address: e.target.value }));
                        if (errors.address) setErrors(prev => { const n = {...prev}; delete n.address; return n; });
                      }}
                    />
                    {errors.address && <div className="co-err show">{errors.address}</div>}
                  </div>

                  {field("note", "Ghi chú", { req: false, placeholder: "Giao giờ hành chính, gọi trước khi giao…", rows: 2 })}

                  {/* Bank info nếu chọn chuyển khoản */}
                  {payMethod === "Chuyển khoản test" && (
                    <div className="co-bank-box">
                      <h4>Thông tin chuyển khoản</h4>
                      <span className="co-bank-label">Ngân hàng</span>
                      <select
                        className={`co-inp${errors.bank_name ? " err" : ""}`}
                        value={customer.bank_name}
                        onChange={e => setCustomer(prev => ({ ...prev, bank_name: e.target.value }))}
                        style={{ marginBottom: 8 }}
                      >
                        <option value="">-- Chọn ngân hàng --</option>
                        {["VCB","BIDV","TCB","MB","ACB","TPB"].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      {errors.bank_name && <div className="co-err show">{errors.bank_name}</div>}

                      <span className="co-bank-label">Số tài khoản</span>
                      <input className={`co-inp${errors.bank_account ? " err" : ""}`} placeholder="9704360000000000"
                        value={customer.bank_account}
                        onChange={e => setCustomer(prev => ({ ...prev, bank_account: e.target.value }))}
                        style={{ marginBottom: 8 }} />
                      {errors.bank_account && <div className="co-err show">{errors.bank_account}</div>}

                      <span className="co-bank-label">Tên chủ tài khoản</span>
                      <input className={`co-inp${errors.account_holder ? " err" : ""}`} placeholder="NGUYEN VAN A"
                        value={customer.account_holder}
                        onChange={e => setCustomer(prev => ({ ...prev, account_holder: e.target.value }))}
                        style={{ marginBottom: 8 }} />
                      {errors.account_holder && <div className="co-err show">{errors.account_holder}</div>}

                      <span className="co-bank-label">OTP</span>
                      <input className={`co-inp${errors.otp ? " err" : ""}`} placeholder="123456"
                        value={customer.otp}
                        onChange={e => setCustomer(prev => ({ ...prev, otp: e.target.value }))}
                        maxLength={6} />
                      {errors.otp && <div className="co-err show">{errors.otp}</div>}
                    </div>
                  )}

                  <button className="co-submit" type="submit">
                    <span>✅</span>
                    {payMethod === "VNPay Sandbox" ? "Thanh toán qua VNPay"
                      : payMethod === "Chuyển khoản test" ? "Xác nhận chuyển khoản"
                      : "Xác nhận đặt hàng"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
