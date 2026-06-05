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

// ===================== BIỂU ĐỒ DOANH THU =====================

function RevenueChart({ orders }) {
  const [viewMode, setViewMode] = useState("month"); // "month" | "year"
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const paidOrders = orders.filter((o) =>
    normalize(o.payment_status).includes("đã thanh toán")
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
                <div
                  className="bar-fill"
                  style={{ height: `${pct}%` }}
                />
              </div>
              <div className="bar-label">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== TOP SẢN PHẨM =====================

function TopProducts({ orders, products }) {
  const productMap = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [products]);

  // Đếm từ order items — dùng tổng tiền vì không có order_items trực tiếp
  // Thay vào đó hiển thị đơn hàng gần đây
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [orders]);

  return (
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
  );
}

function getOrderStatusClass(status) {
  const normalized = normalize(status);
  if (normalized.includes("đã thanh toán")) return "is-paid";
  if (normalized.includes("thất bại") || normalized.includes("hủy")) return "is-failed";
  if (normalized.includes("chờ")) return "is-pending";
  return "is-cod";
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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setErrors([]);
    const requests = [
      ["products", "/api/products", setProducts],
      ["orders", "/api/admin/orders", setOrders],
      ["contacts", "/api/admin/contacts", setContacts],
      ["chat", "/api/admin/chat-messages", setChatMessages],
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
    () => orders.filter((o) => normalize(o.payment_status).includes("đã thanh toán")),
    [orders]
  );

  const totalRevenue = useMemo(
    () => paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    [paidOrders]
  );

  // Doanh thu tháng này
  const thisMonthRevenue = useMemo(() => {
    const now = new Date();
    return paidOrders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  }, [paidOrders]);

  // Doanh thu tháng trước
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
        (orderFilter === "paid" && status.includes("đã thanh toán")) ||
        (orderFilter === "unpaid" && !status.includes("đã thanh toán")) ||
        (orderFilter === "cod" && normalize(order.payment_method).includes("cod")) ||
        (orderFilter === "vnpay" && normalize(order.payment_method).includes("vnpay"));
      const matchesSearch =
        !search ||
        [order.id, order.customer_name, order.customer_email, order.phone, order.address, order.payment_method, order.payment_status]
          .some((v) => normalize(v).includes(search));
      return matchesStatus && matchesSearch;
    });
  }, [orders, searchTerm, orderFilter]);

  const filteredProducts = useMemo(() => {
    const search = normalize(searchTerm);
    return products.filter((p) =>
      !search ? true : [p.id, p.name, p.category, p.weight, p.origin].some((v) => normalize(v).includes(search))
    );
  }, [products, searchTerm]);

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

  const getTabCount = (tab) => {
    if (tab === "orders") return orders.length;
    if (tab === "products") return products.length;
    if (tab === "contacts") return contacts.length;
    if (tab === "chat") return chatMessages.length;
    return null;
  };

  const exportCurrentTable = () => {
    if (activeTab === "orders") {
      downloadCsv("don-hang-thanh-chuong-tra.csv", [
        ["Mã đơn", "Khách hàng", "Email", "Số điện thoại", "Địa chỉ", "Tổng tiền", "Phương thức", "Trạng thái", "Ngày đặt"],
        ...filteredOrders.map((o) => [o.id, o.customer_name, o.customer_email, o.phone, o.address, o.total_amount, o.payment_method, o.payment_status, formatDate(o.created_at)]),
      ]);
    } else if (activeTab === "products") {
      downloadCsv("san-pham-thanh-chuong-tra.csv", [
        ["ID", "Tên sản phẩm", "Danh mục", "Khối lượng", "Giá", "Xuất xứ"],
        ...filteredProducts.map((p) => [p.id, p.name, p.category, p.weight, p.price, p.origin]),
      ]);
    } else if (activeTab === "contacts") {
      downloadCsv("lien-he-thanh-chuong-tra.csv", [
        ["ID", "Khách hàng", "Số điện thoại", "Email", "Nội dung", "Ngày gửi"],
        ...filteredContacts.map((c) => [c.id, c.name, c.phone, c.email, c.message, formatDate(c.created_at)]),
      ]);
    } else {
      downloadCsv("chatbot-thanh-chuong-tra.csv", [
        ["ID", "Khách hàng", "Email", "Câu hỏi", "Phản hồi chatbot", "Thời gian"],
        ...filteredChatMessages.map((m) => [m.id, m.customer_name, m.customer_email, m.user_message, m.bot_reply, formatDate(m.created_at)]),
      ]);
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
    { key: "contacts", label: "Liên hệ", icon: "✉️" },
    { key: "chat", label: "Chatbot", icon: "💬" },
  ];

  return (
    <div className="admin-page">
      {/* Overlay mobile */}
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
                <strong>{orders.length - paidOrders.length}</strong>
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
              <div className="stat-card">
                <div className="stat-icon">✉️</div>
                <span>Liên hệ</span>
                <strong>{contacts.length}</strong>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💬</div>
                <span>Tin nhắn chatbot</span>
                <strong>{chatMessages.length}</strong>
              </div>
            </section>

            <RevenueChart orders={orders} />

            <TopProducts orders={orders} products={products} />
          </>
        )}

        {/* ORDERS, PRODUCTS, CONTACTS, CHAT */}
        {activeTab !== "dashboard" && (
          <section className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <h2>
                  {activeTab === "orders" && "🛒 Danh sách đơn hàng"}
                  {activeTab === "products" && "🍃 Danh sách sản phẩm"}
                  {activeTab === "contacts" && "✉️ Liên hệ khách hàng"}
                  {activeTab === "chat" && "💬 Tin nhắn chatbot"}
                </h2>
                <span>Theo dõi và tra cứu dữ liệu trực tiếp từ hệ thống</span>
              </div>
              <button type="button" onClick={exportCurrentTable}>📥 Xuất CSV</button>
            </div>

            <div className="admin-toolbar">
              <input type="search" placeholder="Tìm kiếm nhanh..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} />
              {activeTab === "orders" && (
                <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}>
                  <option value="all">Tất cả trạng thái</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="unpaid">Chưa thanh toán</option>
                  <option value="cod">COD</option>
                  <option value="vnpay">VNPay</option>
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
                      <th>Trạng thái</th><th>Ngày đặt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td>
                        <td>{order.phone}</td>
                        <td>{order.address}</td>
                        <td><strong>{formatMoney(order.total_amount)}</strong></td>
                        <td>{order.payment_method}</td>
                        <td><span className={`admin-status ${getOrderStatusClass(order.payment_status)}`}>{order.payment_status}</span></td>
                        <td>{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && filteredOrders.length === 0 && <p className="admin-empty">Không có đơn hàng phù hợp.</p>}
              </div>
            )}

            {activeTab === "products" && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>ID</th><th>Sản phẩm</th><th>Danh mục</th><th>Khối lượng</th><th>Giá</th><th>Xuất xứ</th></tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.category}</td>
                        <td>{p.weight}</td>
                        <td>{formatMoney(p.price)}</td>
                        <td>{p.origin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && filteredProducts.length === 0 && <p className="admin-empty">Không có sản phẩm phù hợp.</p>}
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
    </div>
  );
}

export default AdminPage;
