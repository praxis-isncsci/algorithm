# Sensory ZPP Step-Based Architecture

**Author:** ISNCSCI Architect Agent  
**Date:** 2025-02-17  
**Status:** Architecture proposal for refactor

---

## 1. High-Level Overview

### What the module computes

The **Sensory Zone of Partial Preservation (Sensory ZPP)** identifies the most caudal segment with preserved sensory function (light touch and pin prick) when sacral sparing is absent or not testable. It answers: _"What is the lowest level with any preserved sensation?"_

### Role in the ISNCSCI algorithm

- Sensory ZPP is reported when **Deep Anal Pressure (DAP)** is `No` or `NT` and S4-5 sensory values indicate absent sensation.
- When DAP is `Yes` or when S4-5 has preserved sensation, Sensory ZPP is `NA`.
- The algorithm iterates from S3 down to C1, checking each level for preserved sensory function until it finds the caudal boundary.

### Key inputs and final outputs

| Input              | Type                | Description                                   |
| ------------------ | ------------------- | --------------------------------------------- |
| `side`             | `ExamSide`          | Exam data (lightTouch, pinPrick) for one side |
| `deepAnalPressure` | `BinaryObservation` | DAP: `Yes`, `No`, or `NT`                     |

| Output      | Type     | Description                                                   |
| ----------- | -------- | ------------------------------------------------------------- |
| Sensory ZPP | `string` | Comma-separated levels (e.g. `"S3,S2,S1"`, `"NA"`, `"NA,S3"`) |

---

## 2. List of Steps (in order)

1. **checkIfSensoryZPPIsApplicable** – Gate: return NA immediately if DAP is Yes or S4-5 has preserved sensation.
2. **checkSacralLevel** – Evaluate S4-5; optionally add NA to zpp based on DAP and sacral result.
3. **getTopAndBottomLevelsForCheck** – Set up iteration range (S3 down to C1) and initialize current level.
4. **checkLevel** – For each level, run sensory check; add level to zpp, update variable flag, continue or stop.
5. **sortSensoryZPP** – Sort results with NA first if present; final step.

---

## 3. Step Definitions

### Step 1: checkIfSensoryZPPIsApplicable

| Field           | Description                                                                          |
| --------------- | ------------------------------------------------------------------------------------ |
| **name**        | `checkIfSensoryZPPIsApplicable`                                                      |
| **purpose**     | Determine if Sensory ZPP applies or if we return `NA` immediately.                   |
| **inputs**      | `state.deepAnalPressure`, `state.side.lightTouch.S4_5`, `state.side.pinPrick.S4_5`   |
| **outputs**     | `state.zpp` (empty or `['NA']`), `state.next`                                        |
| **explanation** | "Check if Deep Anal Pressure and S4-5 sensory values allow Sensory ZPP calculation." |

**Logic:**

- If DAP is `Yes` → `zpp = ['NA']`, `next = null` (stop).
- If DAP is `No` or `NT` and either S4-5 LT or PP is _not_ `canBeAbsentSensory` → `zpp = ['NA']`, `next = null` (stop).
- Else → `zpp = []`, `variable = false`, `next = checkSacralLevel`.

---

### Step 2: checkSacralLevel

| Field           | Description                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **name**        | `checkSacralLevel`                                                                                                              |
| **purpose**     | Evaluate S4-5 with `checkLevelForSensoryZPP`; add NA to zpp when DAP is NT or when DAP is No and sacral result indicates NA.    |
| **inputs**      | `state.side`, `state.deepAnalPressure`, `state.variable`                                                                        |
| **outputs**     | `state.zpp` (variable unchanged; sacral result not propagated)                                                                  |
| **explanation** | "Evaluate S4-5 sensory values. Add NA to Sensory ZPP when DAP is NT or when DAP is No and sacral sparing is absent or partial." |

**Logic:**

- Call `checkLevelForSensoryZPP(side, 'S4_5', variable)`.
- If DAP is `NT` → push `'NA'` to zpp.
- If DAP is `No` and (`!sacralResult.continue` or `sacralResult.level !== undefined`) → push `'NA'` to zpp.
- Do **not** propagate `sacralResult.variable`; keep `variable` unchanged (original did not pass sacral variable into S3→C1 loop).
- `next = getTopAndBottomLevelsForCheck`.

---

### Step 3: getTopAndBottomLevelsForCheck

| Field           | Description                                                                              |
| --------------- | ---------------------------------------------------------------------------------------- |
| **name**        | `getTopAndBottomLevelsForCheck`                                                          |
| **purpose**     | Define iteration range (S3 → C1) and set `currentLevel` to S3.                           |
| **inputs**      | `state.side`                                                                             |
| **outputs**     | `state.topLevel`, `state.bottomLevel`, `state.currentLevel`                              |
| **explanation** | "Set the search range from S3 (top) to C1 (bottom). We will iterate from S3 down to C1." |

