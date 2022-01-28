import Link from "next/link";

function FailedPage({ orderId, reason }) {
  return (
    <>
      <h2>
        <Link href={`/?order=${orderId}`}>
          <a>Checkout</a>
        </Link>
        {" / "}
        Confirmation
      </h2>
      <h3>
        {reason || "Payment was declined"} -{" "}
        <Link href={`/?order=${orderId}`}>
          <a>please try again</a>
        </Link>
      </h3>
    </>
  );
}

export async function getServerSideProps({ query }) {
  return {
    props: {
      orderId: query.order,
      reason: query.reason
    }
  };
}

export default FailedPage;
