const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const qs = require("qs");
const { poolPromise } = require("./db");
require("dotenv").config();

const ENABLE_EMAIL = process.env.ENABLE_EMAIL === "true";

const app = express();

app.use(cors());
app.use(express.json());

/* ===================== EMAIL CONFIG ===================== */

// Render Free chặn các cổng SMTP phổ biến. Gửi email qua Resend HTTP API.
const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM =
  process.env.EMAIL_FROM || "Thanh Chương Trà <onboarding@resend.dev>";

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("vi-VN") + "đ";
}

function formatDateTime(date = new Date()) {
  return new Date(date).toLocaleString("vi-VN", {
    hour12: false,
  });
}

async function sendOrderSuccessEmail(orderInfo) {
  if (!ENABLE_EMAIL) {
    console.log("Đã bỏ qua gửi email xác nhận vì ENABLE_EMAIL=false");
    return;
  }

  const {
    order_id,
    customer_name,
    customer_email,
    phone,
    address,
    note,
    total_amount,
    payment_method,
    payment_status,
    items,
  } = orderInfo;

  if (!customer_email) {
    console.log("Không có email khách hàng nên không gửi email.");
    return;
  }

  const itemRows = items
    .map((item, index) => {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const lineTotal = quantity * price;

      return `
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
            ${index + 1}
          </td>
          <td style="padding: 12px; border: 1px solid #ddd;">
            <strong>${item.name || "Sản phẩm trà"}</strong>
            <br />
            <span style="color: #667066;">${item.weight || ""}</span>
          </td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
            ${quantity}
          </td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">
            ${formatMoney(price)}
          </td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">
            <strong>${formatMoney(lineTotal)}</strong>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; background: #f7f3e8; padding: 28px;">
      <div style="max-width: 760px; margin: auto; background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e6eadf;">
        <div style="background: #174421; color: #ffffff; padding: 26px;">
          <h1 style="margin: 0; font-size: 26px;">Thanh Chương Trà</h1>
          <p style="margin: 8px 0 0; font-size: 15px;">
            Hương xanh xứ Nghệ trong từng chén trà
          </p>
        </div>

        <div style="padding: 28px;">
          <h2 style="margin: 0 0 14px; color: #174421;">
            Xác nhận đơn hàng thành công
          </h2>

          <p style="font-size: 16px; line-height: 1.7; color: #333;">
            Xin chào <strong>${customer_name}</strong>,
            cảm ơn bạn đã đặt hàng tại <strong>Thanh Chương Trà</strong>.
            Đơn hàng của bạn đã được ghi nhận thành công.
          </p>

          <div style="background: #fffaf0; border: 1px solid #eadfbf; border-radius: 14px; padding: 18px; margin: 22px 0;">
            <p style="margin: 8px 0;"><strong>Mã đơn hàng:</strong> #${order_id}</p>
            <p style="margin: 8px 0;"><strong>Ngày giờ:</strong> ${formatDateTime()}</p>
            <p style="margin: 8px 0;"><strong>Khách hàng:</strong> ${customer_name}</p>
            <p style="margin: 8px 0;"><strong>Số điện thoại:</strong> ${phone}</p>
            <p style="margin: 8px 0;"><strong>Địa chỉ nhận hàng:</strong> ${address}</p>
            <p style="margin: 8px 0;"><strong>Ghi chú:</strong> ${note || "Không có"}</p>
            <p style="margin: 8px 0;"><strong>Phương thức thanh toán:</strong> ${payment_method}</p>
            <p style="margin: 8px 0;">
              <strong>Trạng thái:</strong>
              <span style="color: #1f7a36; font-weight: bold;">${payment_status}</span>
            </p>
          </div>

          <h3 style="color: #174421;">Sản phẩm đã đặt</h3>

          <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
            <thead>
              <tr style="background: #e8f6e0; color: #174421;">
                <th style="padding: 12px; border: 1px solid #d8e7d2;">STT</th>
                <th style="padding: 12px; border: 1px solid #d8e7d2; text-align: left;">Sản phẩm</th>
                <th style="padding: 12px; border: 1px solid #d8e7d2;">SL</th>
                <th style="padding: 12px; border: 1px solid #d8e7d2; text-align: right;">Đơn giá</th>
                <th style="padding: 12px; border: 1px solid #d8e7d2; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <h2 style="text-align: right; color: #b96b00; margin-top: 24px;">
            Tổng thanh toán: ${formatMoney(total_amount)}
          </h2>

          <div style="margin-top: 28px; padding: 18px; background: #f3f8ef; border-left: 5px solid #1f7a36; border-radius: 12px;">
            <p style="margin: 0; line-height: 1.7; color: #344034;">
              Cảm ơn bạn đã tin tưởng lựa chọn Thanh Chương Trà.
              Chúng tôi sẽ kiểm tra và xử lý đơn hàng trong thời gian sớm nhất.
            </p>
          </div>

          <p style="margin-top: 26px; line-height: 1.7; color: #333;">
            Trân trọng,<br />
            <strong>Thanh Chương Trà</strong><br />
            Hotline: 0900 000 000<br />
            Email: ${process.env.SHOP_EMAIL || "thanhchuongtra@gmail.com"}
          </p>
        </div>
      </div>
    </div>
  `;

  if (!RESEND_API_KEY) {
    throw new Error(
      "Thiếu RESEND_API_KEY. Hãy thêm biến RESEND_API_KEY trong Render Environment."
    );
  }

  const payload = {
    from: EMAIL_FROM,
    to: [customer_email],
    subject: `Xác nhận đơn hàng #${order_id} - Thanh Chương Trà`,
    html,
  };

  if (process.env.SHOP_EMAIL) {
    payload.cc = [process.env.SHOP_EMAIL];
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Resend API lỗi ${response.status}: ${responseText.slice(0, 300)}`
    );
  }

  console.log(
    `Đã gửi email xác nhận đơn hàng #${order_id} tới ${customer_email}`
  );
}

/* ===================== VNPAY FUNCTIONS ===================== */

function formatDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type) =>
    parts.find((part) => part.type === type)?.value || "";

  return (
    get("year") +
    get("month") +
    get("day") +
    get("hour") +
    get("minute") +
    get("second")
  );
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.socket?.remoteAddress?.replace("::ffff:", "") || "127.0.0.1";
}

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }

  return sorted;
}

