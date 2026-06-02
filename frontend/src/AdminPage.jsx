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

function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    sessionStorage.getItem("thanh_chuong_admin") === "true"
  );

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [activeTab, setActiveTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + "đ";

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("vi-VN", {
      hour12: false,
    });
  };

  const normalize = (value) =>
    String(value ?? "").trim().toLowerCase();

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
        return `${requests[index][1]}: ${
          result.reason?.message || "Không tải được dữ liệu"
        }`;
      })
      .filter(Boolean);

    setErrors(newErrors);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchAdminData();
    }
  }, [isLoggedIn]);

  const handleLogin = (event) => {
    event.preventDefault();

    if (
      loginForm.username === "admin" &&
      loginForm.password === "123456"
    ) {
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
    () =>
      orders.filter((order) =>
        normalize(order.payment_status).includes("đã thanh toán")
      ),
    [orders]
  );

  const totalRevenue = useMemo(
    () =>
      paidOrders.reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0
      ),
    [paidOrders]
  );

  const filteredOrders = useMemo(() => {
    const search = normalize(searchTerm);

    return orders.filter((order) => {
      const status = normalize(order.payment_status);

      const matchesStatus =
        orderFilter === "all" ||
        (orderFilter === "paid" && status.includes("đã thanh toán")) ||
        (orderFilter === "unpaid" && !status.includes("đã thanh toán")) ||
        (orderFilter === "cod" && normalize(order.payment_method).includes("cod")) ||
        (orderFilter === "vnpay" &&
          normalize(order.payment_method).includes("vnpay"));

      const matchesSearch =
        !search ||
        [
          order.id,
          order.customer_name,
          order.customer_email,
          order.phone,
          order.address,
          order.payment_method,
          order.payment_status,
        ].some((value) => normalize(value).includes(search));

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchTerm, orderFilter]);

  const filteredProducts = useMemo(() => {
    const search = normalize(searchTerm);

    return products.filter((product) =>
      !search
        ? true
        : [
            product.id,
            product.name,
            product.category,
            product.weight,
            product.origin,
          ].some((value) => normalize(value).includes(search))
    );
  }, [products, searchTerm]);

  const filteredContacts = useMemo(() => {
    const search = normalize(searchTerm);

    return contacts.filter((contact) =>
      !search
        ? true
        : [
            contact.id,
            contact.name,
            contact.phone,
            contact.email,
            contact.message,
          ].some((value) => normalize(value).includes(search))
    );
  }, [contacts, searchTerm]);

  const filteredChatMessages = useMemo(() => {
    const search = normalize(searchTerm);

    return chatMessages.filter((message) =>
      !search
        ? true
        : [
            message.id,
            message.customer_name,
            message.customer_email,
            message.user_message,
            message.bot_reply,
          ].some((value) => normalize(value).includes(search))
    );
  }, [chatMessages, searchTerm]);

  const getOrderStatusClass = (status) => {
    const normalized = normalize(status);

    if (normalized.includes("đã thanh toán")) return "is-paid";
    if (normalized.includes("thất bại") || normalized.includes("hủy")) {
      return "is-failed";
    }
    if (normalized.includes("chờ")) return "is-pending";
    return "is-cod";
  };

  const getTabCount = (tab) => {
    if (tab === "orders") return orders.length;
    if (tab === "products") return products.length;
    if (tab === "contacts") return contacts.length;
    return chatMessages.length;
  };

  const exportCurrentTable = () => {
    if (activeTab === "orders") {
      downloadCsv("don-hang-thanh-chuong-tra.csv", [
        [
          "Mã đơn",
          "Khách hàng",
          "Email",
          "Số điện thoại",
          "Địa chỉ",
          "Tổng tiền",
          "Phương thức",
          "Trạng thái",
          "Ngày đặt",
        ],
        ...filteredOrders.map((order) => [
          order.id,
          order.customer_name,
          order.customer_email,
          order.phone,
          order.address,
          order.total_amount,
          order.payment_method,
          order.payment_status,
          formatDate(order.created_at),
        ]),
      ]);
      return;
    }

    if (activeTab === "products") {
      downloadCsv("san-pham-thanh-chuong-tra.csv", [
        ["ID", "Tên sản phẩm", "Danh mục", "Khối lượng", "Giá", "Xuất xứ"],
        ...filteredProducts.map((product) => [
          product.id,
          product.name,
          product.category,
          product.weight,
          product.price,
          product.origin,
        ]),
      ]);
      return;
    }

    if (activeTab === "contacts") {
      downloadCsv("lien-he-thanh-chuong-tra.csv", [
        ["ID", "Khách hàng", "Số điện thoại", "Email", "Nội dung", "Ngày gửi"],
        ...filteredContacts.map((contact) => [
          contact.id,
          contact.name,
          contact.phone,
          contact.email,
          contact.message,
          formatDate(contact.created_at),
        ]),
      ]);
      return;
    }

    downloadCsv("chatbot-thanh-chuong-tra.csv", [
      ["ID", "Khách hàng", "Email", "Câu hỏi", "Phản hồi chatbot", "Thời gian"],
      ...filteredChatMessages.map((message) => [
        message.id,
        message.customer_name,
        message.customer_email,
        message.user_message,
        message.bot_reply,
        formatDate(message.created_at),
      ]),
    ]);
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login-page">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <div className="admin-login-badge">ADMIN</div>
          <h1>Thanh Chương Trà</h1>
          <p>Đăng nhập để quản lý dữ liệu cửa hàng.</p>

          <input
            type="text"
            placeholder="Tài khoản"
            value={loginForm.username}
            onChange={(event) =>
              setLoginForm({
                ...loginForm,
                username: event.target.value,
              })
            }
            required
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={loginForm.password}
            onChange={(event) =>
              setLoginForm({
                ...loginForm,
                password: event.target.value,
              })
            }
            required
          />

          <button type="submit">Đăng nhập quản trị</button>
          <a href="/">← Quay lại website</a>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">T</div>
          <div>
            <strong>Thanh Chương Trà</strong>
            <span>Trang quản trị</span>
          </div>
        </div>

        {[
          ["orders", "Đơn hàng"],
          ["products", "Sản phẩm"],
          ["contacts", "Liên hệ"],
          ["chat", "Chatbot"],
        ].map(([tab, label]) => (
          <button
            type="button"
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => {
              setActiveTab(tab);
              setSearchTerm("");
            }}
          >
            <span>{label}</span>
            <b>{getTabCount(tab)}</b>
          </button>
        ))}

        <a href="/">Xem website</a>

        <button type="button" className="admin-logout" onClick={logout}>
          Đăng xuất
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p>Tổng quan hệ thống</p>
            <h1>Quản trị Thanh Chương Trà</h1>
            <span>
              {lastUpdated
                ? `Cập nhật: ${formatDate(lastUpdated)}`
                : "Chưa đồng bộ dữ liệu"}
            </span>
          </div>

          <button type="button" onClick={fetchAdminData} disabled={loading}>
            {loading ? "Đang tải..." : "↻ Tải lại dữ liệu"}
          </button>
        </header>

        <section className="admin-stats">
          <div>
            <span>Sản phẩm</span>
            <strong>{products.length}</strong>
          </div>
          <div>
            <span>Đơn hàng</span>
            <strong>{orders.length}</strong>
          </div>
          <div>
            <span>Đã nhận tiền</span>
            <strong>{paidOrders.length}</strong>
          </div>
          <div>
            <span>Chưa nhận tiền</span>
            <strong>{orders.length - paidOrders.length}</strong>
          </div>
          <div>
            <span>Doanh thu đã thanh toán</span>
            <strong>{formatMoney(totalRevenue)}</strong>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>
                {activeTab === "orders" && "Danh sách đơn hàng"}
                {activeTab === "products" && "Danh sách sản phẩm"}
                {activeTab === "contacts" && "Liên hệ khách hàng"}
                {activeTab === "chat" && "Tin nhắn chatbot"}
              </h2>
              <span>
                Theo dõi và tra cứu dữ liệu trực tiếp từ hệ thống
              </span>
            </div>

            <button type="button" onClick={exportCurrentTable}>
              Xuất CSV
            </button>
          </div>

          <div className="admin-toolbar">
            <input
              type="search"
              placeholder="Tìm kiếm nhanh..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            {activeTab === "orders" && (
              <select
                value={orderFilter}
                onChange={(event) => setOrderFilter(event.target.value)}
              >
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
              <ul>
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Điện thoại</th>
                    <th>Địa chỉ</th>
                    <th>Tổng tiền</th>
                    <th>Thanh toán</th>
                    <th>Trạng thái</th>
                    <th>Ngày đặt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>
                        <strong>{order.customer_name}</strong>
                        <small>{order.customer_email}</small>
                      </td>
                      <td>{order.phone}</td>
                      <td>{order.address}</td>
                      <td>{formatMoney(order.total_amount)}</td>
                      <td>{order.payment_method}</td>
                      <td>
                        <span
                          className={`admin-status ${getOrderStatusClass(
                            order.payment_status
                          )}`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td>{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filteredOrders.length === 0 && (
                <p className="admin-empty">Không có đơn hàng phù hợp.</p>
              )}
            </div>
          )}

          {activeTab === "products" && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Khối lượng</th>
                    <th>Giá</th>
                    <th>Xuất xứ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td><strong>{product.name}</strong></td>
                      <td>{product.category}</td>
                      <td>{product.weight}</td>
                      <td>{formatMoney(product.price)}</td>
                      <td>{product.origin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filteredProducts.length === 0 && (
                <p className="admin-empty">Không có sản phẩm phù hợp.</p>
              )}
            </div>
          )}

          {activeTab === "contacts" && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Khách hàng</th>
                    <th>Điện thoại</th>
                    <th>Email</th>
                    <th>Nội dung</th>
                    <th>Ngày gửi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id}>
                      <td>{contact.id}</td>
                      <td>{contact.name}</td>
                      <td>{contact.phone}</td>
                      <td>{contact.email}</td>
                      <td>{contact.message}</td>
                      <td>{formatDate(contact.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filteredContacts.length === 0 && (
                <p className="admin-empty">Chưa có liên hệ phù hợp.</p>
              )}
            </div>
          )}

          {activeTab === "chat" && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Khách hàng</th>
                    <th>Email</th>
                    <th>Câu hỏi</th>
                    <th>Phản hồi chatbot</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChatMessages.map((message) => (
                    <tr key={message.id}>
                      <td>{message.id}</td>
                      <td>{message.customer_name}</td>
                      <td>{message.customer_email}</td>
                      <td>{message.user_message}</td>
                      <td>{message.bot_reply}</td>
                      <td>{formatDate(message.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filteredChatMessages.length === 0 && (
                <p className="admin-empty">Chưa có tin nhắn phù hợp.</p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminPage;
