import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Success from "./pages/Success.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/success" element={<Success />} />
    </Routes>
  );
}
