import { exercises, workouts } from './data'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Exercise {
  id: string
  name: string
  movement_pattern: 'push' | 'pull' | 'squat' | 'hinge' | 'core'
  equipment_required: string[]
  base_difficulty: number
}

export interface WODMovement {
  exercise_id: string
  reps: number | string
  name?: string
}

export interface Workout {
  id: string
  name: string
  type: 'AMRAP' | 'For Time' | 'EMOM'
  default_movements: WODMovement[]
}

export interface GeneratedTimeBlock {
  durationMinutes: number
  type: 'AMRAP' | 'EMOM' | 'For Time'
  movements: Array<{ exercise_id: string; name: string; reps: number }>
}

export interface MatchedWODsResult {
  wods: Workout[]
  isBodyweightFallback: boolean
}

export interface ClosestMatch {
  wod: Workout
  missingEquipment: string[]
}

// ─── WorkoutEngine ───────────────────────────────────────────────────────────

export class WorkoutEngine {
  private filterExercisesByEquipment(
    allExercises: Exercise[],
    availableEquipment: string[]
  ): Exercise[] {
    return allExercises.filter((ex) => {
      if (ex.equipment_required.length === 0) return true
      return ex.equipment_required.every((equip) =>
        availableEquipment.includes(equip)
      )
    })
  }

  getMatchedWODs(availableEquipment: string[]): MatchedWODsResult {
    const validExerciseIds = new Set(
      this.filterExercisesByEquipment(exercises, availableEquipment)
        .map((ex) => ex.id)
    )

    const exNameMap = new Map(exercises.map(e => [e.id, e.name]))
    const exEquipMap = new Map(exercises.map(e => [e.id, e.equipment_required]))

    const enrichWod = (wod: Workout) => ({
      ...wod,
      default_movements: wod.default_movements.map(m => ({
        ...m,
        name: exNameMap.get(m.exercise_id) ?? 'Unknown',
      })),
    })

    const doableWods = workouts.filter((wod) =>
      wod.default_movements.every((m) => validExerciseIds.has(m.exercise_id))
    )

    if (availableEquipment.length > 0) {
      const equipmentWods = doableWods.filter((wod) =>
        wod.default_movements.some((m) => {
          const equip = exEquipMap.get(m.exercise_id) ?? []
          return equip.length > 0
        })
      )
      if (equipmentWods.length > 0) {
        return { wods: equipmentWods.map(enrichWod), isBodyweightFallback: false }
      }
      return { wods: doableWods.map(enrichWod), isBodyweightFallback: true }
    }

    return { wods: doableWods.map(enrichWod), isBodyweightFallback: false }
  }

  generateTimeBlock(durationMinutes: number): GeneratedTimeBlock {
    let type: 'AMRAP' | 'EMOM' | 'For Time'

    if (durationMinutes <= 10) {
      type = 'AMRAP'
    } else if (durationMinutes <= 20) {
      type = 'EMOM'
    } else {
      type = 'For Time'
    }

    return {
      durationMinutes,
      type,
      movements: [],
    }
  }

  generateSmartWorkout(
    durationMinutes: number,
    availableEquipment: string[]
  ): GeneratedTimeBlock {
    const block = this.generateTimeBlock(durationMinutes)

    const validExercises = this.filterExercisesByEquipment(
      exercises,
      availableEquipment
    )

    const pushExercises = validExercises.filter((e) => e.movement_pattern === 'push')
    const pullExercises = validExercises.filter((e) => e.movement_pattern === 'pull')
    const squatHingeExercises = validExercises.filter(
      (e) => e.movement_pattern === 'squat' || e.movement_pattern === 'hinge'
    )

    const pickRandom = (arr: Exercise[]): Exercise | null =>
      arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null

    const selected = [
      pickRandom(pushExercises),
      pickRandom(pullExercises),
      pickRandom(squatHingeExercises),
    ].filter((e): e is Exercise => e !== null)

    block.movements = selected.map((ex) => ({
      exercise_id: ex.id,
      name: ex.name,
      reps: ex.base_difficulty * 5,
    }))

    return block
  }

  getClosestMatchedWODs(
    availableEquipment: string[]
  ): ClosestMatch[] {
    const exerciseMap = new Map(
      exercises.map((ex) => [ex.id, ex])
    )

    const results: ClosestMatch[] = []

    for (const wod of workouts) {
      const missingSet = new Set<string>()

      for (const movement of wod.default_movements) {
        const exercise = exerciseMap.get(movement.exercise_id)
        if (!exercise) continue

        for (const equip of exercise.equipment_required) {
          if (!availableEquipment.includes(equip)) {
            missingSet.add(equip)
          }
        }
      }

      if (missingSet.size > 0 && missingSet.size <= 3) {
        results.push({
          wod,
          missingEquipment: Array.from(missingSet),
        })
      }
    }

    return results.sort((a, b) => a.missingEquipment.length - b.missingEquipment.length)
  }

  scaleRepVolume(
    reps: number | string,
    originalEquipment: string,
    substitutedEquipment: string
  ): number | string {
    let scaleFactor = 1

    if (originalEquipment === 'Barbell' && substitutedEquipment === 'Dumbbell') {
      scaleFactor = 1.2
    } else if (originalEquipment === 'Dumbbell' && substitutedEquipment === 'None') {
      scaleFactor = 1.5
    } else if (originalEquipment === 'Barbell' && substitutedEquipment === 'None') {
      scaleFactor = 1.8
    } else {
      return reps
    }

    if (typeof reps === 'number') {
      return Math.round(reps * scaleFactor)
    }

    return reps
      .split('-')
      .map((r) => Math.round(parseInt(r, 10) * scaleFactor).toString())
      .join('-')
  }
}
