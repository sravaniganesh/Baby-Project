const mongoose = require("mongoose");

const shopProductSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Seller",
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    /* =====================
       💰 PRICING (CRITICAL)
    ====================== */

    mrp: {
      type: Number,
      required: true,
      min: 0,
    },

    price: {
      // selling price (what user finally sees)
      type: Number,
      required: true,
      min: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    /* =====================
       📦 STOCK & MEDIA
    ====================== */

    stock: {
      type: Number,
      required: true,
      min: 0, // 0 = out of stock
    },

    images: {
      type: [String],
      default: [],
    },

    /* =====================
       📂 CATEGORY (ADDED)
    ====================== */

    mainCategory: {
      type: String, // WOMEN | KIDS
      required: true,
      index: true,
    },

    category: {
      type: String, // CLOTHING, TOYS, BABY_CARE etc
      required: true,
      index: true,
    },

    productType: {
      type: String, // Saree, Kurti, Toy Car etc
      required: true,
      index: true,
    },

    /* =====================
       📋 SPECIFICATIONS
    ====================== */

    specifications: {
      type: Object,
      default: {}, // material, size, skinType, etc
    },

    /* =====================
       ⭐ RATINGS & REVIEWS (ADDED)
    ====================== */

    rating: {
      type: Number,
      default: 0, // average rating (0–5)
      min: 0,
      max: 5,
    },

    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
          required: true,
        },
        comment: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        /* =====================
   ⭐ RATING (ADDITIVE)
===================== */
rating: {
  type: Number,
  default: 0,
  min: 0,
  max: 5,
  index: true,
},

ratingCount: {
  type: Number,
  default: 0,
},

/* =====================
   🏷️ CATEGORY (REQUIRED FOR RELATED)
===================== */
category: {
  type: String,
  index: true, // WOMEN_CLOTHING, KIDS_TOYS etc
},

mainCategory: {
  type: String,
  index: true, // WOMEN / KIDS
},

      },
      
    ],

    /* =====================
       🔁 SELLER POLICIES
    ====================== */

    sellerPolicies: {
      returnable: { type: Boolean, default: true },
      replaceable: { type: Boolean, default: true },
      exchangeable: { type: Boolean, default: false },
    },

    /* =====================
       🚚 DELIVERY (ADDED)
    ====================== */

    delivery: {
      channel: {
        type: String, // STANDARD | EXPRESS
        required: true,
      },
      charge: {
        type: Number, // calculated internally, NOT shown to user
        default: 0,
      },
      weightInGrams: {
        type: Number,
        required: true,
        min: 1,
      },
    },

    /* =====================
       🧾 TAX & SKU (EXISTING – KEPT)
    ====================== */

    tax: {
      gstPercent: { type: Number, default: 0 },
      hsnCode: { type: String, default: "" },
      sku: { type: String, default: "" },
    },

    gst: {
      applicable: { type: Boolean, default: false },
      percent: { type: Number, default: 0 },
    },

    hsn: {
      type: String,
      default: "",
    },

    sku: {
      type: String,
      default: "",
    },

    /* =====================
       🔥 OFFER SUPPORT
    ====================== */

    isOfferActive: {
      type: Boolean,
      default: false,
    },

    discountType: {
      type: String,
      enum: ["PERCENT", "FLAT"],
    },

    discountValue: {
      type: Number,
      min: 0,
    },

    offerStart: Date,
    offerEnd: Date,

    /* =====================
       🛡️ ADMIN APPROVAL
    ====================== */

    approvalStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShopProduct", shopProductSchema);
