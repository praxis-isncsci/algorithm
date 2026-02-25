# Neurological Level of Injury (NLI) Step-Based Architecture

**Author:** ISNCSCI Architect Agent  
**Date:** 2026-02-25  
**Status:** Architecture proposal for refactor

---

## 1. High-Level Overview

### What the module computes

The **Neurological Level of Injury (NLI)** identifies the most caudal segment with normal sensory and motor function on both sides. It answers: _"What is the lowest level where sensation and motor function are both intact bilaterally?"_

The algorithm iterates through all SensoryLevels from C1 toward S4_5. At each level, it evaluates:

1. **Bilateral sensory function** (left and right sides) using light touch and pin prick
2. **Bilateral motor function** (when applicable) for motor regions:
   - **C4-T1**: Cervical motor region
   - **L1-S1**: Lumbar motor region

For each level, the algorithm determines if the level qualifies as an NLI based on intact function bilaterally. The `variable` flag accumulates across all checks (left sensory, right sensory, left motor, right motor). When iteration completes at S4_5 without stopping early, the result is `INT` (intact).

### Role in the ISNCSCI algorithm

- NLI is a **single value** (not separate for left/right) representing the most caudal level with bilateral intact function.
- It is the **primary measure** reported on the ISNCSCI worksheet.
- NLI feeds into AIS classification and helps clinicians understand the extent of injury.
- Multiple levels can be reported (comma-separated) when they meet the criteria simultaneously.
- The `variable` flag (indicated by `*`) tracks whether any check had variable or non-testable values.

### Key inputs and final outputs

| Input | Type   | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| `exam` | `Exam` | Full exam data (left and right sides, all values) |

| Output | Type     | Description                                                           |
| ------ | -------- | --------------------------------------------------------------------- |
| NLI    | `string` | Comma-separated levels (e.g. `"C5"`, `"T3*"`, `"S3,INT"`, `"INT*"`) |

---

## 2. List of Steps (in order)

1. **initializeNLIIteration** – Set up state: levels list, variable flag, current index; start at C1.
2. **checkLevel** – For current level, evaluate bilateral sensory and motor function (when applicable); add level if criteria met; update variable; continue or stop.
3. **addIntactAndComplete** – When iteration reaches S4_5 without stopping, add `INT` or `INT*`; final step.

---

## 3. Step Definitions

### Step 1: initializeNLIIteration

| Field           | Description                                                                                |
| --------------- | ------------------------------------------------------------------------------------------ |
| **name**        | `initializeNLIIteration`                                                                   |
| **purpose**     | Initialize state for NLI calculation: empty levels list, variable=false, currentIndex=0.   |
| **inputs**      | `state.exam`                                                                               |
| **outputs**     | `state.listOfNLI`, `state.variable`, `state.currentIndex`                                 |
| **explanation** | "Initialize Neurological Level of Injury calculation. Iterate from C1 toward S4_5."       |

**Logic:**

- `listOfNLI = []`
- `variable = false`
- `currentIndex = 0` (first level is C1)
- `next = checkLevel`

---

### Step 2: checkLevel

| Field           | Description                                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **name**        | `checkLevel`                                                                                                                        |
| **purpose**     | For the current level, evaluate bilateral sensory and motor function (when applicable); add level if criteria met; continue or stop. |
| **inputs**      | `state.exam`, `state.listOfNLI`, `state.variable`, `state.currentIndex`                                                             |
| **outputs**     | `state.listOfNLI`, `state.variable`, `state.currentIndex`, `state.next`                                                             |
| **explanation** | "Check neurological level at {{levelName}} (bilateral sensory and motor function)."                                                 |

**Logic:**

- `level = SensoryLevels[currentIndex]`
- `nextLevel = SensoryLevels[currentIndex + 1]`

**Dispatch by level category:**

| Condition                | Check sequence                                                                                                         | Notes                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **C1–C3, T2–T12, S2–S3** | 1. Check left sensory<br>2. Check right sensory<br>3. Combine results via `checkLevelWithoutMotor`                     | Sensory-only regions; no key muscles.               |
| **C4-T1, L1-S1**         | 1. Check left sensory<br>2. Check right sensory<br>3. Combine via `checkLevelWithoutMotor`<br>4. Check motors via `checkLevelWithMotor` | Motor regions; includes bilateral motor evaluation. |
| **S4_5**                 | Add `'INT' + (variable ? '*' : '')` to listOfNLI                                                                        | End of iteration; no next level.                    |

