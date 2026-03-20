import { describe, it, expect } from 'vitest'
import { WorkoutEngine } from './WorkoutEngine'

const engine = new WorkoutEngine()

describe('WorkoutEngine', () => {
  describe('Phase 1: Classic WOD Matcher', () => {
    it('returns WODs that match available equipment', async () => {
      // With Pull Up Bar, we should get WODs that only need bodyweight + pull up bar
      // Cindy needs: Pull Up Bar (for Pull Up) + bodyweight (Push Up, Air Squat)
      const { wods } = await engine.getMatchedWODs(['Pull Up Bar'])

      // Cindy should be in the results (only needs Pull Up Bar + bodyweight)
      const wodNames = wods.map((w) => w.name)
      expect(wodNames).toContain('Cindy')
    })

    it('filters out WODs that require missing equipment', async () => {
      // With no equipment, WODs requiring Pull Up Bar, Barbell, etc. should be excluded
      const { wods } = await engine.getMatchedWODs([])

      const wodNames = wods.map((w) => w.name)

      // Fran needs Barbell + Pull Up Bar — should NOT be included
      expect(wodNames).not.toContain('Fran')
      // Grace needs Barbell — should NOT be included
      expect(wodNames).not.toContain('Grace')
      // Cindy needs Pull Up Bar — should NOT be included
      expect(wodNames).not.toContain('Cindy')
    })

    it('returns more WODs when more equipment is available', async () => {
      const { wods: wodsNoEquip } = await engine.getMatchedWODs([])
      const { wods: wodsFullGym } = await engine.getMatchedWODs([
        'Barbell', 'Pull Up Bar', 'Kettlebell',
        'Jump Rope', 'Rower', 'Medicine Ball', 'Rings',
      ])

      expect(wodsFullGym.length).toBeGreaterThan(wodsNoEquip.length)
    })

    it('flags bodyweight fallback when equipment has no specific WODs', async () => {
      // Rope has no WODs that use Rope Climb exclusively
      const { isBodyweightFallback } = await engine.getMatchedWODs(['Rope'])
      expect(isBodyweightFallback).toBe(true)

      // Pull Up Bar has many specific WODs
      const pullUpResult = await engine.getMatchedWODs(['Pull Up Bar'])
      expect(pullUpResult.isBodyweightFallback).toBe(false)
    })
  })

  describe('Phase 2: Template Stacker', () => {
    it('returns AMRAP for durations <= 10 minutes', () => {
      const block = engine.generateTimeBlock(10)
      expect(block.type).toBe('AMRAP')
      expect(block.durationMinutes).toBe(10)
      expect(block.movements).toEqual([])
    })

    it('returns EMOM for durations 11-20 minutes', () => {
      const block = engine.generateTimeBlock(15)
      expect(block.type).toBe('EMOM')
      expect(block.durationMinutes).toBe(15)
    })

    it('returns For Time for durations > 20 minutes', () => {
      const block = engine.generateTimeBlock(30)
      expect(block.type).toBe('For Time')
      expect(block.durationMinutes).toBe(30)
    })
  })

  describe('Balanced Movement Rule', () => {
    it('test_smart_distribution: generates a 3-movement workout with one push, one pull, and one squat/hinge', async () => {
      // With Pull Up Bar we have: bodyweight push + pull-up bar pull + bodyweight squat/hinge
      const workout = await engine.generateSmartWorkout(10, ['Pull Up Bar'])

      // Should have exactly 3 movements
      expect(workout.movements.length).toBe(3)

      // Use static data to verify movement patterns
      const { exercises: allExercises } = await import('./data')

      const exerciseMap = new Map(
        allExercises.map((ex) => [ex.id, ex.movement_pattern])
      )

      const patterns = workout.movements.map((m) => {
        const pattern = exerciseMap.get(m.exercise_id)
        // Combine squat and hinge into one category
        return pattern === 'squat' || pattern === 'hinge' ? 'squat/hinge' : pattern
      })

      // Verify balanced distribution
      expect(patterns).toContain('push')
      expect(patterns).toContain('pull')
      expect(patterns).toContain('squat/hinge')

      // Each category should appear exactly once
      expect(patterns.filter((p) => p === 'push').length).toBe(1)
      expect(patterns.filter((p) => p === 'pull').length).toBe(1)
      expect(patterns.filter((p) => p === 'squat/hinge').length).toBe(1)
    })

    it('respects equipment filtering in smart workout generation', async () => {
      // With no equipment, should only get bodyweight exercises
      const workout = await engine.generateSmartWorkout(15, [])

      // All selected exercises should require no equipment
      const { exercises: allExercises } = await import('./data')

      const exerciseMap = new Map(
        allExercises.map((ex) => [ex.id, ex.equipment_required])
      )

      workout.movements.forEach((m) => {
        const required = exerciseMap.get(m.exercise_id)
        expect(required).toBeDefined()
        expect(required!.length).toBe(0) // bodyweight only
      })
    })
  })

  describe('Phase 3: Filter Relaxation', () => {
    it('finds closest matching WODs and reports missing equipment', async () => {
      // With only Pull Up Bar, Fran (needs Barbell+Pull Up Bar) is close
      const closest = await engine.getClosestMatchedWODs(['Pull Up Bar'])

      expect(closest.length).toBeGreaterThan(0)

      // Each result should have missing equipment listed
      closest.forEach((match) => {
        expect(match.missingEquipment.length).toBeGreaterThan(0)
        expect(match.wod.name).toBeDefined()
      })

      // Results should be sorted by fewest missing items first
      for (let i = 1; i < closest.length; i++) {
        expect(closest[i].missingEquipment.length)
          .toBeGreaterThanOrEqual(closest[i - 1].missingEquipment.length)
      }
    })

    it('excludes exact matches from closest results', async () => {
      // With full gym equipment, exact matches should NOT appear in closest
      const fullGym = ['Barbell', 'Pull Up Bar', 'Kettlebell', 'Jump Rope', 'Rower', 'Medicine Ball', 'Rings']
      const { wods: exactMatches } = await engine.getMatchedWODs(fullGym)
      const closestMatches = await engine.getClosestMatchedWODs(fullGym)

      const exactNames = new Set(exactMatches.map((w) => w.name))
      closestMatches.forEach((match) => {
        expect(exactNames.has(match.wod.name)).toBe(false)
      })
    })
  })

  describe('Rep-Volume Scaling', () => {
    it('scales numeric reps by 20% for Barbell → Dumbbell', () => {
      expect(engine.scaleRepVolume(10, 'Barbell', 'Dumbbell')).toBe(12)
      expect(engine.scaleRepVolume(21, 'Barbell', 'Dumbbell')).toBe(25)
      expect(engine.scaleRepVolume(5, 'Barbell', 'Dumbbell')).toBe(6)
    })

    it('scales numeric reps by 50% for Dumbbell → None', () => {
      expect(engine.scaleRepVolume(10, 'Dumbbell', 'None')).toBe(15)
      expect(engine.scaleRepVolume(20, 'Dumbbell', 'None')).toBe(30)
    })

    it('scales string rep schemes like "21-15-9"', () => {
      expect(engine.scaleRepVolume('21-15-9', 'Barbell', 'Dumbbell')).toBe('25-18-11')
      expect(engine.scaleRepVolume('50-40-30-20-10', 'Barbell', 'Dumbbell')).toBe('60-48-36-24-12')
    })

    it('returns unchanged reps for unknown substitution', () => {
      expect(engine.scaleRepVolume(10, 'Kettlebell', 'Dumbbell')).toBe(10)
      expect(engine.scaleRepVolume('21-15-9', 'Rings', 'None')).toBe('21-15-9')
    })

    it('handles edge cases with rounding', () => {
      // 9 * 1.2 = 10.8 → 11
      expect(engine.scaleRepVolume(9, 'Barbell', 'Dumbbell')).toBe(11)
      // 7 * 1.5 = 10.5 → 11 (Math.round rounds .5 up)
      expect(engine.scaleRepVolume(7, 'Dumbbell', 'None')).toBe(11)
    })
  })
})
