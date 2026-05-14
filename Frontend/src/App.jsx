import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { useCurrentUser } from "./auth/CurrentUser";

export default function App() {
  const { user } = useCurrentUser();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