**Check functions used:**

1. **checkSensoryLevel**(side, level, nextLevel, variable) → CheckLevelResult
   - Used for bilateral sensory checks (left and right)
   - Returns `{ continue, level?, variable }`

2. **checkLevelWithoutMotor**(level, leftSensoryResult, rightSensoryResult, variable) → CheckLevelResult
   - Combines left and right sensory results for sensory-only regions
   - Returns combined result with bilateral logic

3. **checkMotorLevel**(side, motorLevel, nextMotorLevel, variable) → CheckLevelResult
   - Used for key motor regions (C5-C8, L2-L5)
   - Returns `{ continue, level?, variable }`

4. **checkMotorLevelBeforeStartOfKeyMuscles**(side, level, nextLevel, variable) → CheckLevelResult
   - Used for C4 and L1 (before key muscles begin)
   - Evaluates next motor level (C5 or L2)

5. **checkLevelWithMotor**(exam, level, sensoryResult, variable) → CheckLevelResult
   - Combines sensory and bilateral motor results for motor regions
   - Handles C4, T1, S1 special cases
   - Returns final result for the level

**Bilateral sensory check logic (checkLevelWithoutMotor):**

```typescript
// Evaluate left and right sensory
leftSensoryResult = checkSensoryLevel(exam.left, level, nextLevel, variable)
rightSensoryResult = checkSensoryLevel(exam.right, level, nextLevel, variable)

// Combine results
if (leftSensoryResult.level || rightSensoryResult.level) {
  if (
    leftSensoryResult.level && rightSensoryResult.level &&
    leftSensoryResult.level.includes('*') && rightSensoryResult.level.includes('*')
  ) {
    resultLevel = level + '*'
  } else {
    resultLevel = level + (variable ? '*' : '')
  }
}

return {
  continue: leftSensoryResult.continue && rightSensoryResult.continue,
  level: resultLevel,
  variable: variable || leftSensoryResult.variable || rightSensoryResult.variable
}
```

**Bilateral motor check logic (checkLevelWithMotor):**

For motor regions (C4-T1 and L1-S1), after combining bilateral sensory results, the algorithm evaluates bilateral motor function:

```typescript
// Map SensoryLevel index to MotorLevel index
const i = SensoryLevels.indexOf(level)
const index = i - (levelIsBetween(i,'C4','T1') ? 4 : 16)
const motorLevel = MotorLevels[index]
const nextMotorLevel = MotorLevels[index + 1]

// Determine check function based on level
if (level === 'C4' || level === 'L1') {
  // Before key muscles: use next motor level
  leftMotorResult = checkMotorLevelBeforeStartOfKeyMuscles(exam.left, level, nextMotorLevel, variable)
  rightMotorResult = checkMotorLevelBeforeStartOfKeyMuscles(exam.right, level, nextMotorLevel, variable)
} else if (level === 'T1' || level === 'S1') {
  // End of key muscles: use current motor level only
  leftMotorResult = checkMotorLevel(exam.left, motorLevel, motorLevel, variable)
  rightMotorResult = checkMotorLevel(exam.right, motorLevel, motorLevel, variable)
} else {
  // Key motor region: use current and next motor levels
  leftMotorResult = checkMotorLevel(exam.left, motorLevel, nextMotorLevel, variable)
  rightMotorResult = checkMotorLevel(exam.right, motorLevel, nextMotorLevel, variable)
}

// Combine motor and sensory results
if (leftMotorResult.level || rightMotorResult.level || sensoryResult.level) {
  if (
    leftMotorResult.level && rightMotorResult.level &&
    (leftMotorResult.level.includes('*') || rightMotorResult.level.includes('*'))
  ) {
    resultLevel = level + '*'
  } else {
    resultLevel = level + (variable ? '*' : '')
  }
}

// Return result (if sensory stopped, propagate that; otherwise use motor continue)
return !sensoryResult.continue
  ? { ...sensoryResult, level: resultLevel }
  : {
      continue: leftMotorResult.continue && rightMotorResult.continue,
      level: resultLevel,
      variable: variable || sensoryResult.variable || leftMotorResult.variable || rightMotorResult.variable
    }
```

**After any check:**

- `variable = variable || result.variable`
- If `result.level` → push `result.level` to listOfNLI
- If `result.continue`:
  - `currentIndex++`
  - `next = checkLevel`
- Else:
  - `next = null` (stop)

**When reaching S4_5 (no nextLevel):**

