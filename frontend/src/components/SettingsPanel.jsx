import { useState, useEffect } from 'react'

export default function SettingsPanel({ settings, onUpdate, onClose }) {
  const [localSettings, setLocalSettings] = useState({
    temperature: settings.temperature,
    top_p: settings.top_p,
    confidence_threshold: settings.confidence_threshold
  })

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: parseFloat(value) }
    setLocalSettings(newSettings)
  }

  const handleApply = () => {
    onUpdate(localSettings)
  }

  const handleReset = () => {
    const defaults = { temperature: 0.7, top_p: 0.9, confidence_threshold: 0.25 }
    setLocalSettings(defaults)
    onUpdate(defaults)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative glass-gold rounded-2xl p-6 w-full max-w-md animate-slide-up shadow-2xl shadow-gold-500/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500 to-yellow-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">Model Settings</h3>
              <p className="text-[10px] text-gold-500/50 font-mono">Configure ML parameters</p>
            </div>
          </div>
          <button
            id="close-settings-btn"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gold-500/10 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Controls */}
        <div className="space-y-6">
          {/* Temperature */}
          <SettingSlider
            id="temperature-slider"
            label="Temperature"
            description="Controls the randomness of responses. Lower values make output more deterministic and focused. Higher values increase creativity and diversity but may reduce accuracy."
            value={localSettings.temperature}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => handleChange('temperature', v)}
            formatValue={(v) => v.toFixed(1)}
            marks={[
              { value: 0, label: 'Precise' },
              { value: 1, label: 'Balanced' },
              { value: 2, label: 'Creative' }
            ]}
          />

          {/* Top-P */}
          <SettingSlider
            id="top-p-slider"
            label="Top-P (Nucleus Sampling)"
            description="Selects from the smallest set of candidates whose cumulative probability exceeds this threshold. Lower values make responses more focused; higher values consider more options."
            value={localSettings.top_p}
            min={0.1}
            max={1}
            step={0.05}
            onChange={(v) => handleChange('top_p', v)}
            formatValue={(v) => v.toFixed(2)}
            marks={[
              { value: 0.1, label: 'Narrow' },
              { value: 0.5, label: 'Moderate' },
              { value: 1, label: 'Wide' }
            ]}
          />

          {/* Confidence Threshold */}
          <SettingSlider
            id="threshold-slider"
            label="Confidence Threshold"
            description="Minimum cosine similarity score required for a direct FAQ match. Below this threshold, the system generates a synthesized response from partial matches."
            value={localSettings.confidence_threshold}
            min={0.05}
            max={0.8}
            step={0.05}
            onChange={(v) => handleChange('confidence_threshold', v)}
            formatValue={(v) => v.toFixed(2)}
            marks={[
              { value: 0.05, label: 'Loose' },
              { value: 0.4, label: 'Balanced' },
              { value: 0.8, label: 'Strict' }
            ]}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-8">
          <button
            id="reset-settings-btn"
            onClick={handleReset}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-medium hover:border-gold-500/20 hover:text-white transition-all"
          >
            Reset Defaults
          </button>
          <button
            id="apply-settings-btn"
            onClick={handleApply}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-yellow-600 text-black text-sm font-bold hover:shadow-gold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  )
}

function SettingSlider({ id, label, description, value, min, max, step, onChange, formatValue, marks }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">{label}</label>
        <span className="text-sm font-mono text-gold-500 bg-gold-500/10 px-2.5 py-1 rounded-lg">
          {formatValue(value)}
        </span>
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed">{description}</p>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1"
      />
      {marks && (
        <div className="flex justify-between">
          {marks.map((mark, i) => (
            <span key={i} className="text-[9px] text-gray-600 font-mono">{mark.label}</span>
          ))}
        </div>
      )}
    </div>
  )
}
