import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

export default function ChatWindow({ messages, isLoading, onSendMessage }) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input)
      setInput('')
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        <div className="max-w-3xl mx-auto space-y-1">
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isLast={index === messages.length - 1}
            />
          ))}

          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 pb-6 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="glass-gold rounded-2xl p-1 input-glow transition-all duration-300">
            <div className="flex items-center gap-2 px-4 py-2">
              {/* Attachment hint */}
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-gold-500/10 transition-colors group"
                title="Feature coming soon"
              >
                <svg className="w-4 h-4 text-gold-500/30 group-hover:text-gold-500/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              <input
                ref={inputRef}
                id="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about AI & Technology..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none font-body text-sm"
                disabled={isLoading}
                autoComplete="off"
              />

              {/* Character count */}
              {input.length > 0 && (
                <span className="text-[10px] text-gold-500/30 font-mono tabular-nums">
                  {input.length}
                </span>
              )}

              {/* Send button */}
              <button
                id="send-btn"
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-yellow-600 text-black disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-gold transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-600 mt-2 font-mono">
            Powered by TF-IDF + Cosine Similarity · Local ML Model · No API Keys Required
          </p>
        </form>
      </div>
    </div>
  )
}
