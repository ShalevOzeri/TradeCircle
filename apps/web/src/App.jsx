import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Login          from "./pages/Login";
import Register       from "./pages/Register";
import Feed           from "./pages/Feed";
import Stats          from "./pages/Stats";
import GroupsPage     from "./pages/GroupsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import ProfilePage    from "./pages/ProfilePage";
import SearchPage     from "./pages/SearchPage";
import MarketExplorer from "./pages/MarketExplorer";

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/"         element={<ProtectedRoute><Feed /></ProtectedRoute>} />
      <Route path="/groups"   element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
      <Route path="/groups/:id" element={<ProtectedRoute><GroupDetailPage /></ProtectedRoute>} />
      <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile"  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/search"   element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/market"   element={<ProtectedRoute><MarketExplorer /></ProtectedRoute>} />
      <Route path="/stats"    element={<ProtectedRoute><Stats /></ProtectedRoute>} />
      <Route path="*"         element={<Navigate to="/" />} />
    </Routes>
  );
}
