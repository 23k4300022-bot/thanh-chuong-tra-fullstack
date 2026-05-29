import { useEffect, useMemo, useState } from "react";
import "./App.css";
import logo from "./assets/logo.png";

const API_URL = "http://localhost:5000";

function App() {
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

      // Chuyển thẳng sang cổng thanh toán VNPay Sandbox
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

  const getBotReply = (message) => {
    const text = message.toLowerCase().trim();

    const removeVietnameseTones = (str) => {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();
    };

    const cleanText = removeVietnameseTones(text);

    const hasAny = (keywords) => {
      return keywords.some((keyword) =>
        cleanText.includes(removeVietnameseTones(keyword))
      );
    };

    const formatProductLine = (item, index) => {
      return `${index + 1}. ${item.name} - ${formatPrice(item.price)} - ${
        item.weight || "chưa có khối lượng"
      }`;
    };

    const getProductList = (list = products, limit = 13) => {
      if (!list || list.length === 0) {
        return "Hiện chưa tải được danh sách sản phẩm từ SQL. Bạn kiểm tra lại backend http://localhost:5000/api/products hoặc bảng products.";
      }

      return list.slice(0, limit).map(formatProductLine).join("\n");
    };

    const findProductsByKeywords = (keywords) => {
      return products.filter((item) => {
        const name = removeVietnameseTones(item.name || "");
        const category = removeVietnameseTones(item.category || "");
        const teaType = removeVietnameseTones(item.tea_type || "");
        const flavor = removeVietnameseTones(item.flavor || "");
        const description = removeVietnameseTones(item.description || "");

        return keywords.some((keyword) => {
          const key = removeVietnameseTones(keyword);
          return (
            name.includes(key) ||
            category.includes(key) ||
            teaType.includes(key) ||
            flavor.includes(key) ||
            description.includes(key)
          );
        });
      });
    };

    const findExactProduct = () => {
      if (!products || products.length === 0) return null;

      const sortedProducts = [...products].sort(
        (a, b) => String(b.name || "").length - String(a.name || "").length
      );

      return sortedProducts.find((item) => {
        const name = removeVietnameseTones(item.name || "");
        const slug = removeVietnameseTones(item.slug || "");
        return cleanText.includes(name) || cleanText.includes(slug);
      });
    };

    const productDetailText = (product) => {
      return `Thông tin sản phẩm: ${product.name}

Giá: ${formatPrice(product.price)}
Khối lượng: ${product.weight || "Chưa cập nhật"}
Danh mục: ${product.category || "Chưa cập nhật"}
Xuất xứ: ${product.origin || "Thanh Chương, Nghệ An"}
Loại trà: ${product.tea_type || "Chưa cập nhật"}
Hương vị: ${product.flavor || "Chưa cập nhật"}
Màu nước: ${product.water_color || "Chưa cập nhật"}

Cách pha:
${product.brewing_guide || "Dùng 5–8g trà, pha với nước 80–90°C, hãm 20–30 giây."}

Bảo quản:
${product.storage_guide || "Bảo quản nơi khô ráo, tránh ánh nắng và mùi lạ."}

Bạn có thể bấm "Xem chi tiết" hoặc "Thêm vào giỏ hàng" ở sản phẩm này trên website.`;
    };

    const matchedProduct = findExactProduct();

    if (matchedProduct) {
      return productDetailText(matchedProduct);
    }

    if (
      hasAny([
        "tat ca san pham",
        "toan bo san pham",
        "danh sach san pham",
        "san pham",
        "menu",
        "co nhung tra gi",
        "co tra gi",
        "tra gi",
        "loai tra",
        "mat hang",
      ])
    ) {
      return `Hiện website đang có ${products.length} sản phẩm trà:\n\n${getProductList(products, 20)}\n\nBạn có thể hỏi cụ thể như: "giá trà sen", "trà móc câu", "hộp quà", "trà nào uống hằng ngày", "trà nào để biếu".`;
    }

    if (
      hasAny([
        "gia",
        "bao nhieu",
        "bao tien",
        "tien",
        "bang gia",
        "gia san pham",
      ])
    ) {
      const matchedByPrice = findProductsByKeywords([
        "trà xanh",
        "trà móc câu",
        "trà nõn",
        "trà túi lọc",
        "hộp quà",
        "trà sen",
        "trà lài",
        "trà gừng",
        "trà atiso",
      ]).filter((item) => {
        const itemText = removeVietnameseTones(
          `${item.name} ${item.category} ${item.tea_type}`
        );

        return itemText
          .split(" ")
          .some((word) => cleanText.includes(word) && word.length >= 3);
      });

      const list = matchedByPrice.length > 0 ? matchedByPrice : products;

      return `Bảng giá sản phẩm hiện có:\n\n${getProductList(list, 20)}\n\nBạn muốn xem chi tiết loại trà nào thì nhắn đúng tên sản phẩm, ví dụ: "Trà Sen Thanh Chương" hoặc "Hộp Quà Trà Xứ Nghệ Cao Cấp".`;
    }

    if (hasAny(["tra xanh", "xanh thanh chuong", "tra truyen thong"])) {
      const list = findProductsByKeywords(["trà xanh"]);
      return `Các sản phẩm trà xanh Thanh Chương hiện có:\n\n${getProductList(list, 10)}\n\nTrà xanh phù hợp uống hằng ngày, tiếp khách, vị chát dịu và hậu ngọt thanh.`;
    }

    if (hasAny(["moc cau", "tra moc cau"])) {
      const list = findProductsByKeywords(["móc câu"]);
      return `Các sản phẩm trà móc câu hiện có:\n\n${getProductList(list, 10)}\n\nTrà móc câu có cánh trà xoăn nhỏ, hương thơm dịu, nước xanh vàng và vị đượm vừa.`;
    }

    if (hasAny(["tra non", "non thanh chuong", "tra cao cap", "cao cap"])) {
      const list = findProductsByKeywords(["trà nõn", "cao cấp"]);
      return `Các sản phẩm cao cấp bạn có thể xem:\n\n${getProductList(list, 10)}\n\nTrà nõn thường hợp với khách thích vị thanh, hậu ngọt sâu và chất trà tinh tế hơn.`;
    }

    if (hasAny(["tui loc", "tra tui loc", "van phong", "nguoi ban ron"])) {
      const list = findProductsByKeywords(["túi lọc"]);
      return `Dòng trà tiện lợi hiện có:\n\n${getProductList(list, 10)}\n\nTrà túi lọc phù hợp cho văn phòng, người bận rộn hoặc người muốn pha nhanh.`;
    }

    if (hasAny(["hop qua", "qua", "bieu", "tang", "qua tet", "doi tac", "thay co"])) {
      const list = findProductsByKeywords(["hộp quà", "quà"]);
      return `Các sản phẩm hộp quà hiện có:\n\n${getProductList(list, 10)}\n\nHộp quà phù hợp biếu Tết, thầy cô, người thân, khách hàng hoặc đối tác.`;
    }

    if (hasAny(["tra sen", "sen"])) {
      const list = findProductsByKeywords(["trà sen", "sen"]);
      return `Các sản phẩm trà sen hiện có:\n\n${getProductList(list, 10)}\n\nTrà sen có hương sen dịu nhẹ, vị trà thanh, phù hợp uống thư giãn hoặc tiếp khách.`;
    }

    if (hasAny(["tra lai", "lai", "hoa lai"])) {
      const list = findProductsByKeywords(["trà lài", "lài"]);
      return `Sản phẩm trà lài hiện có:\n\n${getProductList(list, 10)}\n\nTrà lài có hương hoa lài nhẹ nhàng, dễ uống và thích hợp dùng hằng ngày.`;
    }

    if (hasAny(["tra gung", "gung", "ngay lanh", "am bung"])) {
      const list = findProductsByKeywords(["trà gừng", "gừng"]);
      return `Sản phẩm trà gừng hiện có:\n\n${getProductList(list, 10)}\n\nTrà gừng phù hợp dùng vào sáng sớm, ngày lạnh hoặc khi muốn một loại trà có vị ấm nhẹ.`;
    }

    if (hasAny(["atiso", "tra atiso", "thao moc", "thanh mat"])) {
      const list = findProductsByKeywords(["atiso", "thảo mộc"]);
      return `Các sản phẩm trà thảo mộc hiện có:\n\n${getProductList(list, 10)}\n\nTrà atiso có vị thanh mát, dịu nhẹ, phù hợp với người thích dòng trà thảo mộc dễ uống.`;
    }

    if (
      hasAny([
        "uong hang ngay",
        "uong moi ngay",
        "dung hang ngay",
        "de uong",
        "tra nao de uong",
      ])
    ) {
      const list = findProductsByKeywords(["trà xanh", "trà lài", "túi lọc"]);
      return `Nếu uống hằng ngày, mình gợi ý:\n\n${getProductList(list, 10)}\n\nGợi ý chọn: Trà Xanh Thanh Chương Đặc Sản, Trà Lài Thanh Chương hoặc Trà Xanh Túi Lọc nếu bạn muốn pha nhanh.`;
    }

    if (
      hasAny([
        "bieu tang",
        "lam qua",
        "tang sep",
        "tang thay co",
        "tang doi tac",
        "qua cao cap",
      ])
    ) {
      const list = findProductsByKeywords(["hộp quà"]);
      return `Nếu mua để biếu tặng, bạn nên chọn hộp quà:\n\n${getProductList(list, 10)}\n\nGợi ý: Hộp Quà Trà Xứ Nghệ Cao Cấp phù hợp đối tác, khách hàng; Hộp Quà Trà Thanh Chương An Lộc phù hợp người thân, thầy cô.`;
    }

    if (
      hasAny([
        "cach pha",
        "pha tra",
        "nuoc bao nhieu do",
        "ham bao lau",
        "pha nhu nao",
      ])
    ) {
      return `Cách pha trà ngon:\n\n1. Dùng khoảng 5–8g trà cho ấm 150–200ml.\n2. Tráng trà nhanh bằng nước nóng rồi đổ bỏ nước đầu.\n3. Pha bằng nước khoảng 80–90°C.\n4. Hãm trà 20–30 giây.\n5. Rót hết nước trà ra chén, không ngâm quá lâu để tránh bị chát.\n\nNếu là trà thảo mộc như trà gừng hoặc atiso, có thể hãm lâu hơn khoảng 3–7 phút.`;
    }

    if (hasAny(["bao quan", "cat tra", "giu tra", "de tra"])) {
      return `Cách bảo quản trà:\n\n1. Đóng kín túi hoặc hộp sau khi mở.\n2. Để nơi khô ráo, thoáng mát.\n3. Tránh ánh nắng trực tiếp.\n4. Tránh để gần thực phẩm có mùi mạnh.\n5. Nên dùng hộp kín hoặc túi zip để giữ hương trà lâu hơn.`;
    }

    if (hasAny(["dat hang", "mua", "gio hang", "them vao gio", "order"])) {
      return `Cách đặt hàng:\n\n1. Vào mục Sản phẩm.\n2. Bấm "Thêm vào giỏ hàng".\n3. Bấm nút "Giỏ hàng".\n4. Nhập họ tên, số điện thoại, địa chỉ nhận hàng.\n5. Chọn phương thức thanh toán.\n6. Bấm đặt hàng hoặc thanh toán.\n\nSau khi đặt thành công, đơn hàng sẽ được lưu vào SQL Server.`;
    }

    if (hasAny(["thanh toan", "cod", "ngan hang", "chuyen khoan", "vnpay"])) {
      return `Website hỗ trợ thanh toán:\n\n1. COD - Thanh toán khi nhận hàng.\n2. Thanh toán qua ngân hàng test.\n3. VNPay Sandbox.\n\nBạn chọn phương thức trong phần Giỏ hàng & thanh toán.`;
    }

    if (hasAny(["ncb", "so the", "otp", "ngay phat hanh", "sandbox"])) {
      return `Thông tin test VNPay Sandbox:\n\nNgân hàng: NCB\nSố thẻ: 9704198526191432198\nTên chủ thẻ: NGUYEN VAN A\nNgày phát hành: 07/15\nOTP: 123456`;
    }

    if (hasAny(["lien he", "hotline", "so dien thoai", "email", "dia chi"])) {
      return `Thông tin liên hệ:\n\nHotline: 0900 000 000\nEmail: thanhchuongtra@gmail.com\nĐịa chỉ: Thanh Chương, Nghệ An\n\nBạn cũng có thể gửi form ở mục Liên hệ trên website.`;
    }

    if (hasAny(["nguon goc", "xuat xu", "o dau", "thanh chuong", "nghe an"])) {
      return `Sản phẩm được xây dựng theo thương hiệu trà Thanh Chương, Nghệ An.\n\nĐặc trưng là hương trà mộc, vị chát dịu, hậu ngọt thanh, phù hợp uống hằng ngày, tiếp khách hoặc làm quà biếu.`;
    }

    if (hasAny(["ship", "giao hang", "van chuyen", "bao lau", "phi ship"])) {
      return `Bạn nhập địa chỉ nhận hàng trong phần Giỏ hàng. Shop sẽ dựa theo địa chỉ để xác nhận thời gian giao và phí vận chuyển nếu có.\n\nBạn nên nhập rõ xã/phường, huyện/quận, tỉnh/thành và số điện thoại.`;
    }

    if (hasAny(["doi tra", "hoan tien", "loi san pham", "hong", "sai hang"])) {
      return `Nếu sản phẩm bị lỗi, hỏng bao bì hoặc giao sai sản phẩm, bạn nên liên hệ shop qua hotline hoặc form Liên hệ.\n\nKhi liên hệ, hãy cung cấp mã đơn hàng, số điện thoại đặt hàng và hình ảnh sản phẩm để được hỗ trợ nhanh hơn.`;
    }

    if (hasAny(["xin chao", "chao", "hello", "hi", "alo"])) {
      return "Xin chào! Mình là trợ lý Thanh Chương Trà. Bạn muốn hỏi về sản phẩm, giá, hộp quà, cách pha trà, đặt hàng hay thanh toán?";
    }

    if (hasAny(["cam on", "thanks", "thank you"])) {
      return "Rất vui được hỗ trợ bạn. Bạn cần xem thêm sản phẩm, giá, cách đặt hàng hay thanh toán thì cứ nhắn tiếp nhé.";
    }

    return `Mình chưa hiểu rõ câu hỏi của bạn.\n\nBạn có thể hỏi:\n- Sản phẩm hiện có những loại nào?\n- Giá trà bao nhiêu?\n- Trà sen Thanh Chương giá bao nhiêu?\n- Có hộp quà không?\n- Trà nào phù hợp để biếu?\n- Trà nào uống hằng ngày?\n- Cách pha trà như thế nào?\n- Đặt hàng ra sao?\n- Thanh toán VNPay thế nào?`;
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    const botReply = getBotReply(userMessage);

    setChatMessages((prev) => [
      ...prev,
      {
        from: "user",
        text: userMessage,
      },
      {
        from: "bot",
        text: botReply,
      },
    ]);

    setChatInput("");

    try {
      await fetch(`${API_URL}/api/chatbot/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: currentUser?.name || "",
          customer_email: currentUser?.email || "",
          user_message: userMessage,
          bot_reply: botReply,
        }),
      });
    } catch (error) {
      console.error("Lỗi lưu câu hỏi chatbot:", error);
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
            <p>Dữ liệu sản phẩm được lấy trực tiếp từ SQL Server.</p>
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

      {/* ===== MODAL CHI TIẾT THƯƠNG HIỆU (MỚI) ===== */}
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
                <span>Hỗ trợ tư vấn sản phẩm</span>
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
                placeholder="Nhập câu hỏi..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendChatMessage();
                  }
                }}
              />

              <button type="button" onClick={sendChatMessage}>
                Gửi
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

export default App;