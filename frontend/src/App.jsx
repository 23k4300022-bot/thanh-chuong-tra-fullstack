import { useEffect, useMemo, useState } from "react";
import "./App.css";
import "./admin.css";
import AdminPage from "./AdminPage";
import logo from "./assets/logo.png";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function Storefront() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAboutDetail, setShowAboutDetail] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(null); // null | 'nguon-goc' | 'huong-vi' | 'cach-pha'
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);

  const [showChatbot, setShowChatbot] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      from: "bot",
      text: "Xin chào! Mình là trợ lý Thanh Chương Trà. Bạn cần tư vấn sản phẩm, cách pha trà, đặt hàng hay thanh toán?",
    },
  ]);

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [customer, setCustomer] = useState({
    customer_name: "",
    customer_email: "",
    phone: "",
    address: "",
    note: "",
    payment_method: "COD",
    bank_name: "",
    bank_account: "",
    account_holder: "",
    otp: "",
    vnp_bank_code: "",
    vnp_card_number: "",
    vnp_card_holder: "",
    vnp_issue_date: "",
    vnp_otp: "",
  });

  const [contact, setContact] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Lỗi lấy sản phẩm:", err));

    const savedUser = localStorage.getItem("thanh_chuong_user");

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const orderId = params.get("order_id");

    if (payment === "vnpay_success") {
      alert(`Thanh toán VNPay Sandbox thành công! Mã đơn: ${orderId}`);
      setCart([]);
      setShowCheckout(false);
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

  const categories = useMemo(() => {
    const unique = [...new Set(products.map((item) => item.category))].filter(
      Boolean
    );

    return ["Tất cả", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "Tất cả") return products;

    return products.filter((item) => item.category === activeCategory);
  }, [products, activeCategory]);

  const giftProducts = useMemo(() => {
    return products.filter((item) =>
      String(item.category || "").toLowerCase().includes("hộp quà")
    );
  }, [products]);

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const handleRegister = (e) => {
    e.preventDefault();

    if (!authForm.name || !authForm.email || !authForm.password) {
      alert("Vui lòng nhập đầy đủ thông tin đăng ký");
      return;
    }

    const users = JSON.parse(localStorage.getItem("thanh_chuong_users") || "[]");

    const existed = users.find((user) => user.email === authForm.email);

    if (existed) {
      alert("Email này đã được đăng ký");
      return;
    }

    const newUser = {
      id: Date.now(),
      name: authForm.name,
      email: authForm.email,
      password: authForm.password,
    };

    users.push(newUser);

    localStorage.setItem("thanh_chuong_users", JSON.stringify(users));

    const loginUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    };

    localStorage.setItem("thanh_chuong_user", JSON.stringify(loginUser));

    setCurrentUser(loginUser);
    setShowAuth(false);
    setAuthForm({
      name: "",
      email: "",
      password: "",
    });

    alert("Đăng ký thành công!");
  };

  const handleLogin = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("thanh_chuong_users") || "[]");

    const user = users.find(
      (item) =>
        item.email === authForm.email && item.password === authForm.password
    );

    if (!user) {
      alert("Email hoặc mật khẩu không đúng");
      return;
    }

    const loginUser = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    localStorage.setItem("thanh_chuong_user", JSON.stringify(loginUser));

    setCurrentUser(loginUser);
    setShowAuth(false);
    setAuthForm({
      name: "",
      email: "",
      password: "",
    });

    alert("Đăng nhập thành công!");
  };

  const logout = () => {
    localStorage.removeItem("thanh_chuong_user");
    setCurrentUser(null);
    alert("Đã đăng xuất");
  };

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
        },
      ]);
    }
  };

  const increaseQty = (id) => {
    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCart(
      cart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const openCheckout = () => {
    if (!currentUser) {
      setShowAuth(true);
      setAuthMode("login");
      alert("Vui lòng đăng nhập trước khi thanh toán");
      return;
    }

    setCustomer({
      ...customer,
      customer_name: currentUser.name || "",
      customer_email: currentUser.email || customer.customer_email || "",
    });

    setShowCheckout(true);
  };

  const payWithVnpay = async () => {
    if (cart.length === 0) {
      alert("Giỏ hàng đang trống");
      return;
    }

    if (
      !customer.customer_name ||
      !customer.customer_email ||
      !customer.phone ||
      !customer.address
    ) {
      alert("Vui lòng nhập họ tên, email, số điện thoại và địa chỉ trước khi thanh toán");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/create-vnpay-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            ...customer,
            payment_method: "VNPay Sandbox",
            vnp_bank_code: "NCB",
          },
          items: cart.map((item) => ({
            product_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            weight: item.weight,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Không tạo được URL thanh toán VNPay");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      alert("Lỗi khi chuyển sang VNPay");
      console.error(error);
    }
  };

  const submitOrder = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("Vui lòng đăng nhập trước khi đặt hàng");
      setShowAuth(true);
      return;
    }

    if (cart.length === 0) {
      alert("Giỏ hàng đang trống");
      return;
    }

    if (
      !customer.customer_name ||
      !customer.customer_email ||
      !customer.phone ||
      !customer.address
    ) {
      alert("Vui lòng nhập họ tên, email, số điện thoại và địa chỉ");
      return;
    }

    if (customer.payment_method === "VNPay Sandbox") {
      await payWithVnpay();
      return;
    }

    if (customer.payment_method === "Chuyển khoản test") {
      if (
        !customer.bank_name ||
        !customer.bank_account ||
        !customer.account_holder ||
        !customer.otp
      ) {
        alert("Vui lòng nhập đầy đủ thông tin thanh toán ngân hàng");
        return;
      }

      if (customer.bank_account.trim() !== "9704360000000000") {
        alert("Số tài khoản test không đúng");
        return;
      }

      if (customer.account_holder.trim().toUpperCase() !== "NGUYEN VAN A") {
        alert("Tên chủ tài khoản test không đúng");
        return;
      }

      if (customer.otp.trim() !== "123456") {
        alert("OTP test không đúng");
        return;
      }
    }

    const orderData = {
      ...customer,
      items: cart.map((item) => ({
        product_id: item.id,
        name: item.name,
        weight: item.weight,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Đặt hàng thất bại");
        return;
      }

      if (customer.payment_method === "Chuyển khoản test") {
        alert(`Thanh toán ngân hàng test thành công! Mã đơn: ${data.order_id}`);
      } else {
        alert(`Đặt hàng thành công! Mã đơn: ${data.order_id}`);
      }

      setCart([]);
      setShowCheckout(false);

      setCustomer({
        customer_name: currentUser.name || "",
        customer_email: currentUser.email || "",
        phone: "",
        address: "",
        note: "",
        payment_method: "COD",
        bank_name: "",
        bank_account: "",
        account_holder: "",
        otp: "",
        vnp_bank_code: "",
        vnp_card_number: "",
        vnp_card_holder: "",
        vnp_issue_date: "",
        vnp_otp: "",
      });
    } catch (error) {
      alert("Lỗi kết nối khi đặt hàng");
      console.error(error);
    }
  };

  const submitContact = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/api/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contact),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gửi liên hệ thất bại");
        return;
      }

      alert("Gửi liên hệ thành công!");

      setContact({
        name: "",
        phone: "",
        email: "",
        message: "",
      });
    } catch (error) {
      alert("Lỗi kết nối khi gửi liên hệ");
      console.error(error);
    }
  };

  const sendChatMessage = async () => {
    const userMessage = chatInput.trim();

    if (!userMessage || chatbotLoading) return;

    // FIX: Chỉ gửi history là các tin nhắn thực (bỏ tin chào đầu tiên từ bot),
    // và đảm bảo history bắt đầu bằng tin nhắn của user
    const previousMessages = chatMessages
      .slice(1)   // bỏ tin chào mặc định của bot ở đầu
      .slice(-8); // lấy tối đa 8 tin gần nhất

    setChatMessages((prev) => [
      ...prev,
      {
        from: "user",
        text: userMessage,
      },
    ]);

    setChatInput("");
    setChatbotLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chatbot/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: currentUser?.name || "",
          customer_email: currentUser?.email || "",
          user_message: userMessage,
          history: previousMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Không nhận được phản hồi từ trợ lý AI");
      }

      setChatMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: data.reply,
        },
      ]);
    } catch (error) {
      console.error("Lỗi chatbot AI:", error);

      setChatMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text:
            "Xin lỗi, trợ lý AI đang tạm thời chưa phản hồi được. " +
            "Bạn vui lòng thử lại sau ít phút hoặc liên hệ shop qua mục Liên hệ.",
        },
      ]);
    } finally {
      setChatbotLoading(false);
    }
  };

  // Data cho các modal chi tiết về thương hiệu
  const aboutModalData = {
    "nguon-goc": {
      title: "Nguồn gốc rõ ràng",
      content: `Thanh Chương Trà ra đời từ vùng đất chè nổi tiếng Thanh Chương, Nghệ An — nơi những đồi chè xanh mướt trải dài theo từng sườn núi, gắn bó bao đời với cuộc sống người dân địa phương. Khác với nhiều vùng chè công nghiệp, chè Thanh Chương được trồng trên đất đỏ bazan, khí hậu mát mẻ quanh năm, tạo nên búp chè có độ ngọt tự nhiên và hương thơm mộc mạc rất riêng.

Chúng tôi hướng đến sự minh bạch từ vườn chè đến tay người dùng. Mỗi dòng sản phẩm đều ghi rõ xuất xứ, loại trà, trọng lượng và cách bảo quản, để người mua hiểu rõ mình đang chọn loại trà nào và dùng như thế nào cho đúng cách. Đây không chỉ là trà — đây là câu chuyện về mảnh đất xứ Nghệ được đóng gói trang nhã và gửi đi khắp mọi miền.`,
    },
    "huong-vi": {
      title: "Hương vị truyền thống",
      content: `Điều làm nên sự khác biệt của trà Thanh Chương chính là hương vị mang đậm dấu ấn vùng miền. Trà có vị chát dịu, không gắt — đó là cái chát của chè non hái đúng lứa, qua công đoạn sao thủ công vừa đủ để giữ lại tinh chất tự nhiên. Nước trà xanh vàng, trong, toát lên mùi thơm cỏ xanh thanh khiết sau khi pha.

Hậu vị là điểm được nhiều người yêu trà nhắc đến nhất: ngọt thanh lan dần từ cuống lưỡi, không cần thêm đường mà vẫn cảm nhận được sự dịu dàng tự nhiên. Đây chính là kiểu hương vị phù hợp uống hằng ngày — không quá mạnh để gây mất ngủ, không quá nhạt để cảm thấy vô vị. Với người lần đầu uống trà mộc, Thanh Chương Trà là một lựa chọn dễ uống và dễ cảm nhận.`,
    },
    "cach-pha": {
      title: "Cách pha trà",
      content: `Pha trà đúng cách là bước quan trọng để cảm nhận hết hương vị mà thiên nhiên và người làm trà đã gửi gắm vào từng lá chè.

Bước 1 — Chuẩn bị: Dùng khoảng 5–8g trà cho ấm 150–200ml. Nên dùng ấm gốm hoặc ấm thủy tinh để giữ nhiệt tốt và quan sát được màu nước trà.

Bước 2 — Tráng trà: Rót một ít nước nóng vào ấm, lắc nhẹ rồi đổ bỏ. Bước này giúp trà nở đều và loại bỏ bụi còn sót.

Bước 3 — Pha trà: Dùng nước khoảng 80–90°C, không nên dùng nước sôi 100°C vì sẽ làm trà bị đắng. Rót nước vào ấm từ từ theo vòng tròn.

Bước 4 — Hãm trà: Đậy nắp và hãm khoảng 20–30 giây. Không hãm quá lâu sẽ làm trà chát.

Bước 5 — Thưởng thức: Rót đều ra chén, uống khi còn ấm để cảm nhận rõ hương thơm và hậu vị ngọt thanh.

Lưu ý: Trà thảo mộc như trà gừng, trà atiso có thể hãm lâu hơn 3–7 phút. Trà túi lọc dùng nước 90°C, hãm 2–3 phút.`,
    },
  };

  return (
    <div>
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
            <button
              className="auth-button"
              onClick={() => {
                setShowAuth(true);
                setAuthMode("login");
              }}
            >
              Đăng nhập
            </button>
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
            <p>
              Tinh chọn từ vùng chè Thanh Chương, Nghệ An, mang đến hương vị
              trà xanh mộc mạc, chát dịu và hậu ngọt thanh trong từng chén trà.
            </p>

            <div className="hero-actions">
              <a href="#products" className="btn primary">
                Xem sản phẩm
              </a>
              <a href="#gift" className="btn outline">
                Chọn hộp quà
              </a>
            </div>
          </div>
        </section>

        <section className="category-section">
          <div className="section-heading">
            <p className="eyebrow green">Danh mục</p>
            <h2>Chọn dòng trà phù hợp</h2>
            <p>
              Mỗi nhóm sản phẩm được phân loại rõ ràng để khách dễ chọn trà uống
              hằng ngày, trà tiếp khách hoặc hộp quà biếu tặng.
            </p>
          </div>

          <div className="category-tabs">
            {categories.map((category) => (
              <button
                key={category}
                className={activeCategory === category ? "active" : ""}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* ===== ABOUT SECTION - HAI CỘT ===== */}
        <section className="about-section about-story-section" id="about">
          <div className="about-two-col">

            {/* CỘT TRÁI - Câu chuyện thương hiệu */}
            <div className="about-left">
              <p className="eyebrow green">Câu chuyện thương hiệu</p>
              <h2>
                Từ vùng chè Thanh Chương
                <br />
                đến chén trà Việt
              </h2>
              <p>
                Giữa những ngọn đồi xanh mướt của Thanh Chương, Nghệ An, từng búp chè
                non tươi được hái bằng đôi tay người dân địa phương mỗi sớm mai. Đó là
                nơi Thanh Chương Trà ra đời — không phải từ nhà máy hay công thức hiện
                đại, mà từ tình yêu với hương trà mộc mạc của xứ Nghệ. Chúng tôi muốn
                giữ lại cái vị chát dịu, hậu ngọt thanh ấy và đưa nó đến với người yêu
                trà khắp mọi miền đất nước — trong từng gói trà sạch, từng hộp quà
                trang nhã và từng chén trà thơm ngát buổi sớm mai.
              </p>
            </div>

            {/* CỘT PHẢI - 3 card */}
            <div className="about-right">

              <div className="about-story-card">
                <div className="about-card-top">
                  <span className="story-number">01</span>
                  <h3>Nguồn gốc rõ ràng</h3>
                </div>
                <p>
                  Mỗi dòng trà đều hướng đến sự minh bạch về xuất xứ, phù hợp để
                  sử dụng hằng ngày, tiếp khách hoặc làm quà biếu.
                </p>
                <button
                  type="button"
                  className="about-detail-button"
                  onClick={() => setShowAboutModal("nguon-goc")}
                >
                  Xem chi tiết
                </button>
              </div>

              <div className="about-story-card">
                <div className="about-card-top">
                  <span className="story-number">02</span>
                  <h3>Hương vị truyền thống</h3>
                </div>
                <p>
                  Trà có vị chát dịu, hương thơm tự nhiên và hậu ngọt thanh —
                  vừa đủ đậm để thưởng thức, vừa đủ mềm để dễ uống.
                </p>
                <button
                  type="button"
                  className="about-detail-button"
                  onClick={() => setShowAboutModal("huong-vi")}
                >
                  Xem chi tiết
                </button>
              </div>

              <div className="about-story-card">
                <div className="about-card-top">
                  <span className="story-number">03</span>
                  <h3>Cách pha trà</h3>
                </div>
                <p>
                  Từ nhiệt độ nước, lượng trà đến thời gian hãm — mỗi bước đều
                  giúp bạn cảm nhận trọn vẹn hương vị thiên nhiên.
                </p>
                <button
                  type="button"
                  className="about-detail-button"
                  onClick={() => setShowAboutModal("cach-pha")}
                >
                  Xem chi tiết
                </button>
              </div>

            </div>
          </div>
        </section>
        {/* ===== KẾT THÚC ABOUT SECTION ===== */}

        <section className="products-section" id="products">
          <div className="section-heading">
            <p className="eyebrow green">Sản phẩm</p>
            <h2>Sản phẩm nổi bật</h2>
          </div>

          <div className="product-grid">
            {filteredProducts.map((product) => (
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
                    <button onClick={() => setSelectedProduct(product)}>
                      Xem chi tiết
                    </button>
                  </div>

                  <button className="add-cart" onClick={() => addToCart(product)}>
                    Thêm vào giỏ hàng
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="gift-section" id="gift">
          <div className="gift-intro">
            <p className="eyebrow">Hộp quà trà</p>
            <h2>Quà biếu Thanh Chương – trang nhã, gần gũi, ý nghĩa</h2>
            <p>
              Khu vực hộp quà được tách riêng để khách dễ chọn sản phẩm biếu
              Tết, biếu thầy cô, đối tác, người thân hoặc khách hàng.
            </p>
          </div>

          <div className="gift-grid">
            {giftProducts.length > 0 ? (
              giftProducts.map((product) => (
                <article className="gift-card" key={product.id}>
                  <img src={product.image_url} alt={product.name} />

                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <strong>{formatPrice(product.price)}</strong>

                    <div className="gift-actions">
                      <button onClick={() => setSelectedProduct(product)}>
                        Xem chi tiết
                      </button>
                      <button onClick={() => addToCart(product)}>
                        Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p>Chưa có sản phẩm hộp quà.</p>
            )}
          </div>
        </section>

        <section className="guide-section" id="guide">
          <div className="section-heading">
            <p className="eyebrow green">Thưởng trà</p>
            <h2>Cách pha trà ngon</h2>
          </div>

          <div className="guide-grid">
            <div>
              <strong>01</strong>
              <p>Dùng 5–8g trà cho ấm 150–200ml.</p>
            </div>
            <div>
              <strong>02</strong>
              <p>Tráng trà nhanh bằng nước nóng.</p>
            </div>
            <div>
              <strong>03</strong>
              <p>Pha với nước 80–90°C.</p>
            </div>
            <div>
              <strong>04</strong>
              <p>Hãm 20–30 giây rồi thưởng thức.</p>
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div>
            <p className="eyebrow green">Liên hệ</p>
            <h2>Đặt mua Thanh Chương Trà</h2>
            <p>Hotline: 0900 000 000</p>
            <p>Email: thanhchuongtra@gmail.com</p>
            <p>Địa chỉ: Thanh Chương, Nghệ An</p>
          </div>

          <form className="contact-form" onSubmit={submitContact}>
            <input
              type="text"
              placeholder="Họ và tên"
              value={contact.name}
              onChange={(e) =>
                setContact({
                  ...contact,
                  name: e.target.value,
                })
              }
              required
            />

            <input
              type="text"
              placeholder="Số điện thoại"
              value={contact.phone}
              onChange={(e) =>
                setContact({
                  ...contact,
                  phone: e.target.value,
                })
              }
            />

            <input
              type="email"
              placeholder="Email"
              value={contact.email}
              onChange={(e) =>
                setContact({
                  ...contact,
                  email: e.target.value,
                })
              }
            />

            <textarea
              placeholder="Nội dung cần tư vấn"
              value={contact.message}
              onChange={(e) =>
                setContact({
                  ...contact,
                  message: e.target.value,
                })
              }
              required
            />

            <button>Gửi liên hệ</button>
          </form>
        </section>
      </main>

      <footer className="footer">
        <h3>Thanh Chương Trà</h3>
        <p>Hương xanh xứ Nghệ trong từng chén trà.</p>
      </footer>

      {/* ===== MODAL CHI TIẾT THƯƠNG HIỆU ===== */}
      {showAboutModal && aboutModalData[showAboutModal] && (
        <div className="modal">
          <div className="detail-modal">
            <button className="close" onClick={() => setShowAboutModal(null)}>
              ×
            </button>
            <div style={{ padding: "1rem 0" }}>
              <h2>{aboutModalData[showAboutModal].title}</h2>
              <div style={{ marginTop: "1.5rem", lineHeight: "1.9", whiteSpace: "pre-line", color: "#444" }}>
                {aboutModalData[showAboutModal].content}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuth && (
        <div className="modal">
          <div className="auth-modal">
            <button className="close" onClick={() => setShowAuth(false)}>
              ×
            </button>

            <h2>{authMode === "login" ? "Đăng nhập" : "Đăng ký"}</h2>

            <form onSubmit={authMode === "login" ? handleLogin : handleRegister}>
              {authMode === "register" && (
                <input
                  type="text"
                  placeholder="Họ và tên"
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      name: e.target.value,
                    })
                  }
                  required
                />
              )}

              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({
                    ...authForm,
                    email: e.target.value,
                  })
                }
                required
              />

              <input
                type="password"
                placeholder="Mật khẩu"
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({
                    ...authForm,
                    password: e.target.value,
                  })
                }
                required
              />

              <button>{authMode === "login" ? "Đăng nhập" : "Đăng ký"}</button>
            </form>

            {authMode === "login" ? (
              <p>
                Chưa có tài khoản?{" "}
                <button
                  className="text-button"
                  onClick={() => setAuthMode("register")}
                >
                  Đăng ký ngay
                </button>
              </p>
            ) : (
              <p>
                Đã có tài khoản?{" "}
                <button
                  className="text-button"
                  onClick={() => setAuthMode("login")}
                >
                  Đăng nhập
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="modal">
          <div className="detail-modal">
            <button className="close" onClick={() => setSelectedProduct(null)}>
              ×
            </button>

            <div className="detail-grid">
              <img src={selectedProduct.image_url} alt={selectedProduct.name} />

              <div>
                <span className="detail-tag">{selectedProduct.category}</span>
                <h2>{selectedProduct.name}</h2>
                <h3>{formatPrice(selectedProduct.price)}</h3>
                <p>{selectedProduct.description}</p>

                <ul className="detail-list">
                  <li>
                    <strong>Khối lượng:</strong> {selectedProduct.weight}
                  </li>
                  <li>
                    <strong>Xuất xứ:</strong> {selectedProduct.origin}
                  </li>
                  <li>
                    <strong>Loại trà:</strong> {selectedProduct.tea_type}
                  </li>
                  <li>
                    <strong>Hương vị:</strong> {selectedProduct.flavor}
                  </li>
                  <li>
                    <strong>Màu nước:</strong> {selectedProduct.water_color}
                  </li>
                  <li>
                    <strong>Cách pha:</strong> {selectedProduct.brewing_guide}
                  </li>
                  <li>
                    <strong>Bảo quản:</strong> {selectedProduct.storage_guide}
                  </li>
                </ul>

                <button
                  className="add-cart"
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  Thêm vào giỏ hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="modal">
          <div className="checkout-modal">
            <button className="close" onClick={() => setShowCheckout(false)}>
              ×
            </button>

            <h2>Giỏ hàng & thanh toán</h2>

            {cart.length === 0 ? (
              <p>Giỏ hàng đang trống.</p>
            ) : (
              <>
                <div className="cart-list">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <div>
                        <h4>{item.name}</h4>
                        <p>{formatPrice(item.price)}</p>
                      </div>

                      <div className="qty">
                        <button type="button" onClick={() => decreaseQty(item.id)}>
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => increaseQty(item.id)}>
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="remove"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>

                <h3 className="total">Tổng tiền: {formatPrice(totalAmount)}</h3>

                <form className="checkout-form" onSubmit={submitOrder}>
                  <input
                    type="text"
                    placeholder="Họ và tên"
                    value={customer.customer_name}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        customer_name: e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="email"
                    placeholder="Email nhận xác nhận đơn hàng"
                    value={customer.customer_email}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        customer_email: e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="Số điện thoại"
                    value={customer.phone}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        phone: e.target.value,
                      })
                    }
                    required
                  />

                  <textarea
                    placeholder="Địa chỉ nhận hàng"
                    value={customer.address}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        address: e.target.value,
                      })
                    }
                    required
                  />

                  <textarea
                    placeholder="Ghi chú đơn hàng"
                    value={customer.note}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        note: e.target.value,
                      })
                    }
                  />

                  <select
                    value={customer.payment_method}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        payment_method: e.target.value,
                        bank_name: "",
                        bank_account: "",
                        account_holder: "",
                        otp: "",
                        vnp_bank_code: "",
                        vnp_card_number: "",
                        vnp_card_holder: "",
                        vnp_issue_date: "",
                        vnp_otp: "",
                      })
                    }
                  >
                    <option value="COD">Thanh toán khi nhận hàng - COD</option>
                    <option value="Chuyển khoản test">
                      Thanh toán qua ngân hàng
                    </option>
                    <option value="VNPay Sandbox">Thanh toán qua VNPay</option>
                  </select>

                  {customer.payment_method === "Chuyển khoản test" && (
                    <div className="bank-payment-box">
                      <h4>Thanh toán qua ngân hàng</h4>

                      <label>Chọn ngân hàng</label>
                      <select
                        value={customer.bank_name}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
                            bank_name: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">-- Chọn ngân hàng --</option>
                        <option value="VCB">Vietcombank - VCB</option>
                        <option value="BIDV">BIDV</option>
                        <option value="TCB">Techcombank - TCB</option>
                        <option value="MB">MB Bank</option>
                        <option value="ACB">ACB</option>
                        <option value="TPB">TPBank</option>
                      </select>

                      <label>Số tài khoản</label>
                      <input
                        type="text"
                        placeholder="Nhập số tài khoản"
                        value={customer.bank_account}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
                            bank_account: e.target.value,
                          })
                        }
                        required
                      />

                      <label>Tên chủ tài khoản</label>
                      <input
                        type="text"
                        placeholder="Nhập tên chủ tài khoản"
                        value={customer.account_holder}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
                            account_holder: e.target.value,
                          })
                        }
                        required
                      />

                      <label>OTP</label>
                      <input
                        type="text"
                        placeholder="Nhập OTP"
                        value={customer.otp}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
                            otp: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  )}

                  <button>
                    {customer.payment_method === "Chuyển khoản test"
                      ? "Thanh toán qua ngân hàng"
                      : customer.payment_method === "VNPay Sandbox"
                      ? "Thanh toán qua VNPay"
                      : "Đặt hàng"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <div className="chatbot-widget">
        {showChatbot && (
          <div className="chatbot-box">
            <div className="chatbot-header">
              <div>
                <strong>Trợ lý Thanh Chương Trà</strong>
                <span>Trợ lý AI tư vấn linh hoạt</span>
              </div>

              <button type="button" onClick={() => setShowChatbot(false)}>
                ×
              </button>
            </div>

            <div className="chatbot-messages">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={
                    message.from === "user"
                      ? "chat-message user-message"
                      : "chat-message bot-message"
                  }
                >
                  {message.text}
                </div>
              ))}
            </div>

            <div className="chatbot-input">
              <input
                type="text"
                placeholder={
                  chatbotLoading ? "Trợ lý AI đang trả lời..." : "Nhập câu hỏi..."
                }
                value={chatInput}
                disabled={chatbotLoading}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendChatMessage();
                  }
                }}
              />

              <button
                type="button"
                onClick={sendChatMessage}
                disabled={chatbotLoading}
              >
                {chatbotLoading ? "Đang trả lời..." : "Gửi"}
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          className="chatbot-toggle"
          onClick={() => setShowChatbot(!showChatbot)}
        >
          {showChatbot ? "×" : "Chat"}
        </button>
      </div>
    </div>
  );
}

function App() {
  if (window.location.pathname === "/admin") {
    return <AdminPage />;
  }

  return <Storefront />;
}

export default App;
