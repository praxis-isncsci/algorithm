# Motor Level Step-Based Architecture

**Author:** ISNCSCI Architect Agent  
**Date:** 2025-02-19  
**Status:** Implemented

---

## 1. High-Level Overview

### What the module computes

The **Motor Level** identifies the most caudal myotome on each side with normal motor function (grade 3 or better). It answers: _"What is the lowest level with intact motor function?"_

The algorithm iterates over SensoryLevels from C1 through S4_5. At each index, it dispatches to one of five check types depending on the level category:

1. **Sensory regions** (C1–C3, T2–T12, S2–S3): Uses sensory values via `checkSensoryLevel`.
2. **Before key muscles** (C4, L1): Uses motor at the next key muscle (C5 or L2) via `checkMotorLevelBeforeStartOfKeyMuscles`.
3. **Key motor regions** (C5–C8, L2–L5): Uses motor values via `checkMotorLevel`.
4. **End of key muscles** (T1, S1): Uses motor at the level plus sensory values below via `checkMotorLevelAtEndOfKeyMuscles`.
5. **S4_5 (VAC handling)**: When past S1, handles Voluntary Anal Contraction (No/NT/Yes) to add S3, INT, etc.

Each check returns `CheckLevelResult { continue, level?, variable }`. The `variable` flag accumulates. When `continue === false`, the algorithm stops and returns `levels.join(',')`.

### Role in the ISNCSCI algorithm

- Motor level is reported separately for left and right sides.
- It feeds into neurological level of injury (NLI) and AIS classification.
- The `variable` flag (indicated by `*`) tracks whether any level had variable or non-testable values that affect interpretation.
- VAC (Voluntary Anal Contraction) affects whether S3 and INT appear in the motor level result when the algorithm reaches S4_5.

### Key inputs and final outputs

| Input  | Type                | Description                                          |
| ------ | ------------------- | ---------------------------------------------------- |
| `side` | `ExamSide`          | Exam data (lightTouch, pinPrick, motor) for one side |
| `vac`  | `BinaryObservation` | Voluntary Anal Contraction: 'No', 'NT', or 'Yes'     |

| Output      | Type     | Description                                                         |
| ----------- | -------- | ------------------------------------------------------------------- |
| Motor level | `string` | Comma-separated levels (e.g. `"C5"`, `"T3*"`, `"S3,INT"`, `"INT*"`) |

---

## 2. List of Steps (in order)

1. **initializeMotorLevelIteration** – Set up state: levels array, variable flag, current index; start at C1.
2. **checkLevel** – For current level, dispatch to the appropriate check (sensory, before key muscles, motor, end of key muscles, or VAC); add level if indicated; update variable; continue or stop.

---

## 3. Step Definitions

### Step 1: initializeMotorLevelIteration

| Field           | Description                                                                          |
| --------------- | ------------------------------------------------------------------------------------ |
| **name**        | `initializeMotorLevelIteration`                                                      |
| **purpose**     | Initialize state for motor level calculation: empty levels, variable=false, index=0. |
| **inputs**      | `state.side`, `state.vac`                                                            |
| **outputs**     | `state.levels`, `state.variable`, `state.currentIndex`                               |
| **explanation** | "Initialize motor level calculation. Iterate from C1 toward S4_5."                   |

**Logic:**

- `levels = []`
- `variable = false`
- `currentIndex = 0` (first level is C1)
- `next = checkLevel`

---

### Step 2: checkLevel

| Field           | Description                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| **name**        | `checkLevel`                                                                                                         |
| **purpose**     | For the current level, dispatch to the appropriate check; add level if indicated; update variable; continue or stop. |
| **inputs**      | `state.side`, `state.vac`, `state.levels`, `state.variable`, `state.currentIndex`                                    |
| **outputs**     | `state.levels`, `state.variable`, `state.currentIndex`, `state.next`                                                 |
| **explanation** | "Check motor/sensory function at {{levelName}}." (Params vary by check type.)                                        |

**Logic:**

- `level = SensoryLevels[currentIndex]`
- `nextLevel = SensoryLevels[currentIndex + 1]`

**Dispatch by level category:**