- Push `'INT' + (variable ? '*' : '')` to listOfNLI
- `next = null` (stop)

---

### Step 3: addIntactAndComplete

| Field           | Description                                                                |
| --------------- | -------------------------------------------------------------------------- |
| **name**        | `addIntactAndComplete`                                                     |
| **purpose**     | Add INT (or INT\*) when iteration completes at S4_5; final step.           |
| **inputs**      | `state.listOfNLI`, `state.variable`                                       |
| **outputs**     | `state.listOfNLI`                                                          |
| **explanation** | "Reached S4_5. All levels have intact bilateral function. Add INT to NLI." |

**Note:** This step is reached when `checkLevel` detects `nextLevel === undefined` at S4_5. The logic is embedded in `checkLevel`; the step name documents the action. This mirrors the pattern used in sensoryLevel and motorLevel.

---

## 4. Check Functions (Preserved)

The following check functions are imported and reused without modification:

### checkSensoryLevel

`checkSensoryLevel(side, level, nextLevel, variable)` from `neurologicalLevels/sensoryLevel.ts`

- Returns `CheckLevelResult`
- Used for bilateral sensory evaluation

### checkMotorLevel

`checkMotorLevel(side, motorLevel, nextMotorLevel, variable)` from `neurologicalLevels/motorLevel.ts`

- Returns `CheckLevelResult`
- Used for key motor regions (C5-C8, L2-L5)
- Throws if current level motor is ['0','1','2']

### checkMotorLevelBeforeStartOfKeyMuscles

`checkMotorLevelBeforeStartOfKeyMuscles(side, level, nextLevel, variable)` from `neurologicalLevels/motorLevel.ts`

- Used for C4 and L1 (before key muscles)
- Evaluates next motor level (C5 or L2)

### checkLevelWithoutMotor

`checkLevelWithoutMotor(level, leftSensoryResult, rightSensoryResult, variable)`

- Combines bilateral sensory results
- Returns combined `CheckLevelResult`

**Logic:**

| Condition                                                   | Result                                            |
| ----------------------------------------------------------- | ------------------------------------------------- |
| Neither left nor right has level                            | `{ continue: left.continue && right.continue, variable: variable \|\| left.variable \|\| right.variable }` |
| Both left and right have level with `*`                     | `{ continue: left.continue && right.continue, level: level + '*', variable }` |
| At least one side has level                                 | `{ continue: left.continue && right.continue, level: level + (variable ? '*' : ''), variable }` |

### checkLevelWithMotor

`checkLevelWithMotor(exam, level, sensoryResult, variable)`

- Combines bilateral sensory and bilateral motor results for motor regions
- Handles special cases:
  - **C4, L1**: Uses `checkMotorLevelBeforeStartOfKeyMuscles` for both sides
  - **C5-C8, L2-L5**: Uses `checkMotorLevel` with current and next motor levels
  - **T1, S1**: Uses `checkMotorLevel` with current motor level only (special case: end of key muscles)

**Logic:**

1. Map SensoryLevel index to MotorLevel index
2. Evaluate left and right motor function based on level type
3. Combine motor results with sensory result:
   - If either motor side has level with `*` → add `*` to result level
   - If sensory already stopped (`!sensoryResult.continue`) → propagate sensory result
   - Otherwise combine motor continue flags

---

## 5. State Type Definition

```typescript
export type NeurologicalLevelOfInjuryState = {
  exam: Exam;
  listOfNLI: string[];
  variable: boolean;
  currentIndex: number;
};
```

---

## 6. Step Handler Signatures and Chain Flow

```typescript
export type NeurologicalLevelOfInjuryStepHandler = StepHandler<NeurologicalLevelOfInjuryState>;
export type NeurologicalLevelOfInjuryStep = Step<NeurologicalLevelOfInjuryState>;

// Step 1: Entry point
function initializeNLIIteration(
  state: NeurologicalLevelOfInjuryState,
): NeurologicalLevelOfInjuryStep;

// Step 2: Iteration (may chain to itself or stop)
function checkLevel(
  state: NeurologicalLevelOfInjuryState,
): NeurologicalLevelOfInjuryStep;
```

**Chain flow:**

```
initializeNLIIteration
    → checkLevel (currentIndex=0)
        → checkLevel (currentIndex=1) | ... | null
```

The `checkLevel` step either:

- Sets `next = checkLevel` and increments `currentIndex` when `result.continue` is true, or
- Sets `next = null` when `result.continue` is false or when `nextLevel` is undefined (reached S4_5).

