import fetch from "isomorphic-fetch";
import { orders } from "../../../../db";

async function handleFinishOrder(req, res) {
  try {
    const order = await orders.get(req.query.id);
    const response = await fetch(
      process.env.REACT_APP_MODE === "prod"
        ? `https://merchant.revolut.com/api/1.0/orders/${order.payment.id}`
        : `https://sandbox-merchant.revolut.com/api/1.0/orders/${order.payment.id}`,
      {
        headers: {
          Authorization:
            process.env.REACT_APP_MODE === "prod"
              ? `Bearer ${process.env.REACT_APP_REVOLUT_API_KEY_PROD}`
              : `Bearer ${process.env.REACT_APP_REVOLUT_API_KEY_SANDBOX}`
        }
      }
    );

    res.status(response.status);

    const payment = await response.json();
    const isCompleted = payment.state === "COMPLETED";
    const isFailed = payment.state === "FAILED";

    await orders.put({ ...order, payment, isCompleted, isFailed });

    res.json({ id: order._id, isCompleted, isFailed });
  } catch (error) {
    console.error(error);
    res.json({
      error: "Status check failed"
    });
  }
}

export default handleFinishOrder;
