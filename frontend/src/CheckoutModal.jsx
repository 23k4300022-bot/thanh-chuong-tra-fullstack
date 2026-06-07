import { useState, useRef, useEffect } from "react";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');

.co-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(10,20,12,0.72);
  display: flex; align-items: center; justify-content: center;
  padding: 16px; backdrop-filter: blur(8px);
  animation: coFadeIn .22s ease;
}
@keyframes coFadeIn { from{opacity:0} to{opacity:1} }

.co-modal {
  font-family: 'Be Vietnam Pro', sans-serif;
  background: #fff; width: 100%; max-width: 980px;
  max-height: 94vh; border-radius: 24px;
  overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1);
  animation: coSlideUp .32s cubic-bezier(.22,1,.36,1);
  position: relative;
}
@keyframes coSlideUp { from{transform:translateY(36px);opacity:0} to{transform:translateY(0);opacity:1} }

/* HEADER */
.co-hdr {
  background: #0d2e15;
  color:#fff; padding: 0 28px;
  display:flex; align-items:center; justify-content:space-between;
  height: 64px; flex-shrink:0; position: relative; overflow: hidden;
}
.co-hdr::before {
  content:''; position:absolute; inset:0;
  background: radial-gradient(ellipse at 20% 50%, rgba(45,158,78,0.3) 0%, transparent 60%);
  pointer-events: none;
}
.co-hdr-left { display:flex; align-items:center; gap:14px; }
.co-hdr-brand {
  display:flex; align-items:center; gap:10px;
}
.co-hdr-logo {
  width:36px; height:36px; border-radius:10px;
  background: linear-gradient(135deg,#2d9e4e,#1f7a36);
  display:flex; align-items:center; justify-content:center;
  font-size:18px; font-weight:900; color:#fff;
  box-shadow: 0 2px 12px rgba(45,158,78,0.5);
}
.co-hdr h2 { margin:0; font-size:15px; font-weight:800; letter-spacing:-.01em; }
.co-hdr p  { margin:0; font-size:11px; opacity:.55; margin-top:1px; }
.co-hdr-close {
  width:32px; height:32px; border:none;
  background: rgba(255,255,255,.1); color:#fff;
  border-radius:8px; cursor:pointer; font-size:16px;
  display:flex; align-items:center; justify-content:center;
  transition: background .15s; z-index:1;
}
.co-hdr-close:hover { background: rgba(255,255,255,.2); }

/* STEPS */
.co-steps {
  display:flex; align-items:center; padding:16px 28px 0;
  flex-shrink:0; background:#fff; border-bottom:1px solid #f0f0f0;
  padding-bottom: 16px;
}
.co-step { display:flex; align-items:center; gap:8px; font-size:12px; font-weight:700; color:#ccc; font-family:'Be Vietnam Pro',sans-serif; }
.co-step.active { color:#1f7a36; }
.co-step.done   { color:#68b87a; }
.co-step-dot {
  width:28px; height:28px; border-radius:50%;
  background:#f0f0f0; display:flex; align-items:center;
  justify-content:center; font-size:12px; font-weight:800; flex-shrink:0;
  transition: all .2s;
}
.co-step.active .co-step-dot { background:#1f7a36; color:#fff; box-shadow:0 4px 12px rgba(31,122,54,.35); }
.co-step.done   .co-step-dot { background:#e0f5e8; color:#1f7a36; }
.co-step-line   { flex:1; height:2px; background:#f0f0f0; margin:0 10px; }
.co-step.done ~ .co-step-line { background:#c8ecd1; }

/* BODY */
.co-body { overflow-y:auto; flex:1; }
.co-layout {
  display:grid; grid-template-columns:1fr 380px; min-height:100%;
}
.co-left  { padding:24px 26px; }
.co-right { padding:24px 26px; background:#fafcf9; border-left:1px solid #eef4eb; }

.co-sec-title {
  font-size:10px; font-weight:800; color:#1f7a36;
  text-transform:uppercase; letter-spacing:.1em;
  margin:0 0 14px; display:flex; align-items:center; gap:6px;
  font-family:'Be Vietnam Pro',sans-serif;
}
.co-sec-title::before {
  content:''; width:3px; height:14px; background:#1f7a36; border-radius:2px;
}

/* CART ITEMS */
.co-cart-list { display:flex; flex-direction:column; gap:8px; margin-bottom:18px; }
.co-cart-item {
  display:grid; grid-template-columns:1fr auto auto;
  align-items:center; gap:12px;
  padding:13px 15px; background:#fff;
  border-radius:14px; border:1px solid #eaede8;
  transition:border-color .15s, box-shadow .15s;
}
.co-cart-item:hover { border-color:#c8e6bc; box-shadow:0 2px 12px rgba(31,122,54,.08); }
.co-item-name  { font-size:13px; font-weight:700; color:#1a2e1c; margin-bottom:4px; }
.co-item-sub   { font-size:11px; color:#999; margin-bottom:4px; }
.co-item-price { font-size:12px; color:#b96b00; font-weight:700; }
.co-item-total { font-size:13px; font-weight:800; color:#1f7a36; }

.co-qty-ctrl { display:flex; align-items:center; gap:6px; }
.co-qty-btn {
  width:28px; height:28px; border:1px solid #e0e8dc;
  border-radius:8px; background:#fff; color:#1f7a36;
  font-weight:900; font-size:16px; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition: all .15s;
}
.co-qty-btn:hover { background:#1f7a36; color:#fff; border-color:#1f7a36; }
.co-qty-num { font-weight:800; font-size:14px; min-width:20px; text-align:center; color:#1a2e1c; }
.co-remove {
  width:28px; height:28px; border:1px solid #fce4e4; background:#fff9f9;
  color:#c0392b; border-radius:8px; cursor:pointer; font-size:13px;
  display:flex; align-items:center; justify-content:center; transition:all .15s;
}
.co-remove:hover { background:#c0392b; color:#fff; border-color:#c0392b; }

/* TOTAL BOX */
.co-total-box {
  background:#fffdf5; border:1px solid #ede0b0;
  border-radius:16px; padding:16px 18px; margin-bottom:22px;
  position:relative; overflow:hidden;
}
.co-total-box::before {
  content:''; position:absolute; top:-20px; right:-20px;
  width:80px; height:80px; border-radius:50%;
  background:radial-gradient(circle, rgba(185,107,0,.08) 0%, transparent 70%);
}
.co-total-row {
  display:flex; justify-content:space-between; align-items:center;
  font-size:12px; color:#888; margin-bottom:6px;
}
.co-total-row .free { color:#1f7a36; font-weight:700; background:#e8f6e0; padding:2px 8px; border-radius:99px; }
.co-total-divider { height:1px; background:#ede0b0; margin:10px 0; }
.co-total-big {
  display:flex; justify-content:space-between; align-items:center;
}
.co-total-big .lbl { font-size:14px; font-weight:700; color:#555; }
.co-total-big .amt { font-size:22px; font-weight:900; color:#b96b00; letter-spacing:-.02em; }

/* PAYMENT */
.co-pay-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-bottom:0; }
.co-pay-opt {
  border:2px solid #eaede8; border-radius:14px; padding:13px 15px;
  cursor:pointer; display:flex; align-items:center; gap:10px;
  font-size:13px; font-weight:700; color:#555;
  transition:all .18s; background:#fff; position:relative; overflow:hidden;
}
.co-pay-opt::after {
  content:''; position:absolute; inset:0;
  background:linear-gradient(135deg, rgba(31,122,54,.04), transparent);
  opacity:0; transition:opacity .15s;
}
.co-pay-opt:hover { border-color:#1f7a36; color:#1f7a36; }
.co-pay-opt:hover::after { opacity:1; }
.co-pay-opt.active {
  border-color:#1f7a36; background:#f0fbf4; color:#174421;
  box-shadow:0 0 0 3px rgba(31,122,54,.1);
}
.co-pay-opt.active .co-pay-check { opacity:1; }
.co-pay-icon { font-size:22px; flex-shrink:0; }
.co-pay-check {
  width:18px; height:18px; background:#1f7a36; border-radius:50%;
  color:#fff; font-size:11px; font-weight:900;
  display:flex; align-items:center; justify-content:center;
  margin-left:auto; opacity:0; transition:opacity .15s; flex-shrink:0;
}

/* BANK BOX */
.co-bank-info {
  margin-top:16px; border-radius:18px; overflow:hidden;
  border:1px solid #dce8f5; box-shadow:0 4px 20px rgba(21,101,192,.08);
}
.co-bank-info-header {
  background:linear-gradient(135deg,#1565c0,#1976d2);
  color:#fff; padding:14px 18px;
  display:flex; align-items:center; gap:12px;
}
.bank-logo {
  width:40px; height:40px; border-radius:10px;
  background:#fff; display:flex; align-items:center; justify-content:center;
  font-size:14px; font-weight:900; color:#1565c0;
  box-shadow:0 2px 8px rgba(0,0,0,.2);
}
.co-bank-info-header h4 { margin:0; font-size:14px; font-weight:800; }
.co-bank-info-header p  { margin:0; font-size:11px; opacity:.8; margin-top:2px; }
.co-bank-info-body { padding:14px; display:flex; flex-direction:column; gap:9px; background:#f7fbff; }
.co-bank-row {
  display:flex; justify-content:space-between; align-items:center;
  background:#fff; border-radius:12px; padding:10px 14px;
  border:1px solid #dce8f5;
}
.co-bank-row-label { font-size:10px; color:#888; font-weight:600; margin-bottom:3px; text-transform:uppercase; letter-spacing:.05em; }
.co-bank-row-value { font-size:16px; font-weight:900; color:#1565c0; letter-spacing:.04em; }
.co-bank-row-value.name { color:#174421; font-size:13px; letter-spacing:0; font-weight:700; }
.co-copy-btn {
  border:none; background:#e3f2fd; color:#1565c0;
  border-radius:8px; padding:6px 12px; font-size:11px; font-weight:700;
  cursor:pointer; transition:all .15s; white-space:nowrap;
  font-family:'Be Vietnam Pro',sans-serif;
}
.co-copy-btn:hover   { background:#1565c0; color:#fff; }
.co-copy-btn.copied  { background:#e8f5e9; color:#2e7d32; }
.co-bank-note {
  background:#fff8e1; border:1px solid #ffe082; border-radius:12px;
  padding:11px 14px; font-size:12px; color:#5d4037; line-height:1.7;
}
.co-bank-note strong { color:#e65100; }

/* VNPAY BOX */
.co-vnpay-box {
  margin-top:16px; border-radius:18px; overflow:hidden;
  border:1px solid #e1bee7; box-shadow:0 4px 20px rgba(106,27,154,.08);
}
.co-vnpay-header {
  background:linear-gradient(135deg,#6a1b9a,#8e24aa);
  color:#fff; padding:14px 18px; display:flex; align-items:center; gap:12px;
}
.co-vnpay-header h4 { margin:0; font-size:14px; font-weight:800; }
.co-vnpay-header p  { margin:0; font-size:11px; opacity:.8; margin-top:2px; }
.co-vnpay-body { padding:20px; text-align:center; background:#fdf7ff; }
.co-vnpay-logo { font-size:44px; margin-bottom:10px; }
.co-vnpay-body p { font-size:13px; color:#666; line-height:1.65; margin:0; }
.sandbox-badge {
  display:inline-block; margin-top:10px;
  background:#fff3e0; border:1px solid #ffb74d;
  border-radius:99px; padding:4px 14px;
  font-size:11px; font-weight:700; color:#e65100;
}

/* MOMO BOX */
.co-momo-box {
  margin-top:16px; border-radius:18px; overflow:hidden;
  border:1px solid #f3d0f3; box-shadow:0 4px 20px rgba(163,0,150,.08);
}
.co-momo-header {
  background:linear-gradient(135deg,#a30096,#c70099);
  color:#fff; padding:14px 18px; display:flex; align-items:center; gap:12px;
}
.co-momo-header h4 { margin:0; font-size:14px; font-weight:800; }
.co-momo-header p  { margin:0; font-size:11px; opacity:.8; margin-top:2px; }
.co-momo-body { padding:20px; background:#fdf5ff; }
.co-momo-row {
  display:flex; justify-content:space-between; align-items:center;
  background:#fff; border-radius:12px; padding:10px 14px;
  border:1px solid #f3d0f3; margin-bottom:8px;
}
.co-momo-row-label { font-size:10px; color:#888; font-weight:600; margin-bottom:3px; text-transform:uppercase; }
.co-momo-row-value { font-size:15px; font-weight:900; color:#a30096; }
.co-momo-copy { border:none; background:#fce4fc; color:#a30096; border-radius:8px; padding:6px 12px; font-size:11px; font-weight:700; cursor:pointer; transition:all .15s; font-family:'Be Vietnam Pro',sans-serif; }
.co-momo-copy:hover { background:#a30096; color:#fff; }

/* FORM */
.co-field { display:flex; flex-direction:column; gap:5px; margin-bottom:14px; }
.co-label { font-size:11px; font-weight:700; color:#444; display:flex; align-items:center; gap:4px; font-family:'Be Vietnam Pro',sans-serif; }
.co-label .req  { color:#e53935; }
.co-label .hint { color:#aaa; font-weight:400; }
.co-inp {
  padding:11px 14px; border:1.5px solid #e0e8dc; border-radius:12px;
  font-size:13px; outline:none; background:#fff; color:#1a2e1c;
  font-family:'Be Vietnam Pro',sans-serif; transition:border .18s, box-shadow .18s;
}
.co-inp:focus { border-color:#1f7a36; box-shadow:0 0 0 3px rgba(31,122,54,.1); }
.co-inp.err    { border-color:#e53935; background:#fff8f8; }
.co-err { font-size:11px; color:#e53935; display:none; margin-top:1px; }
.co-err.show   { display:block; }

/* MAP */
.co-map-search { display:flex; gap:8px; margin-bottom:8px; }
.co-map-search-inp {
  flex:1; padding:10px 13px; border:1.5px solid #e0e8dc; border-radius:11px;
  font-size:12px; outline:none; font-family:'Be Vietnam Pro',sans-serif; transition:border .18s;
}
.co-map-search-inp:focus { border-color:#1f7a36; }
.co-map-search-btn {
  padding:10px 14px; background:#1f7a36; color:#fff; border:none;
  border-radius:11px; font-size:12px; font-weight:700; cursor:pointer;
  white-space:nowrap; transition:background .15s; font-family:'Be Vietnam Pro',sans-serif;
}
.co-map-search-btn:hover { background:#174421; }
.co-map-wrap {
  border-radius:14px; overflow:hidden; border:1.5px solid #e0e8dc;
  height:155px; background:#edf4eb; position:relative;
}
.co-map-placeholder {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  height:100%; gap:8px; color:#1f7a36;
}
.co-map-placeholder .ico { font-size:30px; }
.co-map-placeholder p { font-size:11px; color:#888; text-align:center; line-height:1.5; margin:0; }
.co-map-label {
  position:absolute; top:8px; left:8px; background:#fff; border-radius:8px;
  padding:3px 9px; font-size:11px; font-weight:700; color:#1f7a36;
  box-shadow:0 2px 8px rgba(0,0,0,.12); display:none; align-items:center; gap:3px;
}
.co-map-label.show { display:flex; }
.co-map-frame { width:100%; height:100%; border:none; display:none; }
.co-map-frame.show { display:block; }
.co-map-addr {
  background:#f0faf4; border-radius:10px; padding:8px 12px;
  border:1px solid #c8e6bc; font-size:11px; color:#333; line-height:1.5;
  display:none; align-items:flex-start; gap:6px; margin-top:7px;
}
.co-map-addr.show { display:flex; }

/* SUBMIT BTN */
.co-submit {
  background:linear-gradient(135deg,#1a6b2e,#25944a);
  color:#fff; border:none; border-radius:14px; padding:15px;
  font-size:14px; font-weight:800; cursor:pointer; width:100%;
  display:flex; align-items:center; justify-content:center; gap:10px;
  transition:all .2s; margin-top:4px; letter-spacing:-.01em;
  font-family:'Be Vietnam Pro',sans-serif;
  box-shadow:0 6px 24px rgba(26,107,46,.3);
}
.co-submit:hover { background:linear-gradient(135deg,#145724,#1d7a3a); transform:translateY(-1px); box-shadow:0 10px 28px rgba(26,107,46,.35); }
.co-submit:active { transform:translateY(0); }
.co-submit.vnpay  { background:linear-gradient(135deg,#5a1585,#7b1fa2); box-shadow:0 6px 24px rgba(90,21,133,.3); }
.co-submit.vnpay:hover  { background:linear-gradient(135deg,#4a1170,#6a1b9a); }
.co-submit.bank   { background:linear-gradient(135deg,#0d47a1,#1565c0); box-shadow:0 6px 24px rgba(13,71,161,.3); }
.co-submit.bank:hover   { background:linear-gradient(135deg,#0a3880,#0d47a1); }

/* ORDER SUMMARY SIDEBAR */
.co-order-summary {
  background:#fff; border:1px solid #eaede8; border-radius:16px;
  padding:16px; margin-bottom:18px;
}
.co-order-summary-row {
  display:flex; justify-content:space-between; align-items:center;
  padding:8px 0; border-bottom:1px solid #f5f5f5;
  font-size:12px; color:#777;
}
.co-order-summary-row:last-child { border:none; }
.co-order-summary-row .val { font-weight:700; color:#1a2e1c; }
.co-order-summary-row.total .lbl { font-size:13px; font-weight:700; color:#444; }
.co-order-summary-row.total .val { font-size:18px; font-weight:900; color:#b96b00; }

/* SUCCESS */
.co-success {
  display:none; flex-direction:column; align-items:center; justify-content:center;
  padding:40px 28px; text-align:center; min-height:480px;
}
.co-success.show { display:flex; }
.co-success-ring {
  width:90px; height:90px;
  background:linear-gradient(135deg,#1f7a36,#2d9e4e);
  border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-size:44px; margin-bottom:20px;
  animation:coPopIn .5s cubic-bezier(.34,1.56,.64,1);
  box-shadow:0 12px 40px rgba(31,122,54,.35);
}
@keyframes coPopIn{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
.co-success h2 { font-size:24px; color:#174421; font-weight:900; margin:0 0 10px; }
.co-success .sub { color:#888; font-size:14px; line-height:1.7; max-width:380px; margin-bottom:22px; }
.co-order-card {
  background:#f7fcf5; border:1px solid #c8e6bc; border-radius:18px;
  padding:18px 22px; width:100%; max-width:440px; text-align:left; margin-bottom:22px;
}
.co-order-row {
  display:flex; justify-content:space-between; align-items:flex-start;
  padding:7px 0; border-bottom:1px solid #e8f5e0; font-size:12px;
}
.co-order-row:last-child { border:none; padding-top:10px; margin-top:4px; }
.co-order-row .lbl { color:#888; font-weight:600; }
.co-order-row .val { color:#174421; font-weight:800; text-align:right; max-width:230px; }
.co-order-row.big .val { color:#b96b00; font-size:17px; font-weight:900; }
.co-success-btn {
  background:#1f7a36; color:#fff; border:none; border-radius:14px;
  padding:13px 38px; font-size:14px; font-weight:800; cursor:pointer;
  transition:all .2s; font-family:'Be Vietnam Pro',sans-serif;
  box-shadow:0 6px 20px rgba(31,122,54,.3);
}
.co-success-btn:hover { background:#174421; transform:translateY(-1px); }

/* CONFETTI */
.co-confetti { position:absolute; pointer-events:none; inset:0; overflow:hidden; border-radius:24px; z-index:10; }
.co-cf { position:absolute; border-radius:50%; animation:coFall linear forwards; }
@keyframes coFall { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(700px) rotate(720deg);opacity:0} }

/* EMPTY CART */
.co-empty {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:60px 28px; gap:12px; color:#aaa;
}
.co-empty-icon { font-size:56px; margin-bottom:4px; }
.co-empty p { font-size:15px; color:#999; margin:0; }

@media(max-width:720px){
  .co-layout { grid-template-columns:1fr; }
  .co-right   { border-left:none; border-top:1px solid #eef4eb; }
  .co-pay-grid { grid-template-columns:1fr 1fr; }
}
@media(max-width:460px){
  .co-pay-grid { grid-template-columns:1fr; }
  .co-cart-item { grid-template-columns:1fr; gap:8px; }
}
`;

const fmt = n => Number(n||0).toLocaleString("vi-VN")+"đ";
const genOrderId = () => "TCT"+String(Date.now()).slice(-6);
const CF_COLORS = ["#1f7a36","#b96b00","#ffe57a","#2d9e4e","#ff6b6b","#4ecdc4","#a8e063"];

const BANK_INFO = {
  stk: "5180971464",
  bank: "BIDV",
  owner: "NGUYEN HONG TRUONG",
};

const PAY_OPTS = [
  { id:"COD",               label:"Tiền mặt (COD)",  icon:"💵", sub:"Thanh toán khi nhận hàng" },
  { id:"Chuyển khoản test", label:"Chuyển khoản",    icon:"🏦", sub:"BIDV — Ngay lập tức" },
  { id:"VNPay Sandbox",     label:"VNPay QR",        icon:"💳", sub:"Cổng thanh toán bảo mật" },
  { id:"MoMo",              label:"MoMo",             icon:"💜", sub:"Ví điện tử MoMo" },
];

function Steps({ active }) {
  const labels = ["Giỏ hàng","Thông tin","Hoàn tất"];
  return (
    <div className="co-steps">
      {labels.map((lbl,i)=>{
        const idx=i+1, done=active>idx, cur=active===idx;
        return (
          <div key={idx} style={{display:"flex",alignItems:"center",flex:i<2?1:"none"}}>
            <div className={`co-step${done?" done":cur?" active":""}`}>
              <div className="co-step-dot">{done?"✓":idx}</div>
              {lbl}
            </div>
            {i<2&&<div className="co-step-line"/>}
          </div>
        );
      })}
    </div>
  );
}

function CopyBtn({ text, color }) {
  const [copied,setCopied]=useState(false);
  const copy=()=>{ navigator.clipboard.writeText(text).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return <button className={`co-copy-btn${copied?" copied":""}`} style={color?{background:color+"22",color}:{}} type="button" onClick={copy}>{copied?"✓ Đã sao chép":"Sao chép"}</button>;
}

function BankInfoBox({ amount }) {
  return (
    <div className="co-bank-info">
      <div className="co-bank-info-header">
        <div className="bank-logo">B</div>
        <div>
          <h4>Chuyển khoản BIDV</h4>
          <p>Xác nhận trong 5–15 phút sau khi nhận tiền</p>
        </div>
      </div>
      <div className="co-bank-info-body">
        <div className="co-bank-row">
          <div><div className="co-bank-row-label">Số tài khoản</div><div className="co-bank-row-value">{BANK_INFO.stk}</div></div>
          <CopyBtn text={BANK_INFO.stk}/>
        </div>
        <div className="co-bank-row">
          <div><div className="co-bank-row-label">Chủ tài khoản</div><div className="co-bank-row-value name">{BANK_INFO.owner}</div></div>
        </div>
        <div className="co-bank-row">
          <div><div className="co-bank-row-label">Ngân hàng</div><div className="co-bank-row-value name">BIDV — Ngân hàng Đầu tư &amp; Phát triển VN</div></div>
        </div>
        {amount>0&&(
          <div className="co-bank-row">
            <div><div className="co-bank-row-label">Số tiền</div><div className="co-bank-row-value">{fmt(amount)}</div></div>
            <CopyBtn text={String(amount)}/>
          </div>
        )}
        <div className="co-bank-note">
          📝 Nội dung CK: <strong>Tên + SĐT + TCTra</strong><br/>
          Ví dụ: <strong>Nguyen Hong 0912345678 TCTra</strong><br/>
          ⏱ Đơn xác nhận sau khi nhận thanh toán (5–15 phút)
        </div>
      </div>
    </div>
  );
}

function VNPayBox() {
  return (
    <div className="co-vnpay-box">
      <div className="co-vnpay-header">
        <div style={{width:38,height:38,borderRadius:10,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#6a1b9a",boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>VP</div>
        <div><h4>Thanh toán VNPay</h4><p>Bấm nút bên dưới để chuyển đến cổng thanh toán</p></div>
      </div>
      <div className="co-vnpay-body">
        <div className="co-vnpay-logo">💳</div>
        <p>Bạn sẽ được chuyển đến <strong>VNPay Sandbox</strong> để hoàn tất thanh toán an toàn qua thẻ ngân hàng hoặc QR.</p>
        <span className="sandbox-badge">🧪 Môi trường Sandbox Test</span>
      </div>
    </div>
  );
}

function MoMoBox({ amount }) {
  return (
    <div className="co-momo-box">
      <div className="co-momo-header">
        <div style={{width:38,height:38,borderRadius:10,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>💜</div>
        <div><h4>Chuyển tiền MoMo</h4><p>Chuyển khoản nhanh qua ví MoMo</p></div>
      </div>
      <div className="co-momo-body">
        <div className="co-momo-row">
          <div><div className="co-momo-row-label">Số điện thoại</div><div className="co-momo-row-value">0900 000 000</div></div>
          <button className="co-momo-copy" type="button" onClick={()=>navigator.clipboard.writeText("0900000000").catch(()=>{})}>Sao chép</button>
        </div>
        <div className="co-momo-row">
          <div><div className="co-momo-row-label">Tên tài khoản</div><div className="co-momo-row-value" style={{fontSize:13,color:"#333",fontWeight:700}}>NGUYEN HONG TRUONG</div></div>
        </div>
        {amount>0&&(
          <div className="co-momo-row">
            <div><div className="co-momo-row-label">Số tiền</div><div className="co-momo-row-value">{fmt(amount)}</div></div>
          </div>
        )}
      </div>
    </div>
  );
}

function MapPicker({ onAddressSelect }) {
  const [query,setQuery]=useState("");
  const [loaded,setLoaded]=useState(false);
  const [addr,setAddr]=useState("");
  const search=()=>{ const q=query.trim(); if(!q)return; setLoaded(true); setAddr(q); onAddressSelect(q); };
  return (
    <>
      <div className="co-map-search">
        <input className="co-map-search-inp" placeholder="Nhập địa chỉ để xem trên bản đồ…"
          value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()}/>
        <button className="co-map-search-btn" type="button" onClick={search}>🗺 Tìm</button>
      </div>
      <div className="co-map-wrap">
        {!loaded?(
          <div className="co-map-placeholder">
            <span className="ico">🗺</span>
            <p>Nhập địa chỉ và bấm <strong>Tìm</strong><br/>để xem vị trí giao hàng</p>
          </div>
        ):(
          <>
            <iframe title="map" className="co-map-frame show"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(addr+", Việt Nam")}&z=15&output=embed&hl=vi`}
              allowFullScreen loading="lazy"/>
            <div className="co-map-label show">📍 Vị trí đã chọn</div>
          </>
        )}
      </div>
      {addr&&<div className="co-map-addr show"><span>📍</span><span>{addr}</span></div>}
    </>
  );
}

export default function CheckoutModal({
  cart, onClose, onInc, onDec, onRemove,
  customer, setCustomer,
  onSubmit, onVnpay, currentUser,
}) {
  const [success,setSuccess]=useState(false);
  const [ordNum,setOrdNum]=useState("");
  const [errors,setErrors]=useState({});
  const confettiRef=useRef(null);
  const totalAmount=cart.reduce((s,i)=>s+Number(i.price)*i.quantity,0);

  useEffect(()=>{
    if(document.getElementById("co-styles"))return;
    const tag=document.createElement("style");
    tag.id="co-styles"; tag.textContent=STYLES;
    document.head.appendChild(tag);
  },[]);

  const validate=()=>{
    const e={};
    if(!customer.customer_name?.trim()||customer.customer_name.trim().length<2) e.name="Vui lòng nhập họ tên";
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.customer_email)) e.email="Email không hợp lệ";
    if(!/^0\d{9}$/.test(customer.phone)) e.phone="SĐT phải đúng 10 số, bắt đầu bằng 0";
    if(!customer.address?.trim()||customer.address.trim().length<10) e.address="Vui lòng nhập địa chỉ chi tiết (tối thiểu 10 ký tự)";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const shootConfetti=()=>{
    const box=confettiRef.current; if(!box)return;
    for(let i=0;i<50;i++){
      const d=document.createElement("div"); d.className="co-cf";
      const size=5+Math.random()*9;
      d.style.cssText=[`left:${Math.random()*100}%`,`background:${CF_COLORS[i%CF_COLORS.length]}`,`width:${size}px`,`height:${size}px`,`border-radius:${Math.random()>.5?"50%":"3px"}`,`animation-duration:${1.5+Math.random()*2.2}s`,`animation-delay:${Math.random()*.5}s`].join(";");
      box.appendChild(d); setTimeout(()=>d.remove(),4500);
    }
  };

  const handleSubmit=async e=>{
    e.preventDefault();
    if(!validate())return;
    if(cart.length===0){alert("Giỏ hàng đang trống");return;}
    if(customer.payment_method==="VNPay Sandbox"){await onVnpay();return;}
    try{ await onSubmit(e); setOrdNum(genOrderId()); setSuccess(true); setTimeout(shootConfetti,220); }
    catch{/* handled in onSubmit */}
  };

  const payMethod=customer.payment_method;
  const setField=(key,val)=>{
    setCustomer(prev=>({...prev,[key]:val}));
    if(errors[key])setErrors(prev=>{const n={...prev};delete n[key];return n;});
  };

  const payLabel={ COD:"Tiền mặt (COD)", "Chuyển khoản test":"Chuyển khoản BIDV", "VNPay Sandbox":"VNPay Sandbox", MoMo:"MoMo" }[payMethod]||payMethod;

  const submitClass = payMethod==="VNPay Sandbox"?"vnpay":payMethod==="Chuyển khoản test"?"bank":"";

  return (
    <div className="co-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="co-modal">
        <div className="co-confetti" ref={confettiRef}/>

        {/* HEADER */}
        <div className="co-hdr">
          <div className="co-hdr-left">
            <div className="co-hdr-brand">
              <div className="co-hdr-logo">🍃</div>
              <div><h2>Giỏ hàng &amp; Thanh toán</h2><p>Thanh Chương Trà — Hương xanh xứ Nghệ</p></div>
            </div>
          </div>
          <button className="co-hdr-close" type="button" onClick={onClose}>✕</button>
        </div>

        {!success&&<Steps active={2}/>}

        {/* SUCCESS */}
        <div className={`co-success${success?" show":""}`}>
          <div className="co-success-ring">✓</div>
          <h2>Đặt hàng thành công! 🎉</h2>
          <p className="sub">Cảm ơn bạn đã tin tưởng Thanh Chương Trà.<br/>Chúng tôi sẽ liên hệ xác nhận trong vòng <strong>30 phút</strong>.</p>
          <div className="co-order-card">
            <div className="co-order-row"><span className="lbl">Mã đơn hàng</span><span className="val">#{ordNum}</span></div>
            <div className="co-order-row"><span className="lbl">Khách hàng</span><span className="val">{customer.customer_name}</span></div>
            <div className="co-order-row"><span className="lbl">Điện thoại</span><span className="val">{customer.phone}</span></div>
            <div className="co-order-row"><span className="lbl">Địa chỉ</span><span className="val">{customer.address}</span></div>
            <div className="co-order-row"><span className="lbl">Thanh toán</span><span className="val">{payLabel}</span></div>
            <div className="co-order-row big"><span className="lbl">Tổng tiền</span><span className="val">{fmt(totalAmount)}</span></div>
          </div>
          <button className="co-success-btn" type="button" onClick={onClose}>Tiếp tục mua sắm 🍃</button>
        </div>

        {/* MAIN */}
        {!success&&(
          <div className="co-body">
            {cart.length===0?(
              <div className="co-empty">
                <div className="co-empty-icon">🛒</div>
                <p>Giỏ hàng của bạn đang trống</p>
              </div>
            ):(
              <form className="co-layout" onSubmit={handleSubmit} noValidate>

                {/* LEFT */}
                <div className="co-left">
                  <div className="co-sec-title">Sản phẩm đã chọn</div>
                  <div className="co-cart-list">
                    {cart.map(item=>(
                      <div className="co-cart-item" key={item.id}>
                        <div>
                          <div className="co-item-name">{item.name}</div>
                          <div className="co-item-sub">{item.weight||""}</div>
                          <div className="co-item-price">{fmt(item.price)} × {item.quantity} = <span className="co-item-total">{fmt(item.price*item.quantity)}</span></div>
                        </div>
                        <div className="co-qty-ctrl">
                          <button className="co-qty-btn" type="button" onClick={()=>onDec(item.id)}>−</button>
                          <span className="co-qty-num">{item.quantity}</span>
                          <button className="co-qty-btn" type="button" onClick={()=>onInc(item.id)}>+</button>
                        </div>
                        <button className="co-remove" type="button" onClick={()=>onRemove(item.id)}>✕</button>
                      </div>
                    ))}
                  </div>

                  <div className="co-total-box">
                    <div className="co-total-row"><span>Tạm tính</span><span>{fmt(totalAmount)}</span></div>
                    <div className="co-total-row"><span>Phí vận chuyển</span><span className="free">Miễn phí</span></div>
                    <div className="co-total-divider"/>
                    <div className="co-total-big">
                      <span className="lbl">Tổng thanh toán</span>
                      <span className="amt">{fmt(totalAmount)}</span>
                    </div>
                  </div>

                  <div className="co-sec-title">Phương thức thanh toán</div>
                  <div className="co-pay-grid">
                    {PAY_OPTS.map(opt=>(
                      <div key={opt.id}
                        className={`co-pay-opt${payMethod===opt.id?" active":""}`}
                        onClick={()=>setCustomer(prev=>({
                          ...prev, payment_method:opt.id,
                          bank_name:       opt.id==="Chuyển khoản test"?"BIDV":"",
                          bank_account:    opt.id==="Chuyển khoản test"?"5180971464":"",
                          account_holder:  opt.id==="Chuyển khoản test"?"NGUYEN HONG TRUONG":"",
                          otp:             opt.id==="Chuyển khoản test"?"123456":"",
                        }))}>
                        <span className="co-pay-icon">{opt.icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700}}>{opt.label}</div>
                          <div style={{fontSize:10,color:"#aaa",marginTop:2}}>{opt.sub}</div>
                        </div>
                        <div className="co-pay-check">✓</div>
                      </div>
                    ))}
                  </div>

                  {payMethod==="Chuyển khoản test"&&<BankInfoBox amount={totalAmount}/>}
                  {payMethod==="VNPay Sandbox"&&<VNPayBox/>}
                  {payMethod==="MoMo"&&<MoMoBox amount={totalAmount}/>}
                </div>

                {/* RIGHT */}
                <div className="co-right">
                  <div className="co-sec-title">Thông tin giao hàng</div>

                  <div className="co-field">
                    <div className="co-label">Họ và tên <span className="req">*</span></div>
                    <input className={`co-inp${errors.name?" err":""}`} placeholder="Nguyễn Văn A"
                      value={customer.customer_name||""} onChange={e=>setField("customer_name",e.target.value)}/>
                    {errors.name&&<div className="co-err show">{errors.name}</div>}
                  </div>

                  <div className="co-field">
                    <div className="co-label">Email <span className="req">*</span></div>
                    <input className={`co-inp${errors.email?" err":""}`} type="email" placeholder="email@gmail.com"
                      value={customer.customer_email||""} onChange={e=>setField("customer_email",e.target.value)}/>
                    {errors.email&&<div className="co-err show">{errors.email}</div>}
                  </div>

                  <div className="co-field">
                    <div className="co-label">Số điện thoại <span className="req">*</span> <span className="hint">(10 số)</span></div>
                    <input className={`co-inp${errors.phone?" err":""}`} placeholder="0912 345 678"
                      value={customer.phone||""} maxLength={10}
                      onChange={e=>setField("phone",e.target.value.replace(/\D/g,""))}/>
                    {errors.phone&&<div className="co-err show">{errors.phone}</div>}
                  </div>

                  <div className="co-field">
                    <div className="co-label">📍 Địa chỉ nhận hàng <span className="req">*</span></div>
                    <MapPicker onAddressSelect={addr=>setField("address",addr)}/>
                    <textarea className={`co-inp${errors.address?" err":""}`}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                      value={customer.address||""} rows={2}
                      style={{marginTop:8,minHeight:62,resize:"vertical"}}
                      onChange={e=>setField("address",e.target.value)}/>
                    {errors.address&&<div className="co-err show">{errors.address}</div>}
                  </div>

                  <div className="co-field">
                    <div className="co-label">Ghi chú</div>
                    <textarea className="co-inp" placeholder="Giao giờ hành chính, gọi trước khi giao…"
                      value={customer.note||""} rows={2}
                      style={{minHeight:58,resize:"vertical"}}
                      onChange={e=>setField("note",e.target.value)}/>
                  </div>

                  <div className="co-order-summary">
                    <div className="co-order-summary-row"><span className="lbl">Sản phẩm</span><span className="val">{cart.length} loại</span></div>
                    <div className="co-order-summary-row"><span className="lbl">Vận chuyển</span><span className="val" style={{color:"#1f7a36"}}>Miễn phí</span></div>
                    <div className="co-order-summary-row total"><span className="lbl">Tổng thanh toán</span><span className="val">{fmt(totalAmount)}</span></div>
                  </div>

                  <button className={`co-submit${submitClass?" "+submitClass:""}`} type="submit">
                    {payMethod==="VNPay Sandbox"
                      ? <><span>💳</span> Thanh toán qua VNPay</>
                      : payMethod==="Chuyển khoản test"
                      ? <><span>🏦</span> Xác nhận &amp; Chuyển khoản BIDV</>
                      : payMethod==="MoMo"
                      ? <><span>💜</span> Xác nhận đơn hàng MoMo</>
                      : <><span>✅</span> Xác nhận đặt hàng</>}
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
