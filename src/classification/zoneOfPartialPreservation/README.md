# Zone of Partial Preservation (ZPP)

This module computes the **Sensory ZPP** and **Motor ZPP** for the International Standards for Neurological Classification of Spinal Cord Injury (ISNCSCI). Both algorithms use a step-based, chain-of-command pattern so clinicians can follow the logic and see where each value is generated.

---

## Overview

The **Zone of Partial Preservation (ZPP)** describes the dermatomes and myotomes with partial preservation of sensation or motor function caudal to the neurological level of injury (NLI). When sacral sparing is absent or not testable, ZPP identifies the most caudal segments with any preserved function.

| ZPP Type        | What it reports                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------- |
| **Sensory ZPP** | The most caudal dermatomes with preserved light touch or pin prick sensation                       |
| **Motor ZPP**   | The most caudal myotomes with preserved motor function (including non-key muscles when applicable) |

When ZPP does not apply (e.g., sacral sparing is present), the result is **NA** (Not Applicable).

---

## Prerequisites

### Sensory ZPP

| Input              | Description                                                                        |
| ------------------ | ---------------------------------------------------------------------------------- |
| `side`             | Exam data for one side: light touch and pin prick values at each key sensory point |
| `deepAnalPressure` | DAP: `Yes`, `No`, or `NT`                                                          |

### Motor ZPP

| Input                      | Description                                                      |
| -------------------------- | ---------------------------------------------------------------- |
| `side`                     | Exam data for one side: light touch, pin prick, and motor grades |
| `voluntaryAnalContraction` | VAC: `Yes`, `No`, or `NT`                                        |
| `ais`                      | AIS grade (A, B, C, C\*, D, E)                                   |
| `motorLevel`               | Comma-separated motor levels (e.g. `"C5,C6,C7"`)                 |

---

# Sensory ZPP

## Algorithm Summary

Sensory ZPP is calculated when **Deep Anal Pressure (DAP)** is `No` or `NT` and **S4-5** sensation is absent. The algorithm iterates from **S3** up to **C1**, checking each dermatome for preserved light touch or pin prick until it finds the caudal boundary of preserved sensation.

**Early exits:** Sensory ZPP is `NA` when:

- DAP is `Yes` (sacral sparing present)
- S4-5 has preserved sensation (either light touch or pin prick is not absent)

## Step Index

| Step | Name                            | Purpose                                                         |
| ---- | ------------------------------- | --------------------------------------------------------------- |
| 1    | `checkIfSensoryZPPIsApplicable` | Determine if Sensory ZPP applies or return NA immediately       |
| 2    | `checkSacralLevel`              | Evaluate S4-5; optionally add NA based on DAP and sacral result |
| 3    | `getTopAndBottomLevelsForCheck` | Set search range from S3 to C1                                  |
| 4    | `checkLevel`                    | For each level, check sensory function; add level or stop       |
| 5    | `sortSensoryZPP`                | Sort results with NA first (final step)                         |

## Step-by-Step Explanations

### Step 1: checkIfSensoryZPPIsApplicable

**Purpose:** Determine whether Sensory ZPP applies. If sacral sparing is present, Sensory ZPP is NA and we stop.

**Inputs:** Deep Anal Pressure (DAP), S4-5 light touch and pin prick values.

**Logic:**

- If DAP is **Yes** → Sacral sparing is present. Sensory ZPP = **NA**. Stop.
- If S4-5 has **preserved sensation** (neither light touch nor pin prick is absent) → Sensory ZPP = **NA**. Stop.
- Otherwise (DAP is No or NT, and S4-5 sensation is absent) → Proceed to evaluate sacral level.

**Outputs:** `zpp` is either `['NA']` (stop) or `[]` (proceed). `variable` is initialized to `false`.

**Next step:** `checkSacralLevel` if proceeding; otherwise `null` (done).

**Clinical note:** Per ISNCSCI, Sensory ZPP is only reported when sacral sparing is absent. DAP "Yes" or preserved S4-5 sensation indicates sacral sparing.

---

### Step 2: checkSacralLevel

**Purpose:** Evaluate S4-5 sensory values and decide whether to add NA to the ZPP list before iterating through higher levels.

**Inputs:** Exam side (S4-5 light touch and pin prick), DAP, and `variable` flag from state.

**Logic:**

- Evaluate S4-5 using the same sensory-check rules as other levels.
- Add **NA** to ZPP when:
  - DAP is **NT** (not testable), or
  - DAP is **No** and S4-5 indicates absent or partial sensation (sacral result suggests NA).
- Update the `variable` flag if S4-5 has variable/non-normal values (e.g. NT, 0\*).

**Outputs:** `zpp` may include `'NA'`; `variable` may be updated.

**Next step:** `getTopAndBottomLevelsForCheck`.

