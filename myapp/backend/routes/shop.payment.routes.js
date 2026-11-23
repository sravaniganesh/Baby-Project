
const express = require("express");
const crypto = require("crypto");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const ShopOrder = require("../models/ShopOrder");
const ShopPayment = require("../models/ShopPayment");
const ShopCart = require("../models/ShopCart");

const isDevelopment = process.env.NODE_ENV === "development";

const isValidObjectId = (id) =>
  typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);

/* =====================================================
   1. CREATE SHOP PAYMENT ATTEMPT
   POST /:orderId/create

   Development simulator only.
===================================================== */
router.post("/:orderId/create", authMiddleware, async (req, res) => {
  try {
    // Payment simulator must never run in production.
    if (!isDevelopment) {
      return res.status(403).json({
        message: "Payment simulation is disabled",
      });
    }

    const userId = req.user.id;
    const { orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await ShopOrder.findOne({
      _id: orderId,
      userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "SUCCESS") {
      return res.status(409).json({
        message: "This order has already been paid",
      });
    }

    if (
      !["PENDING", "FAILED", "CANCELLED"].includes(
        order.paymentStatus
      )
    ) {
      return res.status(409).json({
        message: "This order is not eligible for payment",
      });
    }

    if (
      !Number.isFinite(order.totalAmount) ||
      order.totalAmount <= 0
    ) {
      return res.status(400).json({
        message: "Invalid order amount",
      });
    }

    // Reuse the current pending attempt if one already exists.
    // This prevents duplicate attempts when the user taps Pay Now
    // multiple times.
    if (order.paymentReference) {
      const existingPayment = await ShopPayment.findOne({
        userId,
        orderId: order._id,
        transactionReference: order.paymentReference,
        status: "PENDING",
      });

      if (existingPayment) {
        return res.status(200).json({
          success: true,
          message: "Existing payment attempt returned",
          payment: {
            _id: existingPayment._id,
            orderId: existingPayment.orderId,
            amount: existingPayment.amount,
            currency: existingPayment.currency,
            status: existingPayment.status,
            method: existingPayment.method,
            transactionReference:
              existingPayment.transactionReference,
          },
        });
      }
    }

    const transactionReference =
      "SHP-" +
      crypto.randomBytes(12).toString("hex").toUpperCase();

    const payment = await ShopPayment.create({
      userId,
      orderId: order._id,
      amount: order.totalAmount,
      currency: "INR",
      status: "PENDING",
      method: "SIMULATOR",
      transactionReference,
    });

    order.paymentStatus = "PENDING";
    order.paymentMethod = "SIMULATOR";
    order.paymentReference = transactionReference;

    await order.save();

    return res.status(201).json({
      success: true,
      message: "Payment attempt created",
      payment: {
        _id: payment._id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        transactionReference: payment.transactionReference,
      },
    });
  } catch (err) {
    console.error("CREATE SHOP PAYMENT ERROR:", err);

    return res.status(500).json({
      message: "Failed to create payment attempt",
    });
  }
});

/* =====================================================
   2. SIMULATE PAYMENT RESULT
   POST /attempt/:paymentId/simulate

   Body:
   {
     "outcome": "SUCCESS"
   }

   Allowed outcomes:
   SUCCESS | FAILED | CANCELLED

   Development only.
===================================================== */
router.post(
  "/attempt/:paymentId/simulate",
  authMiddleware,
  async (req, res) => {
    try {
      if (!isDevelopment) {
        return res.status(403).json({
          message: "Payment simulation is disabled",
        });
      }

      const userId = req.user.id;
      const { paymentId } = req.params;
      const { outcome } = req.body || {};

      if (!isValidObjectId(paymentId)) {
        return res.status(400).json({
          message: "Invalid payment ID",
        });
      }

      if (
        !["SUCCESS", "FAILED", "CANCELLED"].includes(outcome)
      ) {
        return res.status(400).json({
          message: "Invalid simulation outcome",
        });
      }

      const payment = await ShopPayment.findOne({
        _id: paymentId,
        userId,
      });

      if (!payment) {
        return res.status(404).json({
          message: "Payment attempt not found",
        });
      }

      if (payment.status !== "PENDING") {
        return res.status(409).json({
          message: "This payment attempt has already been processed",
        });
      }

      const order = await ShopOrder.findOne({
        _id: payment.orderId,
        userId,
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      // Verify that this payment attempt still belongs
      // to the current pending order.
      if (
        order.paymentStatus !== "PENDING" ||
        order.paymentReference !== payment.transactionReference ||
        order.totalAmount !== payment.amount
      ) {
        return res.status(409).json({
          message: "Order and payment state do not match",
        });
      }

      /* ---------------------------------------------
         2A. SUCCESSFUL PAYMENT
      --------------------------------------------- */
      if (outcome === "SUCCESS") {
        // Conditional update prevents multiple successful
        // payments for the same order.
        const updatedOrder = await ShopOrder.findOneAndUpdate(
          {
            _id: order._id,
            userId,
            paymentStatus: "PENDING",
            paymentReference: payment.transactionReference,
            totalAmount: payment.amount,
          },
          {
            $set: {
              paymentStatus: "SUCCESS",
              paymentMethod: "SIMULATOR",
              paidAt: new Date(),
              "items.$[].status": "PLACED",
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

        if (!updatedOrder) {
          return res.status(409).json({
            message: "Order payment state changed. Please refresh.",
          });
        }

        const updatedPayment =
          await ShopPayment.findOneAndUpdate(
            {
              _id: payment._id,
              userId,
              status: "PENDING",
            },
            {
              $set: {
                status: "SUCCESS",
                processedAt: new Date(),
                failureReason: null,
              },
            },
            {
              new: true,
              runValidators: true,
            }
          );

        if (!updatedPayment) {
          console.error(
            "PAYMENT CONSISTENCY ERROR: Order paid but payment record not updated",
            payment._id
          );

          return res.status(500).json({
            message:
              "Payment records need reconciliation. Do not retry payment; contact support.",
          });
        }

        // Remove only the cart entries included in this order.
        // Never clear the entire cart.
        try {
          const purchasedCartItemIds = order.items
            .map((item) => item.cartItemId?.toString())
            .filter(Boolean);

          if (purchasedCartItemIds.length > 0) {
            const cart = await ShopCart.findOne({ userId });

            if (cart) {
              cart.items = cart.items.filter(
                (item) =>
                  !purchasedCartItemIds.includes(
                    item._id.toString()
                  )
              );

              await cart.save();
            }
          }
        } catch (cartError) {
          // Payment is already successful.
          // Do not report payment failure because cart cleanup failed.
          console.error(
            "SHOP CART CLEANUP ERROR AFTER SUCCESSFUL PAYMENT:",
            cartError
          );
        }

        return res.json({
          success: true,
          message: "Simulated payment succeeded",
          order: updatedOrder,
          payment: updatedPayment,
          simulated: true,
        });
      }

      /* ---------------------------------------------
         2B. FAILED OR CANCELLED PAYMENT
      --------------------------------------------- */
      const updatedPayment =
        await ShopPayment.findOneAndUpdate(
          {
            _id: payment._id,
            userId,
            status: "PENDING",
          },
          {
            $set: {
              status: outcome,
              processedAt: new Date(),
              failureReason:
                outcome === "FAILED"
                  ? "Simulated payment failure"
                  : null,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedPayment) {
        return res.status(409).json({
          message: "Payment attempt was already processed",
        });
      }

      // The order remains PENDING so the user can retry payment.
      return res.json({
        success: true,
        message:
          outcome === "FAILED"
            ? "Simulated payment failure"
            : "Simulated payment cancellation",
        orderId: order._id,
        payment: updatedPayment,
        simulated: true,
      });
    } catch (err) {
      console.error("SIMULATE SHOP PAYMENT ERROR:", err);

      return res.status(500).json({
        message: "Failed to process simulated payment",
      });
    }
  }
);

module.exports = router;
