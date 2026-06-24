import { useEffect, useMemo, useState } from "react";
import "./admin.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://thanh-chuong-tra-fullstack.onrender.com";

async function fetchJson(path) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${path}: HTTP ${response.status} - ${text.slice(0, 120)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${path}: backend không trả dữ liệu JSON hợp lệ`);
  }
}

function toCsvCell(value) {
  const safeValue = String(value ?? "").replace(/"/g, '""');
  return `"${safeValue}"`;
}

function downloadCsv(filename, rows) {
  const csv = "\uFEFF" + rows.map((row) => row.map(toCsvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + "đ";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN", {
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const normalize = (value) => String(value ?? "").trim().toLowerCase();
const normalizePlain = (value) =>
  normalize(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const CANCELLED_ORDER_STATUS = "Đã hủy đơn hàng";
const isPaidStatus = value => {
  const status = normalize(value);
  return status.includes("đã thanh toán") || status.includes("đã giao cod và thu tiền");
};
const isCancelledStatus = value => {
  const status = normalize(value);
  const plainStatus = normalizePlain(value);
  return status.includes("đã hủy đơn") || plainStatus.includes("da huy don");
};
const isFailedStatus = value => normalize(value).includes("thất bại");
const isDeliveredCodStatus = value => normalize(value).includes("đã giao cod và thu tiền");
const canCancelOrder = order =>
  order && !isCancelledStatus(order.payment_status) && !isFailedStatus(order.payment_status) && !isDeliveredCodStatus(order.payment_status);

// Tính giá sau giảm
function calcSalePrice(price, discountPercent, discountAmount) {
  let p = Number(price || 0);
  if (discountPercent > 0) p = p * (1 - discountPercent / 100);
  else if (discountAmount > 0) p = p - discountAmount;
  return Math.max(0, Math.round(p));
}

// ===================== BIỂU ĐỒ DOANH THU =====================

function RevenueChart({ orders }) {
  const [viewMode, setViewMode] = useState("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const paidOrders = orders.filter((o) =>
    isPaidStatus(o.payment_status)
  );

  const years = useMemo(() => {
    const set = new Set(
      paidOrders.map((o) => new Date(o.created_at).getFullYear())
    );
    return [...set].sort((a, b) => b - a);
  }, [paidOrders]);

  const monthlyData = useMemo(() => {
    const map = {};
    for (let m = 1; m <= 12; m++) map[m] = 0;
    paidOrders.forEach((o) => {
      const d = new Date(o.created_at);
      if (d.getFullYear() === selectedYear) {
        map[d.getMonth() + 1] += Number(o.total_amount || 0);
      }
    });
    return Object.entries(map).map(([month, revenue]) => ({
      label: `T${month}`,
      revenue,
    }));
  }, [paidOrders, selectedYear]);

  const yearlyData = useMemo(() => {
    const map = {};
    paidOrders.forEach((o) => {
      const y = new Date(o.created_at).getFullYear();
      map[y] = (map[y] || 0) + Number(o.total_amount || 0);
    });
    return Object.entries(map)
      .sort((a, b) => a[0] - b[0])
      .map(([year, revenue]) => ({ label: year, revenue }));
  }, [paidOrders]);

  const data = viewMode === "month" ? monthlyData : yearlyData;
  const maxVal = Math.max(...data.map((d) => d.revenue), 1);

  const totalDisplayed =
    viewMode === "month"
      ? monthlyData.reduce((s, d) => s + d.revenue, 0)
      : yearlyData.reduce((s, d) => s + d.revenue, 0);

  const bestItem = data.reduce(
    (best, d) => (d.revenue > best.revenue ? d : best),
    data[0] || { label: "-", revenue: 0 }
  );

  return (
    <div className="revenue-chart-card">
      <div className="revenue-chart-header">
        <div>
          <h2>Biểu đồ doanh thu</h2>
          <span>Chỉ tính đơn đã thanh toán</span>
        </div>
        <div className="revenue-chart-controls">
          <div className="tab-toggle">
            <button
              className={viewMode === "month" ? "active" : ""}
              onClick={() => setViewMode("month")}
            >
              Theo tháng
            </button>
            <button
              className={viewMode === "year" ? "active" : ""}
              onClick={() => setViewMode("year")}
            >
              Theo năm
            </button>
          </div>
          {viewMode === "month" && years.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="year-select"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="revenue-summary-row">
        <div className="revenue-summary-item">
          <span>Tổng doanh thu</span>
          <strong>{formatMoney(totalDisplayed)}</strong>
        </div>
        <div className="revenue-summary-item">
          <span>{viewMode === "month" ? "Tháng cao nhất" : "Năm cao nhất"}</span>
          <strong>
            {bestItem?.label} — {formatMoney(bestItem?.revenue)}
          </strong>
        </div>
        <div className="revenue-summary-item">
          <span>Đơn đã thanh toán</span>
          <strong>{paidOrders.length} đơn</strong>
        </div>
      </div>

      <div className="bar-chart">
        {data.map((item) => {
          const pct = maxVal > 0 ? (item.revenue / maxVal) * 100 : 0;
          return (
            <div key={item.label} className="bar-col">
              <div className="bar-tooltip">{formatMoney(item.revenue)}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ height: `${pct}%` }} />
              </div>
              <div className="bar-label">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== TOP SẢN PHẨM BÁN CHẠY =====================

function TopProducts({ orders, products }) {
  // Sắp xếp sản phẩm theo sold_count giảm dần
  const topSelling = useMemo(() => {
    return [...products]
      .sort((a, b) => Number(b.sold_count || 0) - Number(a.sold_count || 0))
      .slice(0, 5);
  }, [products]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [orders]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* Top bán chạy */}
      <div className="recent-orders-card">
        <h2>🔥 Sản phẩm bán chạy</h2>
        <div className="recent-orders-list">
          {topSelling.length === 0 && (
            <p className="admin-empty">Chưa có dữ liệu bán hàng.</p>
          )}
          {topSelling.map((p, i) => (
            <div key={p.id} className="recent-order-row">
              <div className="recent-order-info">
                <strong>#{i + 1} — {p.name}</strong>
                <span>{p.category} · {p.weight}</span>
              </div>
              <div className="recent-order-right">
                <span className="admin-status is-paid">
                  {Number(p.sold_count || 0)} đã bán
                </span>
                <strong>{formatMoney(p.price)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Đơn hàng gần đây */}
      <div className="recent-orders-card">
        <h2>Đơn hàng gần đây</h2>
        <div className="recent-orders-list">
          {recentOrders.length === 0 && (
            <p className="admin-empty">Chưa có đơn hàng nào.</p>
          )}
          {recentOrders.map((order) => (
            <div key={order.id} className="recent-order-row">
              <div className="recent-order-info">
                <strong>#{order.id} — {order.customer_name}</strong>
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div className="recent-order-right">
                <span className={`admin-status ${getOrderStatusClass(order.payment_status)}`}>
                  {order.payment_status}
                </span>
                <strong>{formatMoney(order.total_amount)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getOrderStatusClass(status) {
  const normalized = normalize(status);
  if (isPaidStatus(normalized)) return "is-paid";
  if (normalized.includes("thất bại") || isCancelledStatus(normalized)) return "is-failed";
  if (normalized.includes("chờ")) return "is-pending";
  return "is-cod";
}

// ===================== MODAL SỬA SẢN PHẨM =====================

function ProductEditModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:             product.name || "",
    description:      product.description || "",
    price:             Number(product.price || 0),
    weight:            product.weight || "",
    category:          product.category || "",
    origin:            product.origin || "",
    flavor:            product.flavor || "",
    image_url:         product.image_url || "",
    discount_percent: Number(product.discount_percent || 0),
    discount_amount:  Number(product.discount_amount  || 0),
    stock:            Number(product.stock     ?? 999),
    is_hot:           Boolean(product.is_hot),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const salePrice = calcSalePrice(product.price, form.discount_percent, form.discount_amount);
  const hasDiscount = form.discount_percent > 0 || form.discount_amount > 0;

  const handleSave = async () => {
    if (!form.name.trim() || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) {
      setError("Tên sản phẩm và giá bán hợp lệ là bắt buộc.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:             form.name.trim(),
          description:      form.description.trim(),
          price:             Number(form.price),
          weight:            form.weight.trim(),
          category:          form.category.trim(),
          origin:            form.origin.trim(),
          flavor:            form.flavor.trim(),
          image_url:         form.image_url.trim(),
          discount_percent: Number(form.discount_percent),
          discount_amount:  Number(form.discount_amount),
          stock:            Number(form.stock),
          is_hot:           Boolean(form.is_hot),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi cập nhật");
      onSaved(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, padding: 28,
          width: "100%", maxWidth: 720, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: "#174421", fontSize: 18 }}>
            ✏️ Chỉnh sản phẩm
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>×</button>
        </div>

        <div style={{ marginBottom: 16, padding: "12px 16px", background: "#f8fdf5", borderRadius: 10, borderLeft: "4px solid #2d8a45" }}>
          <div style={{ fontWeight: 700, color: "#174421" }}>{product.name}</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
            Giá gốc: <strong>{formatMoney(product.price)}</strong>
            <span style={{ marginLeft: 10 }}>
              Tồn kho: <strong>{Number(product.stock ?? 0)}</strong>
            </span>
            <span style={{ marginLeft: 10 }}>
              Đã bán thực tế: <strong>{Number(product.sold_count || 0)}</strong>
            </span>
            {hasDiscount && (
              <span style={{ marginLeft: 10, color: "#d32f2f", fontWeight: 700 }}>
                → Giá bán: {formatMoney(salePrice)}
                {form.discount_percent > 0 && ` (−${form.discount_percent}%)`}
                {form.discount_amount > 0 && !form.discount_percent && ` (−${formatMoney(form.discount_amount)})`}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
            <span>Tên sản phẩm</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}><span>Danh mục</span><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle} /></label>
          <label style={labelStyle}><span>Giá gốc (đ)</span><input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} style={inputStyle} /></label>
          <label style={labelStyle}><span>Khối lượng / quy cách</span><input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} style={inputStyle} /></label>
          <label style={labelStyle}><span>Xuất xứ</span><input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} style={inputStyle} /></label>
          <label style={labelStyle}><span>Hương vị</span><input value={form.flavor} onChange={(e) => setForm({ ...form, flavor: e.target.value })} style={inputStyle} /></label>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}><span>Ảnh sản phẩm (URL)</span><input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} style={inputStyle} /></label>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}><span>Mô tả</span><textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} /></label>
          <label style={labelStyle}>
            <span>Giảm giá (%)</span>
            <input
              type="number" min="0" max="99" step="0.5"
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value), discount_amount: 0 })}
              style={inputStyle}
              placeholder="vd: 10 = giảm 10%"
            />
            <small style={{ color: "#888", fontSize: 11 }}>Nhập % hoặc số tiền, không dùng cả 2</small>
          </label>

          <label style={labelStyle}>
            <span>Giảm giá (đ)</span>
            <input
              type="number" min="0" step="1000"
              value={form.discount_amount}
              onChange={(e) => setForm({ ...form, discount_amount: Number(e.target.value), discount_percent: 0 })}
              style={inputStyle}
              placeholder="vd: 20000"
            />
            <small style={{ color: "#888", fontSize: 11 }}>Nhập số tiền giảm trực tiếp</small>
          </label>

          <label style={labelStyle}>
            <span>Tồn kho (số lượng)</span>
            <input
              type="number" min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              style={inputStyle}
              placeholder="999 = không giới hạn"
            />
            <small style={{ color: "#888", fontSize: 11 }}>999 = không giới hạn tồn kho</small>
          </label>

          <div style={{ ...labelStyle, padding: "9px 12px", borderRadius: 8, border: "1px solid #dde8d8", background: "#f7fbf5" }}>
            <span>Đã bán thực tế</span>
            <strong style={{ color: "#1565c0", fontSize: 18 }}>{Number(product.sold_count || 0)}</strong>
            <small style={{ color: "#888", fontSize: 11 }}>Tự tính từ các đơn đã thanh toán hoặc COD đã giao.</small>
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 20, padding: "12px 16px", background: "#fff8e1", borderRadius: 10, border: "1px solid #ffe082" }}>
          <input
            type="checkbox"
            checked={form.is_hot}
            onChange={(e) => setForm({ ...form, is_hot: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: "#e65100" }}
          />
          <div>
            <div style={{ fontWeight: 700, color: "#e65100" }}>🔥 Đánh dấu bán chạy</div>
            <div style={{ fontSize: 12, color: "#888" }}>
              Sản phẩm sẽ hiển thị badge "Bán chạy" trên website.
              {Number(product.sold_count || 0) >= 10 && " (Đang tự động bán chạy theo dữ liệu)"}
            </div>
          </div>
        </label>

        {error && (
          <div style={{ padding: "10px 14px", background: "#ffebee", borderRadius: 8, color: "#c62828", fontSize: 13, marginBottom: 14 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", fontWeight: 600 }}>
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: saving ? "#aaa" : "#1f7a36", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700 }}
          >
            {saving ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "flex", flexDirection: "column", gap: 4,
  fontSize: 13, fontWeight: 600, color: "#333",
};
const inputStyle = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd",
  fontSize: 14, outline: "none",
};

const emptyProductForm = {
  name: "", description: "", price: "", weight: "", category: "Đồ ăn kèm trà",
  origin: "Việt Nam", flavor: "", image_url: "", tea_type: "Đồ ăn nhẹ",
  water_color: "Không áp dụng", brewing_guide: "Mở gói và dùng trực tiếp cùng trà. Dùng lượng vừa phải.",
  storage_guide: "Đậy kín sau khi mở, để nơi khô ráo và dùng theo hạn trên bao bì.",
  discount_percent: 0, discount_amount: 0, stock: 20, is_hot: false,
};

function ProductCreateModal({ onClose, onSaved }) {
  const [form, setForm] = useState(emptyProductForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const save = async () => {
    if (!form.name.trim() || !form.price || Number(form.price) < 0) {
      setError("Vui lòng nhập tên và giá bán hợp lệ."); return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_URL}/api/products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tạo được sản phẩm");
      onSaved(data); onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  return <div className="admin-news-modal" onClick={onClose}><div className="admin-news-editor" onClick={e => e.stopPropagation()}>
    <div className="admin-news-editor-head"><h2>Thêm sản phẩm</h2><button onClick={onClose}>×</button></div>
    <div className="admin-news-form-grid">
      <label className="wide">Tên sản phẩm<input value={form.name} onChange={e => setField("name", e.target.value)} placeholder="Ví dụ: Bánh đậu xanh ít ngọt" /></label>
      <label>Danh mục<input value={form.category} onChange={e => setField("category", e.target.value)} /></label>
      <label>Giá bán (đ)<input type="number" min="0" value={form.price} onChange={e => setField("price", Number(e.target.value))} /></label>
      <label>Quy cách / khối lượng<input value={form.weight} onChange={e => setField("weight", e.target.value)} placeholder="Hộp 180g" /></label>
      <label>Tồn kho<input type="number" min="0" value={form.stock} onChange={e => setField("stock", Number(e.target.value))} /></label>
      <label>Xuất xứ<input value={form.origin} onChange={e => setField("origin", e.target.value)} /></label>
      <label>Hương vị<input value={form.flavor} onChange={e => setField("flavor", e.target.value)} /></label>
      <label className="wide">Ảnh sản phẩm (URL)<input value={form.image_url} onChange={e => setField("image_url", e.target.value)} placeholder="https://..." /></label>
      <label className="wide">Mô tả<textarea rows="3" value={form.description} onChange={e => setField("description", e.target.value)} /></label>
      <label>Giảm giá (%)<input type="number" min="0" max="99" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: Number(e.target.value), discount_amount: 0 })} /></label>
      <label>Giảm trực tiếp (đ)<input type="number" min="0" value={form.discount_amount} onChange={e => setForm({ ...form, discount_amount: Number(e.target.value), discount_percent: 0 })} /></label>
      <label className="wide">Cách dùng<input value={form.brewing_guide} onChange={e => setField("brewing_guide", e.target.value)} /></label>
      <label className="wide">Bảo quản<input value={form.storage_guide} onChange={e => setField("storage_guide", e.target.value)} /></label>
      <label className="admin-news-check wide"><input type="checkbox" checked={form.is_hot} onChange={e => setField("is_hot", e.target.checked)} /> Đánh dấu bán chạy</label>
    </div>
    {error && <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 9, background: "#fff1f0", color: "#b42318", fontSize: 12 }}>{error}</div>}
    <div className="admin-news-editor-actions"><button type="button" onClick={onClose}>Hủy</button><button type="button" className="primary" disabled={saving} onClick={save}>{saving ? "Đang lưu..." : "Tạo sản phẩm"}</button></div>
  </div></div>;
}

const emptyNewsForm={title:"",summary:"",content:"",image_url:"",category:"Kiến thức về trà",status:"draft",is_featured:false};

function NewsEditModal({ article, onClose, onSaved }) {
  const [form,setForm]=useState(article?{...emptyNewsForm,...article}:emptyNewsForm);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const save=async()=>{
    setSaving(true);setError("");
    try{
      const res=await fetch(`${API_URL}/api/admin/news${article?`/${article.id}`:""}`,{method:article?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data=await res.json();
      if(!res.ok)throw new Error(data.message||"Không lưu được bài viết");
      onSaved(data);onClose();
    }catch(err){setError(err.message);}finally{setSaving(false);}
  };
  return <div className="admin-news-modal" onClick={onClose}><div className="admin-news-editor" onClick={e=>e.stopPropagation()}>
    <div className="admin-news-editor-head"><h2>{article?"Sửa bài viết":"Thêm bài viết"}</h2><button onClick={onClose}>×</button></div>
    <div className="admin-news-form-grid">
      <label className="wide">Tiêu đề<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
      <label>Danh mục<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Kiến thức về trà</option><option>Cách pha trà</option><option>Câu chuyện thương hiệu</option><option>Khuyến mãi</option><option>Sức khỏe</option></select></label>
      <label>Trạng thái<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="draft">Bản nháp</option><option value="published">Xuất bản</option></select></label>
      <label className="wide">Ảnh đại diện (URL)<input value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://..."/></label>
      <label className="wide">Mô tả ngắn<textarea rows="3" value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})}/></label>
      <label className="wide">Nội dung bài viết<textarea rows="12" value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/></label>
      <label className="admin-news-check wide"><input type="checkbox" checked={form.is_featured} onChange={e=>setForm({...form,is_featured:e.target.checked})}/> Đánh dấu bài nổi bật</label>
    </div>
    {error&&<div className="admin-error">{error}</div>}
    <div className="admin-news-editor-actions"><button onClick={onClose}>Hủy</button><button className="primary" disabled={saving} onClick={save}>{saving?"Đang lưu...":"Lưu bài viết"}</button></div>
  </div></div>;
}

const emptyDiscountForm={code:"",description:"",discount_type:"percent",discount_value:10,min_order_amount:0,max_discount_amount:"",usage_limit:"",starts_at:"",expires_at:"",is_active:true};
const toDateTimeInput=value=>value?new Date(value).toISOString().slice(0,16):"";

function DiscountCodeModal({coupon,onClose,onSaved}){
  const [form,setForm]=useState(coupon?{...emptyDiscountForm,...coupon,starts_at:toDateTimeInput(coupon.starts_at),expires_at:toDateTimeInput(coupon.expires_at)}:emptyDiscountForm);
  const [saving,setSaving]=useState(false);
  const submit=async e=>{
    e.preventDefault();setSaving(true);
    try{
      const res=await fetch(`${API_URL}/api/admin/discount-codes${coupon?`/${coupon.id}`:""}`,{method:coupon?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data=await res.json();
      if(!res.ok)throw new Error(data.message||"Không lưu được mã giảm giá");
      onSaved(data);onClose();
    }catch(error){alert(error.message);}
    finally{setSaving(false);}
  };
  return <div className="admin-news-modal" onClick={onClose}><form className="admin-news-editor" onClick={e=>e.stopPropagation()} onSubmit={submit}>
    <div className="admin-news-editor-head"><h2>{coupon?"Sửa mã giảm giá":"Tạo mã giảm giá"}</h2><button type="button" onClick={onClose}>×</button></div>
    <div className="admin-news-form-grid">
      <label>Mã giảm giá<input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g,"")})} placeholder="VD: TRAHE2026" required/></label>
      <label>Loại giảm<select value={form.discount_type} onChange={e=>setForm({...form,discount_type:e.target.value,max_discount_amount:e.target.value==="fixed"?"":form.max_discount_amount})}><option value="percent">Theo phần trăm (%)</option><option value="fixed">Số tiền cố định (đ)</option></select></label>
      <label>Giá trị giảm<input type="number" min="1" max={form.discount_type==="percent"?100:undefined} value={form.discount_value} onChange={e=>setForm({...form,discount_value:e.target.value})} required/></label>
      <label>Đơn tối thiểu<input type="number" min="0" step="1000" value={form.min_order_amount} onChange={e=>setForm({...form,min_order_amount:e.target.value})}/></label>
      <label>Mức giảm tối đa<input type="number" min="0" step="1000" value={form.max_discount_amount} onChange={e=>setForm({...form,max_discount_amount:e.target.value})} placeholder="Để trống nếu không giới hạn" disabled={form.discount_type==="fixed"}/></label>
      <label>Giới hạn lượt dùng<input type="number" min="1" value={form.usage_limit} onChange={e=>setForm({...form,usage_limit:e.target.value})} placeholder="Để trống nếu không giới hạn"/></label>
      <label>Bắt đầu<input type="datetime-local" value={form.starts_at} onChange={e=>setForm({...form,starts_at:e.target.value})}/></label>
      <label>Hết hạn<input type="datetime-local" value={form.expires_at} onChange={e=>setForm({...form,expires_at:e.target.value})}/></label>
      <label className="wide">Mô tả<input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Ưu đãi dành cho khách hàng..."/></label>
      <label className="admin-news-check wide"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Cho phép khách sử dụng mã</label>
    </div>
    <div className="admin-news-editor-actions"><button type="button" onClick={onClose}>Hủy</button><button className="primary" type="submit" disabled={saving}>{saving?"Đang lưu...":"Lưu mã"}</button></div>
  </form></div>;
}

function ShippingEditModal({ order, onClose, onSaved }) {
  const [form, setForm] = useState({
    shipping_carrier: order.shipping_carrier || "GHN",
    tracking_code: order.tracking_code || "",
    tracking_url: order.tracking_url || "",
    shipping_status: order.shipping_status || "Đã tạo vận đơn GHN - chờ lấy hàng",
  });
  const [ghnForm, setGhnForm] = useState({
    to_district_id: "",
    to_ward_code: "",
    weight: 500,
    length: 20,
    width: 15,
    height: 8,
    required_note: "CHOXEMHANGKHONGTHU",
  });
  const [saving, setSaving] = useState(false);
  const [creatingGhn, setCreatingGhn] = useState(false);
  const [ghnLoading, setGhnLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setGhnLoading(true);
    fetchJson("/api/admin/ghn/provinces")
      .then(data => {
        if (!ignore) setProvinces(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setGhnLoading(false);
      });
    return () => { ignore = true; };
  }, []);

  const useGhn = () => {
    setForm(prev => ({
      ...prev,
      shipping_carrier: "GHN",
      shipping_status: "Đã tạo vận đơn GHN - chờ lấy hàng",
    }));
  };

  const selectProvince = async provinceId => {
    setSelectedProvinceId(provinceId);
    setDistricts([]);
    setWards([]);
    setGhnForm(prev => ({ ...prev, to_district_id: "", to_ward_code: "" }));
    if (!provinceId) return;
    setGhnLoading(true);
    setError("");
    try {
      const data = await fetchJson(`/api/admin/ghn/districts?province_id=${encodeURIComponent(provinceId)}`);
      setDistricts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setGhnLoading(false);
    }
  };

  const selectDistrict = async districtId => {
    setGhnForm(prev => ({ ...prev, to_district_id: districtId, to_ward_code: "" }));
    setWards([]);
    if (!districtId) return;
    setGhnLoading(true);
    setError("");
    try {
      const data = await fetchJson(`/api/admin/ghn/wards?district_id=${encodeURIComponent(districtId)}`);
      setWards(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setGhnLoading(false);
    }
  };

  const createGhnOrder = async () => {
    setCreatingGhn(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${order.id}/create-ghn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ghnForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không tạo được vận đơn GHN");
      onSaved(data);
      setForm({
        shipping_carrier: data.shipping_carrier || "GHN",
        tracking_code: data.tracking_code || "",
        tracking_url: data.tracking_url || "",
        shipping_status: data.shipping_status || "Đã tạo vận đơn GHN - chờ lấy hàng",
      });
      alert(data.message || "Đã tạo vận đơn GHN");
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingGhn(false);
    }
  };

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${order.id}/shipping`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không cập nhật được vận đơn");
      onSaved(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-news-modal" onClick={onClose}>
      <form className="admin-news-editor shipping-editor" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="admin-news-editor-head">
          <h2>Cập nhật vận đơn #{order.id}</h2>
          <button type="button" onClick={onClose}>x</button>
        </div>
        <div className="admin-shipping-note">
          Dùng GHN cho vận đơn thật. Nếu backend đã cấu hình GHN_TOKEN, GHN_SHOP_ID và địa chỉ lấy hàng, bạn có thể tạo vận đơn tự động ngay tại đây. Nếu chưa có mã khu vực GHN, vẫn có thể tạo đơn trên GHN rồi dán mã vận đơn vào phần bên dưới.
        </div>
        <button className="admin-row-btn ghn-preset-btn" type="button" onClick={useGhn}>Dùng GHN</button>
        <div className="admin-ghn-create">
          <h3>Tạo vận đơn GHN tự động</h3>
          <div className="admin-news-form-grid">
            <label>Tỉnh/thành người nhận
              <select value={selectedProvinceId} onChange={e => selectProvince(e.target.value)} disabled={ghnLoading}>
                <option value="">Chon tinh/thanh</option>
                {provinces.map(province => (
                  <option key={province.ProvinceID} value={province.ProvinceID}>{province.ProvinceName}</option>
                ))}
              </select>
            </label>
            <label>Quận/huyện người nhận
              <select value={ghnForm.to_district_id} onChange={e => selectDistrict(e.target.value)} disabled={!selectedProvinceId || ghnLoading}>
                <option value="">Chon quan/huyen</option>
                {districts.map(district => (
                  <option key={district.DistrictID} value={district.DistrictID}>{district.DistrictName}</option>
                ))}
              </select>
            </label>
            <label>Phường/xã người nhận
              <select value={ghnForm.to_ward_code} onChange={e => setGhnForm({ ...ghnForm, to_ward_code: e.target.value })} disabled={!ghnForm.to_district_id || ghnLoading}>
                <option value="">Chon phuong/xa</option>
                {wards.map(ward => (
                  <option key={ward.WardCode} value={ward.WardCode}>{ward.WardName}</option>
                ))}
              </select>
            </label>
            <label>Mã GHN đã chọn
              <input value={ghnForm.to_district_id && ghnForm.to_ward_code ? `${ghnForm.to_district_id} / ${ghnForm.to_ward_code}` : ""} readOnly placeholder="district_id / ward_code" />
            </label>
            <label>Cân nặng (gram)
              <input type="number" min="1" value={ghnForm.weight} onChange={e => setGhnForm({ ...ghnForm, weight: Number(e.target.value) })} />
            </label>
            <label>Kích thước D x R x C (cm)
              <div className="admin-size-row">
                <input type="number" min="1" value={ghnForm.length} onChange={e => setGhnForm({ ...ghnForm, length: Number(e.target.value) })} />
                <input type="number" min="1" value={ghnForm.width} onChange={e => setGhnForm({ ...ghnForm, width: Number(e.target.value) })} />
                <input type="number" min="1" value={ghnForm.height} onChange={e => setGhnForm({ ...ghnForm, height: Number(e.target.value) })} />
              </div>
            </label>
            <label className="wide">Ghi chú giao hàng GHN
              <select value={ghnForm.required_note} onChange={e => setGhnForm({ ...ghnForm, required_note: e.target.value })}>
                <option value="CHOXEMHANGKHONGTHU">Cho xem hàng, không cho thử</option>
                <option value="CHOTHUHANG">Cho thử hàng</option>
                <option value="KHONGCHOXEMHANG">Không cho xem hàng</option>
              </select>
            </label>
          </div>
          <button className="admin-row-btn ghn-create-btn" type="button" onClick={createGhnOrder} disabled={creatingGhn}>
            {creatingGhn ? "Đang tạo vận đơn GHN..." : "Tạo vận đơn GHN tự động"}
          </button>
        </div>
        <div className="admin-news-form-grid">
          <label>Đơn vị vận chuyển
            <select value={form.shipping_carrier} onChange={e => setForm({ ...form, shipping_carrier: e.target.value })}>
              <option value="GHN">GHN</option>
            </select>
          </label>
          <label>Mã vận đơn
            <input value={form.tracking_code} onChange={e => setForm({ ...form, tracking_code: e.target.value })} placeholder="Nhập mã GHN thật sau khi tạo vận đơn" />
          </label>
          <label>Trạng thái giao hàng
            <select value={form.shipping_status} onChange={e => setForm({ ...form, shipping_status: e.target.value })}>
              <option>Chờ shop xử lý</option>
              <option>Đã tạo vận đơn GHN - chờ lấy hàng</option>
              <option>GHN đã lấy hàng</option>
              <option>Đã bàn giao vận chuyển</option>
              <option>Đang trung chuyển</option>
              <option>Đang giao hàng</option>
              <option>Giao hàng thành công</option>
              <option>Giao không thành công</option>
              <option>Đã hủy vận đơn</option>
            </select>
          </label>
          <label>Link theo dõi
            <input value={form.tracking_url} onChange={e => setForm({ ...form, tracking_url: e.target.value })} placeholder="https://..." />
          </label>
        </div>
        {error && <div className="admin-error">{error}</div>}
        <div className="admin-news-editor-actions">
          <button type="button" onClick={onClose}>Hủy</button>
          <button className="primary" type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu vận đơn"}</button>
        </div>
      </form>
    </div>
  );
}

