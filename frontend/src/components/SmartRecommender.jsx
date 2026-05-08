import { useState, useEffect, useRef } from 'react'

const API_BASE = ''

export default function SmartRecommender({ onBack }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [trending, setTrending] = useState([])
  const [categories, setCategories] = useState([])
  const [engineStats, setEngineStats] = useState(null)
  const [copiedPrompt, setCopiedPrompt] = useState(null)
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexus_favorites') || '[]') } catch { return [] }
  })
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexus_recent') || '[]') } catch { return [] }
  })
  const [activeTab, setActiveTab] = useState('search')
  const inputRef = useRef(null)

  useEffect(() => {
    fetchTrending()
    fetchCategories()
    fetchEngineStats()
    inputRef.current?.focus()
  }, [])

  const fetchTrending = async () => {
    try {
      const res = await fetch(`${API_BASE}/recommend/trending`)
      const data = await res.json()
      setTrending(data.trending || [])
    } catch (err) { console.error('Failed to fetch trending:', err) }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/recommend/categories`)
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (err) { console.error('Failed to fetch categories:', err) }
  }

  const fetchEngineStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/recommend/engine-stats`)
      const data = await res.json()
      setEngineStats(data)
    } catch (err) { console.error('Failed to fetch engine stats:', err) }
  }

  const handleRecommend = async (text) => {
    const q = text || query
    if (!q.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim() })
      })
      const data = await res.json()
      setResult(data)
      // Save to recent
      const updated = [q.trim(), ...recentSearches.filter(s => s !== q.trim())].slice(0, 10)
      setRecentSearches(updated)
      localStorage.setItem('nexus_recent', JSON.stringify(updated))
    } catch (err) {
      console.error('Recommendation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (toolName) => {
    let updated
    if (favorites.includes(toolName)) {
      updated = favorites.filter(f => f !== toolName)
    } else {
      updated = [...favorites, toolName]
      try {
        await fetch(`${API_BASE}/recommend/favorite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool_name: toolName })
        })
      } catch {}
    }
    setFavorites(updated)
    localStorage.setItem('nexus_favorites', JSON.stringify(updated))
  }

  const copyPrompt = (prompt) => {
    navigator.clipboard.writeText(prompt)
    setCopiedPrompt(prompt)
    setTimeout(() => setCopiedPrompt(null), 2000)
  }

  const suggestedQueries = [
    { icon: '🎨', text: 'Create realistic anime art', cat: 'Creative' },
    { icon: '💻', text: 'Help me debug Python code', cat: 'Coding' },
    { icon: '🎬', text: 'Generate a short video clip', cat: 'Video' },
    { icon: '🎵', text: 'Compose background music', cat: 'Audio' },
    { icon: '📊', text: 'Analyze my sales data', cat: 'Data' },
    { icon: '✍️', text: 'Write a blog post about AI', cat: 'Writing' },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-0 relative z-10">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gold-500/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gold-500/10 transition-colors" id="back-to-chat-btn">
            <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-yellow-500">Smart AI Recommender</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-gold-500/10 text-gold-500/70 border border-gold-500/20">ML-Powered</span>
            </h2>
            <p className="text-[10px] text-gray-500 font-mono">TF-IDF + Cosine Similarity + KNN · No APIs</p>
          </div>
        </div>
        {engineStats && (
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-gold-500/50">
            <span>{engineStats.total_categories} categories</span>
            <span className="w-1 h-1 rounded-full bg-gold-500/30" />
            <span>{engineStats.total_tools} tools</span>
            <span className="w-1 h-1 rounded-full bg-gold-500/30" />
            <span>{engineStats.vocabulary_size} features</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 py-2 flex gap-1 border-b border-gold-500/5 shrink-0">
        {[
          { id: 'search', label: 'Search', icon: '🔍' },
          { id: 'trending', label: 'Trending', icon: '🔥' },
          { id: 'categories', label: 'Categories', icon: '📂' },
        ].map(tab => (
          <button key={tab.id} id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-gold-500/15 text-gold-500 border border-gold-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
          >
            <span className="mr-1.5">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Search Tab */}
          {activeTab === 'search' && (
            <>
              {/* Search Bar */}
              <form onSubmit={(e) => { e.preventDefault(); handleRecommend() }} className="relative">
                <div className="glass-gold rounded-2xl p-1 input-glow transition-all">
                  <div className="flex items-center gap-3 px-5 py-3">
                    <svg className="w-5 h-5 text-gold-500/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input ref={inputRef} id="recommend-input" type="text" value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Describe your task... e.g. 'Create realistic anime art'"
                      className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none font-body text-sm"
                    />
                    <button type="submit" id="recommend-btn" disabled={!query.trim() || loading}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-yellow-600 text-black text-xs font-bold disabled:opacity-30 hover:shadow-gold transition-all hover:scale-105 active:scale-95"
                    >
                      {loading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : 'Recommend'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Suggested Queries */}
              {!result && (
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest text-center">Try asking</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {suggestedQueries.map((sq, i) => (
                      <button key={i} id={`suggest-${i}`}
                        onClick={() => { setQuery(sq.text); handleRecommend(sq.text) }}
                        className="group glass-gold rounded-xl p-3 text-left hover-lift hover:border-gold-500/30 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg group-hover:scale-110 transition-transform">{sq.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-300 group-hover:text-white transition-colors truncate">{sq.text}</p>
                            <span className="text-[9px] text-gold-500/40 font-mono">{sq.cat}</span>
                          </div>
                          <svg className="w-3 h-3 text-gold-500/20 group-hover:text-gold-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Searches */}
              {!result && recentSearches.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Recent Searches</p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.slice(0, 6).map((s, i) => (
                      <button key={i} onClick={() => { setQuery(s); handleRecommend(s) }}
                        className="px-3 py-1.5 rounded-full text-[11px] text-gray-400 bg-white/5 border border-white/5 hover:border-gold-500/20 hover:text-gold-500 transition-all"
                      >⏱ {s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {result && <RecommendationResults result={result} favorites={favorites} toggleFavorite={toggleFavorite} copyPrompt={copyPrompt} copiedPrompt={copiedPrompt} />}
            </>
          )}

          {/* Trending Tab */}
          {activeTab === 'trending' && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <span className="text-xl">🔥</span> Trending AI Tools
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trending.map((t, i) => (
                  <div key={i} className="glass-gold rounded-xl p-4 hover-lift transition-all group cursor-pointer"
                    onClick={() => { setQuery(t.category); setActiveTab('search'); handleRecommend(t.category) }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-gold-500 transition-colors">{t.category}</p>
                        <div className="flex gap-1.5 mt-1">
                          {t.tags?.map((tag, j) => (
                            <span key={j} className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-gold-500/10 text-gold-500/70 border border-gold-500/15">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">TRENDING</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{t.top_tool?.icon}</span>
                      <div>
                        <p className="text-xs text-gray-300">{t.top_tool?.name}</p>
                        <p className="text-[10px] text-gray-500">{t.top_tool?.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <span className="text-xl">📂</span> All Categories
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {categories.map((cat, i) => (
                  <button key={i} id={`cat-${cat.id}`}
                    onClick={() => { setQuery(cat.name); setActiveTab('search'); handleRecommend(cat.name) }}
                    className="glass-gold rounded-xl p-3 text-left hover-lift hover:border-gold-500/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-gray-200 group-hover:text-white">{cat.name}</p>
                      {cat.trending && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                      <span>{cat.tool_count} tools</span>
                      <span className="w-1 h-1 rounded-full bg-gray-700" />
                      <span>{cat.difficulty}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-700" />
                      <div className="flex gap-1">
                        {cat.tags?.slice(0, 2).map((tag, j) => (
                          <span key={j} className="px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-500/60 text-[8px]">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ===== Recommendation Results Panel ===== */
function RecommendationResults({ result, favorites, toggleFavorite, copyPrompt, copiedPrompt }) {
  if (!result) return null

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Prediction Header */}
      <div className="glass-gold rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] text-gold-500/50 font-mono uppercase tracking-widest mb-1">Predicted Category</p>
            <h3 className="font-display font-bold text-xl text-white">{result.predicted_category}</h3>
          </div>
          <div className="flex items-center gap-3">
            {result.trending && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 neon-red">🔥 TRENDING</span>
            )}
            <span className={`px-3 py-1 rounded-full text-[10px] font-mono border ${result.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : result.difficulty === 'Advanced' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
              {result.difficulty}
            </span>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-mono">Confidence Score</span>
            <span className="text-sm font-display font-bold text-gold-500">{result.confidence}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-gold-500 to-yellow-500 transition-all duration-1000 ease-out" style={{ width: `${result.confidence}%` }} />
          </div>
        </div>

        {/* ML Scores */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Cosine Sim', value: result.scores?.cosine_similarity, color: 'text-blue-400' },
            { label: 'KNN Prob', value: result.scores?.knn_probability, color: 'text-emerald-400' },
            { label: 'Keyword', value: result.scores?.keyword_match, color: 'text-purple-400' },
          ].map((s, i) => (
            <div key={i} className="text-center p-2 rounded-lg bg-white/[0.03]">
              <p className="text-[9px] text-gray-500 font-mono uppercase">{s.label}</p>
              <p className={`text-sm font-mono font-bold ${s.color}`}>{(s.value * 100).toFixed(1)}%</p>
            </div>
          ))}
        </div>

        {/* Reasoning */}
        <div className="mt-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-gray-400 font-mono">
            <span className="text-gold-500/70 mr-1">WHY:</span> {result.reasoning}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {result.tags?.map((tag, i) => (
            <span key={i} className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${tag === 'Free Tool' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : tag === 'Best for Students' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : tag === 'Trending' ? 'bg-red-500/10 text-red-400 border-red-500/20' : tag === 'Advanced Tool' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-gold-500/10 text-gold-500/70 border-gold-500/20'}`}>
              {tag === 'Free Tool' ? '🆓' : tag === 'Best for Students' ? '🎓' : tag === 'Trending' ? '🔥' : tag === 'Advanced Tool' ? '⚡' : '🏷️'} {tag}
            </span>
          ))}
          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-gold-500/10 text-gold-500/70 border border-gold-500/20">⭐ Best Free: {result.best_free}</span>
        </div>
      </div>

      {/* Recommended Tools */}
      <div className="space-y-3">
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Recommended AI Platforms</p>
        <div className="space-y-2">
          {result.recommended_tools?.map((tool, i) => (
            <div key={i} className="glass-gold rounded-xl p-4 hover-lift transition-all group">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{tool.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white group-hover:text-gold-500 transition-colors">{tool.name}</h4>
                    {i === 0 && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-gold-500/20 text-gold-500">#1 PICK</span>}
                    {tool.name === result.best_free && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400">FREE</span>}
                  </div>
                  <p className="text-[11px] text-gray-400 mb-2">{tool.description}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 text-[10px]">★</span>
                      <span className="text-[10px] font-mono text-gray-300">{tool.rating}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{tool.pricing}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button id={`fav-${tool.name.replace(/\s+/g, '-')}`}
                    onClick={() => toggleFavorite(tool.name)}
                    className={`p-2 rounded-lg transition-all ${favorites.includes(tool.name) ? 'bg-red-500/10 text-red-400' : 'hover:bg-gold-500/10 text-gray-600 hover:text-gold-500'}`}
                  >
                    <svg className="w-4 h-4" fill={favorites.includes(tool.name) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <a href={tool.url} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-gold-500/10 text-gray-600 hover:text-gold-500 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Starter Prompts */}
      <div className="space-y-3">
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">✨ AI Prompt Generator</p>
        <div className="space-y-2">
          {result.all_prompts?.map((prompt, i) => (
            <div key={i} className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-3 group hover:border-gold-500/20 transition-all">
              <p className="text-xs text-gray-300 flex-1">{prompt}</p>
              <button id={`copy-prompt-${i}`}
                onClick={() => copyPrompt(prompt)}
                className="p-2 rounded-lg hover:bg-gold-500/10 transition-all shrink-0"
              >
                {copiedPrompt === prompt ? (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Categories */}
      {result.alternative_categories?.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Also Consider</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {result.alternative_categories.map((alt, i) => (
              <div key={i} className="glass rounded-xl p-3 text-center">
                <p className="text-xs text-gray-300 font-medium">{alt.category}</p>
                <p className="text-[10px] text-gold-500/50 font-mono mt-0.5">{alt.confidence}% match</p>
                <p className="text-[10px] text-gray-500 mt-1">Top: {alt.top_tool}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
