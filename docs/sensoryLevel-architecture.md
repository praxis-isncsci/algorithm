# Sensory Level Step-Based Architecture

**Author:** ISNCSCI Architect Agent  
**Date:** 2025-02-18  
**Status:** Architecture proposal for refactor

---

## 1. High-Level Overview

### What the module computes

The **Sensory Level** identifies the most caudal dermatome on each side with normal sensation (light touch and pin prick). It answers: _"What is the lowest level with intact sensation?"_

The algorithm iterates from C1 toward S4_5, checking each level against the next. When the next level shows abnormal sensation, the current level is recorded as the sensory level. When the end of the dermatome series (S4_5) is reached without finding abnormality, the result is `INT` (intact).

### Role in the ISNCSCI algorithm

- Sensory level is reported separately for left and right sides.
- It feeds into neurological level of injury (NLI) and AIS classification.
- The `variable` flag (indicated by `*`) tracks whether any level in the chain had variable or non-testable values that affect interpretation.

### Key inputs and final outputs

| Input  | Type       | Description                                   |
| ------ | ---------- | --------------------------------------------- |
| `side` | `ExamSide` | Exam data (lightTouch, pinPrick) for one side |

| Output        | Type     | Description                                                      |
| ------------- | -------- | ---------------------------------------------------------------- |
| Sensory level | `string` | Comma-separated levels (e.g. `"C5"`, `"T3*"`, `"INT"`, `"INT*"`) |

---

## 2. List of Steps (in order)

1. **initializeSensoryLevelIteration** – Set up state: levels array, variable flag, current index; start at C1.
2. **checkLevel** – For current level, call `checkSensoryLevel` with next level; add level if indicated; update variable; continue or stop.
3. **addIntactAndComplete** – When iteration reaches S4_5 (no next level), add `INT` or `INT*`; final step.

---

## 3. Step Definitions

### Step 1: initializeSensoryLevelIteration

| Field           | Description                                                                            |
| --------------- | -------------------------------------------------------------------------------------- |
| **name**        | `initializeSensoryLevelIteration`                                                      |
| **purpose**     | Initialize state for sensory level calculation: empty levels, variable=false, index=0. |
| **inputs**      | `state.side`                                                                           |
| **outputs**     | `state.levels`, `state.variable`, `state.currentIndex`                                 |
| **explanation** | "Initialize sensory level calculation. Iterate from C1 toward S4_5."                   |

**Logic:**

- `levels = []`
- `variable = false`
- `currentIndex = 0` (first level is C1)
- `next = checkLevel`

---

### Step 2: checkLevel

| Field           | Description                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| **name**        | `checkLevel`                                                                                                      |
| **purpose**     | For the current level, evaluate the next level via `checkSensoryLevel`; add level if indicated; continue or stop. |
| **inputs**      | `state.side`, `state.levels`, `state.variable`, `state.currentIndex`                                              |
| **outputs**     | `state.levels`, `state.variable`, `state.currentIndex`, `state.next`                                              |
| **explanation** | "Check sensory function at {{levelName}} (LT: {{lightTouch}}, PP: {{pinPrick}})."                                 |

**Logic:**

- `level = SensoryLevels[currentIndex]`
- `nextLevel = SensoryLevels[currentIndex + 1]`

- **If `nextLevel` is undefined** (reached S4_5):
  - Push `'INT' + (variable ? '*' : '')` to levels
  - `next = null` (stop)

- **Else** (nextLevel exists):
  - `result = checkSensoryLevel(side, level, nextLevel, variable)`
  - `variable = variable || !!result.variable`
  - If `result.level` → push `result.level` to levels
  - If `result.continue`:
    - `currentIndex++`
    - `next = checkLevel`
  - Else:
    - `next = null` (stop)

---

### Step 3: addIntactAndComplete

| Field           | Description                                                                     |
| --------------- | ------------------------------------------------------------------------------- |
| **name**        | `addIntactAndComplete`                                                          |
| **purpose**     | Add INT (or INT\*) when iteration reaches the end of SensoryLevels; final step. |
| **inputs**      | `state.levels`, `state.variable`                                                |
| **outputs**     | `state.levels`                                                                  |
| **explanation** | "Reached S4_5. Add INT to sensory level."                                       |

**Note:** This step is reached only when `checkLevel` detects `nextLevel === undefined`. The logic is embedded in `checkLevel`; the step name documents the action. Alternatively, this can be a separate step that `checkLevel` chains to when the end is reached. For consistency with the current single-loop structure, the architecture keeps this logic inside `checkLevel` and documents it as a conceptual step.

---

## 4. checkSensoryLevel Logic (Preserved)

`checkSensoryLevel(side, level, nextLevel, variable)` returns `SensoryLevelCheckResult`, which extends `CheckLevelResult` with a `branch` property. The `branch` identifies which action key to use in the step-based UI (e.g. `sensoryLevelCheckLevelBothNormalAction`, `sensoryLevelCheckLevelAbnormalAction`). It evaluates LT and PP at **nextLevel** (not at level).

| Condition                                                                 | Result                                                                     | Branch          |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------- |
| `nextLevel === 'C1'`                                                      | Throw: invalid arguments                                                   | —               |
| LT and PP both `'2'`                                                      | `{ continue: true, variable }`                                             | `bothNormal`    |
| Either LT or PP is abnormal (`0`, `1`, `0*`, `1*`)                        | `{ continue: false, level: level + (variable ? '*' : ''), variable }`      | `abnormal`      |
| Either LT or PP is `'NT*'`                                                | `{ continue: false, level: level + '*', variable: true }`                  | `ntStar`        |
| LT or PP is `'NT'` and either is NTVariableSensory (`0**`, `1**`)         | `{ continue: true, level: level + (variable ? '*' : ''), variable: true }` | `ntVariable`    |
| LT or PP is `'NT'` and either is NTNotVariableSensory (`2`, `NT`, `NT**`) | `{ continue: true, level: level + (variable ? '*' : ''), variable }`       | `ntNotVariable` |
| LT or PP is `'NT'` and neither branch matches                             | Throw                                                                      | —               |
| Else (e.g. `0**`, `1**`, `NT**` without `NT`)                             | `{ continue: true, variable: true }`                                       | `otherVariable` |