// ===================== TRANG CHÍNH =====================

function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    sessionStorage.getItem("thanh_chuong_admin") === "true"
  );
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [news,setNews]=useState([]);
  const [newsComments,setNewsComments]=useState([]);
  const [discountCodes,setDiscountCodes]=useState([]);
  const [loyalCustomers,setLoyalCustomers]=useState([]);
  const [orderFeedback,setOrderFeedback]=useState([]);
  const [editingDiscount,setEditingDiscount]=useState(null);
  const [showDiscountEditor,setShowDiscountEditor]=useState(false);
  const [editingNews,setEditingNews]=useState(null);
  const [showNewsEditor,setShowNewsEditor]=useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductCreator, setShowProductCreator] = useState(false);
  const [productFilter, setProductFilter] = useState("all"); // all | hot | discount | low_stock
  const [confirmingCodId, setConfirmingCodId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [editingShippingOrder, setEditingShippingOrder] = useState(null);
  const [cancelledOrderIds, setCancelledOrderIds] = useState(() => new Set());
  const [cancellingOrderIds, setCancellingOrderIds] = useState(() => new Set());

  const fetchAdminData = async () => {
    setLoading(true);
    setErrors([]);
    const requests = [
      ["products", "/api/products", setProducts],
      ["orders", "/api/admin/orders", setOrders],
      ["contacts", "/api/admin/contacts", setContacts],
      ["chat", "/api/admin/chat-messages", setChatMessages],
      ["news", "/api/admin/news", setNews],
      ["newsComments", "/api/admin/news-comments", setNewsComments],
      ["discountCodes", "/api/admin/discount-codes", setDiscountCodes],
      ["loyalCustomers", "/api/admin/loyal-customers", setLoyalCustomers],
      ["orderFeedback", "/api/admin/order-feedback", setOrderFeedback],
    ];
    const results = await Promise.allSettled(
      requests.map(async ([, path, setter]) => {
        const data = await fetchJson(path);
        setter(Array.isArray(data) ? data : []);
      })
    );
    const newErrors = results
      .map((result, index) => {
        if (result.status === "fulfilled") return null;
        return `${requests[index][1]}: ${result.reason?.message || "Không tải được dữ liệu"}`;
      })
      .filter(Boolean);
    setErrors(newErrors);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn) fetchAdminData();
  }, [isLoggedIn]);

  const handleLogin = (event) => {
    event.preventDefault();
    if (loginForm.username === "admin" && loginForm.password === "123456") {
      sessionStorage.setItem("thanh_chuong_admin", "true");
      setIsLoggedIn(true);
      return;
    }
    alert("Tài khoản hoặc mật khẩu quản trị không đúng");
  };

  const logout = () => {
    sessionStorage.removeItem("thanh_chuong_admin");
    setIsLoggedIn(false);
  };

  const paidOrders = useMemo(
    () => orders.filter((o) => isPaidStatus(o.payment_status)),
    [orders]
  );

  const cancelledOrders = useMemo(
    () => orders.filter((o) => isCancelledStatus(o.payment_status)),
    [orders]
  );

  const failedOrders = useMemo(
    () => orders.filter((o) => isFailedStatus(o.payment_status)),
    [orders]
  );

  const totalRevenue = useMemo(
    () => paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    [paidOrders]
  );

  const thisMonthRevenue = useMemo(() => {
    const now = new Date();
    return paidOrders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  }, [paidOrders]);

  const lastMonthRevenue = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return paidOrders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
      })
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  }, [paidOrders]);

  const growthPct =
    lastMonthRevenue > 0
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : null;

  const filteredOrders = useMemo(() => {
    const search = normalize(searchTerm);
    return orders.filter((order) => {
      const status = normalize(order.payment_status);
      const matchesStatus =
        orderFilter === "all" ||
        (orderFilter === "paid" && isPaidStatus(status)) ||
        (orderFilter === "unpaid" && !isPaidStatus(status) && !isCancelledStatus(status) && !isFailedStatus(status)) ||
        (orderFilter === "cancelled" && isCancelledStatus(status)) ||
        (orderFilter === "cod" && normalize(order.payment_method).includes("cod")) ||
        (orderFilter === "vnpay" && normalize(order.payment_method).includes("vnpay"));
      const matchesSearch =
        !search ||
        [order.id, order.customer_name, order.customer_email, order.phone, order.address, order.payment_method, order.payment_status, order.shipping_carrier, order.tracking_code, order.shipping_status]
          .some((v) => normalize(v).includes(search));
      return matchesStatus && matchesSearch;
    });
  }, [orders, searchTerm, orderFilter]);

  const filteredProducts = useMemo(() => {
    const search = normalize(searchTerm);
    return products
      .filter((p) => {
        if (productFilter === "hot") return p.is_hot || Number(p.sold_count || 0) >= 10;
        if (productFilter === "discount") return Number(p.discount_percent || 0) > 0 || Number(p.discount_amount || 0) > 0;
        if (productFilter === "low_stock") return Number(p.stock ?? 999) < 10;
        return true;
      })
      .filter((p) =>
        !search ? true : [p.id, p.name, p.category, p.weight, p.origin].some((v) => normalize(v).includes(search))
      );
  }, [products, searchTerm, productFilter]);

  const filteredContacts = useMemo(() => {
    const search = normalize(searchTerm);
    return contacts.filter((c) =>
      !search ? true : [c.id, c.name, c.phone, c.email, c.message].some((v) => normalize(v).includes(search))
    );
  }, [contacts, searchTerm]);

  const filteredChatMessages = useMemo(() => {
    const search = normalize(searchTerm);
    return chatMessages.filter((m) =>
      !search ? true : [m.id, m.customer_name, m.customer_email, m.user_message, m.bot_reply].some((v) => normalize(v).includes(search))
    );
  }, [chatMessages, searchTerm]);

  const filteredNews=useMemo(()=>{const search=normalize(searchTerm);return news.filter(n=>!search||[n.title,n.category,n.summary,n.status].some(v=>normalize(v).includes(search)));},[news,searchTerm]);
  const filteredNewsComments=useMemo(()=>{const search=normalize(searchTerm);return newsComments.filter(c=>!search||[c.customer_name,c.customer_email,c.content,c.news_title,c.status].some(v=>normalize(v).includes(search)));},[newsComments,searchTerm]);
  const filteredDiscountCodes=useMemo(()=>{const search=normalize(searchTerm);return discountCodes.filter(c=>!search||[c.code,c.description,c.discount_type,c.customer_email].some(v=>normalize(v).includes(search)));},[discountCodes,searchTerm]);
  const filteredLoyalCustomers=useMemo(()=>{const search=normalize(searchTerm);return loyalCustomers.filter(c=>!search||[c.customer_name,c.customer_email,c.phone,c.loyalty_tier].some(v=>normalize(v).includes(search)));},[loyalCustomers,searchTerm]);
  const filteredOrderFeedback=useMemo(()=>{const search=normalize(searchTerm);return orderFeedback.filter(f=>!search||[f.order_id,f.customer_name,f.customer_email,f.product_names,f.comment,f.product_rating,f.service_rating].some(v=>normalize(v).includes(search)));},[orderFeedback,searchTerm]);

  const getTabCount = (tab) => {
    if (tab === "orders") return orders.length;
    if (tab === "products") return products.length;
    if (tab === "contacts") return contacts.length;
    if (tab === "chat") return chatMessages.length;
    if (tab === "news") return news.length;
    if (tab === "newsComments") return newsComments.filter(c=>c.status==="pending").length;
    if (tab === "discountCodes") return discountCodes.length;
    if (tab === "loyalCustomers") return loyalCustomers.length;
    if (tab === "orderFeedback") return orderFeedback.length;
    return null;
  };

  const exportCurrentTable = () => {
    if(activeTab==="loyalCustomers") {
      downloadCsv("khach-hang-than-thiet.csv",[["Khách hàng","Email","Điện thoại","Số đơn đã thanh toán","Tổng chi tiêu","Hạng","Đơn gần nhất"],...filteredLoyalCustomers.map(c=>[c.customer_name,c.customer_email,c.phone,c.paid_orders,c.total_spent,c.loyalty_tier,formatDate(c.last_order_at)])]);
      return;
    }
    if(activeTab==="orderFeedback") {
      downloadCsv("phan-hoi-san-pham.csv",[["Đơn hàng","Khách hàng","Email","Sản phẩm","Sao sản phẩm","Sao dịch vụ","Phản hồi","Ngày gửi"],...filteredOrderFeedback.map(f=>[f.order_id,f.customer_name,f.customer_email,f.product_names,f.product_rating,f.service_rating,f.comment,formatDate(f.updated_at)])]);
      return;
    }
    if (activeTab === "orders") {
      downloadCsv("don-hang-thanh-chuong-tra.csv", [
        ["Mã đơn", "Khách hàng", "Email", "Số điện thoại", "Địa chỉ", "Tổng tiền", "Phương thức", "Trạng thái", "Ngày đặt"],
        ...filteredOrders.map((o) => [o.id, o.customer_name, o.customer_email, o.phone, o.address, o.total_amount, o.payment_method, o.payment_status, formatDate(o.created_at)]),
      ]);
    } else if (activeTab === "products") {
      downloadCsv("san-pham-thanh-chuong-tra.csv", [
        ["ID", "Tên sản phẩm", "Danh mục", "Khối lượng", "Giá gốc", "Giảm %", "Giảm đ", "Tồn kho", "Đã bán", "Bán chạy", "Xuất xứ"],
        ...filteredProducts.map((p) => [
          p.id, p.name, p.category, p.weight, p.price,
          p.discount_percent || 0, p.discount_amount || 0,
          p.stock ?? 999, p.sold_count || 0, p.is_hot ? "Có" : "Không", p.origin,
        ]),
      ]);
    } else if (activeTab === "contacts") {
      downloadCsv("lien-he-thanh-chuong-tra.csv", [
        ["ID", "Khách hàng", "Số điện thoại", "Email", "Nội dung", "Ngày gửi"],
        ...filteredContacts.map((c) => [c.id, c.name, c.phone, c.email, c.message, formatDate(c.created_at)]),
      ]);
    } else if(activeTab === "chat") {
      downloadCsv("chatbot-thanh-chuong-tra.csv", [
        ["ID", "Khách hàng", "Email", "Câu hỏi", "Phản hồi chatbot", "Thời gian"],
        ...filteredChatMessages.map((m) => [m.id, m.customer_name, m.customer_email, m.user_message, m.bot_reply, formatDate(m.created_at)]),
      ]);
    } else if(activeTab==="discountCodes") downloadCsv("ma-giam-gia.csv",[["Mã","Email được dùng","Loại","Giá trị","Đơn tối thiểu","Đã dùng","Giới hạn","Trạng thái","Hết hạn"],...filteredDiscountCodes.map(c=>[c.code,c.customer_email||"Mọi khách hàng",c.discount_type,c.discount_value,c.min_order_amount,c.used_count,c.usage_limit||"Không giới hạn",c.is_active?"Bật":"Tắt",c.expires_at||""])]);
    else if(activeTab==="news") downloadCsv("tin-tuc-thanh-chuong-tra.csv",[["ID","Tiêu đề","Danh mục","Trạng thái","Nổi bật","Ngày"],...filteredNews.map(n=>[n.id,n.title,n.category,n.status,n.is_featured?"Có":"Không",formatDate(n.created_at)])]);
    else downloadCsv("binh-luan-tin-tuc.csv",[["ID","Bài viết","Khách hàng","Email","Nội dung","Trạng thái","Ngày"],...filteredNewsComments.map(c=>[c.id,c.news_title,c.customer_name,c.customer_email,c.content,c.status,formatDate(c.created_at)])]);
  };

  const handleProductSaved = (updatedProduct) => {
    setProducts((prev) => prev.map((p) => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const updateNewsComment=async(id,status)=>{
    const res=await fetch(`${API_URL}/api/admin/news-comments/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
    const data=await res.json();
    if(!res.ok){alert(data.message||"Không cập nhật được bình luận");return;}
    setNewsComments(prev=>prev.map(c=>c.id===id?{...c,...data}:c));
  };

  const deleteNewsComment=async comment=>{
    if(!confirm(`Xóa bình luận của ${comment.customer_name}?`))return;
    const res=await fetch(`${API_URL}/api/admin/news-comments/${comment.id}`,{method:"DELETE"});
    if(res.ok)setNewsComments(prev=>prev.filter(c=>c.id!==comment.id));
    else alert("Không xóa được bình luận");
  };

  const handleShippingSaved = updatedOrder => {
    setOrders(current => current.map(item => item.id === updatedOrder.id ? { ...item, ...updatedOrder } : item));
  };

  const confirmCodDelivered = async order => {
    if (!confirm(`Xác nhận đơn #${order.id} đã giao hàng và đã thu đủ tiền?`)) return;
    setConfirmingCodId(order.id);
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${order.id}/confirm-cod`, { method: "PUT" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không xác nhận được đơn COD");
      setOrders(current => current.map(item => item.id === order.id ? { ...item, payment_status: data.payment_status } : item));
      const customers = await fetchJson("/api/admin/loyal-customers");
      setLoyalCustomers(Array.isArray(customers) ? customers : []);
      alert(data.message);
    } catch (error) {
      alert(error.message);
    } finally {
      setConfirmingCodId(null);
    }
  };

  const cancelOrder = async order => {
    const refundNote = isPaidStatus(order.payment_status)
      ? "\n\nLưu ý: Đơn này đã thanh toán, cần hoàn tiền thủ công cho khách nếu shop chưa hoàn."
      : "";
    if (!confirm(`Hủy đơn #${order.id} của ${order.customer_name}? Tồn kho và lượt dùng mã giảm giá sẽ được hoàn lại.${refundNote}`)) return;
    setCancellingOrderId(order.id);
    setCancellingOrderIds(current => {
      const next = new Set(current);
      next.add(order.id);
      return next;
    });
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${order.id}/cancel`, { method: "PUT" });
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text || "Backend không trả dữ liệu JSON hợp lệ" };
      }
      if (!response.ok) throw new Error(data.message || "Không hủy được đơn hàng");
      setCancelledOrderIds(current => {
        const next = new Set(current);
        next.add(order.id);
        return next;
      });
      setOrders(current => current.map(item => item.id === order.id ? { ...item, ...data, payment_status: data.payment_status || CANCELLED_ORDER_STATUS } : item));
      const [productsData, discountData, customers] = await Promise.all([
        fetchJson("/api/products"),
        fetchJson("/api/admin/discount-codes"),
        fetchJson("/api/admin/loyal-customers"),
      ]);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setDiscountCodes(Array.isArray(discountData) ? discountData : []);
      setLoyalCustomers(Array.isArray(customers) ? customers : []);
      alert(data.message);
    } catch (error) {
      setCancellingOrderIds(current => {
        const next = new Set(current);
        next.delete(order.id);
        return next;
      });
      alert(error.message);
    } finally {
      setCancellingOrderId(null);
      setCancellingOrderIds(current => {
        const next = new Set(current);
        next.delete(order.id);
        return next;
      });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login-page">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <div className="admin-login-badge">ADMIN</div>
          <h1>Thanh Chương Trà</h1>
          <p>Đăng nhập để quản lý dữ liệu cửa hàng.</p>
          <input type="text" placeholder="Tài khoản" value={loginForm.username}
            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} required />
          <input type="password" placeholder="Mật khẩu" value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
          <button type="submit">Đăng nhập quản trị</button>
          <a href="/">← Quay lại website</a>
        </form>
      </div>
    );
  }

  const tabs = [
    { key: "dashboard", label: "Tổng quan", icon: "📊" },
    { key: "orders", label: "Đơn hàng", icon: "🛒" },
    { key: "products", label: "Sản phẩm", icon: "🍃" },
    { key: "discountCodes", label: "Mã giảm giá", icon: "🏷️" },
    { key: "news", label: "Tin tức", icon: "📰" },
    { key: "newsComments", label: "Bình luận", icon: "💭" },
    { key: "loyalCustomers", label: "Khách thân thiết", icon: "👑" },
    { key: "orderFeedback", label: "Phản hồi", icon: "⭐" },
    { key: "contacts", label: "Liên hệ", icon: "✉️" },
    { key: "chat", label: "Chatbot", icon: "💬" },
  ];

  // Thống kê nhanh sản phẩm cho dashboard
  const hotCount = products.filter(p => p.is_hot || Number(p.sold_count || 0) >= 10).length;
  const discountCount = products.filter(p => Number(p.discount_percent || 0) > 0 || Number(p.discount_amount || 0) > 0).length;
  const lowStockCount = products.filter(p => Number(p.stock ?? 999) < 10).length;

  return (
    <div className="admin-page">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-mark">T</div>
          <div>
            <strong>Thanh Chương Trà</strong>
            <span>Trang quản trị</span>
          </div>
        </div>

        {tabs.map(({ key, label, icon }) => (
          <button
            type="button"
            key={key}
            className={activeTab === key ? "active" : ""}
            onClick={() => { setActiveTab(key); setSearchTerm(""); setSidebarOpen(false); }}
          >
            <span>{icon} {label}</span>
            {getTabCount(key) !== null && <b>{getTabCount(key)}</b>}
          </button>
        ))}

        <a href="/">🌐 Xem website</a>
        <button type="button" className="admin-logout" onClick={logout}>🚪 Đăng xuất</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <p>Tổng quan hệ thống</p>
              <h1>Quản trị Thanh Chương Trà</h1>
              <span>{lastUpdated ? `Cập nhật: ${formatDate(lastUpdated)}` : "Chưa đồng bộ dữ liệu"}</span>
            </div>
          </div>
          <button type="button" onClick={fetchAdminData} disabled={loading} className="refresh-btn">
            {loading ? "⏳ Đang tải..." : "↻ Tải lại"}
          </button>
        </header>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <section className="admin-stats">
              <div className="stat-card">
                <div className="stat-icon">🍃</div>
                <span>Sản phẩm</span>
                <strong>{products.length}</strong>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🛒</div>
                <span>Tổng đơn hàng</span>
                <strong>{orders.length}</strong>
              </div>
              <div className="stat-card is-success">
                <div className="stat-icon">✅</div>
                <span>Đã thanh toán</span>
                <strong>{paidOrders.length}</strong>
              </div>
              <div className="stat-card is-warning">
                <div className="stat-icon">⏳</div>
                <span>Chưa thanh toán</span>
                <strong>{orders.length - paidOrders.length - cancelledOrders.length - failedOrders.length}</strong>
              </div>
              <div className="stat-card is-revenue">
                <div className="stat-icon">💰</div>
                <span>Tổng doanh thu</span>
                <strong>{formatMoney(totalRevenue)}</strong>
              </div>
              <div className="stat-card is-month">
                <div className="stat-icon">📅</div>
                <span>Tháng này</span>
                <strong>{formatMoney(thisMonthRevenue)}</strong>
                {growthPct !== null && (
                  <div className={`growth-badge ${Number(growthPct) >= 0 ? "up" : "down"}`}>
                    {Number(growthPct) >= 0 ? "▲" : "▼"} {Math.abs(growthPct)}% so với tháng trước
                  </div>
                )}
              </div>
              <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => { setActiveTab("products"); setProductFilter("hot"); }}>
                <div className="stat-icon">🔥</div>
                <span>Bán chạy</span>
                <strong>{hotCount}</strong>
              </div>
              <div className="stat-card" style={{ cursor: "pointer", borderTop: lowStockCount > 0 ? "3px solid #e53935" : undefined }}
                onClick={() => { setActiveTab("products"); setProductFilter("low_stock"); }}>
                <div className="stat-icon">📦</div>
                <span>Sắp hết hàng</span>
                <strong style={{ color: lowStockCount > 0 ? "#e53935" : undefined }}>{lowStockCount}</strong>
              </div>
            </section>

            <RevenueChart orders={orders} />
            <TopProducts orders={orders} products={products} />
          </>
        )}

        {/* ORDERS / PRODUCTS / CONTACTS / CHAT */}
        {activeTab !== "dashboard" && (
          <section className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <h2>
                  {activeTab === "loyalCustomers" && "👑 Khách hàng thân thiết"}
                  {activeTab === "orderFeedback" && "⭐ Phản hồi sản phẩm & dịch vụ"}
                  {activeTab === "orders" && "🛒 Danh sách đơn hàng"}
                  {activeTab === "products" && "🍃 Danh sách sản phẩm"}
                  {activeTab === "discountCodes" && "🏷️ Quản lý mã giảm giá"}
                  {activeTab === "news" && "📰 Quản lý tin tức"}
                  {activeTab === "newsComments" && "💭 Bình luận bài viết"}
                  {activeTab === "contacts" && "✉️ Liên hệ khách hàng"}
                  {activeTab === "chat" && "💬 Tin nhắn chatbot"}
                </h2>
                <span>Theo dõi và tra cứu dữ liệu trực tiếp từ hệ thống</span>
              </div>
              <div style={{display:"flex",gap:8}}>
                {activeTab==="products"&&<button type="button" onClick={()=>setShowProductCreator(true)}>＋ Thêm sản phẩm</button>}
                {activeTab==="news"&&<button type="button" onClick={()=>{setEditingNews(null);setShowNewsEditor(true);}}>＋ Thêm bài viết</button>}
                {activeTab==="discountCodes"&&<button type="button" onClick={()=>{setEditingDiscount(null);setShowDiscountEditor(true);}}>＋ Tạo mã</button>}
                <button type="button" onClick={exportCurrentTable}>📥 Xuất CSV</button>
              </div>
            </div>

            <div className="admin-toolbar">
              <input type="search" placeholder="Tìm kiếm nhanh..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} />
              {activeTab === "orders" && (
                <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}>
                  <option value="all">Tất cả trạng thái</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="unpaid">Chưa thanh toán</option>
                  <option value="cancelled">Đã hủy</option>
                  <option value="cod">COD</option>
                  <option value="vnpay">VNPay</option>
                </select>
              )}
              {activeTab === "products" && (
                <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
                  <option value="all">Tất cả sản phẩm</option>
                  <option value="hot">🔥 Bán chạy</option>
                  <option value="discount">🏷️ Đang giảm giá</option>
                  <option value="low_stock">📦 Sắp hết hàng (&lt;10)</option>
                </select>
              )}
            </div>

            {errors.length > 0 && (
              <div className="admin-error">
                <strong>Một số API chưa tải được:</strong>
                <ul>{errors.map((msg) => <li key={msg}>{msg}</li>)}</ul>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th><th>Khách hàng</th><th>Điện thoại</th>
                      <th>Địa chỉ</th><th>Tổng tiền</th><th>Thanh toán</th>
                      <th>Trạng thái</th><th>Vận đơn</th><th>Ngày đặt</th><th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const orderStatus = cancelledOrderIds.has(order.id) ? CANCELLED_ORDER_STATUS : order.payment_status;
                      const displayOrder = { ...order, payment_status: orderStatus };
                      const showCodConfirm = displayOrder.payment_method === "COD" && displayOrder.payment_status === "Thanh toán khi nhận hàng";
                      const showCancel = canCancelOrder(displayOrder) && !cancelledOrderIds.has(order.id);

                      return (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td>
                          <td>{order.phone}</td>
                          <td>{order.address}</td>
                          <td><strong>{formatMoney(order.total_amount)}</strong></td>
                          <td>{order.payment_method}</td>
                          <td><span className={`admin-status ${getOrderStatusClass(orderStatus)}`}>{orderStatus}</span></td>
                          <td>
                            <div className="admin-shipping-cell">
                              <strong>{order.shipping_status || "Chờ shop xử lý"}</strong>
                              <small>{order.shipping_carrier || "Chưa có đơn vị vận chuyển"}</small>
                              <small>{order.tracking_code || "Chưa có mã vận đơn"}</small>
                            </div>
                          </td>
                          <td>{formatDate(order.created_at)}</td>
                          <td>
                            <div className="admin-order-actions">
                              <button className="admin-row-btn" type="button" onClick={() => setEditingShippingOrder(order)}>
                                Vận đơn
                              </button>
                              {showCodConfirm && (
                                <button className="admin-row-btn" disabled={confirmingCodId === order.id || cancellingOrderId === order.id} onClick={() => confirmCodDelivered(order)}>
                                  {confirmingCodId === order.id ? "Đang xác nhận..." : "Đã giao & thu tiền"}
                                </button>
                              )}
                              {showCancel && (
                                <button className="admin-row-btn danger" disabled={cancellingOrderId === order.id || confirmingCodId === order.id} onClick={() => cancelOrder(displayOrder)}>
                                  {cancellingOrderId === order.id ? "Đang hủy..." : "Hủy đơn"}
                                </button>
                              )}
                              {!showCancel && !showCodConfirm && (
                                <span style={{color:"#98a096"}}>—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!loading && filteredOrders.length === 0 && <p className="admin-empty">Không có đơn hàng phù hợp.</p>}
              </div>
            )}

            {activeTab === "products" && (
              <>
                {/* Thống kê nhanh sản phẩm */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                  {[
                    { label: "🔥 Bán chạy", value: hotCount, color: "#e65100", bg: "#fff3e0" },
                    { label: "🏷️ Đang giảm giá", value: discountCount, color: "#1565c0", bg: "#e3f2fd" },
                    { label: "📦 Sắp hết hàng", value: lowStockCount, color: lowStockCount > 0 ? "#c62828" : "#388e3c", bg: lowStockCount > 0 ? "#ffebee" : "#e8f5e9" },
                    { label: "📦 Tổng tồn kho", value: products.reduce((s, p) => s + (Number(p.stock ?? 999) < 999 ? Number(p.stock) : 0), 0) + (products.filter(p => (p.stock ?? 999) >= 999).length > 0 ? "+" : ""), color: "#2e7d32", bg: "#f1f8f4" },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: "10px 18px", background: item.bg, borderRadius: 10, fontSize: 13, fontWeight: 700, color: item.color, whiteSpace: "nowrap" }}>
                      {item.label}: {item.value}
                    </div>
                  ))}
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Sản phẩm</th>
                        <th>Danh mục</th>
                        <th>Giá gốc</th>
                        <th>Giảm giá</th>
                        <th>Giá bán</th>
                        <th>Tồn kho</th>
                        <th>Đã bán</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => {
                        const discPct = Number(p.discount_percent || 0);
                        const discAmt = Number(p.discount_amount  || 0);
                        const hasDisc = discPct > 0 || discAmt > 0;
                        const salePrice = calcSalePrice(p.price, discPct, discAmt);
                        const stock = Number(p.stock ?? 999);
                        const soldCount = Number(p.sold_count || 0);
                        const isHot = p.is_hot || soldCount >= 10;
                        const isLowStock = stock < 10;

                        return (
                          <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>
                              <strong>{p.name}</strong>
                              <small>{p.weight}</small>
                            </td>
                            <td>{p.category}</td>
                            <td>
                              {hasDisc
                                ? <span style={{ textDecoration: "line-through", color: "#999", fontSize: 12 }}>{formatMoney(p.price)}</span>
                                : formatMoney(p.price)
                              }
                            </td>
                            <td>
                              {discPct > 0 && (
                                <span style={{ background: "#ffebee", color: "#c62828", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                                  −{discPct}%
                                </span>
                              )}
                              {discAmt > 0 && !discPct && (
                                <span style={{ background: "#ffebee", color: "#c62828", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                                  −{formatMoney(discAmt)}
                                </span>
                              )}
                              {!hasDisc && <span style={{ color: "#bbb" }}>—</span>}
                            </td>
                            <td>
                              {hasDisc
                                ? <strong style={{ color: "#1f7a36" }}>{formatMoney(salePrice)}</strong>
                                : <span style={{ color: "#888" }}>{formatMoney(p.price)}</span>
                              }
                            </td>
                            <td>
                              <span style={{
                                fontWeight: 700,
                                color: isLowStock ? "#c62828" : "#2e7d32",
                              }}>
                                {stock >= 999 ? "∞" : stock}
                              </span>
                              {isLowStock && <small style={{ color: "#e53935", display: "block" }}>Sắp hết!</small>}
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: "#1565c0" }}>{soldCount}</span>
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {isHot && (
                                  <span style={{ background: "#fff3e0", color: "#e65100", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                                    🔥 Bán chạy
                                  </span>
                                )}
                                {hasDisc && (
                                  <span style={{ background: "#e3f2fd", color: "#1565c0", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                                    🏷️ Giảm giá
                                  </span>
                                )}
                                {!isHot && !hasDisc && (
                                  <span style={{ color: "#bbb", fontSize: 12 }}>Thường</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <button
                                onClick={() => setEditingProduct(p)}
                                style={{
                                  padding: "6px 14px", borderRadius: 8, border: "none",
                                  background: "#e8f5e9", color: "#1f7a36", fontWeight: 700,
                                  cursor: "pointer", fontSize: 13, whiteSpace: "nowrap",
                                }}
                              >
                                ✏️ Sửa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!loading && filteredProducts.length === 0 && <p className="admin-empty">Không có sản phẩm phù hợp.</p>}
                </div>
              </>
            )}

            {activeTab === "news"&&(
              <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Bài viết</th><th>Danh mục</th><th>Trạng thái</th><th>Nổi bật</th><th>Cập nhật</th><th>Hành động</th></tr></thead><tbody>
                {filteredNews.map(article=><tr key={article.id}><td>{article.id}</td><td><strong>{article.title}</strong><small>{article.summary}</small></td><td>{article.category}</td><td><span className={`admin-status ${article.status==="published"?"is-paid":"is-pending"}`}>{article.status==="published"?"Đã xuất bản":"Bản nháp"}</span></td><td>{article.is_featured?"⭐ Có":"—"}</td><td>{formatDate(article.updated_at)}</td><td><div style={{display:"flex",gap:6}}><button className="admin-row-btn" onClick={()=>{setEditingNews(article);setShowNewsEditor(true);}}>Sửa</button><button className="admin-row-btn danger" onClick={async()=>{if(!confirm(`Xóa bài “${article.title}”?`))return;const res=await fetch(`${API_URL}/api/admin/news/${article.id}`,{method:"DELETE"});if(res.ok)setNews(prev=>prev.filter(n=>n.id!==article.id));else alert("Không xóa được bài viết");}}>Xóa</button></div></td></tr>)}
              </tbody></table>{!loading&&filteredNews.length===0&&<p className="admin-empty">Chưa có bài viết phù hợp.</p>}</div>
            )}

            {activeTab === "discountCodes"&&(
              <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Mã</th><th>Chủ mã</th><th>Ưu đãi</th><th>Điều kiện</th><th>Lượt dùng</th><th>Hiệu lực</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody>
                {filteredDiscountCodes.map(c=>{
                  const expired=c.expires_at&&new Date(c.expires_at)<new Date();
                  return <tr key={c.id}><td><strong className="discount-code-text">{c.code}</strong><small>{c.description}</small></td><td>{c.customer_email?<><strong>Mã riêng</strong><small>{c.customer_email}</small></>:"Mọi khách hàng"}</td><td><strong>{c.discount_type==="percent"?`${Number(c.discount_value)}%`:formatMoney(c.discount_value)}</strong>{c.max_discount_amount&&<small>Tối đa {formatMoney(c.max_discount_amount)}</small>}</td><td>Đơn từ {formatMoney(c.min_order_amount)}</td><td>{c.used_count}/{c.usage_limit||"∞"}</td><td>{c.starts_at?<small>Từ {formatDate(c.starts_at)}</small>:<small>Dùng ngay</small>}<small>{c.expires_at?`Đến ${formatDate(c.expires_at)}`:"Không hết hạn"}</small></td><td><span className={`admin-status ${c.is_active&&!expired?"is-paid":"is-failed"}`}>{expired?"Hết hạn":c.is_active?"Đang bật":"Đã tắt"}</span></td><td><div className="admin-comment-actions"><button onClick={()=>{setEditingDiscount(c);setShowDiscountEditor(true);}}>Sửa</button><button className="danger" onClick={async()=>{if(!confirm(`Xóa mã ${c.code}?`))return;const res=await fetch(`${API_URL}/api/admin/discount-codes/${c.id}`,{method:"DELETE"});if(res.ok)setDiscountCodes(prev=>prev.filter(x=>x.id!==c.id));else alert("Không xóa được mã giảm giá");}}>Xóa</button></div></td></tr>;
                })}
              </tbody></table>{!loading&&filteredDiscountCodes.length===0&&<p className="admin-empty">Chưa có mã giảm giá phù hợp.</p>}</div>
            )}

            {activeTab === "newsComments"&&(
              <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Bài viết</th><th>Khách hàng</th><th>Bình luận</th><th>Trạng thái</th><th>Ngày gửi</th><th>Hành động</th></tr></thead><tbody>
                {filteredNewsComments.map(comment=><tr key={comment.id}><td>{comment.id}</td><td><strong>{comment.news_title}</strong></td><td><strong>{comment.customer_name}</strong><small>{comment.customer_email}</small></td><td style={{maxWidth:300,whiteSpace:"normal"}}>{comment.content}</td><td><span className={`admin-status ${comment.status==="approved"?"is-paid":comment.status==="hidden"?"is-failed":"is-pending"}`}>{comment.status==="approved"?"Đã duyệt":comment.status==="hidden"?"Đã ẩn":"Chờ duyệt"}</span></td><td>{formatDate(comment.created_at)}</td><td><div className="admin-comment-actions">{comment.status!=="approved"&&<button onClick={()=>updateNewsComment(comment.id,"approved")}>Duyệt</button>}{comment.status!=="hidden"&&<button onClick={()=>updateNewsComment(comment.id,"hidden")}>Ẩn</button>}<button className="danger" onClick={()=>deleteNewsComment(comment)}>Xóa</button></div></td></tr>)}
              </tbody></table>{!loading&&filteredNewsComments.length===0&&<p className="admin-empty">Chưa có bình luận phù hợp.</p>}</div>
            )}

            {activeTab === "loyalCustomers" && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Khách hàng</th><th>Điện thoại</th><th>Đơn thành công</th><th>Tổng chi tiêu</th><th>Hạng thành viên</th><th>Mua gần nhất</th></tr></thead>
                  <tbody>{filteredLoyalCustomers.map(customer => (
                    <tr key={customer.customer_email}>
                      <td><strong>{customer.customer_name}</strong><small>{customer.customer_email}</small></td>
                      <td>{customer.phone || "—"}</td>
                      <td><strong>{customer.paid_orders}</strong></td>
                      <td><strong>{formatMoney(customer.total_spent)}</strong></td>
                      <td><span className="admin-status is-paid">{customer.loyalty_tier}</span></td>
                      <td>{formatDate(customer.last_order_at)}</td>
                    </tr>
                  ))}</tbody>
                </table>
                {!loading && filteredLoyalCustomers.length === 0 && <p className="admin-empty">Chưa có khách hàng đã thanh toán.</p>}
              </div>
            )}

            {activeTab === "orderFeedback" && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Đơn hàng</th><th>Khách hàng</th><th>Sản phẩm</th><th>Sản phẩm</th><th>Dịch vụ</th><th>Nội dung phản hồi</th><th>Ngày gửi</th></tr></thead>
                  <tbody>{filteredOrderFeedback.map(feedback => (
                    <tr key={feedback.id}>
                      <td>#{feedback.order_id}</td>
                      <td><strong>{feedback.customer_name}</strong><small>{feedback.customer_email}</small></td>
                      <td style={{maxWidth:220,whiteSpace:"normal"}}>{feedback.product_names || "—"}</td>
                      <td><strong style={{color:"#d99b00"}}>{"★".repeat(Number(feedback.product_rating))}</strong><small>{feedback.product_rating}/5</small></td>
                      <td><strong style={{color:"#d99b00"}}>{"★".repeat(Number(feedback.service_rating))}</strong><small>{feedback.service_rating}/5</small></td>
                      <td style={{maxWidth:320,whiteSpace:"normal"}}>{feedback.comment || <em>Không có nhận xét</em>}</td>
                      <td>{formatDate(feedback.updated_at)}</td>
                    </tr>
                  ))}</tbody>
                </table>
                {!loading && filteredOrderFeedback.length === 0 && <p className="admin-empty">Chưa có phản hồi từ khách hàng.</p>}
              </div>
            )}

            {activeTab === "contacts" && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>ID</th><th>Khách hàng</th><th>Điện thoại</th><th>Email</th><th>Nội dung</th><th>Ngày gửi</th></tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td><td>{c.name}</td><td>{c.phone}</td>
                        <td>{c.email}</td><td>{c.message}</td><td>{formatDate(c.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && filteredContacts.length === 0 && <p className="admin-empty">Chưa có liên hệ phù hợp.</p>}
              </div>
            )}

            {activeTab === "chat" && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>ID</th><th>Khách hàng</th><th>Email</th><th>Câu hỏi</th><th>Phản hồi chatbot</th><th>Thời gian</th></tr>
                  </thead>
                  <tbody>
                    {filteredChatMessages.map((m) => (
                      <tr key={m.id}>
                        <td>{m.id}</td><td>{m.customer_name}</td><td>{m.customer_email}</td>
                        <td>{m.user_message}</td><td>{m.bot_reply}</td><td>{formatDate(m.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && filteredChatMessages.length === 0 && <p className="admin-empty">Chưa có tin nhắn phù hợp.</p>}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modal sửa sản phẩm */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={handleProductSaved}
        />
      )}
      {showProductCreator && (
        <ProductCreateModal
          onClose={() => setShowProductCreator(false)}
          onSaved={saved => setProducts(prev => [saved, ...prev])}
        />
      )}
      {showNewsEditor&&(
        <NewsEditModal
          article={editingNews}
          onClose={()=>setShowNewsEditor(false)}
          onSaved={saved=>setNews(prev=>editingNews?prev.map(n=>n.id===saved.id?saved:n):[saved,...prev])}
        />
      )}
      {showDiscountEditor&&(
        <DiscountCodeModal
          coupon={editingDiscount}
          onClose={()=>setShowDiscountEditor(false)}
          onSaved={saved=>setDiscountCodes(prev=>editingDiscount?prev.map(c=>c.id===saved.id?saved:c):[saved,...prev])}
        />
      )}
      {editingShippingOrder && (
        <ShippingEditModal
          order={editingShippingOrder}
          onClose={() => setEditingShippingOrder(null)}
          onSaved={handleShippingSaved}
        />
      )}
    </div>
  );
}

export default AdminPage;
