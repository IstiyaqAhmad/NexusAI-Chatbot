import { useState } from 'react'

export default function Sidebar({ modelStats, onRetrain, onClearChat, onToggleSettings, onClose, messageCount }) {
  const [isRetraining, setIsRetraining] = useState(false)

  const handleRetrain = async () => {
    setIsRetraining(true)
    await onRetrain()
    setIsRetraining(false)
  }

  return (
    <aside className="w-72 glass border-r border-gold-500/10 flex flex-col shrink-0 relative z-20 animate-slide-in-right">
      {/* Logo Section */}
      <div className="p-5 border-b border-gold-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-yellow-600 flex items-center justify-center shadow-gold">
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">NexusAI</h2>
              <p className="text-[10px] text-gold-500/50 font-mono tracking-widest uppercase">v1.0.0</p>
            </div>
          </div>
          <button
            id="close-sidebar-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gold-500/10 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Model Info */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status Card */}
        <div className="glass-gold rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-gold-500/80 uppercase tracking-wider">System Status</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatItem label="Model" value="TF-IDF" />
            <StatItem label="Engine" value="Hybrid" />
            <StatItem
              label="FAQ Items"
              value={modelStats?.total_faq_entries || '—'}
            />
            <StatItem
              label="Features"
              value={modelStats?.training_stats?.num_features || '—'}
            />
            <StatItem
              label="Categories"
              value={modelStats?.training_stats?.num_categories || '—'}
            />
            <StatItem
              label="Messages"
              value={messageCount}
            />
          </div>
        </div>

        {/* Model Parameters */}
        <div className="glass-gold rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gold-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="text-xs font-mono text-gold-500/80 uppercase tracking-wider">Parameters</span>
          </div>

          <div className="space-y-2">
            <ParamItem
              label="Temperature"
              value={modelStats?.parameters?.temperature?.toFixed(1) || '0.7'}
              description="Controls randomness"
            />
            <ParamItem
              label="Top-P"
              value={modelStats?.parameters?.top_p?.toFixed(1) || '0.9'}
              description="Nucleus sampling"
            />
            <ParamItem
              label="Threshold"
              value={modelStats?.parameters?.confidence_threshold?.toFixed(2) || '0.25'}
              description="Min confidence"
            />
          </div>
        </div>

        {/* Architecture Info */}
        <div className="glass-gold rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gold-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span className="text-xs font-mono text-gold-500/80 uppercase tracking-wider">Architecture</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-gray-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gold-500/40" />
              Text Preprocessing (NLTK)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gold-500/40" />
              TF-IDF Vectorization
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gold-500/40" />
              Cosine Similarity Search
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gold-500/40" />
              Temperature Sampling
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gold-500/40" />
              Session Memory
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gold-500/10 space-y-2">
        <button
          id="retrain-btn"
          onClick={handleRetrain}
          disabled={isRetraining}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500/20 to-yellow-600/20 border border-gold-500/20 text-gold-500 text-xs font-medium hover:border-gold-500/40 hover:from-gold-500/30 hover:to-yellow-600/30 transition-all disabled:opacity-50"
        >
          {isRetraining ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Retraining...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retrain Model
            </>
          )}
        </button>

        <button
          id="clear-chat-btn"
          onClick={onClearChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 text-gray-500 text-xs font-medium hover:border-red-500/20 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear Chat
        </button>

        <button
          id="settings-sidebar-btn"
          onClick={onToggleSettings}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 text-gray-500 text-xs font-medium hover:border-gold-500/20 hover:text-gold-500/80 hover:bg-gold-500/5 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Model Settings
        </button>
      </div>
    </aside>
  )
}

function StatItem({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">{label}</p>
      <p className="text-sm font-display font-semibold text-white">{value}</p>
    </div>
  )
}

function ParamItem({ label, value, description }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-300">{label}</p>
        <p className="text-[9px] text-gray-600">{description}</p>
      </div>
      <span className="text-xs font-mono text-gold-500 bg-gold-500/10 px-2 py-0.5 rounded-md">{value}</span>
    </div>
  )
}
