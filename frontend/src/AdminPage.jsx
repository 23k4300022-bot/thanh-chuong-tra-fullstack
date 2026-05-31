import { useEffect, useState } from "react";
import "./admin.css";

// Dùng URL backend Render cố định để tránh lỗi cấu hình VITE_API_URL trên Vercel.
const API_URL = "https://thanh-chuong-tra-fullstack.onrender.com";

async function fetchJson(path) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`${path}: HTTP ${response.status} - ${bodyText.slice(0, 120)}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      `${path}: backend không trả JSON. Phản hồi nhận được: ${bodyText.slice(0, 120)}`
    );
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    throw new Error(`${path}: dữ liệu JSON không hợp lệ`);
  }
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
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + "đ";

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("vi-VN", {
      hour12: false,
    });
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setErrors([]);

    const requests = [
      {
        key: "products",
        path: "/api/products",
        setter: setProducts,
      },
      {
        key: "orders",
        path: "/api/admin/orders",
        setter: setOrders,
      },
      {
        key: "contacts",
        path: "/api/admin/contacts",
        setter: setContacts,
      },
      {
        key: "chat",
        path: "/api/admin/chat-messages",
        setter: setChatMessages,
      },
    ];

    const results = await Promise.allSettled(
      requests.map(async (request) => {
        const data = await fetchJson(request.path);
        request.setter(Array.isArray(data) ? data : []);
        return request.key;
      })
    );

    const newErrors = results
      .map((result, index) => {
        if (result.status === "fulfilled") return null;
        return `${requests[index].path}: ${result.reason?.message || "Không tải được dữ liệu"}`;
      })
      .filter(Boolean);

    setErrors(newErrors);
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

  const paidOrders = orders.filter((order) =>
    String(order.payment_status || "")
      .toLowerCase()
      .includes("đã thanh toán")
  );

  const unpaidOrders = orders.length - paidOrders.length;

  const totalRevenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );

  if (!isLoggedIn) {
    return (
      <div className="admin-login-page">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <h1>Thanh Chương Trà</h1>
          <p>Đăng nhập trang quản trị</p>

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

          <button type="submit">Đăng nhập</button>
          <a href="/">← Quay lại website</a>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Quản trị Thanh Chương Trà</h1>
          <p>Sản phẩm, đơn hàng, liên hệ và chatbot</p>
        </div>

        <div className="admin-header-actions">
          <button type="button" onClick={fetchAdminData}>
            Tải lại dữ liệu
          </button>
          <a href="/">Xem website</a>
          <button type="button" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-stats">
          <article>
            <span>Sản phẩm</span>
            <strong>{products.length}</strong>
          </article>
          <article>
            <span>Đơn hàng</span>
            <strong>{orders.length}</strong>
          </article>
          <article>
            <span>Đã nhận tiền</span>
            <strong>{paidOrders.length}</strong>
          </article>
          <article>
            <span>Chưa nhận tiền</span>
            <strong>{unpaidOrders}</strong>
          </article>
          <article>
            <span>Doanh thu đã thanh toán</span>
            <strong>{formatMoney(totalRevenue)}</strong>
          </article>
        </section>

        <section className="admin-panel">
          <div className="admin-tabs">
            <button
              className={activeTab === "orders" ? "active" : ""}
              onClick={() => setActiveTab("orders")}
            >
              Đơn hàng
            </button>
            <button
              className={activeTab === "products" ? "active" : ""}
              onClick={() => setActiveTab("products")}
            >
              Sản phẩm
            </button>
            <button
              className={activeTab === "contacts" ? "active" : ""}
              onClick={() => setActiveTab("contacts")}
            >
              Liên hệ
            </button>
            <button
              className={activeTab === "chat" ? "active" : ""}
              onClick={() => setActiveTab("chat")}
            >
              Chatbot
            </button>
          </div>

          {loading && <p className="admin-message">Đang tải dữ liệu...</p>}

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

          {!loading && activeTab === "orders" && (
            <div className="admin-table-wrap">
              <table>
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
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>
                        <strong>{order.customer_name}</strong>
                        <br />
                        <small>{order.customer_email}</small>
                      </td>
                      <td>{order.phone}</td>
                      <td>{order.address}</td>
                      <td>{formatMoney(order.total_amount)}</td>
                      <td>{order.payment_method}</td>
                      <td>{order.payment_status}</td>
                      <td>{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && activeTab === "products" && (
            <div className="admin-table-wrap">
              <table>
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
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>{product.weight}</td>
                      <td>{formatMoney(product.price)}</td>
                      <td>{product.origin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && activeTab === "contacts" && (
            <div className="admin-table-wrap">
              <table>
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
                  {contacts.map((contact) => (
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
            </div>
          )}

          {!loading && activeTab === "chat" && (
            <div className="admin-table-wrap">
              <table>
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
                  {chatMessages.map((message) => (
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
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminPage;
