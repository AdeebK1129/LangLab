import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthUserProvider } from "./auth/AuthUserProvider"
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthUserProvider>
      <App />
    </AuthUserProvider>
  </BrowserRouter>
);
