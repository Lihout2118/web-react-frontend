import { HashRouter, Route, Routes } from "react-router-dom";
import Home from "./Home";
import Item from "./Item";
import LoginPage from "./Login";
import UserManagement from "./User";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />}>
          <Route path="item" element={<Item />} />
          <Route path="user" element={<UserManagement />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </HashRouter>
  );
}
