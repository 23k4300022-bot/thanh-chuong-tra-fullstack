import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import "./admin.css";
import AdminPage from "./AdminPage";
import logo from "./assets/logo.png";
import CheckoutModal from "./CheckoutModal";   // ← THÊM DÒNG NÀY

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ===================== CHATBOT AVATAR SVG ===================== */
function BotAvatar() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: "linear-gradient(135deg, #1a5c2a, #2d8a45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontSize: 16
    }}>🍵</div>
  );
}

/* ===================== TYPING INDICATOR ===================== */
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
      <BotAvatar />
      <div style={{
        background: "#f0f7f0", borderRadius: "18px 18px 18px 4px",
        padding: "10px 16px", display: "flex", gap: 5, alignItems: "center"
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#2d8a45", display: "inline-block",
            animation: "typingBounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`
          }} />
        ))}
      </div>
    </div>
  );
}

/* ===================== POLICY MODAL ===================== */
function PolicyModal({ type, onClose }) {
  const policies = {
    "van-chuyen": {
      title: "Chính sách vận chuyển",
      icon: "🚚",
      content: [
        { heading: "Thời gian giao hàng", body: "Nội thành: 1–2 ngày làm việc. Ngoại thành và tỉnh thành khác: 3–5 ngày làm việc." },
        { heading: "Phí vận chuyển", body: "Miễn phí vận chuyển cho đơn hàng từ 300.000đ. Đơn dưới 300.000đ phí ship theo khu vực, thông thường 20.000–40.000đ." },
        { heading: "Đơn vị vận chuyển", body: "Chúng tôi hợp tác với GHN, GHTK và ViettelPost để đảm bảo hàng hóa được giao an toàn, đúng hẹn." },
        { heading: "Theo dõi đơn hàng", body: "Sau khi đặt hàng thành công, bạn sẽ nhận được mã vận đơn qua email để theo dõi trạng thái giao hàng." },
      ]
    },
    "doi-tra": {
      title: "Chính sách đổi trả",
      icon: "🔄",
      content: [
        { heading: "Điều kiện đổi trả", body: "Sản phẩm được đổi trả trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm bị lỗi, hư hỏng do vận chuyển hoặc không đúng với mô tả." },
        { heading: "Sản phẩm không được đổi trả", body: "Sản phẩm đã mở seal, đã sử dụng quá 1/3 khối lượng, hoặc không còn bao bì nguyên vẹn sẽ không được đổi trả." },
        { heading: "Quy trình đổi trả", body: "Liên hệ hotline 0900 000 000 hoặc email thanhchuongtra@gmail.com, cung cấp mã đơn hàng và hình ảnh sản phẩm. Shop sẽ phản hồi trong 24h." },
        { heading: "Hoàn tiền", body: "Hoàn tiền 100% qua chuyển khoản trong 3–5 ngày làm việc sau khi xác nhận đổi trả hợp lệ." },
      ]
    },
    "bao-mat": {
      title: "Chính sách bảo mật",
      icon: "🔒",
      content: [
        { heading: "Thu thập thông tin", body: "Chúng tôi chỉ thu thập thông tin cần thiết bao gồm họ tên, email, số điện thoại và địa chỉ giao hàng để xử lý đơn hàng." },
        { heading: "Sử dụng thông tin", body: "Thông tin của bạn chỉ được dùng để xác nhận đơn hàng, giao hàng và gửi thông báo liên quan đến đơn hàng. Chúng tôi không chia sẻ thông tin với bên thứ ba." },
        { heading: "Bảo mật thanh toán", body: "Các giao dịch thanh toán được bảo mật bởi VNPay với chuẩn mã hóa SSL. Chúng tôi không lưu thông tin thẻ ngân hàng của bạn." },
        { heading: "Quyền của khách hàng", body: "Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân bất kỳ lúc nào bằng cách liên hệ với chúng tôi qua email." },
      ]
    }
  };

  const policy = policies[type];
  if (!policy) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <button className="close" onClick={onClose}>×</button>
        <div style={{ padding: "0.5rem 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 32 }}>{policy.icon}</span>
            <h2 style={{ margin: 0, color: "#174421" }}>{policy.title}</h2>
          </div>
          {policy.content.map((item, i) => (
            <div key={i} style={{
              marginBottom: 20, padding: "16px 20px",
              background: i % 2 === 0 ? "#f8fdf5" : "#fff",
              borderRadius: 12, borderLeft: "4px solid #2d8a45"
            }}>
              <h4 style={{ margin: "0 0 8px", color: "#174421", fontSize: 15 }}>{item.heading}</h4>
              <p style={{ margin: 0, color: "#555", lineHeight: 1.7, fontSize: 14 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===================== STOREFRONT ===================== */
function Storefront() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(null);

  // Chatbot
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [showChatBadge, setShowChatBadge] = useState(true);
  const chatEndRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([
    {
      from: "bot",
      text: "Xin chào! Mình là trợ lý Thanh Chương Trà 🍵 Bạn cần tư vấn sản phẩm, cách pha trà, đặt hàng hay thanh toán?",
    },
  ]);

  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });

  const [customer, setCustomer] = useState({
    customer_name: "", customer_email: "", phone: "", address: "",
    note: "", payment_method: "COD", bank_name: "", bank_account: "",
    account_holder: "", otp: "", vnp_bank_code: "", vnp_card_number: "",
    vnp_card_holder: "", vnp_issue_date: "", vnp_otp: "",
  });

  const [contact, setContact] = useState({ name: "", phone: "", email: "", message: "" });

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(err => console.error("Lỗi lấy sản phẩm:", err));

    const savedUser = localStorage.getItem("thanh_chuong_user");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const orderId = params.get("order_id");
    if (payment === "vnpay_success") {
      alert(`Thanh toán VNPay Sandbox thành công! Mã đơn: ${orderId}`);
      setCart([]); setShowCheckout(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (payment === "vnpay_failed") {
      alert(`Thanh toán VNPay thất bại hoặc đã bị hủy. Mã đơn: ${orderId}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (payment === "vnpay_error") {
      alert(`Có lỗi khi xác nhận thanh toán VNPay. Mã đơn: ${orderId}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatbotLoading]);

  const categories = useMemo(() => {
    const unique = [...new Set(products.map(item => item.category))].filter(Boolean);
    return ["Tất cả", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "Tất cả") return products;
    return products.filter(item => item.category === activeCategory);
  }, [products, activeCategory]);

  const giftProducts = useMemo(() => {
    return products.filter(item => String(item.category || "").toLowerCase().includes("hộp quà"));
  }, [products]);

  const formatPrice = price => Number(price || 0).toLocaleString("vi-VN") + "đ";
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleRegister = e => {
    e.preventDefault();
    if (!authForm.name || !authForm.email || !authForm.password) { alert("Vui lòng nhập đầy đủ thông tin đăng ký"); return; }
    const users = JSON.parse(localStorage.getItem("thanh_chuong_users") || "[]");
    if (users.find(u => u.email === authForm.email)) { alert("Email này đã được đăng ký"); return; }
    const newUser = { id: Date.now(), name: authForm.name, email: authForm.email, password: authForm.password };
    users.push(newUser);
    localStorage.setItem("thanh_chuong_users", JSON.stringify(users));
    const loginUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    localStorage.setItem("thanh_chuong_user", JSON.stringify(loginUser));
    setCurrentUser(loginUser); setShowAuth(false);
    setAuthForm({ name: "", email: "", password: "" });
    alert("Đăng ký thành công!");
  };

  const handleLogin = e => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("thanh_chuong_users") || "[]");
    const user = users.find(item => item.email === authForm.email && item.password === authForm.password);
    if (!user) { alert("Email hoặc mật khẩu không đúng"); return; }
    const loginUser = { id: user.id, name: user.name, email: user.email };
    localStorage.setItem("thanh_chuong_user", JSON.stringify(loginUser));
    setCurrentUser(loginUser); setShowAuth(false);
    setAuthForm({ name: "", email: "", password: "" });
    alert("Đăng nhập thành công!");
  };

  const logout = () => { localStorage.removeItem("thanh_chuong_user"); setCurrentUser(null); alert("Đã đăng xuất"); };

  const addToCart = product => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    else setCart([...cart, { ...product, quantity: 1 }]);
  };

  const increaseQty = id => setCart(cart.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  const decreaseQty = id => setCart(cart.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0));
  const removeFromCart = id => setCart(cart.filter(item => item.id !== id));

  const openCheckout = () => {
    if (!currentUser) { setShowAuth(true); setAuthMode("login"); alert("Vui lòng đăng nhập trước khi thanh toán"); return; }
    setCustomer(prev => ({ ...prev, customer_name: currentUser.name || "", customer_email: currentUser.email || prev.customer_email }));
    setShowCheckout(true);
  };

  // ✅ Hàm reset dùng chung — gọi khi đóng modal
  const resetCartAndCustomer = () => {
    setCart([]);
    setCustomer({
      customer_name: currentUser?.name || "",
      customer_email: currentUser?.email || "",
      phone: "", address: "", note: "", payment_method: "COD",
      bank_name: "", bank_account: "", account_holder: "", otp: "",
      vnp_bank_code: "", vnp_card_number: "", vnp_card_holder: "",
      vnp_issue_date: "", vnp_otp: "",
    });
  };

  const payWithVnpay = async () => {
    if (cart.length === 0) { alert("Giỏ hàng đang trống"); return; }
    if (!customer.customer_name || !customer.customer_email || !customer.phone || !customer.address) {
      alert("Vui lòng nhập họ tên, email, số điện thoại và địa chỉ trước khi thanh toán"); return;
    }
    try {
      const res = await fetch(`${API_URL}/api/create-vnpay-payment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { ...customer, payment_method: "VNPay Sandbox", vnp_bank_code: "NCB" },
          items: cart.map(item => ({ product_id: item.id, name: item.name, price: item.price, quantity: item.quantity, weight: item.weight })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Không tạo được URL thanh toán VNPay"); return; }
      window.location.href = data.url;
    } catch (error) { alert("Lỗi khi chuyển sang VNPay"); console.error(error); }
  };

  // ✅ ĐÃ SỬA: KHÔNG reset cart/customer ở đây
  // Reset chỉ xảy ra khi đóng modal (onClose) — để CheckoutModal hiển thị đúng totalAmount
  const submitOrder = async e => {
    e.preventDefault();
    if (!currentUser) { alert("Vui lòng đăng nhập trước khi đặt hàng"); setShowAuth(true); return; }
    if (cart.length === 0) { alert("Giỏ hàng đang trống"); return; }
    if (!customer.customer_name || !customer.customer_email || !customer.phone || !customer.address) {
      alert("Vui lòng nhập đầy đủ thông tin"); return;
    }
    if (customer.payment_method === "VNPay Sandbox") { await payWithVnpay(); return; }

    const orderData = {
      ...customer,
      items: cart.map(item => ({ product_id: item.id, name: item.name, weight: item.weight, quantity: item.quantity, price: item.price })),
    };
    const res = await fetch(`${API_URL}/api/orders`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.message || "Đặt hàng thất bại"); throw new Error("order failed"); }

    // ✅ KHÔNG reset ở đây — để CheckoutModal nhận totalAmount và thông tin đúng
    // Reset sẽ xảy ra khi khách bấm đóng modal (onClose bên dưới)

    return data;
  };

  const submitContact = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/contacts`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contact),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Gửi liên hệ thất bại"); return; }
      alert("Gửi liên hệ thành công!");
      setContact({ name: "", phone: "", email: "", message: "" });
    } catch (error) { alert("Lỗi kết nối khi gửi liên hệ"); console.error(error); }
  };

  const sendChatMessage = async () => {
    const userMessage = chatInput.trim();
    if (!userMessage || chatbotLoading) return;
    const previousMessages = chatMessages.slice(1).slice(-8);
    setChatMessages(prev => [...prev, { from: "user", text: userMessage }]);
    setChatInput("");
    setChatbotLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chatbot/ask`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_name: currentUser?.name || "", customer_email: currentUser?.email || "", user_message: userMessage, history: previousMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không nhận được phản hồi từ trợ lý AI");
      setChatMessages(prev => [...prev, { from: "bot", text: data.reply }]);
    } catch (error) {
      console.error("Lỗi chatbot AI:", error);
      setChatMessages(prev => [...prev, { from: "bot", text: "Xin lỗi, trợ lý AI đang tạm thời chưa phản hồi được. Bạn vui lòng thử lại sau ít phút hoặc liên hệ shop qua mục Liên hệ." }]);
    } finally { setChatbotLoading(false); }
  };

  const aboutModalData = {
    "nguon-goc": { title: "Nguồn gốc rõ ràng", content: `Thanh Chương Trà ra đời từ vùng đất chè nổi tiếng Thanh Chương, Nghệ An — nơi những đồi chè xanh mướt trải dài theo từng sườn núi, gắn bó bao đời với cuộc sống người dân địa phương. Khác với nhiều vùng chè công nghiệp, chè Thanh Chương được trồng trên đất đỏ bazan, khí hậu mát mẻ quanh năm, tạo nên búp chè có độ ngọt tự nhiên và hương thơm mộc mạc rất riêng.\n\nChúng tôi hướng đến sự minh bạch từ vườn chè đến tay người dùng. Mỗi dòng sản phẩm đều ghi rõ xuất xứ, loại trà, trọng lượng và cách bảo quản.` },
    "huong-vi": { title: "Hương vị truyền thống", content: `Điều làm nên sự khác biệt của trà Thanh Chương chính là hương vị mang đậm dấu ấn vùng miền. Trà có vị chát dịu, không gắt — đó là cái chát của chè non hái đúng lứa, qua công đoạn sao thủ công vừa đủ để giữ lại tinh chất tự nhiên.\n\nHậu vị ngọt thanh lan dần từ cuống lưỡi, không cần thêm đường mà vẫn cảm nhận được sự dịu dàng tự nhiên.` },
    "cach-pha": { title: "Cách pha trà", content: `Bước 1 — Chuẩn bị: Dùng khoảng 5–8g trà cho ấm 150–200ml.\n\nBước 2 — Tráng trà: Rót một ít nước nóng vào ấm, lắc nhẹ rồi đổ bỏ.\n\nBước 3 — Pha trà: Dùng nước khoảng 80–90°C, không dùng nước sôi 100°C.\n\nBước 4 — Hãm trà: Đậy nắp và hãm khoảng 20–30 giây.\n\nBước 5 — Thưởng thức: Rót đều ra chén, uống khi còn ấm.` },
  };

  return (
    <div>
      <style>{`
        @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        @keyframes chatBadgePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        @keyframes chatToggleWiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-8deg); } 75% { transform: rotate(8deg); } }
        .chatbot-toggle-btn { animation: chatToggleWiggle 3s ease-in-out infinite; }
        .chatbot-toggle-btn:hover { animation: none; transform: scale(1.08); }
      `}</style>

      <header className="site-header">
        <a href="#home" className="brand">
          <span className="brand-logo-box">
            <img src={logo} alt="Thanh Chương Trà" className="brand-logo" />
          </span>
          <span className="brand-text">
            <strong>Thanh Chương Trà</strong>
            <small>Hương xanh xứ Nghệ</small>
          </span>
        </a>
        <nav className="main-nav">
          <a href="#home">Trang chủ</a>
          <a href="#about">Giới thiệu</a>
          <a href="#products">Sản phẩm</a>
          <a href="#gift">Hộp quà</a>
          <a href="#guide">Cách pha trà</a>
          <a href="#contact">Liên hệ</a>
        </nav>
        <div className="header-actions">
          {currentUser ? (
            <div className="user-area">
              <span title={currentUser.name}>Xin chào, {currentUser.name}</span>
              <button onClick={logout}>Đăng xuất</button>
            </div>
          ) : (
            <button className="auth-button" onClick={() => { setShowAuth(true); setAuthMode("login"); }}>Đăng nhập</button>
          )}
          <button className="cart-button" onClick={openCheckout}>
            Giỏ hàng <span>{cartCount}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-overlay">
            <p className="eyebrow">Đặc sản trà xanh xứ Nghệ</p>
            <h1>Thanh Chương Trà</h1>
            <h2>Hương xanh từ vùng chè Thanh Chương</h2>
            <p>Tinh chọn từ vùng chè Thanh Chương, Nghệ An, mang đến hương vị trà xanh mộc mạc, chát dịu và hậu ngọt thanh trong từng chén trà.</p>
            <div className="hero-actions">
              <a href="#products" className="btn primary">Xem sản phẩm</a>
              <a href="#gift" className="btn outline">Chọn hộp quà</a>
            </div>
          </div>
        </section>

        <section className="category-section">
          <div className="section-heading">
            <p className="eyebrow green">Danh mục</p>
            <h2>Chọn dòng trà phù hợp</h2>
            <p>Mỗi nhóm sản phẩm được phân loại rõ ràng để khách dễ chọn trà uống hằng ngày, trà tiếp khách hoặc hộp quà biếu tặng.</p>
          </div>
          <div className="category-tabs">
            {categories.map(category => (
              <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="about-section about-story-section" id="about">
          <div className="about-two-col">
            <div className="about-left">
              <p className="eyebrow green">Câu chuyện thương hiệu</p>
              <h2>Từ vùng chè Thanh Chương<br />đến chén trà Việt</h2>
              <p>Giữa những ngọn đồi xanh mướt của Thanh Chương, Nghệ An, từng búp chè non tươi được hái bằng đôi tay người dân địa phương mỗi sớm mai. Đó là nơi Thanh Chương Trà ra đời — không phải từ nhà máy hay công thức hiện đại, mà từ tình yêu với hương trà mộc mạc của xứ Nghệ.</p>
            </div>
            <div className="about-right">
              {[
                { num: "01", key: "nguon-goc", title: "Nguồn gốc rõ ràng", desc: "Mỗi dòng trà đều hướng đến sự minh bạch về xuất xứ, phù hợp để sử dụng hằng ngày, tiếp khách hoặc làm quà biếu." },
                { num: "02", key: "huong-vi", title: "Hương vị truyền thống", desc: "Trà có vị chát dịu, hương thơm tự nhiên và hậu ngọt thanh — vừa đủ đậm để thưởng thức, vừa đủ mềm để dễ uống." },
                { num: "03", key: "cach-pha", title: "Cách pha trà", desc: "Từ nhiệt độ nước, lượng trà đến thời gian hãm — mỗi bước đều giúp bạn cảm nhận trọn vẹn hương vị thiên nhiên." },
              ].map(card => (
                <div className="about-story-card" key={card.key}>
                  <div className="about-card-top">
                    <span className="story-number">{card.num}</span>
                    <h3>{card.title}</h3>
                  </div>
                  <p>{card.desc}</p>
                  <button type="button" className="about-detail-button" onClick={() => setShowAboutModal(card.key)}>Xem chi tiết</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <p className="eyebrow green">Sản phẩm</p>
            <h2>Sản phẩm nổi bật</h2>
          </div>
          <div className="product-grid">
            {filteredProducts.map(product => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  <img src={product.image_url} alt={product.name} />
                  <span>{product.category}</span>
                </div>
                <div className="product-body">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-meta">
                    <span>{product.weight}</span>
                    <span>{product.origin}</span>
                  </div>
                  <div className="product-footer">
                    <strong>{formatPrice(product.price)}</strong>
                    <button onClick={() => setSelectedProduct(product)}>Xem chi tiết</button>
                  </div>
                  <button className="add-cart" onClick={() => addToCart(product)}>Thêm vào giỏ hàng</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="gift-section" id="gift">
          <div className="gift-intro">
            <p className="eyebrow">Hộp quà trà</p>
            <h2>Quà biếu Thanh Chương – trang nhã, gần gũi, ý nghĩa</h2>
            <p>Khu vực hộp quà được tách riêng để khách dễ chọn sản phẩm biếu Tết, biếu thầy cô, đối tác, người thân hoặc khách hàng.</p>
          </div>
          <div className="gift-grid">
            {giftProducts.length > 0 ? giftProducts.map(product => (
              <article className="gift-card" key={product.id}>
                <img src={product.image_url} alt={product.name} />
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <strong>{formatPrice(product.price)}</strong>
                  <div className="gift-actions">
                    <button onClick={() => setSelectedProduct(product)}>Xem chi tiết</button>
                    <button onClick={() => addToCart(product)}>Thêm vào giỏ</button>
                  </div>
                </div>
              </article>
            )) : <p>Chưa có sản phẩm hộp quà.</p>}
          </div>
        </section>

        <section className="guide-section" id="guide">
          <div className="section-heading">
            <p className="eyebrow green">Thưởng trà</p>
            <h2>Cách pha trà ngon</h2>
          </div>
          <div className="guide-grid">
            <div><strong>01</strong><p>Dùng 5–8g trà cho ấm 150–200ml.</p></div>
            <div><strong>02</strong><p>Tráng trà nhanh bằng nước nóng.</p></div>
            <div><strong>03</strong><p>Pha với nước 80–90°C.</p></div>
            <div><strong>04</strong><p>Hãm 20–30 giây rồi thưởng thức.</p></div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div>
            <p className="eyebrow green">Liên hệ</p>
            <h2>Đặt mua Thanh Chương Trà</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28, marginTop: 20 }}>
              {[
                { icon: "📞", label: "Hotline", value: "0900 000 000" },
                { icon: "✉️", label: "Email", value: "thanhchuongtra@gmail.com" },
                { icon: "📍", label: "Địa chỉ", value: "Thanh Chương, Nghệ An" },
                { icon: "🕐", label: "Giờ làm việc", value: "7:00 – 21:00 hàng ngày" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 16px", backdropFilter: "blur(4px)" }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</div>
                    <div style={{ fontWeight: 600 }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderRadius: 16, overflow: "hidden", border: "3px solid rgba(255,255,255,0.15)" }}>
              <iframe
                title="Bản đồ Thanh Chương, Nghệ An"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d59877.11!2d105.2!3d18.73!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x313685b5a3c3ef8b%3A0x5e5e5e5e5e5e5e5e!2sThanh%20Ch%C6%B0%C6%A1ng%2C%20Ngh%E1%BB%87%20An!5e0!3m2!1svi!2svn!4v1"
                width="100%" height="220"
                style={{ border: 0, display: "block" }}
                allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
          <form className="contact-form" onSubmit={submitContact}>
            <input type="text" placeholder="Họ và tên" value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} required />
            <input type="text" placeholder="Số điện thoại" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} />
            <input type="email" placeholder="Email" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} />
            <textarea placeholder="Nội dung cần tư vấn" value={contact.message} onChange={e => setContact({ ...contact, message: e.target.value })} required />
            <button>Gửi liên hệ</button>
          </form>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ background: "#0d2e14", color: "#c8e6c9", padding: "48px 5% 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40, maxWidth: 1100, margin: "0 auto", paddingBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div>
            <h3 style={{ color: "#fff", marginBottom: 8, fontSize: 20 }}>Thanh Chương Trà</h3>
            <p style={{ fontSize: 13, lineHeight: 1.8, opacity: 0.75 }}>Hương xanh xứ Nghệ trong từng chén trà. Tinh chọn từ vùng chè Thanh Chương, Nghệ An.</p>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              {[{ label: "Facebook", url: "https://www.facebook.com/share/18adUuHPZp/?mibextid=wwXIfr" }, { label: "Zalo", url: "https://zalo.me/0985605049" }, { label: "TikTok", url: "https://www.tiktok.com/@hthtyuyu" }].map(sn => (
                <a key={sn.label} href={sn.url} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", transition: "background 0.2s", color: "#c8e6c9", textDecoration: "none" }}>{sn.label}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", marginBottom: 16, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>Liên kết nhanh</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[{ label: "Trang chủ", href: "#home" }, { label: "Sản phẩm", href: "#products" }, { label: "Hộp quà", href: "#gift" }, { label: "Cách pha trà", href: "#guide" }, { label: "Liên hệ", href: "#contact" }].map(link => (
                <a key={link.label} href={link.href} style={{ color: "#a5d6a7", textDecoration: "none", fontSize: 14, opacity: 0.85 }}>{link.label}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", marginBottom: 16, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>Chính sách</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[{ label: "🚚 Chính sách vận chuyển", key: "van-chuyen" }, { label: "🔄 Chính sách đổi trả", key: "doi-tra" }, { label: "🔒 Chính sách bảo mật", key: "bao-mat" }].map(policy => (
                <button key={policy.key} onClick={() => setShowPolicyModal(policy.key)} style={{ background: "none", border: "none", color: "#a5d6a7", fontSize: 14, cursor: "pointer", textAlign: "left", padding: 0, opacity: 0.85 }}>{policy.label}</button>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", marginBottom: 16, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>Liên hệ</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, opacity: 0.8 }}>
              <span>📞 0900 000 000</span>
              <span>✉️ thanhchuongtra@gmail.com</span>
              <span>📍 Thanh Chương, Nghệ An</span>
              <span>🕐 7:00 – 21:00 hàng ngày</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, opacity: 0.5, maxWidth: 1100, margin: "24px auto 0" }}>
          © 2025 Thanh Chương Trà. Bảo lưu mọi quyền.
        </div>
      </footer>

      {/* ===== MODALS ===== */}

      {showAboutModal && aboutModalData[showAboutModal] && (
        <div className="modal">
          <div className="detail-modal">
            <button className="close" onClick={() => setShowAboutModal(null)}>×</button>
            <div style={{ padding: "1rem 0" }}>
              <h2>{aboutModalData[showAboutModal].title}</h2>
              <div style={{ marginTop: "1.5rem", lineHeight: "1.9", whiteSpace: "pre-line", color: "#444" }}>
                {aboutModalData[showAboutModal].content}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPolicyModal && <PolicyModal type={showPolicyModal} onClose={() => setShowPolicyModal(null)} />}

      {showAuth && (
        <div className="modal">
          <div className="auth-modal">
            <button className="close" onClick={() => setShowAuth(false)}>×</button>
            <h2>{authMode === "login" ? "Đăng nhập" : "Đăng ký"}</h2>
            <form onSubmit={authMode === "login" ? handleLogin : handleRegister}>
              {authMode === "register" && (
                <input type="text" placeholder="Họ và tên" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} required />
              )}
              <input type="email" placeholder="Email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} required />
              <input type="password" placeholder="Mật khẩu" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} required />
              <button>{authMode === "login" ? "Đăng nhập" : "Đăng ký"}</button>
            </form>
            {authMode === "login" ? (
              <p>Chưa có tài khoản? <button className="text-button" onClick={() => setAuthMode("register")}>Đăng ký ngay</button></p>
            ) : (
              <p>Đã có tài khoản? <button className="text-button" onClick={() => setAuthMode("login")}>Đăng nhập</button></p>
            )}
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="modal">
          <div className="detail-modal">
            <button className="close" onClick={() => setSelectedProduct(null)}>×</button>
            <div className="detail-grid">
              <img src={selectedProduct.image_url} alt={selectedProduct.name} />
              <div>
                <span className="detail-tag">{selectedProduct.category}</span>
                <h2>{selectedProduct.name}</h2>
                <h3>{formatPrice(selectedProduct.price)}</h3>
                <p>{selectedProduct.description}</p>
                <ul className="detail-list">
                  <li><strong>Khối lượng:</strong> {selectedProduct.weight}</li>
                  <li><strong>Xuất xứ:</strong> {selectedProduct.origin}</li>
                  <li><strong>Loại trà:</strong> {selectedProduct.tea_type}</li>
                  <li><strong>Hương vị:</strong> {selectedProduct.flavor}</li>
                  <li><strong>Màu nước:</strong> {selectedProduct.water_color}</li>
                  <li><strong>Cách pha:</strong> {selectedProduct.brewing_guide}</li>
                  <li><strong>Bảo quản:</strong> {selectedProduct.storage_guide}</li>
                </ul>
                <button className="add-cart" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>
                  Thêm vào giỏ hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CHECKOUT MODAL ===== */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onClose={() => {
            setShowCheckout(false);
            // ✅ Reset cart và customer SAU KHI đóng modal
            // Lúc này màn hình success đã hiển thị xong, totalAmount đã được dùng đúng
            resetCartAndCustomer();
          }}
          onInc={increaseQty}
          onDec={decreaseQty}
          onRemove={removeFromCart}
          customer={customer}
          setCustomer={setCustomer}
          onSubmit={submitOrder}
          onVnpay={payWithVnpay}
          currentUser={currentUser}
        />
      )}

      {/* ===== CHATBOT ===== */}
      <div className="chatbot-widget">
        {showChatbot && (
          <div className="chatbot-box">
            <div className="chatbot-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BotAvatar />
                <div>
                  <strong>Trợ lý Thanh Chương Trà</strong>
                  <span style={{ display: "block", fontSize: 11, opacity: 0.8 }}>{chatbotLoading ? "🟡 Đang trả lời..." : "🟢 Trực tuyến"}</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowChatbot(false)}>×</button>
            </div>
            <div className="chatbot-messages">
              {chatMessages.map((message, index) => (
                <div key={index} style={{ display: "flex", flexDirection: message.from === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
                  {message.from === "bot" && <BotAvatar />}
                  <div className={message.from === "user" ? "chat-message user-message" : "chat-message bot-message"}
                    style={{ borderRadius: message.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", maxWidth: "78%" }}>
                    {message.text}
                  </div>
                </div>
              ))}
              {chatbotLoading && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>
            <div className="chatbot-input">
              <input type="text" placeholder="Nhập câu hỏi..." value={chatInput} disabled={chatbotLoading}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendChatMessage(); }} />
              <button type="button" onClick={sendChatMessage} disabled={chatbotLoading}>{chatbotLoading ? "..." : "Gửi"}</button>
            </div>
          </div>
        )}
        <button type="button" className="chatbot-toggle chatbot-toggle-btn"
          onClick={() => { setShowChatbot(!showChatbot); setShowChatBadge(false); }}
          style={{ position: "relative" }}>
          {!showChatbot && showChatBadge && (
            <span style={{ position: "absolute", top: -4, right: -4, background: "#e53935", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", animation: "chatBadgePulse 1.5s infinite", fontWeight: "bold" }}>1</span>
          )}
          {showChatbot ? "×" : "🍵"}
        </button>
      </div>
    </div>
  );
}

function App() {
  if (window.location.pathname === "/admin") return <AdminPage />;
  return <Storefront />;
}

export default App;
