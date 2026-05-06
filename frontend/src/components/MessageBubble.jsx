import { useState } from 'react'

export default function MessageBubble({ message, isLast }) {
  const [showDetails, setShowDetails] = useState(false)
  const isUser = message.type === 'user'
  const isError = message.method === 'error'

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return 'bg-emerald-400'
    if (confidence >= 0.4) return 'bg-yellow-400'
    if (confidence >= 0.2) return 'bg-orange-400'
    return 'bg-red-400'
  }

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.7) return 'High'
    if (confidence >= 0.4) return 'Medium'
    if (confidence >= 0.2) return 'Low'
    return 'Very Low'
  }

  const getMethodLabel = (method) => {
    switch (method) {
      case 'tfidf_match': return 'TF-IDF Match'
      case 'generated': return 'Generated'
      case 'error': return 'Error'
      default: return method
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`message-enter flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar + Name */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-500 to-yellow-600 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
          )}
          <span className="text-[10px] text-gray-500 font-mono">
            {isUser ? 'You' : 'NexusAI'} · {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Message Bubble */}
        <div className={`${isUser ? 'user-bubble' : 'bot-bubble'} ${isError ? 'border-red-500/30' : ''} px-4 py-3`}>
          <p className={`text-sm leading-relaxed font-body whitespace-pre-wrap ${isUser ? 'text-black font-medium' : 'text-gray-200'}`}>
            {message.text}
          </p>
        </div>

        {/* Bot Message Metadata */}
        {!isUser && message.confidence !== undefined && (
          <div className="mt-2 space-y-1.5">
            {/* Confidence Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-[120px]">
                <div
                  className={`confidence-bar ${getConfidenceColor(message.confidence)}`}
                  style={{ width: `${Math.max(message.confidence * 100, 2)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                {(message.confidence * 100).toFixed(1)}% · {getConfidenceLabel(message.confidence)}
              </span>
            </div>

            {/* Method + Category badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono bg-gold-500/10 text-gold-500/70 border border-gold-500/10">
                {getMethodLabel(message.method)}
              </span>
              {message.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/5 text-gray-400 border border-white/5">
                  {message.category}
                </span>
              )}
              {/* Toggle details button */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono text-gray-500 hover:text-gold-500/70 hover:bg-gold-500/5 transition-colors"
              >
                {showDetails ? '▲ Less' : '▼ More'}
              </button>
            </div>

            {/* Expanded Details */}
            {showDetails && (
              <div className="mt-2 p-3 rounded-xl bg-white/[0.02] border border-gold-500/10 space-y-2 animate-fade-in">
                {message.matched_question && (
                  <div>
                    <p className="text-[10px] text-gold-500/50 font-mono uppercase tracking-wider mb-0.5">Matched Question</p>
                    <p className="text-xs text-gray-400 italic">"{message.matched_question}"</p>
                  </div>
                )}
                {message.top_matches && message.top_matches.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gold-500/50 font-mono uppercase tracking-wider mb-1">Top Matches</p>
                    {message.top_matches.map((match, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1">
                        <span className="text-[10px] text-gold-500/40 font-mono shrink-0 mt-0.5">
                          {(match.score * 100).toFixed(1)}%
                        </span>
                        <p className="text-[11px] text-gray-500 leading-tight">{match.question}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