---

## 7. Main Entry and Generator

```typescript
export function determineNeurologicalLevelOfInjury(exam: Exam): string {
  const initialState = getInitialState(exam);
  let step = initializeNLIIteration(initialState);
  while (step.next) {
    step = step.next(step.state);
  }
  return step.state.listOfNLI.join(',');
}

export function* neurologicalLevelOfInjurySteps(
  exam: Exam,
): Generator<NeurologicalLevelOfInjuryStep> {
  const initialState = getInitialState(exam);
  let step = initializeNLIIteration(initialState);
  yield step;
  while (step.next) {
    step = step.next(step.state);
    yield step;
  }
}
```

**Initial state factory:**

```typescript
export function getInitialState(exam: Exam): NeurologicalLevelOfInjuryState {
  return {
    exam,
    listOfNLI: [],
    variable: false,
    currentIndex: 0,
  };
}
```

---

## 8. Proposed Folder/File Structure

```
src/classification/neurologicalLevelOfInjury/
├── neurologicalLevelOfInjury.ts          # Main entry, step chain
├── neurologicalLevelOfInjuryErrors.ts    # Error types and messages (optional)
├── neurologicalLevelOfInjury.spec.ts     # Tests
└── neurologicalLevelOfInjurySupport.ts   # checkLevelWithoutMotor, checkLevelWithMotor (optional extraction)
```

### Shared vs module-specific

| Item                                      | Location                             | Rationale                                            |
| ----------------------------------------- | ------------------------------------ | ---------------------------------------------------- |
| `Step` type                               | `common/step.ts`                     | Reusable                                             |
| `StepHandler<S>`                          | `common/step.ts`                     | Generic handler                                      |
| `createStep`                              | `common/step.ts`                     | Shared helper                                        |
| `CheckLevelResult`                        | `common.ts`                          | Already shared                                       |
| `checkSensoryLevel`                       | `neurologicalLevels/sensoryLevel.ts` | Imported for bilateral sensory checks                |
| `checkMotorLevel`                         | `neurologicalLevels/motorLevel.ts`   | Imported for bilateral motor checks                  |
| `checkMotorLevelBeforeStartOfKeyMuscles`  | `neurologicalLevels/motorLevel.ts`   | Imported for C4 and L1                               |
| `checkLevelWithoutMotor`                  | `neurologicalLevelOfInjury.ts`       | NLI-specific; combines bilateral sensory             |
| `checkLevelWithMotor`                     | `neurologicalLevelOfInjury.ts`       | NLI-specific; combines sensory and bilateral motor   |
| `levelIsBetween`                          | `common.ts`                          | Helper for dispatch logic                            |
| `NeurologicalLevelOfInjuryState`          | `neurologicalLevelOfInjury.ts`       | NLI-specific state                                   |

---

## 9. Proposed Translation Keys (to add to `en.ts`)

```typescript
// Neurological Level of Injury
neurologicalLevelOfInjuryInitializeNLIIterationDescription:
  'Initialize Neurological Level of Injury calculation. Iterate from C1 toward S4_5.',
neurologicalLevelOfInjuryInitializeNLIIterationAction:
  'Set levels list to empty, variable to false.',

neurologicalLevelOfInjuryCheckLevelDescription:
  'Check neurological level at {{levelName}}.',
neurologicalLevelOfInjuryCheckLevelSensoryOnlyAction:
  'Sensory-only region. Evaluate bilateral sensory function (LT and PP on both sides).',
neurologicalLevelOfInjuryCheckLevelMotorRegionAction:
  'Motor region. Evaluate bilateral sensory and motor function.',
neurologicalLevelOfInjuryCheckLevelLeftSensoryAction:
  'Left sensory: LT={{leftLightTouch}}, PP={{leftPinPrick}}.',
neurologicalLevelOfInjuryCheckLevelRightSensoryAction:
  'Right sensory: LT={{rightLightTouch}}, PP={{rightPinPrick}}.',
neurologicalLevelOfInjuryCheckLevelLeftMotorAction:
  'Left motor at {{motorLevel}}: {{leftMotor}}.',
neurologicalLevelOfInjuryCheckLevelRightMotorAction:
  'Right motor at {{motorLevel}}: {{rightMotor}}.',
neurologicalLevelOfInjuryCheckLevelAddLevelAction:
  'Add {{levelName}} to NLI.',
neurologicalLevelOfInjuryCheckLevelContinueAction:
  'Bilateral function intact. Continue to next level.',
neurologicalLevelOfInjuryCheckLevelStopAction:
  'Bilateral function not intact. Stop iteration.',
neurologicalLevelOfInjuryCheckLevelReachedS4_5Action:
  'Reached S4_5. All levels have intact bilateral function. Add INT.',
```