**Clinical note:** The NA in Sensory ZPP can indicate that sacral sensation could not be fully assessed (DAP NT) or that S4-5 was partially absent.

---

### Step 3: getTopAndBottomLevelsForCheck

**Purpose:** Define the iteration range and prepare the level chain. We will examine levels from S3 (top) down to C1 (bottom).

**Inputs:** Exam side (to build the level chain).

**Logic:**

- Build a linked chain of sensory levels from **S3** down to **C1**.
- Set `topLevel` = S3, `bottomLevel` = C1.
- Set `currentLevel` = S3 (start of iteration).

**Outputs:** `topLevel`, `bottomLevel`, `currentLevel` in state.

**Next step:** `checkLevel`.

**Clinical note:** The algorithm always iterates from S3 toward C1. C1 is the most rostral key sensory point and is added when the iteration completes.

---

### Step 4: checkLevel

**Purpose:** For the current dermatome, check whether sensory function (light touch and pin prick) is preserved. Add the level to ZPP when indicated; continue to the next level or stop when the boundary is found.

**Inputs:** `currentLevel` (name, light touch, pin prick), exam side, `variable` flag, `zpp` list.

**Logic:**

- **If current level is C1:** Add C1 to ZPP (per ISNCSCI, C1 is always included when we reach it). Proceed to sort.
- **Otherwise:** Run the sensory check for this level:
  - If **both** light touch and pin prick are **absent** (0) → Continue to next level (no add).
  - If **either** cannot be absent (e.g. 2, 1, NT**) → Add level to ZPP and **stop\*\* (sensory boundary found).
  - If **either** is NT or has variable indicator → Add level (with \* if variable) and continue.
- Advance `currentLevel` to the next level down (e.g. S3 → S2 → S1 → … → C2 → C1).

**Outputs:** `zpp` (levels added as we go), `variable` (updated when variable values are found), `currentLevel` (advanced or set to null when done).

**Next step:** `checkLevel` again if more levels to check; otherwise `sortSensoryZPP`.

**Clinical note:** The asterisk (\*) indicates variable or non-normal sensation. The algorithm stops when it finds a level where sensation is clearly preserved (not absent).

---

### Step 5: sortSensoryZPP

**Purpose:** Sort the Sensory ZPP list so that NA (if present) appears first, followed by levels in anatomical order (caudal to rostral).

**Inputs:** `zpp` list from previous steps.

**Logic:**

- Sort so **NA** is first (if it was added).
- Then sort remaining levels by anatomical order (S3, S2, S1, L5, … C2, C1).

**Outputs:** Final `zpp` list.

**Next step:** `null` (algorithm complete).

**Clinical note:** The final output is a comma-separated string, e.g. `"NA,S3,S2"` or `"S2,S1"`.

---

## Sensory ZPP Flow (Text Diagram)

```
checkIfSensoryZPPIsApplicable
    ├─ DAP Yes or S4-5 preserved → zpp = ['NA'], STOP
    └─ DAP No/NT and S4-5 absent → checkSacralLevel

checkSacralLevel
    └─ (add NA if indicated) → getTopAndBottomLevelsForCheck

getTopAndBottomLevelsForCheck
    └─ range S3→C1, currentLevel=S3 → checkLevel

checkLevel (iterates S3 down to C1)
    ├─ C1 reached → add C1 → sortSensoryZPP
    ├─ Both LT and PP absent → continue to next level
    ├─ Either preserved → add level, STOP → sortSensoryZPP
    └─ Variable (NT, 0*) → add level with *, continue

sortSensoryZPP
    └─ NA first, then levels by order → DONE
```

---

# Motor ZPP

## Algorithm Summary

Motor ZPP is calculated when **Voluntary Anal Contraction (VAC)** is `No` or `NT`. When VAC is `Yes`, Motor ZPP is **NA**. The algorithm uses the **motor levels** to define a search range from the lowest motor level up to the highest. It iterates from **bottom to top** within that range, checking each level for motor or sensory function. For **AIS C or C\***, the lowest non-key muscle with motor function may be included in Motor ZPP.

**Early exits:** Motor ZPP is `NA` when VAC is `Yes`.

## Step Index

| Step | Name                                     | Purpose                                                 |
| ---- | ---------------------------------------- | ------------------------------------------------------- |
| 1    | `checkIfMotorZPPIsApplicable`            | Check VAC; return NA if Yes, else proceed               |
| 2    | `checkLowerNonKeyMuscle`                 | Determine if non-key muscle affects AIS (for AIS C/C\*) |
| 3    | `getTopAndBottomLevelsForCheck`          | Define search range from motor levels                   |
| 4    | `checkLevel`                             | Branch to motor or sensory check for current level      |
| 4a   | `checkForMotorFunction`                  | Evaluate motor grade; add level or continue             |
| 4b   | `checkForSensoryFunction`                | Evaluate sensory when level has no motor key muscle     |
| 5    | `addLowerNonKeyMuscleToMotorZPPIfNeeded` | Add non-key muscle to ZPP when it affects AIS           |
| 6    | `sortMotorZPP`                           | Sort results with NA first (final step)                 |

