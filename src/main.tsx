import { createRoot } from "react-dom/client";
import { registerHttpClearSession } from "./app/api/http/httpHandlers";
import { setAuthTokenGetter } from "./app/api/http/tokenProvider";
import App from "./app/App.tsx";
import { useAuthStore } from "./app/store/authStore";
import "./styles/index.css";

setAuthTokenGetter(() => useAuthStore.getState().token);
registerHttpClearSession(() => useAuthStore.getState().clearLocalSession());

createRoot(document.getElementById("root")!).render(<App />);