**Logic:**

- `topLevel` = S3, `bottomLevel` = C1.
- Build a chain of sensory-only levels (no motor) from S3 down to C1.
- `currentLevel = topLevel` (S3).
- `next = checkLevel`.

---

### Step 4: checkLevel

| Field           | Description                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| **name**        | `checkLevel`                                                                                                     |
| **purpose**     | For the current level, run `checkLevelForSensoryZPP`; add level to zpp if indicated; continue or stop iteration. |
| **inputs**      | `state.currentLevel`, `state.side`, `state.variable`, `state.zpp`                                                |
| **outputs**     | `state.zpp`, `state.variable`, `state.currentLevel`, `state.next`                                                |
| **explanation** | "Check sensory function at {{levelName}} (LT: {{lightTouch}}, PP: {{pinPrick}})."                                |

**Logic:**

- If `currentLevel` is C1 → add C1 to zpp (per ISNCSCI: C1 is always added when iteration completes), `next = sortSensoryZPP`.
- Else:
  - Call `checkLevelForSensoryZPP(side, currentLevel.name, variable)`.
  - `variable = variable || result.variable`.
  - If `result.level` → push/append `result.level` to zpp.
  - If `result.continue` → advance `currentLevel` to next level down (S3→S2→…→C2), `next = checkLevel`.
  - If `!result.continue` → sensory boundary found; do **not** add C1; `next = sortSensoryZPP`.
- Advance: `currentLevel` becomes the next level down (e.g. S3 → S2 → … → C2 → C1).

---

### Step 5: sortSensoryZPP

| Field           | Description                                                            |
| --------------- | ---------------------------------------------------------------------- |
| **name**        | `sortSensoryZPP`                                                       |
| **purpose**     | Sort zpp so NA is first (if present); then by level order. Final step. |
| **inputs**      | `state.zpp`                                                            |
| **outputs**     | `state.zpp`                                                            |
| **explanation** | "Sort Sensory ZPP. Ensure NA is placed first if present."              |

**Logic:**

- Same as `sortMotorZPP`: NA first, then levels by SensoryLevels index.
- `next = null`.

---

## 4. Proposed Folder/File Structure

```
src/classification/
├── common/
│   ├── step.ts                    # Shared Step, StepHandler, createStep
│   └── index.ts
├── zoneOfPartialPreservation/
│   ├── motorZPP.ts                # Uses shared Step/StepHandler
│   ├── motorZPPErrors.ts
│   ├── motorZPP.spec.ts
│   ├── sensoryZPP.ts              # Main entry, step chain
│   ├── sensoryZPPErrors.ts        # Error types and messages
│   ├── sensoryZPP.spec.ts
│   └── sensoryZPPSupport.ts       # checkLevelForSensoryZPP, buildSensoryLevelChain, etc.
```

### Shared vs module-specific

| Item                      | Location                                  | Rationale                                            |
| ------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `Step` type               | `common/step.ts`                          | Reusable across motorZPP, sensoryZPP, future modules |
| `StepHandler<S>`          | `common/step.ts`                          | Generic handler `(state: S) => Step<S>`              |
| `createStep`              | `common/step.ts`                          | Shared helper                                        |
| `State`                   | `sensoryZPP.ts`                           | Sensory-specific state shape                         |
| `checkLevelForSensoryZPP` | `sensoryZPPSupport.ts` or `sensoryZPP.ts` | Pure support; keep in sensory module                 |

---

## 5. Shared Interfaces

### 5.1 Common step module (`common/step.ts`)

```typescript
import { Translation } from '../common';

export type StepDescription = {
  key: Translation;
  params?: { [key: string]: string };
};
export type StepAction = {
  key: Translation;
  params?: { [key: string]: string };
};

export type Step<S = unknown> = {
  description: StepDescription;
  actions: StepAction[];
  next: StepHandler<S> | null;
  state: S;
};

export type StepHandler<S> = (state: S) => Step<S>;

export function createStep<S>(
  description: Step<S>['description'],
  actions: Step<S>['actions'],
  state: S,
  updates: Partial<S>,
  next: Step<S>['next'],
): Step<S> {
  return {
    description,
    actions,
    state: { ...state, ...updates },
    next,
  };
}
```

### 5.2 Sensory ZPP state

```typescript
export type SensoryZPPState = {
  side: ExamSide;
  deepAnalPressure: BinaryObservation;
  zpp: string[];
  variable: boolean;
  topLevel: SensoryLevelNode | null;
  bottomLevel: SensoryLevelNode | null;
  currentLevel: SensoryLevelNode | null;
};

export type SensoryLevelNode = {
  name: SensoryLevel;
  lightTouch: SensoryPointValue;
  pinPrick: SensoryPointValue;
  index: number;
  next: SensoryLevelNode | null; // next level down (e.g. S3 → S2)
  previous: SensoryLevelNode | null;
};
```

