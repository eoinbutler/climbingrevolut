import Head from "next/head";
import "../styles.css";

function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Climbing Club Payment</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default App;
