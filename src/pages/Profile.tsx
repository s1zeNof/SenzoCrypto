import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, Link, useSearchParams } from 'react-router-dom'
import { User, Settings, TrendingUp, Wallet, Lock, Globe, Eye, EyeOff, Bookmark, Clock, LineChart, Copy, Check, Search, Plus, X, Calculator, Trophy, XCircle } from 'lucide-react'
import { getPostBySlug, type Post } from '@/services/posts'
import { supabase } from '@/lib/supabase'
import { getUserTrades, getUserPortfolios, removeMasteredPost, type Trade, type Portfolio } from '@/services/firebase'
import { formatDate } from '@/lib/utils'
import { searchCoins, type CoinSearchResult } from '@/services/cryptoApi'
import * as Tabs from '@radix-ui/react-tabs'
import PortfolioManager from '@/components/portfolio/PortfolioManager'
import TradeLogger from '@/components/portfolio/TradeLogger'
import PnLCalendar from '@/components/portfolio/PnLCalendar'
import RiskCalculator from '@/components/tools/RiskCalculator'
import TradeChecklist from '@/components/tools/TradeChecklist'

export default function Profile() {
  const { user, userData, loading, updatePrivacySettings } = useAuth()
  const [savedPostsList, setSavedPostsList] = useState<Post[]>([])
  const [masteredPostsList, setMasteredPostsList] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'journal'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [trades, setTrades] = useState<Trade[]>([])
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selectedExchangeFilter, setSelectedExchangeFilter] = useState<string>('all')
  const [referralCopied, setReferralCopied] = useState(false)

  // Ticker Settings State
  const [tickerSearchQuery, setTickerSearchQuery] = useState('')
  const [tickerSearchResults, setTickerSearchResults] = useState<CoinSearchResult[]>([])
  const [tickerSearching, setTickerSearching] = useState(false)

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchParams({ tab: value })
  }

  useEffect(() => {
    if (userData?.savedPosts?.length) {
      loadSavedPosts()
    } else {
      setSavedPostsList([])
    }
    if (userData?.masteredPosts?.length) {
      loadMasteredPosts()
    } else {
      setMasteredPostsList([])
    }
    if (user) {
      loadTrades()
      loadPortfolios()
    }
  }, [userData?.savedPosts, user])

  const loadTrades = async () => {
    if (!user) return
    const data = await getUserTrades(user.id)
    setTrades(data)
  }

  const loadPortfolios = async () => {
    if (!user) return
    const data = await getUserPortfolios(user.id)
    setPortfolios(data)
  }

  const loadSavedPosts = async () => {
    if (!userData?.savedPosts || userData.savedPosts.length === 0) return
    setLoadingPosts(true)
    try {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .in('id', userData.savedPosts.slice(0, 10))
        .eq('status', 'published')
      setSavedPostsList((data ?? []) as Post[])
    } catch (error) {
      console.error('Error loading saved posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

  const loadMasteredPosts = async () => {
    if (!userData?.masteredPosts || userData.masteredPosts.length === 0) return
    try {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .in('id', userData.masteredPosts.slice(0, 10))
        .eq('status', 'published')
      setMasteredPostsList((data ?? []) as Post[])
    } catch (error) {
      console.error('Error loading mastered posts:', error)
    }
  }

  const handleRemoveMastered = async (postId: string) => {
    if (!user) return
    try {
      await removeMasteredPost(user.id, postId)
      setMasteredPostsList(prev => prev.filter(p => p.id !== postId))
      window.location.reload()
    } catch (error) {
      console.error('Error removing mastered post:', error)
      alert('Помилка при видаленні статті')
    }
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth/register?ref=${user?.id?.slice(0, 8)}`
    navigator.clipboard.writeText(link)
    setReferralCopied(true)
    setTimeout(() => setReferralCopied(false), 2000)
  }

  // Calculate Stats
  const stats = useMemo(() => {
    let filteredTrades = trades
    let filteredPortfolios = portfolios

    if (selectedExchangeFilter !== 'all') {
      filteredTrades = trades.filter(t => t.exchange === selectedExchangeFilter)
      filteredPortfolios = portfolios.filter(p => p.exchange === selectedExchangeFilter)
    }

    const totalPnL = filteredTrades.reduce((acc, t) => acc + t.pnl, 0)

    // Calculate today's PnL
    const today = new Date().toISOString().split('T')[0]
    const todayPnL = filteredTrades
      .filter(t => {
        const tradeDate = t.date.toDate ? t.date.toDate() : new Date(t.date)
        return tradeDate.toISOString().split('T')[0] === today
      })
      .reduce((acc, t) => acc + t.pnl, 0)

    const totalPortfolioValue = filteredPortfolios.reduce((acc, p) => {
      return acc + p.assets.reduce((pAcc, asset) => pAcc + (asset.amount * asset.avgPrice), 0)
    }, 0)

    const totalAssets = filteredPortfolios.reduce((acc, p) => acc + p.assets.length, 0)

    return { totalPnL, todayPnL, totalPortfolioValue, totalAssets }
  }, [trades, portfolios, selectedExchangeFilter])

  const uniqueExchanges = useMemo(() => {
    const exchanges = new Set([...trades.map(t => t.exchange), ...portfolios.map(p => p.exchange)])
    return Array.from(exchanges)
  }, [trades, portfolios])

  // Ticker Settings Handlers
  const handleTickerSearch = async (query: string) => {
    setTickerSearchQuery(query)
    if (query.length < 2) {
      setTickerSearchResults([])
      return
    }
    setTickerSearching(true)
    const results = await searchCoins(query)
    setTickerSearchResults(results)
    setTickerSearching(false)
  }

  const addTickerCoin = async (coinId: string) => {
    if (!user || !userData) return
    const currentCoins = userData.tickerCoins || []
    if (currentCoins.includes(coinId) || currentCoins.length >= 10) return

    const updatedCoins = [...currentCoins, coinId]
    await supabase
      .from('user_profiles')
      .update({ ticker_coins: updatedCoins })
      .eq('id', user.id)
    setTickerSearchQuery('')
    setTickerSearchResults([])
    window.location.reload()
  }

  const removeTickerCoin = async (coinId: string) => {
    if (!user || !userData) return
    const currentCoins = userData.tickerCoins || []
    if (currentCoins.length <= 1) return // Min 1 coin

    const updatedCoins = currentCoins.filter(id => id !== coinId)
    await supabase
      .from('user_profiles')
      .update({ ticker_coins: updatedCoins })
      .eq('id', user.id)
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" />
  }

  const privacy = userData?.privacy || {
    showPnL: true,
    showPortfolio: true,
    showSavedPosts: true,
    isPublic: true
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-card p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary p-[3px]">
            <div className="w-full h-full rounded-full bg-surface overflow-hidden">
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt={userData.displayName || 'User'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface text-primary text-4xl font-bold">
                  {(userData?.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{userData?.displayName || 'Користувач'}</h1>
                <p className="text-gray-400 mb-4">@{userData?.username || 'username'}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Приєднався {userData?.createdAt ? formatDate(new Date(userData.createdAt)) : 'Недавно'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {privacy.isPublic ? 'Публічний профіль' : 'Приватний профіль'}
                  </div>
                </div>
              </div>

              {/* Referral Section */}
              <div className="glass-card p-4 bg-surface/50 border-primary/20 max-w-sm w-full">
                <div className="text-sm font-bold mb-2 flex items-center justify-between">
                  <span>Ваше реферальне посилання</span>
                  <span className="text-primary text-xs">Ви запросили: {userData?.invitedCount || 0}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={`${window.location.origin}/auth/register?ref=${user?.id?.slice(0, 8)}`}
                    className="flex-1 bg-black/20 border border-border rounded px-2 py-1 text-xs text-gray-400 truncate"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="p-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                  >
                    {referralCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-surface/50 p-4 rounded-xl border border-border">
                <div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Загальний PnL
                </div>
                <div className={`text-xl font-bold ${stats.totalPnL >= 0 ? 'text-success' : 'text-red-500'}`}>
                  {privacy.showPnL ? `${stats.totalPnL >= 0 ? '+' : ''}$${stats.totalPnL.toLocaleString()}` : '****'}
                </div>
              </div>
              <div className="bg-surface/50 p-4 rounded-xl border border-border">
                <div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <LineChart className="w-4 h-4" />
                  PnL за сьогодні
                </div>
                <div className={`text-xl font-bold ${stats.todayPnL >= 0 ? 'text-success' : 'text-red-500'}`}>
                  {privacy.showPnL ? `${stats.todayPnL >= 0 ? '+' : ''}$${stats.todayPnL.toLocaleString()}` : '****'}
                </div>
              </div>
              <div className="bg-surface/50 p-4 rounded-xl border border-border">
                <div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Портфель
                </div>
                <div className="text-xl font-bold text-white">
                  {privacy.showPortfolio ? `$${stats.totalPortfolioValue.toLocaleString()}` : '****'}
                </div>
              </div>
              <div className="bg-surface/50 p-4 rounded-xl border border-border">
                <div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  Збережено
                </div>
                <div className="text-xl font-bold text-white">
                  {userData?.savedPosts?.length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
          <Tabs.List className="flex border-b border-border mb-8 overflow-x-auto">
            <Tabs.Trigger
              value="journal"
              className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <LineChart className="w-4 h-4" />
              Торговий Журнал
            </Tabs.Trigger>
            <Tabs.Trigger
              value="tools"
              className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Calculator className="w-4 h-4" />
              Інструменти
            </Tabs.Trigger>
            <Tabs.Trigger
              value="saved"
              className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Bookmark className="w-4 h-4" />
              Збережені Статті
            </Tabs.Trigger>
            <Tabs.Trigger
              value="mastered"
              className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Trophy className="w-4 h-4" />
              Засвоєні
            </Tabs.Trigger>
            <Tabs.Trigger
              value="settings"
              className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Settings className="w-4 h-4" />
              Налаштування
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="journal" className="outline-none space-y-8">
            {/* Exchange Filter */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedExchangeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedExchangeFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-gray-400 hover:text-white'
                  }`}
              >
                Всі біржі
              </button>
              {uniqueExchanges.map(exchange => (
                <button
                  key={exchange}
                  onClick={() => setSelectedExchangeFilter(exchange)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap uppercase ${selectedExchangeFilter === exchange
                    ? 'bg-primary text-white'
                    : 'bg-surface text-gray-400 hover:text-white'
                    }`}
                >
                  {exchange}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <PortfolioManager />
                <PnLCalendar trades={trades} onTradesChanged={loadTrades} />
              </div>
              <div className="lg:col-span-1">
                <TradeLogger onTradeAdded={loadTrades} />
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="tools" className="outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RiskCalculator />
              <TradeChecklist />
            </div>
          </Tabs.Content>

          <Tabs.Content value="mastered" className="outline-none">
            {masteredPostsList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {masteredPostsList.map(post => (
                  <div key={post.id} className="relative glass-card group hover:border-primary/50 transition-all duration-300 overflow-hidden">
                    <Link to={`/app/academy/${post.slug}`} className="block">
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={post.featuredImage || 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&q=80'}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
                        <div className="absolute top-4 right-4">
                          <div className="bg-yellow-500/20 text-yellow-400 p-2 rounded-full border border-yellow-500/30 backdrop-blur-sm">
                            <Trophy className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded backdrop-blur-sm border border-primary/20 mb-2 inline-block">
                            {post.category}
                          </span>
                          <h3 className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Ви впевнені, що хочете видалити цю статтю з засвоєних? Вам прийдеться заново проходити квіз, щоб додати її назад.')) {
                          handleRemoveMastered(post.id);
                        }
                      }}
                      className="absolute top-2 left-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Видалити із засвоєних"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass-card">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Немає засвоєних статей</h3>
                <p className="text-gray-400 mb-6">Проходьте квізи після прочитання статей, щоб додати їх сюди</p>
                <Link to="/academy" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
                  Перейти в Академію
                </Link>
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="saved" className="outline-none">
            {loadingPosts ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-400">Завантаження збережених статей...</p>
              </div>
            ) : savedPostsList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedPostsList.map(post => (
                  <Link key={post.id} to={`/app/academy/${post.slug}`} className="glass-card group hover:border-primary/50 transition-all duration-300 overflow-hidden">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={post.featuredImage || 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&q=80'}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded backdrop-blur-sm border border-primary/20 mb-2 inline-block">
                          {post.category}
                        </span>
                        <h3 className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass-card">
                <Bookmark className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Немає збережених статей</h3>
                <p className="text-gray-400 mb-6">Зберігайте корисні статті з Академії, щоб прочитати їх пізніше</p>
                <Link to="/academy" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
                  Перейти в Академію
                </Link>
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="settings" className="outline-none">
            <div className="glass-card p-6 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Налаштування Профілю
              </h2>

              <div className="space-y-6">
                {/* Privacy Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white/90 mb-4">Приватність</h3>

                  <div className="flex items-center justify-between p-4 bg-surface/50 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${privacy.isPublic ? 'bg-success/10 text-success' : 'bg-surface text-gray-400'}`}>
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium">Публічний профіль</div>
                        <div className="text-sm text-gray-400">Інші користувачі можуть бачити ваш профіль</div>
                      </div>
                    </div>
                    <button
                      onClick={() => updatePrivacySettings({ isPublic: !privacy.isPublic })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacy.isPublic ? 'bg-primary' : 'bg-surface border border-gray-600'
                        }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacy.isPublic ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface/50 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${privacy.showPnL ? 'bg-primary/10 text-primary' : 'bg-surface text-gray-400'}`}>
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium">Показувати PnL</div>
                        <div className="text-sm text-gray-400">Відображати прибуток/збиток у публічному профілі</div>
                      </div>
                    </div>
                    <button
                      onClick={() => updatePrivacySettings({ showPnL: !privacy.showPnL })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacy.showPnL ? 'bg-primary' : 'bg-surface border border-gray-600'
                        }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacy.showPnL ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface/50 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${privacy.showPortfolio ? 'bg-primary/10 text-primary' : 'bg-surface text-gray-400'}`}>
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium">Показувати Портфель</div>
                        <div className="text-sm text-gray-400">Відображати склад портфеля публічно</div>
                      </div>
                    </div>
                    <button
                      onClick={() => updatePrivacySettings({ showPortfolio: !privacy.showPortfolio })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacy.showPortfolio ? 'bg-primary' : 'bg-surface border border-gray-600'
                        }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacy.showPortfolio ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                  </div>
                </div>

                {/* Ticker Settings */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-white/90 mb-4">Налаштування Тікера</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Оберіть монети, які будуть відображатися у бігучому рядку зверху (макс. 10).
                  </p>

                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={tickerSearchQuery}
                      onChange={(e) => handleTickerSearch(e.target.value)}
                      placeholder="Пошук монети (напр. BTC, ETH)..."
                      className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Search Results */}
                  {tickerSearchResults.length > 0 && (
                    <div className="bg-surface border border-border rounded-lg overflow-hidden mb-4 max-h-48 overflow-y-auto">
                      {tickerSearchResults.map(coin => (
                        <button
                          key={coin.id}
                          onClick={() => addTickerCoin(coin.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                        >
                          <img src={coin.large} alt={coin.symbol} className="w-6 h-6 rounded-full" />
                          <div>
                            <div className="font-bold text-sm">{coin.name}</div>
                            <div className="text-xs text-gray-400 uppercase">{coin.symbol}</div>
                          </div>
                          <Plus className="w-4 h-4 ml-auto text-gray-400" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Active Coins List */}
                  <div className="flex flex-wrap gap-2">
                    {userData?.tickerCoins?.map(coinId => (
                      <div key={coinId} className="flex items-center gap-2 bg-surface border border-border rounded-lg pl-3 pr-2 py-1.5 text-sm">
                        <span className="uppercase">{coinId}</span>
                        <button
                          onClick={() => removeTickerCoin(coinId)}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {(!userData?.tickerCoins || userData.tickerCoins.length === 0) && (
                      <div className="text-sm text-gray-500 italic">
                        Використовуються монети за замовчуванням (BTC, ETH, SOL...)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  )
}
