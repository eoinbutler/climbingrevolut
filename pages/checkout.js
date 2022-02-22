import { useRef, useEffect, useState } from "react";
import RevolutCheckout from "@revolut/checkout";
import fetch from "isomorphic-fetch";
import Router from "next/router";
import { getData } from "country-list";

function CheckoutPage({ order }) {
  const rcRef = useRef(null);
  const cardElementRef = useRef(null);
  const [cardErrors, setCardErrors] = useState([]);

  useEffect(() => {
    if (!order) return;

    RevolutCheckout(
      order.token,
      process.env.REACT_APP_MODE === "prod" ? "prod" : "sandbox"
    ).then((RC) => {
      rcRef.current = RC.createCardField({
        target: cardElementRef.current,
        hidePostcodeField: true,
        styles: {
          default: {
            color: "#fff",
            "::placeholder": {
              color: "#666"
            }
          },
          autofilled: {
            color: "#fff"
          }
        },
        onValidation(errors) {
          setCardErrors(errors);
        },
        onSuccess() {
          finishOrder(order.id);
        },
        onError(error) {
          Router.replace(`/failed?order=${order.id}&reason=${error.message}`);
        },
        onCancel() {
          renewOrder(order.id);
        }
      });
    });

    return () => {
      rcRef.current.destroy();
    };
  }, [order]);

  async function handleFormSubmit(event) {
    event.preventDefault();

    const data = new FormData(event.target);

    rcRef.current.submit({
      name: data.get("name"),
      email: data.get("email"),
      billingAddress: {
        countryCode: data.get("countryCode"),
        region: data.get("region"),
        city: data.get("city"),
        streetLine1: data.get("streetLine1"),
        streetLine2: data.get("streetLine2"),
        postcode: data.get("postcode")
      }
    });
  }

  if (order === null) {
    return (
      <>
        <h2>Checkout</h2>
        <h3>Order not found</h3>
      </>
    );
  }

  const sum = (order.total.amount / 100).toLocaleString("en", {
    style: "currency",
    currency: order.total.currency
  });

  return (
    <>
      <h2>Checkout ({sum})</h2>
      <h4>Order ID {order.id}</h4>

      <form
        id="card-form"
        className="form-card-form"
        onSubmit={handleFormSubmit}
      >
        <fieldset className="form-fieldset">
          <legend>Contact</legend>
          <label>
            <div>Name</div>
            <input
              className="form-field"
              name="name"
              autoComplete="name"
              placeholder="Name"
            />
          </label>
          <label>
            <div>Email</div>
            <input
              className="form-field"
              name="email"
              autoComplete="email"
              placeholder="Email"
            />
          </label>
        </fieldset>
        <fieldset className="form-fieldset">
          <legend>Billing</legend>
          <label>
            <div>Card</div>
            <div className="form-field" ref={cardElementRef} />
            <p className="form-field-error-message">
              {cardErrors.map(
                (error) =>
                  // you can use `error.type` to customise message
                  error.message
              )}
            </p>
          </label>
          <label>
            <div>Country</div>
            <select
              className="form-field"
              name="countryCode"
              defaultValue="IE"
              required
            >
              {getData().map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div>Region</div>
            <input
              className="form-field"
              name="region"
              autoComplete="address-level1"
              placeholder="Region"
            />
          </label>
          <label>
            <div>City</div>
            <input
              className="form-field"
              name="city"
              autoComplete="address-level2"
              placeholder="City"
              required
            />
          </label>
          <label>
            <div>Address line 1</div>
            <input
              className="form-field"
              name="streetLine1"
              autoComplete="address-line1"
              placeholder="Street, house number"
              required
            />
          </label>
          <label>
            <div>Address line 2</div>
            <input
              className="form-field"
              name="streetLine2"
              autoComplete="address-line2"
              placeholder="Appartment, building"
            />
          </label>
          <div>
            <div>Postal code</div>
            <input
              className="form-field"
              name="postcode"
              autoComplete="postal-code"
              placeholder="Postal code"
              required
            />
          </div>
        </fieldset>
        <button
          style={{
            display: "block",
            margin: "1rem auto"
          }}
          className="form-field form-button"
        >
          Pay {sum}
        </button>
      </form>
      <style jsx>{`
        .form-card-form {
          display: block;
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

        /** 
         * How to style autofilled fields:
         * @see https://css-tricks.com/snippets/css/change-autocomplete-styles-webkit-browsers/ 
         */
        .form-field:-webkit-autofill,
        .form-field.rc-card-field--autofilled {
          border-color: yellow;
          -webkit-text-fill-color: white;
          -webkit-box-shadow: 0 0 0px 1000px #222 inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </>
  );
}

async function finishOrder(id) {
  const response = await fetch(`/api/orders/${id}/finish`, { method: "POST" });
  const order = await response.json();

  if (order.isCompleted) {
    Router.replace("/success");
  } else if (order.isFailed) {
    await renewOrder(order.id);
  } else {
    Router.replace(`/pending?order=${order.id}`);
  }
}

async function renewOrder(id) {
  const response = await fetch(`/api/orders/${id}/renew`, { method: "POST" });
  const order = await response.json();

  Router.replace(`/?order=${order.id}`);
}

export async function getServerSideProps({ query, req }) {
  const baseUrl = `http://${req.headers.host}`;

  let response;

  if (query.order) {
    response = await fetch(`${baseUrl}/api/orders/${query.order}`);
  } /** else {
    response = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart: ["001"] }) // THIS IS WHERE YOU MODIFY THE CART
    });
  } */

  const order = response.ok ? await response.json() : null;

  return {
    props: {
      order
    }
  };
}

export default CheckoutPage;
