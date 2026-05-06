import { useState, useRef, useEffect, useCallback } from 'react'
import ChatWindow from './components/ChatWindow'
import Sidebar from './components/Sidebar'
import SettingsPanel from './components/SettingsPanel'
import WelcomeScreen from './components/WelcomeScreen'

const API_BASE = ''

function App() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [modelStats, setModelStats] = useState(null)
  const [settings, setSettings] = useState({
    temperature: 0.7,
    top_p: 0.9,
    confidence_threshold: 0.25
  })

  // Fetch model stats on mount
  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`)
      const data = await res.json()
      setModelStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          session_id: sessionId
        })
      })

      const data = await res.json()

      if (!sessionId) {
        setSessionId(data.session_id)
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: data.response,
        confidence: data.confidence,
        method: data.method,
        category: data.category,
        matched_question: data.matched_question,
        top_matches: data.top_matches,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: 'I apologize, but I\'m having trouble connecting to my brain right now. Please make sure the backend server is running on port 8000.',
        confidence: 0,
        method: 'error',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, sessionId])

  const updateSettings = async (newSettings) => {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })
      const data = await res.json()
      setSettings(data.parameters)
    } catch (err) {
      console.error('Failed to update settings:', err)
    }
  }

  const retrain = async () => {
    try {
      const res = await fetch(`${API_BASE}/train`, { method: 'POST' })
      const data = await res.json()
      fetchStats()
      return data
    } catch (err) {
      console.error('Failed to retrain:', err)
    }
  }

  const clearChat = () => {
    setMessages([])
    if (sessionId) {
      fetch(`${API_BASE}/session/${sessionId}`, { method: 'DELETE' }).catch(() => {})
    }
    setSessionId(null)
  }

  const handleQuickQuestion = (question) => {
    sendMessage(question)
  }

  return (
    <div className="flex h-screen bg-black relative overflow-hidden">
      {/* Background ambient effects */}
      <div className="bg-particles" />

      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          modelStats={modelStats}
          onRetrain={retrain}
          onClearChat={clearChat}
          onToggleSettings={() => setShowSettings(!showSettings)}
          onClose={() => setShowSidebar(false)}
          messageCount={messages.length}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="glass border-b border-gold-500/10 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {!showSidebar && (
              <button
                id="toggle-sidebar-btn"
                onClick={() => setShowSidebar(true)}
                className="p-2 rounded-lg hover:bg-gold-500/10 transition-colors"
              >
                <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-yellow-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-white leading-tight">NexusAI</h1>
                <p className="text-[10px] text-gold-500/60 font-mono tracking-wider uppercase">AI Technology Assistant</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass-gold text-xs font-mono text-gold-500/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Model Active
            </div>
            <button
              id="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gold-500/10 transition-colors group"
              title="Model Settings"
            >
              <svg className="w-5 h-5 text-gold-500/60 group-hover:text-gold-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Chat or Welcome */}
        {messages.length === 0 ? (
          <WelcomeScreen onQuickQuestion={handleQuickQuestion} />
        ) : (
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
          />
        )}

        {/* Input Area - shown even on welcome screen */}
        {messages.length === 0 && (
          <InputBar onSend={sendMessage} isLoading={isLoading} />
        )}
      </div>

      {/* Settings Panel (overlay) */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

function InputBar({ onSend, isLoading }) {
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSend(input)
      setInput('')
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="p-4 pb-6 relative z-10">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="glass-gold rounded-2xl p-1 input-glow transition-all duration-300">
          <div className="flex items-center gap-2 px-4 py-2">
            <input
              ref={inputRef}
              id="welcome-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about AI & Technology..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none font-body text-sm"
              disabled={isLoading}
            />
            <button
              id="welcome-send-btn"
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-yellow-600 text-black disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-gold transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-gray-600 mt-2 font-mono">
          Powered by TF-IDF + Cosine Similarity · Local ML Model · No API Keys Required
        </p>
      </form>
    </div>
  )
}

export default App
