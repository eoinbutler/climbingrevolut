import fetch from "isomorphic-fetch";
import { goods, orders } from "../../../db";

function calculateTotal(cart) {
  return cart.reduce(
    (acc, item) => ({
      description:
        acc.description === null
          ? item.title
          : `${acc.description}, ${item.title}`,
      amount: acc.amount + item.amount,
      currency: item.currency
    }),
    {
      description: null,
      amount: 0,
      currency: null
    }
  );
}

async function handleCreateOrder(req, res) {
  try {
    const goodsList = await goods.bulkGet({
      docs: req.body.cart.map((id) => ({ id }))
    });
    const cart = goodsList.results.map((item) => item.docs[0].ok);
    const total = calculateTotal(cart);

    const payload = {
      capture_mode: `AUTOMATIC` /** Manually confirm payment in the merchant dashboard */,
      settlement_currency: `EUR` /** Automatically exchange payment to desired currency */,
      ...total
    };

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
        body: JSON.stringify(payload)
      }
    );

    res.status(response.status);

    const payment = await response.json();

    const order = await orders.post({
      payment,
      isCompleted: false,
      isFailed: false,
      cart,
      total
    });

    res.json({
      id: order.id,
      id2: order.id,
      public_id: order.public_id,
      token: payment.public_id,
      cart,
      total
    });
    console.log(response.status);
  } catch (error) {
    console.error(error);
    res.json({
      error: "Order creation failed"
    });
  }
}

export default handleCreateOrder;