## Step-by-Step Explanations

### Step 1: checkIfMotorZPPIsApplicable

**Purpose:** Determine whether Motor ZPP applies based on Voluntary Anal Contraction (VAC).

**Inputs:** `voluntaryAnalContraction` (Yes, No, or NT).

**Logic:**

- If VAC is **Yes** → Sacral motor function is preserved. Motor ZPP = **NA**. Stop.
- If VAC is **NT** → Motor ZPP = **NA** for the final result, but we still proceed to determine the top and bottom levels (for consistency and non-key muscle logic).
- If VAC is **No** → Leave ZPP empty and proceed.

**Outputs:** `zpp` is `['NA']` (VAC Yes or NT) or `[]` (VAC No).

**Next step:** `checkLowerNonKeyMuscle` if continuing; otherwise `null` (done).

**Clinical note:** Per ISNCSCI, Motor ZPP is NA when VAC is present. VAC "Yes" indicates preserved sacral motor function.

---

### Step 2: checkLowerNonKeyMuscle

**Purpose:** For AIS C or C\*, the lowest non-key muscle with motor function can influence the AIS grade. Set a flag so the algorithm considers it when building Motor ZPP.

**Inputs:** AIS grade, `side.lowestNonKeyMuscleWithMotorFunction`.

**Logic:**

- If AIS is **C** or **C\*** and there is a **lowest non-key muscle with motor function** → Set `testNonKeyMuscle = true`.
- Otherwise → Set `testNonKeyMuscle = false`.

**Outputs:** `testNonKeyMuscle` in state.

**Next step:** `getTopAndBottomLevelsForCheck`.

**Clinical note:** AIS C implies sensory function at S4-5. The non-key muscle (e.g. hip flexors) may extend the zone of partial preservation and affect the classification.

---

### Step 3: getTopAndBottomLevelsForCheck

**Purpose:** Using the motor levels, define the top and bottom of the search range. Build the level chain and find key reference levels.

**Inputs:** `motorLevel` (comma-separated), exam side.

**Logic:**

- **Top** = first (highest) motor level (e.g. C5 if motor levels are C5,C6,C7).
- **Bottom** = S1 if no motor levels below S1; otherwise the lowest motor level (e.g. S2, S3, or INT).
- Build levels from C1 to bottom; link them; set `currentLevel = bottomLevel`.
- Find `firstLevelWithStar` (first level with \* in LT, PP, or motor).
- Find `lastLevelWithConsecutiveNormalValues` (last level before first non-normal value).
- Identify `nonKeyMuscle` level if applicable.

**Outputs:** `topLevel`, `bottomLevel`, `currentLevel`, `firstLevelWithStar`, `lastLevelWithConsecutiveNormalValues`, `nonKeyMuscle`.

**Next step:** `checkLevel`.

**Clinical note:** The algorithm iterates from bottom to top. Levels below S1 (S2, S3) are only included when motor function exists at those levels.

---

### Step 4: checkLevel

**Purpose:** Dispatch to the appropriate check based on whether the current level has a key motor muscle.

