import { Outlet } from "react-router-dom";
import { PublicNavbar } from "../components/public/PublicNavbar";
import { Footer } from "../components/public/Footer";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 bg-neutral-50">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