---

## 10. Error Handling

The current implementation may throw in the following cases (from check functions):

1. **checkMotorLevel**: Current level motor is ['0','1','2'] → "Invalid motor value at current level"
2. **checkSensoryLevel**: `nextLevel === 'C1'` → invalid arguments

Proposed error module (optional, for consistency):

```typescript
// neurologicalLevelOfInjuryErrors.ts
export const NEUROLOGICAL_LEVEL_OF_INJURY_ERROR_MESSAGES = {
  INVALID_MOTOR_VALUE: 'Invalid motor value at current level',
  INVALID_NEXT_LEVEL: 'checkSensoryLevel: invalid arguments level: {{level}} nextLevel: {{nextLevel}}',
  CURRENT_LEVEL_REQUIRED: 'checkLevel :: state.currentIndex out of bounds.',
} as const;

export class NeurologicalLevelOfInjuryError extends Error {
  constructor(
    public code: keyof typeof NEUROLOGICAL_LEVEL_OF_INJURY_ERROR_MESSAGES,
    message?: string,
  ) {
    super(message ?? NEUROLOGICAL_LEVEL_OF_INJURY_ERROR_MESSAGES[code]);
    this.name = 'NeurologicalLevelOfInjuryError';
  }
}
```

---

## 11. Algorithm Fidelity

This architecture preserves the existing `determineNeurologicalLevelOfInjury` behavior:

- **Same iteration order** (C1 → C2 → … → S4_5).
- **Same dispatch logic**: sensory-only regions vs. motor regions.
- **Same bilateral evaluation**:
  - Left and right sensory checks via `checkSensoryLevel`
  - Combined via `checkLevelWithoutMotor` for sensory-only regions
  - Left and right motor checks (when applicable) via `checkMotorLevel` or `checkMotorLevelBeforeStartOfKeyMuscles`
  - Combined via `checkLevelWithMotor` for motor regions
- **Same variable accumulation**: `variable = variable || result.variable` across all checks.
- **Same level addition logic**: Add level when `result.level` is present.
- **Same continuation logic**: Continue when `result.continue` is true; stop when false.
- **Same end-of-series handling**: Add `INT` or `INT*` when reaching S4_5.
- **Same output format**: comma-separated string of levels.

**Key bilateral logic preserved:**

1. **Both sides with `*` indicator** → Add level with `*`
2. **At least one side qualifies** → Add level (with `*` if variable flag is set)
3. **Continue only if both sides continue** → `leftResult.continue && rightResult.continue`
4. **Accumulate variable from all checks** → sensory left, sensory right, motor left, motor right

**Motor region mapping preserved:**

- **C4-T1**: `index = i - 4` (maps SensoryLevel index to MotorLevel index)
- **L1-S1**: `index = i - 16` (maps SensoryLevel index to MotorLevel index)
- **Special cases**: C4, L1 (before key muscles), T1, S1 (end of key muscles)

No algorithm behavior is modified; only the control flow is expressed as an explicit step chain.

---

## 12. Implementation Notes

### Step 2 detailed implementation guidance

The `checkLevel` step handler will contain substantial branching logic. To maintain clarity:

1. **Determine level category** first (sensory-only vs. motor region)
2. **Perform bilateral sensory checks** for all levels
3. **Perform bilateral motor checks** for motor regions only
4. **Combine results** using the bilateral combination functions
5. **Update state** (variable, listOfNLI, currentIndex)
6. **Determine next step** (continue or stop)

**Recommended structure:**

