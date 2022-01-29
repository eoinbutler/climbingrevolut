import { useRef, useEffect, useState } from "react";
import fetch from "isomorphic-fetch";
import RevolutCheckout from "@revolut/checkout";

function PaymentSelectPage({ order }) {
  useEffect(() => {
    if (!order) return;

    RevolutCheckout(order.token, "sandbox").then(function (instance) {
      instance.revolutPay({
        target: document.getElementById("revolut-pay"),
        //phone: "+441632960022", // recommended
        onSuccess() {
          console.log("Payment completed");
        },
        onError(error) {
          console.error("Payment failed: " + error.message);
        }
      });
    });
  }, [order]);

  const sum = (order.total.amount / 100).toLocaleString("en", {
    style: "currency",
    currency: order.total.currency
  });

  if (order === null) {
    return (
      <>
        <h2>Checkout</h2>
        <h3>Order not found</h3>
      </>
    );
  }

  let dest_link = `checkout?order=${order.id}`;

  return (
    <>
      <h2>Checkout ({sum})</h2>
      <h4>{order.id}</h4>
      <a href={dest_link}>
        <button
          style={{
            display: "block",
            margin: "1rem auto"
          }}
          className="form-field form-button"
        >
          Pay with Card
        </button>
      </a>

      <div id="revolut-pay"></div>

      <style jsx>{`
        .form-card-form {
          display: none;
        }

        .form-fieldset {
          padding: 1rem;
          border-radius: 13px;
          border: 1px solid #333;
        }

        .form-fieldset + .form-fieldset {
          margin-top: 1rem;
        }

        .form-field {
          appearance: none;
          box-sizing: border-box;
          font-size: 16px;
          display: block;
          width: 100%;
          height: 42px;
          margin: 0.5rem 0;
          padding: 0.5rem 0.75rem;
          color: #fff;
          border: 1px solid #222;
          background-color: #222;
          border-radius: 13px;
          outline: none;
        }

        .form-button {
          background-color: rgb(6, 102, 235);
        }

        .form-field::placeholder {
          color: #666;
        }

        .form-field:focus,
        .form-field.rc-card-field--focused {
          border-color: royalblue;
        }

        .form-field:invalid,
        .form-field.rc-card-field--invalid {
          border-color: red;
        }

        .form-field:required:valid,
        .form-field.rc-card-field--completed {
          border-color: lime;
        }

        .form-field-error-message {
          color: red;
        }
      `}</style>
    </>
  );
}

export async function getServerSideProps({ query, req }) {
  const baseUrl = `http://${req.headers.host}`;

  let response;

  if (query.order) {
    response = await fetch(`${baseUrl}/api/orders/${query.order}`);
  } else {
    response = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart: ["001"] }) // THIS IS WHERE YOU MODIFY THE CART
    });
  }

  const order = response.ok ? await response.json() : null;

  return {
    props: {
      order
    }
  };
}

export default PaymentSelectPage;