| Condition            | Check used                                                              | Notes                                             |
| -------------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| C1–C3, T2–T12, S2–S3 | `checkSensoryLevel(side, level, nextLevel, variable)`                   | Sensory regions; no key muscles.                  |
| C4                   | `checkMotorLevelBeforeStartOfKeyMuscles(side, 'C4', 'C5', variable)`    | Before cervical key muscles.                      |
| L1                   | `checkMotorLevelBeforeStartOfKeyMuscles(side, 'L1', 'L2', variable)`    | Before lumbar key muscles.                        |
| C5–C8                | `checkMotorLevel(side, MotorLevels[i-4], MotorLevels[i-3], variable)`   | Key motor; map SensoryLevel index to MotorLevels. |
| L2–L5                | `checkMotorLevel(side, MotorLevels[i-16], MotorLevels[i-15], variable)` | Key motor; map SensoryLevel index to MotorLevels. |
| T1                   | `checkMotorLevelAtEndOfKeyMuscles(side, 'T1', variable)`                | End of cervical key muscles; uses sensory C5–T1.  |
| S1                   | `checkMotorLevelAtEndOfKeyMuscles(side, 'S1', variable)`                | End of lumbar key muscles; uses sensory L2–S1.    |
| S4_5                 | VAC handling (see below)                                                | Past S1; add S3 and/or INT based on VAC.          |

**VAC handling (when level is S4_5):**

| VAC | Condition            | Result                                                                                                               |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| No  | S3 already in levels | `{ continue: false }` — stop, do not add level                                                                       |
| No  | S3 not in levels     | `{ continue: false, level: 'S3' + (variable ? '*' : ''), variable }`                                                 |
| NT  | S3 already in levels | `{ continue: false, level: 'INT' + (variable ? '*' : ''), variable }`                                                |
| NT  | S3 not in levels     | Push `'S3' + (variable ? '*' : '')` to levels; `{ continue: false, level: 'INT' + (variable ? '*' : ''), variable }` |
| Yes | —                    | `{ continue: false, level: 'INT' + (variable ? '*' : ''), variable }`                                                |

**After any check:**

- `variable = variable || result.variable`
- If `result.level` → push `result.level` to levels
- If `result.continue`:
  - `currentIndex++`
  - `next = checkLevel`
- Else:
  - `next = null` (stop)

---

## 4. Check Functions (Preserved)

### checkSensoryLevel

Used for C1–C3, T2–T12, S2–S3. Returns `CheckLevelResult`. See `sensoryLevel.ts` and `sensoryLevel-architecture.md`.

### checkMotorLevelBeforeStartOfKeyMuscles

`checkMotorLevelBeforeStartOfKeyMuscles(side, level, nextLevel, variable)` where level is 'C4' or 'L1', nextLevel is 'C5' or 'L2'.

| Condition                                      | Result                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| nextLevel motor in ['0','1','2']               | `{ continue: false, level: level + (variable ? '*' : ''), variable }` |
| nextLevel motor in ['0*','1*','2*','NT','NT*'] | `{ continue: true, level: level + (variable ? '*' : ''), variable }`  |
| nextLevel motor in ['0**','1**','2**']         | `{ continue: true, variable: true }`                                  |
| Else                                           | `{ continue: true, variable }`                                        |

### checkMotorLevel

`checkMotorLevel(side, level, nextLevel, variable)` where level and nextLevel are MotorLevels (e.g. C5–C8, L2–S1).

- Throws if current level motor is ['0','1','2'] (impaired).
- Returns `CheckLevelResult` with complex branching based on motor grades. See `motorLevel.ts` lines 5–44.

### checkMotorLevelAtEndOfKeyMuscles

`checkMotorLevelAtEndOfKeyMuscles(side, level, variable)` where level is 'T1' or 'S1'.

- Throws if current level motor is ['0','1','2'].
- Internally calls `checkMotorLevelUsingSensoryValues` (C5–T1 for T1, L2–S1 for S1) then `checkWithSensoryCheckLevelResult`.

---

## 5. State Type Definition

```typescript
export type MotorLevelState = {
  side: ExamSide;
  vac: BinaryObservation;
  levels: string[];
  variable: boolean;
  currentIndex: number;
};
```

---

## 6. Step Handler Signatures and Chain Flow

```typescript
export type MotorLevelStepHandler = StepHandler<MotorLevelState>;
export type MotorLevelStep = Step<MotorLevelState>;

// Step 1: Entry point
function initializeMotorLevelIteration(state: MotorLevelState): MotorLevelStep;

// Step 2: Iteration (may chain to itself or stop)
function checkLevel(state: MotorLevelState): MotorLevelStep;
```

**Chain flow:**

```
initializeMotorLevelIteration
    → checkLevel (currentIndex=0)
        → checkLevel (currentIndex=1) | ... | null
```

The `checkLevel` step either:

- Sets `next = checkLevel` and increments `currentIndex` when `result.continue` is true, or
- Sets `next = null` when `result.continue` is false.

---

## 7. Main Entry and Generator

