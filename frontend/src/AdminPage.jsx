import { useEffect, useState } from "react";

function AdminPage({ apiUrl }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    sessionStorage.getItem("thanh_chuong_admin") === "true"
  );
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [activeTab, setActiveTab] = useState("orders");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatMoney = (value) => Number(value || 0).toLocaleString("vi-VN") + "đ";
  const formatDate = (value) => value ? new Date(value).toLocaleString("vi-VN", { hour12: false }) : "";

  const fetchAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [productsRes, ordersRes, contactsRes, chatRes] = await Promise.all([
        fetch(`${apiUrl}/api/products`),
        fetch(`${apiUrl}/api/admin/orders`),
        fetch(`${apiUrl}/api/admin/contacts`),
        fetch(`${apiUrl}/api/admin/chat-messages`),
      ]);

      if (!productsRes.ok || !ordersRes.ok || !contactsRes.ok || !chatRes.ok) {
        throw new Error("Không tải được dữ liệu quản trị. Hãy chờ backend Render khởi động rồi tải lại.");
      }

      const [productsData, ordersData, contactsData, chatData] = await Promise.all([
        productsRes.json(), ordersRes.json(), contactsRes.json(), chatRes.json(),
      ]);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setContacts(Array.isArray(contactsData) ? contactsData : []);
      setChatMessages(Array.isArray(chatData) ? chatData : []);
    } catch (err) {
      setError(err.message || "Không tải được dữ liệu quản trị.");
    } finally {
      setLoading(false);
    }
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

  const paidOrders = orders.filter((order) =>
    String(order.payment_status || "").toLowerCase().includes("đã thanh toán")
  );
  const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  if (!isLoggedIn) {
    return (
      <div className="admin-login-page">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <h1>Thanh Chương Trà</h1>
          <p>Đăng nhập trang quản trị</p>
          <input type="text" placeholder="Tài khoản" value={loginForm.username}
            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} required />
          <input type="password" placeholder="Mật khẩu" value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
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
          <button onClick={fetchAdminData}>Tải lại dữ liệu</button>
          <a href="/">Xem website</a>
          <button onClick={logout}>Đăng xuất</button>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-stats">
          <article><span>Sản phẩm</span><strong>{products.length}</strong></article>
          <article><span>Đơn hàng</span><strong>{orders.length}</strong></article>
          <article><span>Đã nhận tiền</span><strong>{paidOrders.length}</strong></article>
          <article><span>Chưa nhận tiền</span><strong>{orders.length - paidOrders.length}</strong></article>
          <article><span>Doanh thu đã thanh toán</span><strong>{formatMoney(totalRevenue)}</strong></article>
        </section>

        <section className="admin-panel">
          <div className="admin-tabs">
            <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>Đơn hàng</button>
            <button className={activeTab === "products" ? "active" : ""} onClick={() => setActiveTab("products")}>Sản phẩm</button>
            <button className={activeTab === "contacts" ? "active" : ""} onClick={() => setActiveTab("contacts")}>Liên hệ</button>
            <button className={activeTab === "chat" ? "active" : ""} onClick={() => setActiveTab("chat")}>Chatbot</button>
          </div>

          {loading && <p className="admin-message">Đang tải dữ liệu...</p>}
          {error && <p className="admin-error">{error}</p>}

          {!loading && !error && activeTab === "orders" && (
            <div className="admin-table-wrap"><table><thead><tr>
              <th>Mã đơn</th><th>Khách hàng</th><th>Điện thoại</th><th>Địa chỉ</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Ngày đặt</th>
            </tr></thead><tbody>{orders.map((order) => <tr key={order.id}>
              <td>#{order.id}</td><td><strong>{order.customer_name}</strong><br/><small>{order.customer_email}</small></td><td>{order.phone}</td><td>{order.address}</td><td>{formatMoney(order.total_amount)}</td><td>{order.payment_method}</td><td>{order.payment_status}</td><td>{formatDate(order.created_at)}</td>
            </tr>)}</tbody></table></div>
          )}

          {!loading && !error && activeTab === "products" && (
            <div className="admin-table-wrap"><table><thead><tr>
              <th>ID</th><th>Sản phẩm</th><th>Danh mục</th><th>Khối lượng</th><th>Giá</th><th>Xuất xứ</th>
            </tr></thead><tbody>{products.map((product) => <tr key={product.id}>
              <td>{product.id}</td><td>{product.name}</td><td>{product.category}</td><td>{product.weight}</td><td>{formatMoney(product.price)}</td><td>{product.origin}</td>
            </tr>)}</tbody></table></div>
          )}

          {!loading && !error && activeTab === "contacts" && (
            <div className="admin-table-wrap"><table><thead><tr>
              <th>ID</th><th>Khách hàng</th><th>Điện thoại</th><th>Email</th><th>Nội dung</th><th>Ngày gửi</th>
            </tr></thead><tbody>{contacts.map((contact) => <tr key={contact.id}>
              <td>{contact.id}</td><td>{contact.name}</td><td>{contact.phone}</td><td>{contact.email}</td><td>{contact.message}</td><td>{formatDate(contact.created_at)}</td>
            </tr>)}</tbody></table></div>
          )}

          {!loading && !error && activeTab === "chat" && (
            <div className="admin-table-wrap"><table><thead><tr>
              <th>ID</th><th>Khách hàng</th><th>Email</th><th>Câu hỏi</th><th>Phản hồi chatbot</th><th>Thời gian</th>
            </tr></thead><tbody>{chatMessages.map((message) => <tr key={message.id}>
              <td>{message.id}</td><td>{message.customer_name}</td><td>{message.customer_email}</td><td>{message.user_message}</td><td>{message.bot_reply}</td><td>{formatDate(message.created_at)}</td>
            </tr>)}</tbody></table></div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminPage;