/* ===================== ROUTES ===================== */

app.get("/", (req, res) => {
  res.send("API Thanh Chương Trà đang chạy với Supabase PostgreSQL");
});

/* ===================== PRODUCTS ===================== */

app.get("/api/products", async (req, res) => {
  try {
    const result = await poolPromise.query(`
      SELECT *
      FROM products
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Lỗi lấy sản phẩm:", error);
    res.status(500).json({
      message: "Lỗi lấy sản phẩm",
      error: error.message,
    });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const result = await poolPromise.query(
      `
      SELECT *
      FROM products
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Lỗi lấy chi tiết sản phẩm:", error);
    res.status(500).json({
      message: "Lỗi lấy chi tiết sản phẩm",
      error: error.message,
    });
  }
});

/* ===================== CONTACTS ===================== */

app.post("/api/contacts", async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        message: "Vui lòng nhập họ tên và nội dung liên hệ",
      });
    }

    await poolPromise.query(
      `
      INSERT INTO contacts (name, phone, email, message)
      VALUES ($1, $2, $3, $4)
      `,
      [name, phone || "", email || "", message]
    );

    res.json({
      message: "Gửi liên hệ thành công",
    });
  } catch (error) {
    console.error("Lỗi gửi liên hệ:", error);
    res.status(500).json({
      message: "Lỗi gửi liên hệ",
      error: error.message,
    });
  }
});

/* ===================== ORDERS COD / TEST BANK ===================== */

