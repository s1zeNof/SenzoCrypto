import { Outlet, useLocation } from "react-router-dom"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import { useUI } from "@/store/ui"

export default function MainLayout() {
    const location = useLocation()
    const isSimulator = location.pathname === "/app/simulator"
    const { sidebarMode } = useUI()
    const mainMargin = sidebarMode === "expanded" ? "ml-52" : "ml-16"
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex">
                <Sidebar />
                <main className={["flex-1",mainMargin,"mt-16 transition-all duration-200 ease-in-out",isSimulator?"p-0 w-full max-w-full":"p-6 container-tight"].join(" ")}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
