import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import MainLayout from './components/layout/MainLayout'
import LandingPage from './pages/LandingPage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Trading from './pages/Trading'
import Portfolio from './pages/Portfolio'
import Analytics from './pages/Analytics'
import YieldFarming from './pages/YieldFarming'
import Arbitrage from './pages/Arbitrage'
import Settings from './pages/Settings'
import Academy from './pages/Academy'
import PostDetail from './pages/PostDetail'
import Profile from './pages/Profile'
import Simulator from './pages/Simulator'
import Airdrops from './pages/Airdrops'
import CryptoGames from './pages/CryptoGames'
import DailyTrades from './pages/DailyTrades'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Docs from './pages/Docs'
import ComputeNodes from './pages/ComputeNodes'
import SDK from './pages/SDK'
import Community from './pages/Community'

function App() {
  const { user, loading } = useAuth()

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground-muted">Завантаження...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={user ? <Navigate to="/app/dashboard" replace /> : <LandingPage />}
      />
      <Route
        path="/auth/login"
        element={user ? <Navigate to="/app/dashboard" replace /> : <Login />}
      />
      <Route
        path="/auth/register"
        element={user ? <Navigate to="/app/dashboard" replace /> : <Register />}
      />

      {/* Protected Routes */}
      <Route
        path="/app"
        element={
          user ? (
            <MainLayout />
          ) : (
            <Navigate to="/auth/login" replace />
          )
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="trading" element={<Trading />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="portfolio/journal/:date" element={<DailyTrades />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="farming" element={<YieldFarming />} />
        <Route path="arbitrage" element={<Arbitrage />} />
        <Route path="academy" element={<Academy />} />
        <Route path="academy/:slug" element={<PostDetail />} />
        <Route path="airdrops" element={<Airdrops />} />
        <Route path="games" element={<CryptoGames />} />
        <Route path="profile" element={<Profile />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="simulator" element={<Simulator />} />
        <Route path="docs" element={<Docs />} />
        <Route path="compute-nodes" element={<ComputeNodes />} />
        <Route path="sdk" element={<SDK />} />
        <Route path="community" element={<Community />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch all - redirect based on auth */}
      <Route
        path="*"
        element={<Navigate to={user ? "/app/dashboard" : "/"} replace />}
      />
    </Routes>
  )
}

export default App