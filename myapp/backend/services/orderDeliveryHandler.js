const ShopOrder = require("../models/ShopOrder");
const { settleOrderItem } = require("./orderSettlementService");

/**
 * Call this when an order item is marked DELIVERED
 *
 * @param {ObjectId} orderId
 * @param {ObjectId} itemId
 * @param {String} platformState
 * @param {String} sellerState
 * @param {ObjectId} adminId (optional)
 */
async function handleOrderItemDelivered({
  orderId,
  itemId,
  platformState,
  sellerState,
  adminId = null,
}) {
  const order = await ShopOrder.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  const item = order.items.id(itemId);

  if (!item) {
    throw new Error("Order item not found");
  }

  // ✅ Prevent double settlement
  if (item.isSettled === true) {
    return {
      alreadySettled: true,
    };
  }

  /* ============================
     SETTLEMENT
  ============================ */
  const settlement = await settleOrderItem({
    order,
    item,
    platformState,
    sellerState,
    adminId,
  });

  /* ============================
     MARK ITEM AS SETTLED
  ============================ */
  item.isSettled = true;
  item.settledAt = new Date();

  await order.save();

  return settlement;
}

module.exports = {
  handleOrderItemDelivered,
};