**Inputs:** `currentLevel` (with motor grade if it's a motor level).

**Logic:**

- If the level has a **motor** value (it's a key motor level) → `checkForMotorFunction`.
- Otherwise (sensory-only level, e.g. S2, S3) → `checkForSensoryFunction`.

**Outputs:** Delegates to the branch; updates `zpp`, `currentLevel`, and possibly `addNonKeyMuscle`.

**Next step:** From the branch (either `checkLevel` again, or `addLowerNonKeyMuscleToMotorZPPIfNeeded` when at top).

---

### Step 4a: checkForMotorFunction

**Purpose:** Evaluate motor function at the current key muscle level. Add the level to Motor ZPP when motor function is found; apply non-key muscle override when indicated.

**Inputs:** `currentLevel` (name, motor grade), `firstLevelWithStar`, `lastLevelWithConsecutiveNormalValues`, `testNonKeyMuscle`, `nonKeyMuscle`.

**Logic:**

- **Case 1 – Normal motor function (grades 1–5, NT**, 0**):** Add level to ZPP (with \* if in star range). **Stop** iterating (we found the motor boundary). Non-key muscle may override.
- **Case 2 – NT or 0\*:** Add level to ZPP (with \* if applicable). **Continue** to next level toward top. Non-key muscle may override.
- **Case 3 – At top of range with no function:** Stop. Proceed to non-key muscle step.
- **Case 4 – No function, not at top:** Continue to next level.

**Non-key muscle override:** If `testNonKeyMuscle` is true and the non-key muscle is >3 levels below the current level, the non-key muscle overrides: we do not add the current level and set `addNonKeyMuscle = true`.

**Outputs:** `zpp`, `currentLevel` (moves to previous/next level), `addNonKeyMuscle`.

**Next step:** `addLowerNonKeyMuscleToMotorZPPIfNeeded` when at top; otherwise `checkLevel`.

**Clinical note:** The asterisk (\*) indicates variable or non-normal function. Motor ZPP includes the most caudal level with any preserved motor function.

---

### Step 4b: checkForSensoryFunction

**Purpose:** For levels without a key motor muscle (e.g. S2, S3), check sensory function. If the level is within the motor levels and has sensory function, add it to Motor ZPP.

**Inputs:** `currentLevel` (light touch, pin prick), `motorLevel`, `firstLevelWithStar`, `lastLevelWithConsecutiveNormalValues`, `nonKeyMuscle`.

**Logic:**

- If the level is **included in motor levels** and has sensory function:
  - Check non-key muscle override.
  - If not overridden → Add level to ZPP (with \* if in star range).
- If at top of range → Stop.
- If no sensory function → Continue to next level.

**Outputs:** `zpp`, `currentLevel`, `addNonKeyMuscle`.

**Next step:** `addLowerNonKeyMuscleToMotorZPPIfNeeded` when at top; otherwise `checkLevel`.

**Clinical note:** For sensory-only levels (S2, S3), we use light touch and pin prick to determine if the level belongs in Motor ZPP when it's part of the motor level range.

---

### Step 5: addLowerNonKeyMuscleToMotorZPPIfNeeded

**Purpose:** When the non-key muscle affects AIS (AIS C/C\* and `addNonKeyMuscle` is true), add it to Motor ZPP if not already added.

**Inputs:** `addNonKeyMuscle`, `nonKeyMuscleHasBeenAdded`, `nonKeyMuscle`.

**Logic:**

- If `addNonKeyMuscle` is true, `nonKeyMuscleHasBeenAdded` is false, and `nonKeyMuscle` exists → Add the non-key muscle level to ZPP.
- Otherwise → Do not add.

**Outputs:** `zpp` (possibly updated).

**Next step:** `sortMotorZPP`.

**Clinical note:** The non-key muscle (e.g. hip flexors at L1-L2) extends the zone of partial preservation when it influences the AIS grade.

---

### Step 6: sortMotorZPP

**Purpose:** Sort the Motor ZPP list so that NA (if present) is first, followed by levels in anatomical order.

**Inputs:** `zpp` list from previous steps.

**Logic:**

- Sort so **NA** is first (if present).
- Then sort remaining levels by anatomical order (S3, S2, S1, L5, … C2, C1).

**Outputs:** Final `zpp` list.

**Next step:** `null` (algorithm complete).

**Clinical note:** The final output is a comma-separated string, e.g. `"NA,C7,C6"` or `"C6,C5,S1"`.

---

## Motor ZPP Flow (Text Diagram)

```
checkIfMotorZPPIsApplicable
    ├─ VAC Yes → zpp = ['NA'], STOP
    └─ VAC No/NT → checkLowerNonKeyMuscle

checkLowerNonKeyMuscle
    └─ set testNonKeyMuscle (AIS C + non-key muscle) → getTopAndBottomLevelsForCheck

getTopAndBottomLevelsForCheck
    └─ top/bottom from motor levels, currentLevel=bottom → checkLevel

checkLevel (iterates bottom to top)
    ├─ Has motor? → checkForMotorFunction
    │   ├─ Normal motor (1-5, NT**, 0**) → add level, STOP
    │   ├─ NT or 0* → add level, continue
    │   ├─ At top, no function → STOP
    │   └─ No function → continue
    └─ No motor (S2, S3)? → checkForSensoryFunction
        ├─ In motor levels + sensory → add level, continue/stop
        └─ No sensory → continue

addLowerNonKeyMuscleToMotorZPPIfNeeded
    └─ add non-key muscle if applicable → sortMotorZPP

sortMotorZPP
    └─ NA first, then levels by order → DONE
```

---

## References

- **ISNCSCI:** International Standards for Neurological Classification of Spinal Cord Injury (revised 2019)
- **ASIA:** American Spinal Injury Association
- **Key terms:** Neurological level of injury (NLI), Zone of Partial Preservation (ZPP), Deep Anal Pressure (DAP), Voluntary Anal Contraction (VAC), ASIA Impairment Scale (AIS), key muscles, key sensory points, dermatomes, myotomes
