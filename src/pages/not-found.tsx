const NotFound = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "4rem", margin: 0 }}>404</h1>
        <p style={{ fontSize: "1.2rem", color: "#aaa" }}>Page not found</p>
        <a href="/" style={{ color: "#f3a952", textDecoration: "none" }}>
          Go back home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