app.post("/api/orders", async (req, res) => {
  const {
    customer_name,
    customer_email,
    phone,
    address,
    note,
    items,
    payment_method,
    bank_name,
    bank_account,
    account_holder,
  } = req.body;

  if (
    !customer_name ||
    !customer_email ||
    !phone ||
    !address ||
    !items ||
    items.length === 0
  ) {
    return res.status(400).json({
      message: "Thiếu thông tin đặt hàng",
    });
  }

  let paymentStatus = "Chưa thanh toán";
  let testCardNumber = "";

  if (payment_method === "COD") {
    paymentStatus = "Thanh toán khi nhận hàng";
  }

  if (payment_method === "Chuyển khoản test") {
    paymentStatus = "Đã thanh toán ngân hàng test";
    testCardNumber = `${bank_name || ""} - ${bank_account || ""} - ${
      account_holder || ""
    }`;
  }

  const client = await poolPromise.connect();

  try {
    await client.query("BEGIN");

    let totalAmount = 0;

    for (const item of items) {
      totalAmount += Number(item.price) * Number(item.quantity);
    }

    const orderResult = await client.query(
      `
      INSERT INTO orders 
      (customer_name, customer_email, phone, address, note, total_amount, payment_method, payment_status, test_card_number)
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
      `,
      [
        customer_name,
        customer_email,
        phone,
        address,
        note || "",
        totalAmount,
        payment_method || "COD",
        paymentStatus,
        testCardNumber,
      ]
    );

    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
        `,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    await client.query("COMMIT");

    const emailItemsResult = await poolPromise.query(
      `
      SELECT 
        p.name,
        p.weight,
        oi.quantity,
        oi.price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      `,
      [orderId]
    );

    sendOrderSuccessEmail({
      order_id: orderId,
      customer_name,
      customer_email,
      phone,
      address,
      note,
      total_amount: totalAmount,
      payment_method: payment_method || "COD",
      payment_status: paymentStatus,
      items: emailItemsResult.rows,
    }).catch((mailError) => {
      console.error("Lỗi gửi email xác nhận:", mailError.message);
    });

    res.json({
      message: "Đặt hàng thành công",
      order_id: orderId,
      total_amount: totalAmount,
      payment_method: payment_method || "COD",
      payment_status: paymentStatus,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Lỗi tạo đơn hàng:", error);

    res.status(500).json({
      message: "Lỗi tạo đơn hàng",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

/* ===================== CREATE VNPAY PAYMENT ===================== */

app.post("/api/create-vnpay-payment", async (req, res) => {
  const { customer, items } = req.body;

  if (!process.env.VNP_TMN_CODE || !process.env.VNP_HASH_SECRET) {
    return res.status(500).json({
      message: "Chưa cấu hình VNP_TMN_CODE hoặc VNP_HASH_SECRET trong .env",
    });
  }

  if (
    !customer?.customer_name ||
    !customer?.customer_email ||
    !customer?.phone ||
    !customer?.address
  ) {
    return res.status(400).json({
      message:
        "Vui lòng nhập họ tên, email, số điện thoại và địa chỉ trước khi thanh toán",
    });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({
      message: "Giỏ hàng đang trống",
    });
  }

  const client = await poolPromise.connect();

  try {
    await client.query("BEGIN");

    let totalAmount = 0;

    for (const item of items) {
      totalAmount += Number(item.price) * Number(item.quantity);
    }

    const orderResult = await client.query(
      `
      INSERT INTO orders
      (customer_name, customer_email, phone, address, note, total_amount, payment_method, payment_status, test_card_number, transaction_code, bank_code)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, '', '', '')
      RETURNING id
      `,
      [
        customer.customer_name,
        customer.customer_email,
        customer.phone,
        customer.address,
        customer.note || "",
        totalAmount,
        "VNPay Sandbox",
        "Chờ thanh toán VNPay",
      ]
    );

    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
        `,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    await client.query("COMMIT");

    const createDate = formatDate(new Date());
    const expireDate = formatDate(new Date(Date.now() + 15 * 60 * 1000));

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: process.env.VNP_TMN_CODE,
      vnp_Amount: Math.round(totalAmount * 100),
      vnp_CurrCode: "VND",
      vnp_TxnRef: String(orderId),
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: process.env.VNP_RETURN_URL,
      vnp_IpAddr: getClientIp(req),
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, {
      encode: false,
    });

    const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
    const secureHash = hmac
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    vnp_Params.vnp_SecureHash = secureHash;

    const paymentUrl =
      process.env.VNP_URL +
      "?" +
      qs.stringify(vnp_Params, {
        encode: false,
      });

    res.json({
      url: paymentUrl,
      order_id: orderId,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Lỗi tạo VNPay:", error);

    res.status(500).json({
      message: "Không tạo được URL thanh toán VNPay",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

/* ===================== VNPAY RETURN ===================== */

app.get("/api/vnpay-return", async (req, res) => {
  let vnp_Params = { ...req.query };
  const secureHash = vnp_Params.vnp_SecureHash;

  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  vnp_Params = sortObject(vnp_Params);

  const signData = qs.stringify(vnp_Params, {
    encode: false,
  });

  const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  const orderId = Number(req.query.vnp_TxnRef);
  const responseCode = req.query.vnp_ResponseCode;
  const transactionNo = req.query.vnp_TransactionNo || "";
  const bankCode = req.query.vnp_BankCode || "";

  try {
    if (secureHash === signed && responseCode === "00") {
      await poolPromise.query(
        `
        UPDATE orders
        SET payment_status = $1,
            transaction_code = $2,
            bank_code = $3
        WHERE id = $4
        `,
        ["Đã thanh toán VNPay Sandbox", transactionNo, bankCode, orderId]
      );

      const orderInfo = await poolPromise.query(
        `
        SELECT *
        FROM orders
        WHERE id = $1
        LIMIT 1
        `,
        [orderId]
      );

      const itemsInfo = await poolPromise.query(
        `
        SELECT 
          p.name,
          p.weight,
          oi.quantity,
          oi.price
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
        `,
        [orderId]
      );

      if (orderInfo.rows.length > 0) {
        const order = orderInfo.rows[0];

        sendOrderSuccessEmail({
          order_id: order.id,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          phone: order.phone,
          address: order.address,
          note: order.note,
          total_amount: order.total_amount,
          payment_method: order.payment_method,
          payment_status: "Đã thanh toán VNPay Sandbox",
          items: itemsInfo.rows,
        }).catch((mailError) => {
          console.error("Lỗi gửi email sau thanh toán VNPay:", mailError.message);
        });
      }

      return res.redirect(
        `${process.env.CLIENT_URL}?payment=vnpay_success&order_id=${orderId}`
      );
    }

    await poolPromise.query(
      `
      UPDATE orders
      SET payment_status = $1,
          transaction_code = $2,
          bank_code = $3
      WHERE id = $4
      `,
      [
        "Thanh toán VNPay thất bại hoặc bị hủy",
        transactionNo,
        bankCode,
        orderId,
      ]
    );

    return res.redirect(
      `${process.env.CLIENT_URL}?payment=vnpay_failed&order_id=${orderId}`
    );
  } catch (error) {
    console.error("Lỗi vnpay-return:", error);

    return res.redirect(
      `${process.env.CLIENT_URL}?payment=vnpay_error&order_id=${orderId}`
    );
  }
});

/* ===================== CHATBOT ===================== */

app.post("/api/chatbot/messages", async (req, res) => {
  try {
    const { customer_name, customer_email, user_message, bot_reply } = req.body;

    if (!user_message) {
      return res.status(400).json({
        message: "Thiếu nội dung câu hỏi chatbot",
      });
    }

    await poolPromise.query(
      `
      INSERT INTO chat_messages
      (customer_name, customer_email, user_message, bot_reply)
      VALUES
      ($1, $2, $3, $4)
      `,
      [
        customer_name || "",
        customer_email || "",
        user_message,
        bot_reply || "",
      ]
    );

    res.json({
      message: "Đã lưu câu hỏi chatbot",
    });
  } catch (error) {
    console.error("Lỗi lưu chatbot:", error);

    res.status(500).json({
      message: "Lỗi lưu câu hỏi chatbot",
      error: error.message,
    });
  }
});

/* ===================== ADMIN ===================== */

app.get("/api/admin/orders", async (req, res) => {
  try {
    const result = await poolPromise.query(`
      SELECT *
      FROM orders
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy đơn hàng",
      error: error.message,
    });
  }
});

app.get("/api/admin/contacts", async (req, res) => {
  try {
    const result = await poolPromise.query(`
      SELECT *
      FROM contacts
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy liên hệ",
      error: error.message,
    });
  }
});

app.get("/api/admin/chat-messages", async (req, res) => {
  try {
    const result = await poolPromise.query(`
      SELECT *
      FROM chat_messages
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy tin nhắn chatbot",
      error: error.message,
    });
  }
});

/* ===================== START SERVER ===================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});