### 5.3 Sensory ZPP errors

```typescript
// sensoryZPPErrors.ts
export const SENSORY_ZPP_ERROR_MESSAGES = {
  CHECK_LEVEL_C1_INVALID: 'checkLevelForSensoryZPP :: invalid argument level: C1',
  CURRENT_LEVEL_REQUIRED: 'checkLevel :: state.currentLevel is required.',
} as const;

export class SensoryZPPError extends Error { ... }
```

---

## 6. Reusability: Step and StepHandler

### Current motorZPP usage

- `Step` and `StepHandler` are defined locally in `motorZPP.ts`.
- `createStep` is a local helper.

### Proposed refactor

1. **Extract** `Step`, `StepHandler`, and `createStep` to `src/classification/common/step.ts`.
2. **Make generic** so `Step<S>` and `StepHandler<S>` work with any state type.
3. **Update motorZPP** to import from `common/step.ts` and use `Step<State>`, `StepHandler<State>`.
4. **Implement sensoryZPP** using the same `Step<SensoryZPPState>` and `StepHandler<SensoryZPPState>`.

### Migration order

1. Create `common/step.ts` with generic types.
2. Refactor `motorZPP.ts` to use shared types (no behavior change).
3. Implement `sensoryZPP.ts` with step-based architecture.
4. Add `sensoryZPPErrors.ts` and translation keys.
5. Migrate `sensoryZPP.spec.ts` to cover step chain and `sensoryZPPSteps` generator.

### 5.4 Generator for step-by-step execution

Mirror `motorZPPSteps`:

```typescript
export function* sensoryZPPSteps(
  side: ExamSide,
  deepAnalPressure: BinaryObservation,
): Generator<Step<SensoryZPPState>> {
  const initialState = getInitialState(side, deepAnalPressure);
  let step = checkIfSensoryZPPIsApplicable(initialState);
  yield step;
  while (step.next) {
    step = step.next(step.state);
    yield step;
  }
}
```

---

## 7. Translation Keys (to add to `en.ts`)

```typescript
// Sensory ZPP
sensoryZPPCheckIfSensoryZPPIsApplicableDescription: 'Check if Deep Anal Pressure and S4-5 allow Sensory ZPP calculation.',
sensoryZPPCheckIfSensoryZPPIsApplicableYesAction: 'DAP is "Yes". Sensory ZPP is "NA".',
sensoryZPPCheckIfSensoryZPPIsApplicableS4_5PreservedAction: 'S4-5 has preserved sensation. Sensory ZPP is "NA".',
sensoryZPPCheckIfSensoryZPPIsApplicableProceedAction: 'DAP is "No" or "NT" and S4-5 sensation is absent. Proceed to evaluate sacral level.',
sensoryZPPCheckSacralLevelDescription: 'Evaluate S4-5 sensory values.',
sensoryZPPCheckSacralLevelAddNAAction: 'Add "NA" to Sensory ZPP based on DAP and sacral result.',
sensoryZPPCheckSacralLevelNoNAAction: 'Do not add "NA". Proceed to iterate levels.',
sensoryZPPGetTopAndBottomLevelsForCheckDescription: 'Set search range from S3 to C1.',
sensoryZPPGetTopAndBottomLevelsForCheckRangeAction: 'Range: {{top}} (top) to {{bottom}} (bottom).',
sensoryZPPCheckLevelDescription: 'Check sensory function at {{levelName}} (LT: {{lightTouch}}, PP: {{pinPrick}}).',
sensoryZPPCheckLevelAddLevelAction: 'Add {{levelName}} to Sensory ZPP.',
sensoryZPPCheckLevelContinueAction: 'Continue to next level.',
sensoryZPPCheckLevelStopAction: 'Sensory function boundary found. Stop iteration.',
sensoryZPPCheckLevelReachedC1Action: 'Reached C1. Add C1 and complete.',
sensoryZPPSortSensoryZPPDescription: 'Sort Sensory ZPP.',
sensoryZPPSortSensoryZPPEnsureNAIsPlacedFirstAction: 'Ensure "NA" is placed first.',
```

---

## 8. Algorithm Fidelity

This architecture preserves the existing `determineSensoryZPP` and `checkLevelForSensoryZPP` behavior:

- Same conditions for returning `NA`.
- Same iteration order (S3 down to C1).
- Same `checkLevelForSensoryZPP` logic (continue, level, variable).
- Same sort order (NA first, then levels by index).

No algorithm behavior is modified; only the control flow is expressed as an explicit step chain.
