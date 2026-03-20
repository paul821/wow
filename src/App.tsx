import { useState, useCallback } from 'react'
import './App.css'
import type { Workout, GeneratedTimeBlock } from './lib/WorkoutEngine'

const EQUIPMENT_OPTIONS = [
  'Pull Up Bar',
  'Barbell',
  'Plate',
  'Dumbbell',
  'Kettlebell',
  'Medicine Ball',
  'Plyo Box',
  'Jump Rope',
  'Rings',
  'Rower',
  'Rope',
] as const

type WorkoutResult = Workout[] | GeneratedTimeBlock | null

function App() {
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [result, setResult] = useState<WorkoutResult>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCopy = useCallback(() => {
    if (!result) return

    let text = ''
    if (Array.isArray(result) && result.length > 0) {
      const wod = result[0]
      text = `${wod.name} (${wod.type})\n`
      wod.default_movements.forEach((m, i) => {
        const name = m.name ?? `Movement #${i + 1}`
        text += `  ${i + 1}. ${name} — ${typeof m.reps === 'string' ? m.reps : `${m.reps} reps`}\n`
      })
    } else if (!Array.isArray(result)) {
      text = `${result.durationMinutes} Min ${result.type}\n`
      result.movements.forEach((m, i) => {
        text += `  ${i + 1}. ${m.name} — ${m.reps} reps\n`
      })
    }

    navigator.clipboard.writeText(text.trim()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [result])

  const toggleEquipment = (equip: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(equip)
        ? prev.filter((e) => e !== equip)
        : [...prev, equip]
    )
  }

  const clearEquipment = () => {
    setSelectedEquipment([])
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setFallbackMessage(null)
    setError(null)
    try {
      const { WorkoutEngine } = await import('./lib/WorkoutEngine')
      const engine = new WorkoutEngine()

      const { wods, isBodyweightFallback } = await engine.getMatchedWODs(selectedEquipment)
      if (wods.length > 0) {
        const randomWod = wods[Math.floor(Math.random() * wods.length)]
        setResult([randomWod])
        if (isBodyweightFallback) {
          const equipLabel = selectedEquipment.join(' + ')
          setFallbackMessage(
            `No classic WOD found specifically for ${equipLabel}. Showing a bodyweight workout instead.`
          )
        }
      } else {
        const equipLabel = selectedEquipment.length > 0
          ? selectedEquipment.join(' + ')
          : 'your selection'
        setFallbackMessage(
          `No classic WOD found for ${equipLabel}. Here's a custom workout built from your available exercises.`
        )
        const generated = await engine.generateSmartWorkout(15, selectedEquipment)
        setResult(generated)
      }
    } catch (err) {
      console.error('Failed to generate workout:', err)
      setResult(null)
      setError('Something went wrong generating your workout. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const isNoEquipment = selectedEquipment.length === 0

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="noise-overlay" aria-hidden="true" />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-10 pt-4">
          <div className="flex items-baseline gap-3">
            <h1
              className="text-5xl sm:text-6xl tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              WOW
            </h1>
            <span
              className="text-sm tracking-widest uppercase"
              style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              Workout of the Week
            </span>
          </div>
          <div
            className="mt-2 h-px"
            style={{ background: 'linear-gradient(90deg, var(--color-accent), transparent 60%)' }}
          />
        </header>

        {/* Equipment Section */}
        <section className="mb-8">
          <h2
            className="text-xs tracking-widest uppercase mb-4"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
          >
            Select Your Equipment
          </h2>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Equipment Options">
            <button
              onClick={clearEquipment}
              className={`chip ${isNoEquipment ? 'chip-active' : 'chip-inactive'}`}
            >
              <span aria-hidden="true">{isNoEquipment ? '◆' : '◇'}</span>
              No Equipment
            </button>

            {EQUIPMENT_OPTIONS.map((equip) => {
              const isActive = selectedEquipment.includes(equip)
              return (
                <button
                  key={equip}
                  onClick={() => toggleEquipment(equip)}
                  className={`chip ${isActive ? 'chip-active' : 'chip-inactive'}`}
                >
                  <span aria-hidden="true">{isActive ? '◆' : '◇'}</span>
                  {equip}
                </button>
              )
            })}
          </div>
        </section>

        <div className="section-divider mb-8" />

        {/* Actions */}
        <section className="mb-8 flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-generate"
          >
            {isGenerating ? 'Generating...' : 'Generate Workout'}
          </button>

          {result && (
            <>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="chip chip-inactive hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                style={{ padding: '0.875rem 1.5rem' }}
              >
                ↻ Shuffle
              </button>
              <button
                onClick={handleCopy}
                className="chip chip-inactive hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                style={{ padding: '0.875rem 1.5rem' }}
              >
                {copied ? '✓ Copied' : '⎘ Copy'}
              </button>
            </>
          )}
        </section>

        {/* Results */}
        <section>
          {!result && !isGenerating && (
            <div className="result-display">
              <p
                className="text-sm tracking-wide"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                Select equipment & hit generate
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="result-display">
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--color-border-subtle)', borderTopColor: 'var(--color-accent)' }}
              />
            </div>
          )}

          {error && !isGenerating && (
            <div
              className="result-display animate-fade-in-up"
              style={{
                borderLeft: '3px solid #e53e3e',
              }}
            >
              <p
                className="text-sm tracking-wide"
                style={{ color: '#e53e3e', fontFamily: 'var(--font-mono)' }}
              >
                {error}
              </p>
            </div>
          )}

          {result && !isGenerating && (
            <div className="animate-fade-in-up">
              {fallbackMessage && (
                <div
                  className="mb-4 px-4 py-3 rounded-lg text-sm"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                    borderLeft: '3px solid var(--color-accent)',
                  }}
                >
                  {fallbackMessage}
                </div>
              )}
              {Array.isArray(result) && result.length > 0 ? (
                <ClassicWODCard wod={result[0]} />
              ) : !Array.isArray(result) ? (
                <SmartWorkoutCard workout={result} />
              ) : null}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-16 mb-8 text-center">
          <p
            className="text-xs"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
          >
            Project WOW — Built for athletes who hate rest days
          </p>
        </footer>
      </div>
    </div>
  )
}

function ClassicWODCard({ wod }: { wod: Workout }) {
  return (
    <div className="workout-card rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}
          >
            Classic WOD
          </span>
          <h3
            className="text-3xl mt-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {wod.name}
          </h3>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded"
          style={{
            background: 'var(--color-surface-elevated)',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {wod.type}
        </span>
      </div>

      <div className="space-y-2">
        {wod.default_movements.map((m, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 px-3 rounded"
            style={{ background: 'var(--color-surface-elevated)' }}
          >
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {m.name ?? `Movement #${i + 1}`}
            </span>
            <span
              className="text-sm"
              style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}
            >
              {typeof m.reps === 'string' ? m.reps : `${m.reps} reps`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SmartWorkoutCard({ workout }: { workout: GeneratedTimeBlock }) {
  return (
    <div className="workout-card rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}
          >
            Generated Smart Workout
          </span>
          <h3
            className="text-3xl mt-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {workout.durationMinutes} Min {workout.type}
          </h3>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded"
          style={{
            background: 'var(--color-surface-elevated)',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {workout.type}
        </span>
      </div>

      <div className="space-y-2">
        {workout.movements.map((m, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 px-3 rounded"
            style={{ background: 'var(--color-surface-elevated)' }}
          >
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {m.name}
            </span>
            <span
              className="text-sm"
              style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}
            >
              {m.reps} reps
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