---

## 5. State Type Definition

```typescript
export type SensoryLevelState = {
  side: ExamSide;
  levels: string[];
  variable: boolean;
  currentIndex: number;
};
```

---

## 6. Step Handler Signatures and Chain Flow

```typescript
export type SensoryLevelStepHandler = StepHandler<SensoryLevelState>;
export type SensoryLevelStep = Step<SensoryLevelState>;

// Step 1: Entry point
function initializeSensoryLevelIteration(
  state: SensoryLevelState,
): SensoryLevelStep;

// Step 2: Iteration (may chain to itself or stop)
function checkLevel(state: SensoryLevelState): SensoryLevelStep;
```

**Chain flow:**

```
initializeSensoryLevelIteration
    → checkLevel (currentIndex=0)
        → checkLevel (currentIndex=1) | ... | null
```

The `checkLevel` step either:

- Sets `next = checkLevel` and increments `currentIndex` when `result.continue` is true, or
- Sets `next = null` when `result.continue` is false or when `nextLevel` is undefined.

---

## 7. Main Entry and Generator

```typescript
export function determineSensoryLevel(side: ExamSide): string {
  const initialState = getInitialState(side);
  let step = initializeSensoryLevelIteration(initialState);
  while (step.next) {
    step = step.next(step.state);
  }
  return step.state.levels.join(',');
}

export function* sensoryLevelSteps(
  side: ExamSide,
): Generator<SensoryLevelStep> {
  const initialState = getInitialState(side);
  let step = initializeSensoryLevelIteration(initialState);
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
├── sensoryLevel.ts           # Main entry, step chain, checkSensoryLevel
├── sensoryLevelErrors.ts      # Error types and messages (optional)
├── sensoryLevel.spec.ts      # Tests
└── (sensoryLevelSupport.ts)  # Optional: extract checkSensoryLevel helpers
```

### Shared vs module-specific

| Item                      | Location                     | Rationale                              |
| ------------------------- | ---------------------------- | -------------------------------------- |
| `Step` type               | `common/step.ts`             | Reusable                               |
| `StepHandler<S>`          | `common/step.ts`             | Generic handler                        |
| `createStep`              | `common/step.ts`             | Shared helper                          |
| `CheckLevelResult`        | `common.ts`                  | Already shared                         |
| `SensoryLevelCheckResult` | `sensoryLevel.ts`            | Extends CheckLevelResult with branch   |
| `CheckLevelActionBranch`  | `sensoryLevel.ts`            | Branch union for step action lookup    |
| `checkSensoryLevel`       | `sensoryLevel.ts` or support | Pure function; preserve exact behavior |
| `State`                   | `sensoryLevel.ts`            | Sensory-level-specific state           |

---

## 9. Translation Keys (to add to `en.ts`)

```typescript
// Sensory Level
sensoryLevelInitializeSensoryLevelIterationDescription: 'Initialize sensory level calculation. Iterate from C1 toward S4_5.',
sensoryLevelInitializeSensoryLevelIterationAction: 'Set levels to empty, variable to false.',

sensoryLevelCheckLevelDescription: 'Check sensory function at {{levelName}} (LT: {{lightTouch}}, PP: {{pinPrick}}).',
sensoryLevelCheckLevelBothNormalAction: 'LT and PP both normal. Continue to next level.',
sensoryLevelCheckLevelAbnormalAction: 'Abnormal sensation at next level. Add {{levelName}} and stop.',
sensoryLevelCheckLevelNTStarAction: 'NT* at next level. Add {{levelName}}* and stop.',
sensoryLevelCheckLevelNTVariableAction: 'NT with variable sensory. Add level and continue.',
sensoryLevelCheckLevelNTNotVariableAction: 'NT with non-variable sensory. Add level and continue.',
sensoryLevelCheckLevelOtherVariableAction: 'Variable sensory at next level. Continue.',
sensoryLevelCheckLevelReachedEndAction: 'Reached S4_5. Add INT.',
```

---

## 10. Error Handling

The current `checkSensoryLevel` throws in two cases:

1. `nextLevel === 'C1'` → invalid arguments
2. LT or PP is `'NT'` but neither NTVariableSensory nor NTNotVariableSensory matches → empty throw

Proposed error module:

```typescript
// sensoryLevelErrors.ts
export const SENSORY_LEVEL_ERROR_MESSAGES = {
  INVALID_NEXT_LEVEL: 'checkSensoryLevel: invalid arguments level: {{level}} nextLevel: {{nextLevel}}',
  NT_BRANCH_UNMATCHED: 'checkSensoryLevel: NT branch did not match expected values',
} as const;

export class SensoryLevelError extends Error { ... }
```

---

## 11. Algorithm Fidelity

This architecture preserves the existing `determineSensoryLevel` and `checkSensoryLevel` behavior:

- Same iteration order (C1 → C2 → … → S4_5).
- Same `checkSensoryLevel` logic and branching.
- Same `variable` accumulation (`variable = variable || !!result.variable`).
- Same handling of end-of-series: add `INT` or `INT*`.
- Same output format: comma-separated string of levels.
- The `branch` property was added to the return value for step action lookup in the step-based UI; it does not change algorithm behavior.

No algorithm behavior is modified; only the control flow is expressed as an explicit step chain.