```typescript
export function determineMotorLevel(
  side: ExamSide,
  vac: BinaryObservation,
): string {
  const initialState = getInitialState(side, vac);
  let step = initializeMotorLevelIteration(initialState);
  while (step.next) {
    step = step.next(step.state);
  }
  return step.state.levels.join(',');
}

export function* motorLevelSteps(
  side: ExamSide,
  vac: BinaryObservation,
): Generator<MotorLevelStep> {
  const initialState = getInitialState(side, vac);
  let step = initializeMotorLevelIteration(initialState);
  yield step;
  while (step.next) {
    step = step.next(step.state);
    yield step;
  }
}
```

---

## 8. Proposed Folder/File Structure

```
src/classification/neurologicalLevels/
├── motorLevel.ts           # Main entry, step chain, check functions
├── motorLevelErrors.ts     # Error types and messages (optional)
├── motorLevel.spec.ts      # Tests
└── (existing: sensoryLevel.ts, etc.)
```

### Shared vs module-specific

| Item                | Location          | Rationale                    |
| ------------------- | ----------------- | ---------------------------- |
| `Step` type         | `common/step.ts`  | Reusable                     |
| `StepHandler<S>`    | `common/step.ts`  | Generic handler              |
| `createStep`        | `common/step.ts`  | Shared helper                |
| `CheckLevelResult`  | `common.ts`       | Already shared               |
| `checkSensoryLevel` | `sensoryLevel.ts` | Imported for sensory regions |
| `levelIsBetween`    | `common.ts`       | Helper for dispatch logic    |
| `MotorLevelState`   | `motorLevel.ts`   | Motor-level-specific state   |

---

## 9. Proposed Translation Keys (to add to `en.ts`)

```typescript
// Motor Level
motorLevelInitializeMotorLevelIterationDescription:
  'Initialize motor level calculation. Iterate from C1 toward S4_5.',
motorLevelInitializeMotorLevelIterationAction:
  'Set levels to empty, variable to false.',

motorLevelCheckLevelDescription:
  'Check motor/sensory function at {{levelName}}.',
motorLevelCheckLevelSensoryRegionAction:
  'Sensory region. Evaluate using light touch and pin prick.',
motorLevelCheckLevelBeforeKeyMusclesAction:
  'Before key muscles. Evaluate using next key muscle ({{nextLevel}}).',
motorLevelCheckLevelKeyMotorAction:
  'Key motor region. Evaluate using motor grade at {{levelName}} and {{nextLevel}}.',
motorLevelCheckLevelEndOfKeyMusclesAction:
  'End of key muscles. Evaluate using motor at {{levelName}} and sensory below.',
motorLevelCheckLevelVACNoAction:
  'VAC is No. Add S3 if not present and stop.',
motorLevelCheckLevelVACNTAction:
  'VAC is NT. Add S3 and INT as needed.',
motorLevelCheckLevelVACYesAction:
  'VAC is Yes. Add INT and stop.',
motorLevelCheckLevelContinueAction:
  'Continue to next level.',
motorLevelCheckLevelStopAction:
  'Add {{levelName}} and stop.',
```

---

## 10. Error Handling

The current check functions throw in these cases:

1. **checkMotorLevel**: Current level motor is ['0','1','2'] → "Invalid motor value at current level"
2. **checkMotorLevelAtEndOfKeyMuscles**: Same as above for T1 or S1
3. **checkSensoryLevel**: `nextLevel === 'C1'` → invalid arguments (via SensoryLevelError)

Proposed error module (optional, for consistency):

```typescript
// motorLevelErrors.ts
export const MOTOR_LEVEL_ERROR_MESSAGES = {
  INVALID_MOTOR_VALUE: 'Invalid motor value at current level',
} as const;

export class MotorLevelError extends Error { ... }
```

---

## 11. Algorithm Fidelity

This architecture preserves the existing `determineMotorLevel` and all check function behavior:

- Same iteration order (C1 → C2 → … → S4_5).
- Same dispatch logic: sensory regions, before key muscles, key motor, end of key muscles, VAC.
- Same `checkSensoryLevel`, `checkMotorLevelBeforeStartOfKeyMuscles`, `checkMotorLevel`, `checkMotorLevelAtEndOfKeyMuscles` logic.
- Same `variable` accumulation (`variable = variable || !!result.variable`).
- Same VAC handling: No (add S3 or break), NT (add S3 and/or INT), Yes (add INT).
- Same output format: comma-separated string of levels.
- Same MotorLevels index mapping for C5–C8 (i-4) and L2–L5 (i-16).

No algorithm behavior is modified; only the control flow is expressed as an explicit step chain.
