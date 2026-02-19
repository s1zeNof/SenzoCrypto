import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import PostsList from './pages/PostsList'
import CreatePost from './pages/CreatePost'
import EditPost from './pages/EditPost'
import EmojiPacksManager from './pages/EmojiPacksManager'
import StickerPacksManager from './pages/StickerPacksManager'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/posts" replace />} />
        <Route path="posts" element={<PostsList />} />
        <Route path="posts/new" element={<CreatePost />} />
        <Route path="posts/edit/:id" element={<EditPost />} />
        <Route path="emoji-packs" element={<EmojiPacksManager />} />
        <Route path="sticker-packs" element={<StickerPacksManager />} />
      </Route>
      <Route path="/login" element={<Navigate to="/posts" replace />} />
    </Routes>
  )
}

export default App
