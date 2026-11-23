require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const connectDB = require("./config/db");
const Doctor = require("./models/Doctor");
const { startNotificationCron } = require("./cron/notificationCron");
const { initializeFirebase } = require("./services/firebaseService");

const app = express();

/* ---------------- DB ---------------- */
connectDB();
initializeFirebase();


/* ---------------- Middleware ---------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

/* ---------------- ROUTES ---------------- */

const replyRoutes = require("./routes/replyRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const doctorAuthRoutes = require("./routes/doctorAuthRoutes");
const doctorReviewRoutes = require("./routes/doctorReviewRoutes");
const doctorHospitalRoutes = require("./routes/doctor.hospital.routes");
const doctorAssistantRoutes = require("./routes/doctor.assistant.routes");
const assistantRoutes = require("./routes/assistant.routes");
const adminHospitalRoutes = require("./routes/admin.hospital.routes");
const adminDoctorHospitalRoutes = require("./routes/admin.doctor-hospital.routes");
const chatRoutes = require("./routes/chatRoutes");
const adminAuthRoutes = require("./routes/admin.auth.routes");
const adminEarningsRoutes = require("./routes/admin.earnings.routes");
const adminSettlementRoutes = require("./routes/admin.settlement.routes");
const adminRefundRoutes = require("./routes/admin.refund.routes");
const adminPremiumEarningsRoutes = require("./routes/admin.premium.earnings.routes");
const adminBannerRoutes = require("./routes/admin.banner.routes");
const reviewRoutes = require("./routes/review.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const userRoutes = require("./routes/userRoutes");
const womenStageChatRoutes = require("./routes/womenStageChat.routes");
const userPremiumRoutes = require("./routes/user.premium.routes");
const adminUserRoutes = require("./routes/admin.user.routes");
const adminDoctorRoutes = require("./routes/admin.doctor.routes");
const adminOrderRoutes = require("./routes/admin.order.routes");
const adminAnalyticsRoutes = require("./routes/admin.analytics.routes");
const adminFraudRoutes = require("./routes/admin.fraud.routes");
const adminSystemRoutes = require("./routes/admin.system.routes");
const adminConsultationRefundRoutes = require("./routes/admin.consultation.refund.routes");
const adminReportsRoutes = require("./routes/admin.reports.routes");
const adminSessions = require("./routes/admin.sessions.routes");
const adminPermissions = require("./routes/admin.permissions.routes");
const adminSecurity = require("./routes/admin.security.routes");
const paymentRoutes = require("./routes/paymentRoutes");
const walletRoutes = require("./routes/walletRoutes");

/* 🆕 ADDITIVE — SELLER ADMIN ROUTES */
const adminSellerRoutes = require("./routes/admin.seller.routes");

/* ===== CORE ===== */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/auth/doctor", doctorAuthRoutes);
app.use("/api/user", userRoutes);
app.use("/api/user/addresses", require("./routes/user.address.routes"));
app.use("/payment", paymentRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/notify", require("./routes/notifyRoutes"));
// 🔥 ADD THIS LINE
app.use("/api/payment", require("./routes/paymentRoutes"));
/* ===== COMMUNITY ===== */
app.use("/api/community", require("./routes/communityRoutes"));
app.use("/api/replies", replyRoutes);

/* ===== CHAT ===== */
app.use("/api/chat", chatRoutes);
app.use("/api/women-chat", womenStageChatRoutes);
app.use("/api/private-chat", require("./routes/privateChat.routes"));

/* ===== DOCTOR ===== */
app.use("/api/doctor", doctorRoutes);
app.use("/api/doctors", doctorRoutes);
app.use(
  "/api/doctor/settlements",
  require("./routes/doctor.settlement.routes")
);
app.use(
  "/api/consultations",
  require("./routes/consultation.routes")
);
app.use(
  "/api/doctor/consultations",
  require("./routes/doctor.consultation.routes")
);
app.use(
  "/api/doctor/availability",
  require("./routes/doctor.availability.routes")
);
app.use(
  "/api/doctors/availability",
  require("./routes/user.doctor.availability.routes")
);
app.use("/api/doctor-assistants", doctorAssistantRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/doctor-reviews", doctorReviewRoutes);
app.use("/api/doctor-hospitals", doctorHospitalRoutes);
app.use("/api/admin/hospitals", adminHospitalRoutes);
app.use("/api/admin/doctor-hospitals", adminDoctorHospitalRoutes);


/* ===== SHOP & SELLER ===== */
app.use("/api/shop", require("./routes/shop.user.routes"));
app.use("/api/seller", require("./routes/seller.base.routes"));
app.use("/api/seller/products", require("./routes/seller.product.routes"));
app.use("/api/seller/orders", require("./routes/seller.order.routes"));
app.use("/api/seller/earnings", require("./routes/seller.earnings.routes"));
app.use("/api/orders", require("./routes/user.order.routes"));
app.use("/api/shop/payment", require("./routes/shop.payment.routes"));

/* ===== UPLOAD & INVOICE ===== */
app.use("/api/upload", require("./routes/upload.routes"));
app.use("/api/invoice", invoiceRoutes);

/* ===== PREMIUM ===== */
app.use("/api/premium", userPremiumRoutes);
app.use("/api/admin/premium", adminPremiumEarningsRoutes);
app.use(
  "/api/admin/premium-revenue",
  require("./routes/admin.premium.revenue.routes")
);

/* ===== ADMIN ===== */
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin/earnings", adminEarningsRoutes);
app.use("/api/admin/settlements", adminSettlementRoutes);
app.use("/api/admin/refund", adminRefundRoutes);
app.use("/api/admin/gst", require("./routes/admin.gst.routes"));
app.use("/api/admin/gst", require("./routes/admin.gst.compliance.routes"));
app.use("/api/admin/gst", require("./routes/admin.gst.export.routes"));
app.use("/api/admin/audit", require("./routes/admin.audit.routes"));
app.use("/api/admin/dashboard", require("./routes/admin.dashboard.routes"));
app.use("/api/admin/search", require("./routes/admin.search.routes"));
app.use("/api/admin/banners", adminBannerRoutes);
app.use("/api/banners", adminBannerRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/doctors", adminDoctorRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/admins", require("./routes/admin.admins.routes"));
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/fraud", adminFraudRoutes);
app.use("/api/admin/system", adminSystemRoutes);
app.use(
  "/api/admin/consultations",
  require("./routes/admin.consultation.routes")
);
app.use("/api/admin/consultations", adminConsultationRefundRoutes);
/* 🆕 SELLER MANAGEMENT */
app.use("/api/admin/sellers", adminSellerRoutes);

app.use(
  "/api/admin/products",
  require("./routes/admin.product.approval.routes")
);

app.use(
  "/api/admin/scheduled-notifications",
  require("./routes/admin.scheduled.notification.routes")
);
app.use("/api/admin/reports", adminReportsRoutes);
app.use("/api/admin", adminPermissions);
/* ===== OTHER ===== */
app.use("/api/wishlist", require("./routes/wishlist.routes"));
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin/notifications", require("./routes/admin.notification.routes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", adminSessions);
app.use("/api/admin", adminSecurity);

/* ---------------- HTTP + SOCKET ---------------- */

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.set("io", io);

/* ---------------- START NOTIFICATION CRON ---------------- */
startNotificationCron(app);
console.log("⏰ Notification cron started"); // ✅ ADDITIVE

require("./socket").attachIO(io);

/* ---------------- SOCKET LOGIC ---------------- */

const doctorSocketMap = {};

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  /* ================= USER NOTIFICATION REGISTRATION ================= */
  socket.on("register_user", (userId) => {
    try {
      const room = `user_${userId}`;
      socket.join(room);
      console.log(`👤 User ${userId} registered for notifications in room ${room}`);
    } catch (err) {
      console.error("User register error:", err);
    }
  });

  /* ================= DOCTOR AVAILABILITY ================= */
  socket.on("doctor_online", async (doctorId) => {
    io.emit("doctorStatusUpdate", {
  doctorId,
  availability: "online",
});
  try {
    doctorSocketMap[socket.id] = doctorId;

    await Doctor.findByIdAndUpdate(doctorId, {
      availability: "online",
    });

    console.log(`🟢 Doctor ${doctorId} is ONLINE`);

    /* ================= NOTIFY USERS ================= */
    const NotifyRequest = require("./models/NotifyRequest");

    const requests = await NotifyRequest.find({
      doctorId,
      notified: false,
    });

    for (let reqItem of requests) {
      const userRoom = `user_${reqItem.userId}`;

      io.to(userRoom).emit("doctorOnline", {
        doctorId,
      });

      reqItem.notified = true;
      await reqItem.save();

      console.log(`🔔 Notified user ${reqItem.userId}`);
    }
  } catch (err) {
    console.error("Doctor online error:", err);
  }
});

  /* ================= DOCTOR CHAT ================= */
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`👥 Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("send_message", ({ roomId, message }) => {
    socket.to(roomId).emit("receive_message", message);
  });

  /* ================= WOMEN STAGE CHAT ================= */
  socket.on("join_women_stage", (stageKey) => {
    const room = `women_${stageKey}`;
    socket.join(room);
    console.log(`👩 Joined women stage room: ${room}`);
  });
  /* ================= ADMIN PANEL ================= */

socket.on("register_admin", (adminId) => {
  try {
    const room = `admin_${adminId}`;
    socket.join(room);
    console.log(`🛡 Admin ${adminId} connected to room ${room}`);
  } catch (err) {
    console.error("Admin register error:", err);
  }
});

  /* ================= DISCONNECT ================= */
  socket.on("disconnect", async () => {
    console.log("🔴 Socket disconnected:", socket.id);

    const doctorId = doctorSocketMap[socket.id];

    if (doctorId) {
      await Doctor.findByIdAndUpdate(doctorId, {
        availability: "offline",
      });

      delete doctorSocketMap[socket.id];
      console.log(`🔴 Doctor ${doctorId} is OFFLINE`);
    }
  });
});

/* ---------------- START SERVER ---------------- */

server.listen(5001, "0.0.0.0", () => {
  console.log("🚀 Server running on http://0.0.0.0:5001"); // ✅ ADDITIVE
});