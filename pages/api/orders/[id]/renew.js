import fetch from "isomorphic-fetch";
import { orders } from "../../../../db";

async function handleFinishOrder(req, res) {
  try {
    const order = await orders.get(req.query.id);
    const response = await fetch(
      process.env.REACT_APP_MODE === "prod"
        ? `https://merchant.revolut.com/api/1.0/orders`
        : `https://sandbox-merchant.revolut.com/api/1.0/orders`,
      {
        method: "POST",
        headers: {
          Authorization:
            process.env.REACT_APP_MODE === "prod"
              ? `Bearer ${process.env.REACT_APP_REVOLUT_API_KEY_PROD}`
              : `Bearer ${process.env.REACT_APP_REVOLUT_API_KEY_SANDBOX}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(order.total)
      }
    );

    res.status(response.status);

    const payment = await response.json();

    await orders.put({ ...order, payment });

    res.json({ id: order._id });
  } catch (error) {
    console.error(error);

    res.json({
      error: "Payment renewal failed"
    });
  }
}

export default handleFinishOrder;
