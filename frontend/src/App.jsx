import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import "./admin.css";
import AdminPage from "./AdminPage";
import logo from "./assets/logo.png";
import CheckoutModal from "./CheckoutModal";

const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://thanh-chuong-tra-fullstack.onrender.com"
);
const CHECKOUT_PROFILES_KEY = "thanh_chuong_checkout_profiles";

function getCheckoutProfile(email) {
  if (!email) return null;
  try {
    const profiles = JSON.parse(localStorage.getItem(CHECKOUT_PROFILES_KEY) || "{}");
    return profiles[email.trim().toLowerCase()] || null;
  } catch {
    return null;
  }
}

function saveCheckoutProfile(accountEmail, customer) {
  if (!accountEmail) return;
  try {
    const profiles = JSON.parse(localStorage.getItem(CHECKOUT_PROFILES_KEY) || "{}");
    profiles[accountEmail.trim().toLowerCase()] = {
      customer_name: customer.customer_name || "",
      customer_email: customer.customer_email || accountEmail,
      phone: customer.phone || "",
      address: customer.address || "",
    };
    localStorage.setItem(CHECKOUT_PROFILES_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error("Không thể lưu thông tin giao hàng:", error);
  }
}

function TeaGuideIcon({ name, size = 26 }) {
  const paths = {
    scale: (
      <>
        <path d="M12 3v18M6 6h12M7 6l-4 7h8L7 6ZM17 6l-4 7h8l-4-7Z" />
        <path d="M3 13a4 4 0 0 0 8 0M13 13a4 4 0 0 0 8 0M8 21h8" />
      </>
    ),
    teapot: (
      <>
        <path d="M7 9h10v6a5 5 0 0 1-5 5 5 5 0 0 1-5-5V9Z" />
        <path d="M9 9V6h6v3M10 4h4M17 11h1.5a3 3 0 0 1 0 6H17M7 11H5c-1.5 0-2.5-1-2.5-2.5" />
      </>
    ),
    temperature: (
      <>
        <path d="M14 14.8V5a4 4 0 0 0-8 0v9.8a6 6 0 1 0 8 0Z" />
        <path d="M10 7v10M17 6h4M17 10h3" />
      </>
    ),
    timer: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l3 2M9 2h6M12 2v3" />
      </>
    ),
    cup: (
      <>
        <path d="M4 9h13v5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V9Z" />
        <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M7 5c0-1 1-1 1-2M11 5c0-1 1-1 1-2M3 21h17" />
      </>
    ),
    package: (
      <>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7M12 11v10M8 5l8 4" />
      </>
    ),
    tip: (
      <>
        <path d="M9 18h6M10 22h4" />
        <path d="M8.2 14.5A7 7 0 1 1 15.8 14.5C14.7 15.3 14 16.1 14 18h-4c0-1.9-.7-2.7-1.8-3.5Z" />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function BotAvatar() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: "linear-gradient(135deg, #1a5c2a, #2d8a45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <circle cx="9" cy="10" r="1" fill="#fff" stroke="none"/>
        <circle cx="12" cy="10" r="1" fill="#fff" stroke="none"/>
        <circle cx="15" cy="10" r="1" fill="#fff" stroke="none"/>
      </svg>
    </div>
  );
}

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

function PolicyModal({ type, onClose }) {
  const policies = {
    "van-chuyen": {
      title: "Chính sách vận chuyển", icon: "🚚",
      content: [
        { heading: "Thời gian giao hàng", body: "Nội thành: 1–2 ngày làm việc. Ngoại thành và tỉnh thành khác: 3–5 ngày làm việc." },
        { heading: "Phí vận chuyển", body: "Miễn phí vận chuyển cho đơn hàng từ 300.000đ. Đơn dưới 300.000đ phí ship theo khu vực, thông thường 20.000–40.000đ." },
        { heading: "Đơn vị vận chuyển", body: "Chúng tôi hợp tác với GHN, GHTK và ViettelPost để đảm bảo hàng hóa được giao an toàn, đúng hẹn." },
        { heading: "Theo dõi đơn hàng", body: "Sau khi đặt hàng thành công, bạn sẽ nhận được mã vận đơn qua email để theo dõi trạng thái giao hàng." },
      ]
    },
    "doi-tra": {
      title: "Chính sách đổi trả", icon: "🔄",
      content: [
        { heading: "Điều kiện đổi trả", body: "Sản phẩm được đổi trả trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm bị lỗi, hư hỏng do vận chuyển hoặc không đúng với mô tả." },
        { heading: "Sản phẩm không được đổi trả", body: "Sản phẩm đã mở seal, đã sử dụng quá 1/3 khối lượng, hoặc không còn bao bì nguyên vẹn sẽ không được đổi trả." },
        { heading: "Quy trình đổi trả", body: "Liên hệ hotline 0900 000 000 hoặc email thanhchuongtra@gmail.com, cung cấp mã đơn hàng và hình ảnh sản phẩm. Shop sẽ phản hồi trong 24h." },
        { heading: "Hoàn tiền", body: "Hoàn tiền 100% qua chuyển khoản trong 3–5 ngày làm việc sau khi xác nhận đổi trả hợp lệ." },
      ]
    },
    "bao-mat": {
      title: "Chính sách bảo mật", icon: "🔒",
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
            <div key={i} style={{ marginBottom: 20, padding: "16px 20px", background: i % 2 === 0 ? "#f8fdf5" : "#fff", borderRadius: 12, borderLeft: "4px solid #2d8a45" }}>
              <h4 style={{ margin: "0 0 8px", color: "#174421", fontSize: 15 }}>{item.heading}</h4>
              <p style={{ margin: 0, color: "#555", lineHeight: 1.7, fontSize: 14 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const [menuOpen, setMenuOpen] = useState(false);

  const [showChatbot, setShowChatbot] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [showChatBadge, setShowChatBadge] = useState(true);
  const chatEndRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([
    { from: "bot", text: "Xin chào! Mình là trợ lý Thanh Chương Trà 🍵 Bạn cần tư vấn sản phẩm, cách pha trà, đặt hàng hay thanh toán?" },
  ]);

  const [dragPos, setDragPos] = useState({ right: 22, bottom: 22 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);
  const hasDragged = useRef(false);

  const onDragMouseDown = (e) => {
    e.preventDefault();
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, right: dragPos.right, bottom: dragPos.bottom };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      const dx = dragStart.current.x - e.clientX;
      const dy = dragStart.current.y - e.clientY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
      setDragPos({
        right: Math.max(8, Math.min(window.innerWidth - 80, dragStart.current.right + dx)),
        bottom: Math.max(8, Math.min(window.innerHeight - 80, dragStart.current.bottom + dy)),
      });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

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
    if (payment === "vnpay_success") { alert(`Thanh toán VNPay Sandbox thành công! Mã đơn: ${orderId}`); setCart([]); setShowCheckout(false); window.history.replaceState({}, document.title, window.location.pathname); }
    if (payment === "vnpay_failed") { alert(`Thanh toán VNPay thất bại hoặc đã bị hủy. Mã đơn: ${orderId}`); window.history.replaceState({}, document.title, window.location.pathname); }
    if (payment === "vnpay_error") { alert(`Có lỗi khi xác nhận thanh toán VNPay. Mã đơn: ${orderId}`); window.history.replaceState({}, document.title, window.location.pathname); }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, chatbotLoading]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const categories = useMemo(() => {
    const unique = [...new Set(products.map(item => item.category))].filter(Boolean);
    return ["Tất cả", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "Tất cả") return products;
    return products.filter(item => item.category === activeCategory);
  }, [products, activeCategory]);

  const giftProducts = useMemo(() => products.filter(item => String(item.category || "").toLowerCase().includes("hộp quà")), [products]);

  const formatPrice = price => Number(price || 0).toLocaleString("vi-VN") + "đ";

  const calcSalePrice = (price, discountPercent, discountAmount) => {
    let p = Number(price || 0);
    if (Number(discountPercent) > 0) p = p * (1 - Number(discountPercent) / 100);
    else if (Number(discountAmount) > 0) p = p - Number(discountAmount);
    return Math.max(0, Math.round(p));
  };

  const isHotProduct = (product) =>
    product.is_hot || Number(product.sold_count || 0) >= 10;

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

  // ✅ addToCart: lưu finalPrice vào cart, giữ originalPrice để hiển thị gạch ngang
  const addToCart = product => {
    const discPct = Number(product.discount_percent || 0);
    const discAmt = Number(product.discount_amount || 0);
    const finalPrice = calcSalePrice(product.price, discPct, discAmt);

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        ...product,
        price: finalPrice,             // giá đã giảm — dùng để tính tiền
        originalPrice: product.price,  // giá gốc — dùng để hiển thị gạch ngang
        quantity: 1,
      }]);
    }
  };

  const increaseQty = id => setCart(cart.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  const decreaseQty = id => setCart(cart.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0));
  const removeFromCart = id => setCart(cart.filter(item => item.id !== id));

  const openCheckout = () => {
    if (!currentUser) { setShowAuth(true); setAuthMode("login"); alert("Vui lòng đăng nhập trước khi thanh toán"); return; }
    const savedProfile = getCheckoutProfile(currentUser.email);
    setCustomer(prev => ({
      ...prev,
      customer_name: prev.customer_name || savedProfile?.customer_name || currentUser.name || "",
      customer_email: prev.customer_email || savedProfile?.customer_email || currentUser.email || "",
      phone: prev.phone || savedProfile?.phone || "",
      address: prev.address || savedProfile?.address || "",
    }));
    setShowCheckout(true);
  };

  const resetCartAndCustomer = () => {
    setCart([]);
    setCustomer({
      customer_name: currentUser?.name || "", customer_email: currentUser?.email || "",
      phone: "", address: "", note: "", payment_method: "COD",
      bank_name: "", bank_account: "", account_holder: "", otp: "",
      vnp_bank_code: "", vnp_card_number: "", vnp_card_holder: "", vnp_issue_date: "", vnp_otp: "",
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
          items: cart.map(item => ({
            product_id: item.id,
            name: item.name,
            price: item.price,          // ✅ đã là finalPrice
            originalPrice: item.originalPrice,
            quantity: item.quantity,
            weight: item.weight,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Không tạo được URL thanh toán VNPay"); return; }
      saveCheckoutProfile(currentUser?.email, customer);
      window.location.href = data.url;
    } catch (error) { alert("Lỗi khi chuyển sang VNPay"); console.error(error); }
  };

  const submitOrder = async e => {
    e.preventDefault();
    if (!currentUser) { alert("Vui lòng đăng nhập trước khi đặt hàng"); setShowAuth(true); return; }
    if (cart.length === 0) { alert("Giỏ hàng đang trống"); return; }
    if (!customer.customer_name || !customer.customer_email || !customer.phone || !customer.address) { alert("Vui lòng nhập đầy đủ thông tin"); return; }
    if (customer.payment_method === "VNPay Sandbox") { await payWithVnpay(); return; }
    const orderData = {
      ...customer,
      items: cart.map(item => ({
        product_id: item.id,
        name: item.name,
        weight: item.weight,
        quantity: item.quantity,
        price: item.price,           // ✅ đã là finalPrice
        originalPrice: item.originalPrice,
      })),
    };
    const res = await fetch(`${API_URL}/api/orders`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.message || "Đặt hàng thất bại"); throw new Error("order failed"); }
    saveCheckoutProfile(currentUser.email, customer);
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
      setChatMessages(prev => [...prev, { from: "bot", text: "Xin lỗi, trợ lý AI đang tạm thời chưa phản hồi được. Bạn vui lòng thử lại sau ít phút hoặc liên hệ shop qua mục Liên hệ." }]);
    } finally { setChatbotLoading(false); }
  };

  const aboutModalData = {
    "nguon-goc": { title: "Nguồn gốc rõ ràng", content: `Thanh Chương Trà ra đời từ vùng đất chè nổi tiếng Thanh Chương, Nghệ An — nơi những đồi chè xanh mướt trải dài theo từng sườn núi, gắn bó bao đời với cuộc sống người dân địa phương. Khác với nhiều vùng chè công nghiệp, chè Thanh Chương được trồng trên đất đỏ bazan, khí hậu mát mẻ quanh năm, tạo nên búp chè có độ ngọt tự nhiên và hương thơm mộc mạc rất riêng.\n\nChúng tôi hướng đến sự minh bạch từ vườn chè đến tay người dùng. Mỗi dòng sản phẩm đều ghi rõ xuất xứ, loại trà, trọng lượng và cách bảo quản.` },
    "huong-vi": { title: "Hương vị truyền thống", content: `Điều làm nên sự khác biệt của trà Thanh Chương chính là hương vị mang đậm dấu ấn vùng miền. Trà có vị chát dịu, không gắt — đó là cái chát của chè non hái đúng lứa, qua công đoạn sao thủ công vừa đủ để giữ lại tinh chất tự nhiên.\n\nHậu vị ngọt thanh lan dần từ cuống lưỡi, không cần thêm đường mà vẫn cảm nhận được sự dịu dàng tự nhiên.` },
    "cach-pha": { title: "Cách pha trà", content: `Bước 1 — Chuẩn bị: Dùng khoảng 5–8g trà cho ấm 150–200ml.\n\nBước 2 — Tráng trà: Rót một ít nước nóng vào ấm, lắc nhẹ rồi đổ bỏ.\n\nBước 3 — Pha trà: Dùng nước khoảng 80–90°C, không dùng nước sôi 100°C.\n\nBước 4 — Hãm trà: Đậy nắp và hãm khoảng 20–30 giây.\n\nBước 5 — Thưởng thức: Rót đều ra chén, uống khi còn ấm.` },
  };

  const navLinks = [
    { href: "#home", label: "Trang chủ" },
    { href: "#about", label: "Giới thiệu" },
    { href: "#products", label: "Sản phẩm" },
    { href: "#gift", label: "Hộp quà" },
    { href: "#guide", label: "Cách pha trà" },
    { href: "#contact", label: "Liên hệ" },
  ];

  return (
    <div>
      <style>{`
        @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        @keyframes chatBadgePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        @keyframes chatBtnWiggle { 0%,100% { transform: rotate(0deg); } 20% { transform: rotate(-12deg); } 40% { transform: rotate(10deg); } 60% { transform: rotate(-6deg); } 80% { transform: rotate(4deg); } }
        @keyframes chatRipple { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.75); opacity: 0; } }

        .chatbot-toggle-btn { animation: chatBtnWiggle 4s ease-in-out infinite; }
        .chatbot-toggle-btn:hover { animation: none; }
        .chatbot-ripple {
          position: absolute; inset: 0; border-radius: 50%;
          background: #1f7a36; pointer-events: none;
          animation: chatRipple 2s ease-out infinite;
        }

        .badge-hot {
          background: #1a6b2f; color: #d4f5d8; font-size: 11px; font-weight: 700;
          padding: 4px 10px; border-radius: 999px; display: inline-flex;
          align-items: center; gap: 4px; white-space: nowrap; line-height: 1.4;
          letter-spacing: 0.02em; border: 1px solid rgba(255,255,255,0.18);
        }
        .badge-discount {
          background: #e65f00; color: #fff8f0; font-size: 11px; font-weight: 700;
          padding: 4px 10px; border-radius: 999px; display: inline-flex;
          align-items: center; gap: 4px; white-space: nowrap; line-height: 1.4;
          letter-spacing: 0.02em; border: 1px solid rgba(255,255,255,0.18);
        }
        .badge-category {
          position: absolute; bottom: 10px; left: 10px;
          background: rgba(255,255,255,0.92); color: #1f7a36;
          padding: 4px 11px; border-radius: 999px; font-size: 11px; font-weight: 700;
          backdrop-filter: blur(4px); box-shadow: 0 2px 8px rgba(0,0,0,0.10);
          white-space: nowrap; max-width: calc(100% - 20px); overflow: hidden; text-overflow: ellipsis;
        }
        .badges-top-left {
          position: absolute; top: 8px; left: 8px;
          display: flex; flex-direction: column; gap: 4px; z-index: 2;
        }

        .hamburger {
          display: none; flex-direction: column; gap: 5px;
          background: none; border: none; cursor: pointer; padding: 8px; z-index: 1002; flex-shrink: 0;
        }
        .hamburger span { display: block; width: 24px; height: 2.5px; background: #174421; border-radius: 2px; transition: all .25s; }
        .hamburger.open span:nth-child(1) { transform: translateY(7.5px) rotate(45deg); background: #fff; }
        .hamburger.open span:nth-child(2) { opacity: 0; }
        .hamburger.open span:nth-child(3) { transform: translateY(-7.5px) rotate(-45deg); background: #fff; }

        .mobile-cart-btn {
          display: none; align-items: center; gap: 6px; background: #1f7a36;
          color: #fff; border: none; border-radius: 20px; padding: 8px 14px;
          font-size: 14px; font-weight: 700; cursor: pointer; flex-shrink: 0;
        }
        .mobile-cart-btn span {
          background: #fff; color: #1f7a36; border-radius: 50%; width: 20px; height: 20px;
          display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900;
        }
        .mobile-nav-overlay {
          display: none; position: fixed; inset: 0; background: rgba(13,46,21,0.97); z-index: 1000;
          flex-direction: column; align-items: center; justify-content: center; gap: 0;
        }
        .mobile-nav-overlay.open { display: flex; }
        .mobile-nav-overlay a {
          color: #fff; font-size: 22px; font-weight: 700; text-decoration: none;
          padding: 16px 0; width: 100%; text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.1); transition: background .15s;
        }
        .mobile-nav-overlay a:first-child { border-top: 1px solid rgba(255,255,255,0.1); }
        .mobile-nav-overlay a:hover { background: rgba(255,255,255,0.08); }
        .mobile-nav-actions {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; margin-top: 28px; width: 100%; padding: 0 32px;
        }
        .mobile-nav-actions button { width: 100%; padding: 13px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; }
        .mobile-nav-actions .btn-login { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3) !important; }
        .mobile-nav-actions .btn-cart { background: #1f7a36; color: #fff; }
        .mobile-nav-actions .btn-logout { background: rgba(255,255,255,0.1); color: #a5d6a7; font-size: 13px; }

        @media (max-width: 768px) {
          .hamburger { display: flex; }
          .mobile-cart-btn { display: flex; }
          .main-nav { display: none !important; }
          .header-actions { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav-overlay { display: none !important; }
          .mobile-cart-btn { display: none !important; }
        }
      `}</style>

      {/* MOBILE NAV */}
      <div className={`mobile-nav-overlay${menuOpen ? " open" : ""}`}>
        {navLinks.map(link => (
          <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>
        ))}
        <div className="mobile-nav-actions">
          {currentUser ? (
            <>
              <div style={{ color: "#a5d6a7", fontSize: 14, textAlign: "center" }}>Xin chào, <strong>{currentUser.name}</strong></div>
              <button className="btn-logout" onClick={() => { logout(); setMenuOpen(false); }}>Đăng xuất</button>
            </>
          ) : (
            <button className="btn-login" onClick={() => { setShowAuth(true); setAuthMode("login"); setMenuOpen(false); }}>Đăng nhập / Đăng ký</button>
          )}
          <button className="btn-cart" onClick={() => { openCheckout(); setMenuOpen(false); }}>
            🛒 Giỏ hàng ({cartCount})
          </button>
        </div>
      </div>

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
          {navLinks.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
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
        <button className="mobile-cart-btn" onClick={openCheckout}>
          🛒 <span>{cartCount}</span>
        </button>
        <button className={`hamburger${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>
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
            {filteredProducts.map(product => {
              const discPct = Number(product.discount_percent || 0);
              const discAmt = Number(product.discount_amount || 0);
              const hasDiscount = discPct > 0 || discAmt > 0;
              const salePrice = calcSalePrice(product.price, discPct, discAmt);
              const stock = Number(product.stock ?? 999);
              const hot = isHotProduct(product);
              const lowStock = stock > 0 && stock < 10;
              const outOfStock = stock === 0;
              return (
                <article className="product-card" key={product.id}>
                  <div className="product-image" style={{ position: "relative" }}>
                    <img src={product.image_url} alt={product.name} />
                    <span className="badge-category">{product.category}</span>
                    <div className="badges-top-left">
                      {hot && (
                        <span className="badge-hot">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}><path d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9zm0 14a3 3 0 01-3-3c0-2.5 3-6 3-6s3 3.5 3 6a3 3 0 01-3 3z"/></svg>
                          Bán chạy
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="badge-discount">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}><path d="M21.41 11.58L12.41 2.58A2 2 0 0011 2H4a2 2 0 00-2 2v7a2 2 0 00.59 1.42l9 9a2 2 0 002.82 0l7-7a2 2 0 000-2.84zM5.5 7A1.5 1.5 0 117 5.5 1.5 1.5 0 015.5 7z"/></svg>
                          {discPct > 0 ? `−${discPct}%` : `−${Number(discAmt).toLocaleString("vi-VN")}đ`}
                        </span>
                      )}
                    </div>
                    {outOfStock && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.48)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "inherit" }}>
                        <span style={{ color: "#fff", fontWeight: 800, fontSize: 13, background: "rgba(0,0,0,0.55)", padding: "6px 18px", borderRadius: 999 }}>Hết hàng</span>
                      </div>
                    )}
                  </div>
                  <div className="product-body">
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="product-meta">
                      <span>{product.weight}</span>
                      <span>{product.origin}</span>
                    </div>
                    {!outOfStock && stock < 999 && (
                      <div style={{ marginBottom: 6, marginTop: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: lowStock ? "#c62828" : "#666", background: lowStock ? "#ffebee" : "#f5f5f5", padding: "3px 9px", borderRadius: 6 }}>
                          {lowStock ? `⚠️ Còn ${stock} sản phẩm` : `📦 Còn ${stock} sản phẩm`}
                        </span>
                      </div>
                    )}
                    <div className="product-footer">
                      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {hasDiscount && <span style={{ fontSize: 12, color: "#aaa", textDecoration: "line-through" }}>{formatPrice(product.price)}</span>}
                        <strong style={{ color: hasDiscount ? "#c62828" : "#b96b00" }}>
                          {hasDiscount ? formatPrice(salePrice) : formatPrice(product.price)}
                        </strong>
                      </div>
                      <button onClick={() => setSelectedProduct(product)}>Xem chi tiết</button>
                    </div>
                    <button className="add-cart" disabled={outOfStock} style={outOfStock ? { opacity: 0.5, cursor: "not-allowed" } : {}} onClick={() => !outOfStock && addToCart(product)}>
                      {outOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ===== GIFT SECTION ===== */}
        <section className="gift-section" id="gift">
          <div className="gift-intro">
            <p className="eyebrow">Hộp quà trà</p>
            <h2>Quà biếu Thanh Chương – trang nhã, gần gũi, ý nghĩa</h2>
            <p>Khu vực hộp quà được tách riêng để khách dễ chọn sản phẩm biếu Tết, biếu thầy cô, đối tác, người thân hoặc khách hàng.</p>
          </div>
          <div className="gift-grid">
            {giftProducts.length > 0 ? giftProducts.map(product => {
              const discPct = Number(product.discount_percent || 0);
              const discAmt = Number(product.discount_amount || 0);
              const hasDiscount = discPct > 0 || discAmt > 0;
              const salePrice = calcSalePrice(product.price, discPct, discAmt);
              const hot = isHotProduct(product);
              const stock = Number(product.stock ?? 999);
              const outOfStock = stock === 0;
              return (
                <article className="gift-card" key={product.id}>
                  <div style={{ position: "relative" }}>
                    <img src={product.image_url} alt={product.name} />
                    <div className="badges-top-left">
                      {hot && (
                        <span className="badge-hot">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}><path d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9zm0 14a3 3 0 01-3-3c0-2.5 3-6 3-6s3 3.5 3 6a3 3 0 01-3 3z"/></svg>
                          Bán chạy
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="badge-discount">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}><path d="M21.41 11.58L12.41 2.58A2 2 0 0011 2H4a2 2 0 00-2 2v7a2 2 0 00.59 1.42l9 9a2 2 0 002.82 0l7-7a2 2 0 000-2.84zM5.5 7A1.5 1.5 0 117 5.5 1.5 1.5 0 015.5 7z"/></svg>
                          {discPct > 0 ? `−${discPct}%` : `−${Number(discAmt).toLocaleString("vi-VN")}đ`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    {hasDiscount ? (
                      <div style={{ marginBottom: 14 }}>
                        <span style={{ fontSize: 13, color: "#ccc", textDecoration: "line-through" }}>{formatPrice(product.price)}</span>
                        <strong style={{ marginLeft: 8, color: "#ffe57a", fontSize: 20 }}>{formatPrice(salePrice)}</strong>
                      </div>
                    ) : (
                      <strong>{formatPrice(product.price)}</strong>
                    )}
                    {stock < 999 && stock > 0 && stock < 10 && (
                      <div style={{ fontSize: 12, color: "#ffab91", marginTop: 4, marginBottom: 8 }}>⚠️ Còn {stock} sản phẩm</div>
                    )}
                    <div className="gift-actions">
                      <button onClick={() => setSelectedProduct(product)}>Xem chi tiết</button>
                      <button disabled={outOfStock} style={outOfStock ? { opacity: 0.5, cursor: "not-allowed" } : {}} onClick={() => !outOfStock && addToCart(product)}>
                        {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            }) : <p>Chưa có sản phẩm hộp quà.</p>}
          </div>
        </section>

        <section className="guide-section" id="guide">
  <div className="section-heading">
    <p className="eyebrow green">Thưởng trà</p>
    <h2>Cách pha trà ngon</h2>
    <p>Từng bước đơn giản giúp bạn cảm nhận trọn vẹn hương vị trà Thanh Chương.</p>
  </div>

  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 24, maxWidth: 1100, margin: "0 auto", padding: "0 5%"
  }}>
    {[
      {
        num: "01", icon: "scale", title: "Chuẩn bị trà",
        desc: "Dùng 5–8g trà cho ấm 150–200ml nước. Có thể tăng lượng trà nếu thích vị đậm hơn.",
        tip: "Dùng cân nhỏ để đo chính xác lần đầu."
      },
      {
        num: "02", icon: "teapot", title: "Tráng ấm & trà",
        desc: "Rót nước nóng vào ấm, lắc nhẹ rồi đổ bỏ. Giúp ấm đạt nhiệt độ ổn định và khai mở hương trà.",
        tip: "Bước này nhiều người bỏ qua nhưng rất quan trọng."
      },
      {
        num: "03", icon: "temperature", title: "Nhiệt độ nước",
        desc: "Pha với nước 80–90°C. Không dùng nước sôi 100°C vì sẽ làm trà đắng và mất hương.",
        tip: "Đun sôi xong để nguội 3–5 phút là đạt chuẩn."
      },
      {
        num: "04", icon: "timer", title: "Hãm trà",
        desc: "Đậy nắp hãm 20–30 giây cho lần đầu. Các lần sau có thể tăng thêm 10 giây mỗi lần.",
        tip: "Trà Thanh Chương có thể pha được 4–5 lần."
      },
      {
        num: "05", icon: "cup", title: "Rót & thưởng thức",
        desc: "Rót đều ra chén theo vòng tròn để đồng đều màu sắc. Uống khi còn ấm để cảm nhận hậu vị ngọt thanh.",
        tip: "Dùng chén nhỏ để trà không nguội nhanh."
      },
      {
        num: "06", icon: "package", title: "Bảo quản đúng cách",
        desc: "Giữ trà trong hộp kín, tránh ánh sáng và độ ẩm. Không để gần thực phẩm có mùi mạnh.",
        tip: "Dùng hết trong 6 tháng sau khi mở để giữ hương tốt nhất."
      },
    ].map((step, i) => (
      <div key={i} style={{
        background: "#fff",
        borderRadius: 20,
        padding: "28px 24px",
        boxShadow: "0 4px 24px rgba(31,122,54,0.08)",
        border: "1px solid #e8f5e0",
        display: "flex", flexDirection: "column", gap: 12,
        transition: "transform .2s, box-shadow .2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(31,122,54,0.15)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(31,122,54,0.08)"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg,#1a6b2e,#2d9e4e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 900, color: "#fff", flexShrink: 0,
            boxShadow: "0 4px 12px rgba(31,122,54,0.3)"
          }}>{step.num}</div>
          <span style={{
            width: 44, height: 44, borderRadius: 12,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "#1f7a36", background: "#eef8ed", border: "1px solid #dcefd9"
          }}><TeaGuideIcon name={step.icon} /></span>
        </div>

        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#174421" }}>{step.title}</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.7 }}>{step.desc}</p>

        <div style={{
          background: "#f0fbf4", borderRadius: 10, padding: "8px 12px",
          fontSize: 12, color: "#1f7a36", display: "flex", gap: 6, alignItems: "flex-start",
          borderLeft: "3px solid #2d9e4e"
        }}>
          <span style={{ flexShrink: 0, display: "inline-flex", marginTop: 1 }}><TeaGuideIcon name="tip" size={15} /></span>
          <span>{step.tip}</span>
        </div>
      </div>
    ))}
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
                width="100%" height="220" style={{ border: 0, display: "block" }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
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

      <footer className="site-footer" style={{ background: "#0d2e14", color: "#c8e6c9", padding: "48px 5% 24px" }}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40, maxWidth: 1100, margin: "0 auto", paddingBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="footer-column footer-brand-column">
            <h3 style={{ color: "#fff", marginBottom: 8, fontSize: 20 }}>Thanh Chương Trà</h3>
            <p style={{ fontSize: 13, lineHeight: 1.8, opacity: 0.75 }}>Hương xanh xứ Nghệ trong từng chén trà. Tinh chọn từ vùng chè Thanh Chương, Nghệ An.</p>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              {[{ label: "Facebook", url: "https://www.facebook.com/share/18adUuHPZp/?mibextid=wwXIfr" }, { label: "Zalo", url: "https://zalo.me/0985605049" }, { label: "TikTok", url: "https://www.tiktok.com/@hthtyuyu" }].map(sn => (
                <a key={sn.label} href={sn.url} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "#c8e6c9", textDecoration: "none" }}>{sn.label}</a>
              ))}
            </div>
          </div>
          <div className="footer-column">
            <h4 style={{ color: "#fff", marginBottom: 16, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>Liên kết nhanh</h4>
            <div className="footer-links" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[{ label: "Trang chủ", href: "#home" }, { label: "Sản phẩm", href: "#products" }, { label: "Hộp quà", href: "#gift" }, { label: "Cách pha trà", href: "#guide" }, { label: "Liên hệ", href: "#contact" }].map(link => (
                <a key={link.label} href={link.href} style={{ color: "#a5d6a7", textDecoration: "none", fontSize: 14, opacity: 0.85 }}>{link.label}</a>
              ))}
            </div>
          </div>
          <div className="footer-column">
            <h4 style={{ color: "#fff", marginBottom: 16, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>Chính sách</h4>
            <div className="footer-policy-list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[{ icon: "🚚", label: "Chính sách vận chuyển", key: "van-chuyen" }, { icon: "🔄", label: "Chính sách đổi trả", key: "doi-tra" }, { icon: "🔒", label: "Chính sách bảo mật", key: "bao-mat" }].map(policy => (
                <button className="footer-policy-button" key={policy.key} onClick={() => setShowPolicyModal(policy.key)} style={{ background: "none", border: "none", color: "#a5d6a7", fontSize: 14, cursor: "pointer", textAlign: "left", padding: 0, opacity: 0.85 }}><span>{policy.icon}</span><span>{policy.label}</span></button>
              ))}
            </div>
          </div>
          <div className="footer-column">
            <h4 style={{ color: "#fff", marginBottom: 16, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>Liên hệ</h4>
            <div className="footer-contact-list" style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, opacity: 0.8 }}>
              <span className="footer-contact-item"><span>📞</span><span>0395034551</span></span>
              <span className="footer-contact-item"><span>✉️</span><span>thanhchuongtra@gmail.com</span></span>
              <span className="footer-contact-item"><span>📍</span><span>Thanh Chương, Nghệ An</span></span>
              <span className="footer-contact-item"><span>🕐</span><span>7:00 – 21:00 hàng ngày</span></span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, opacity: 0.5, maxWidth: 1100, margin: "24px auto 0" }}>
          © 2025 Thanh Chương Trà. Bảo lưu mọi quyền.
        </div>
      </footer>

      {/* MODALS */}
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
                {(() => {
                  const discPct = Number(selectedProduct.discount_percent || 0);
                  const discAmt = Number(selectedProduct.discount_amount || 0);
                  const hasDiscount = discPct > 0 || discAmt > 0;
                  const salePrice = calcSalePrice(selectedProduct.price, discPct, discAmt);
                  const stock = Number(selectedProduct.stock ?? 999);
                  const hot = isHotProduct(selectedProduct);
                  return (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        {hot && (
                          <span className="badge-hot">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}><path d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9zm0 14a3 3 0 01-3-3c0-2.5 3-6 3-6s3 3.5 3 6a3 3 0 01-3 3z"/></svg>
                            Bán chạy
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="badge-discount">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}><path d="M21.41 11.58L12.41 2.58A2 2 0 0011 2H4a2 2 0 00-2 2v7a2 2 0 00.59 1.42l9 9a2 2 0 002.82 0l7-7a2 2 0 000-2.84zM5.5 7A1.5 1.5 0 117 5.5 1.5 1.5 0 015.5 7z"/></svg>
                            Đang giảm giá
                          </span>
                        )}
                      </div>
                      {hasDiscount ? (
                        <div>
                          <span style={{ fontSize: 14, color: "#aaa", textDecoration: "line-through" }}>{formatPrice(selectedProduct.price)}</span>
                          <h3 style={{ margin: "4px 0", color: "#c62828" }}>{formatPrice(salePrice)}</h3>
                        </div>
                      ) : (
                        <h3>{formatPrice(selectedProduct.price)}</h3>
                      )}
                      {stock < 999 && (
                        <div style={{ fontSize: 13, color: stock === 0 ? "#e53935" : stock < 10 ? "#c62828" : "#555", marginTop: 4 }}>
                          {stock === 0 ? "❌ Hết hàng" : stock < 10 ? `⚠️ Còn ${stock} sản phẩm` : `📦 Còn ${stock} sản phẩm`}
                        </div>
                      )}
                    </div>
                  );
                })()}
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

      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onClose={() => { setShowCheckout(false); resetCartAndCustomer(); }}
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
      <div
        style={{
          position: "fixed",
          right: dragPos.right,
          bottom: dragPos.bottom,
          zIndex: 9999,
          fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
          userSelect: "none",
        }}
      >
        {showChatbot && (
          <div className="chatbot-box">
            <div className="chatbot-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BotAvatar />
                <div>
                  <strong>Trợ lý Thanh Chương Trà</strong>
                  <span style={{ display: "block", fontSize: 11, opacity: 0.8 }}>
                    {chatbotLoading ? "🟡 Đang trả lời..." : "🟢 Trực tuyến"}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setShowChatbot(false)}>×</button>
            </div>
            <div className="chatbot-messages">
              {chatMessages.map((message, index) => (
                <div key={index} style={{ display: "flex", flexDirection: message.from === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
                  {message.from === "bot" && <BotAvatar />}
                  <div
                    className={message.from === "user" ? "chat-message user-message" : "chat-message bot-message"}
                    style={{ borderRadius: message.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", maxWidth: "78%" }}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {chatbotLoading && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>
            <div className="chatbot-input">
              <input
                type="text"
                placeholder="Nhập câu hỏi..."
                value={chatInput}
                disabled={chatbotLoading}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendChatMessage(); }}
              />
              <button type="button" onClick={sendChatMessage} disabled={chatbotLoading}>
                {chatbotLoading ? "..." : "Gửi"}
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          className={`chatbot-toggle${!showChatbot ? " chatbot-toggle-btn" : ""}`}
          onMouseDown={onDragMouseDown}
          onClick={() => {
            if (!hasDragged.current) {
              setShowChatbot(!showChatbot);
              setShowChatBadge(false);
            }
          }}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          aria-label="Mở chatbot tư vấn"
          title="Kéo để di chuyển · Click để mở"
        >
          {!showChatbot && <span className="chatbot-ripple" />}
          {!showChatbot && showChatBadge && (
            <span style={{
              position: "absolute", top: -4, right: -4, zIndex: 2,
              background: "#e53935", color: "#fff", borderRadius: "50%",
              width: 20, height: 20, fontSize: 11,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid #fff", fontWeight: "bold",
              animation: "chatBadgePulse 1.5s infinite",
            }}>1</span>
          )}
          {showChatbot ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <circle cx="9" cy="10" r="1" fill="#fff" stroke="none"/>
              <circle cx="12" cy="10" r="1" fill="#fff" stroke="none"/>
              <circle cx="15" cy="10" r="1" fill="#fff" stroke="none"/>
            </svg>
          )}
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
