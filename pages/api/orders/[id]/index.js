import { orders } from "../../../../db";

async function handleGetOrder(req, res) {
  try {
    const order = await orders.get(req.query.id);

    res.json({
      id: order._id,
      token: order.payment.public_id,
      cart: order.cart,
      total: order.total,
      public_id: order.public_id,
      isCompleted: order.isCompleted
    });
  } catch (error) {
    res.status(error.status || 500);

    return res.json({
      error: "Failed to retrieve order"
    });
  }
}

export default handleGetOrder;
