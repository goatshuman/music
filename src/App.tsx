import { BrowserRouter, Routes, Route } from "react-router-dom";
  import Home from "./pages/Home";
  import Header from "./layout/Header";

  function App() {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    return (
      <BrowserRouter basename={base}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Header />
                <Home />
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    );
  }

  export default App;
  