```typescript
function checkLevel(state: NeurologicalLevelOfInjuryState): NeurologicalLevelOfInjuryStep {
  const level = SensoryLevels[state.currentIndex];
  const nextLevel = SensoryLevels[state.currentIndex + 1];
  const i = state.currentIndex;

  // Handle S4_5 (end of iteration)
  if (!nextLevel) {
    return createStep(
      { key: 'neurologicalLevelOfInjuryCheckLevelDescription', params: { levelName: level } },
      [{ key: 'neurologicalLevelOfInjuryCheckLevelReachedS4_5Action' }],
      state,
      {
        listOfNLI: [...state.listOfNLI, 'INT' + (state.variable ? '*' : '')],
      },
      null,
    );
  }

  // Bilateral sensory checks
  const leftSensoryResult = checkSensoryLevel(state.exam.left, level, nextLevel, state.variable);
  const rightSensoryResult = checkSensoryLevel(state.exam.right, level, nextLevel, state.variable);

  let result: CheckLevelResult;
  let checkType: 'sensory' | 'motor';

  // Determine if this is a motor region
  if (levelIsBetween(i, 'C4', 'T1') || levelIsBetween(i, 'L1', 'S1')) {
    checkType = 'motor';
    const sensoryResult = checkLevelWithoutMotor(level, leftSensoryResult, rightSensoryResult, state.variable);
    result = checkLevelWithMotor(state.exam, level, sensoryResult, state.variable);
  } else {
    checkType = 'sensory';
    result = checkLevelWithoutMotor(level, leftSensoryResult, rightSensoryResult, state.variable);
  }

  // Update variable and levels
  const variable = state.variable || result.variable;
  const newLevels = result.level
    ? [...state.listOfNLI, result.level]
    : [...state.listOfNLI];

  // Build description and actions
  const description = {
    key: 'neurologicalLevelOfInjuryCheckLevelDescription' as const,
    params: { levelName: level },
  };

  const actions = [];
  if (checkType === 'sensory') {
    actions.push({ key: 'neurologicalLevelOfInjuryCheckLevelSensoryOnlyAction' as const });
  } else {
    actions.push({ key: 'neurologicalLevelOfInjuryCheckLevelMotorRegionAction' as const });
  }

  if (result.level) {
    actions.push({
      key: 'neurologicalLevelOfInjuryCheckLevelAddLevelAction' as const,
      params: { levelName: result.level },
    });
  }

  if (result.continue) {
    actions.push({ key: 'neurologicalLevelOfInjuryCheckLevelContinueAction' as const });
  } else {
    actions.push({ key: 'neurologicalLevelOfInjuryCheckLevelStopAction' as const });
  }

  // Determine next step
  const next = result.continue ? checkLevel : null;

  return createStep(
    description,
    actions,
    state,
    {
      listOfNLI: newLevels,
      variable,
      currentIndex: result.continue ? state.currentIndex + 1 : state.currentIndex,
    },
    next,
  );
}
```

### Clinician-friendly descriptions

For the step-based UI, each step should provide clear, clinician-friendly descriptions:

- **At sensory-only levels**: "Evaluating bilateral sensory function at C2 (no motor region)"
- **At motor levels**: "Evaluating bilateral sensory and motor function at C5"
- **When adding a level**: "Level C5 added to NLI (bilateral intact function)"
- **When continuing**: "Bilateral function intact at C5. Continue to C6."
- **When stopping**: "Bilateral function not intact at C6. Stop iteration. NLI: C5"
- **At S4_5**: "Reached S4_5. All levels have intact bilateral function. NLI: INT"

### Testing strategy

The refactored module must pass all existing tests without modification. Key test scenarios:

1. **Sensory-only regions**: Verify bilateral sensory checks (C1-C3, T2-T12, S2-S3)
2. **Motor regions**: Verify bilateral sensory and motor checks (C4-T1, L1-S1)
3. **Variable flag accumulation**: Verify `*` propagates from any bilateral check
4. **Special motor cases**: C4, L1 (before key muscles), T1, S1 (end of key muscles)
5. **Multiple levels**: Verify comma-separated output when multiple levels qualify
6. **INT handling**: Verify `INT` added when reaching S4_5
7. **Early termination**: Verify stop when `continue === false`

---

## 13. Integration with Existing Modules

The refactored neurologicalLevelOfInjury module will:

1. **Import** and reuse `checkSensoryLevel` from `neurologicalLevels/sensoryLevel.ts`
2. **Import** and reuse `checkMotorLevel` and `checkMotorLevelBeforeStartOfKeyMuscles` from `neurologicalLevels/motorLevel.ts`
3. **Preserve** the existing `checkLevelWithoutMotor` and `checkLevelWithMotor` functions (may be extracted to support file)
4. **Use** the shared `Step`, `StepHandler`, and `createStep` from `common/step.ts`
5. **Use** the shared `CheckLevelResult` and `levelIsBetween` from `common.ts`

**No changes required** to the imported check functions; they are used as-is.

---

## End of Document
