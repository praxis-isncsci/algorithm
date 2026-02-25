# Neurological Levels: Motor and Sensory Level Determination

**Module:** `neurologicalLevels`  
**Audience:** Clinicians, Trainers, and Researchers  
**Last Updated:** February 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Motor Level](#motor-level)
3. [Sensory Level](#sensory-level)
4. [Step-Based Architecture](#step-based-architecture)
5. [Clinical Use Cases](#clinical-use-cases)
6. [Key Terminology](#key-terminology)
7. [References](#references)

---

## Overview

### What Are Neurological Levels?

In ISNCSCI assessment, **neurological levels** identify the most caudal (lowest) segments of the spinal cord with intact function. They answer two fundamental questions:

- **Motor Level:** "What is the lowest level with intact motor function?"
- **Sensory Level:** "What is the lowest level with intact sensation?"

These levels are determined separately for **left** and **right** sides, and separately for **motor** and **sensory** modalities. Together with sacral sparing, they form the foundation for determining the neurological level of injury (NLI) and ASIA Impairment Scale (AIS) classification.

### Why Are They Important?

Neurological levels are critical for:

1. **Classifying spinal cord injury severity** – Motor and sensory levels determine the neurological level of injury (NLI).
2. **Tracking recovery** – Changes in motor or sensory levels indicate functional improvement or decline.
3. **Treatment planning** – Understanding the level of injury guides rehabilitation goals and interventions.
4. **Research standardization** – Consistent determination of neurological levels enables comparison across studies.

### How Do They Relate to ISNCSCI Assessment?

The ISNCSCI exam evaluates:

- **Motor function** at 10 key muscles (C5–T1, L2–S1)
- **Sensory function** at 28 dermatomes (C2–S4_5) for light touch and pin prick
- **Sacral function** including voluntary anal contraction (VAC) and anal sensation

Motor and sensory levels are computed from these values using standardized algorithms. This module implements those algorithms in a transparent, step-by-step format that clinicians can review and verify.

---

## Motor Level

### Clinical Definition

The **motor level** is defined as:

> The most caudal myotome with at least grade 3/5 motor function, provided the segments above are graded 5/5 or are not testable (NT).

In simpler terms: the lowest level where you can reliably demonstrate voluntary motor control against gravity, assuming all levels above are normal.

### How the Algorithm Works

The motor level algorithm evaluates spinal levels from **C1 to S4_5** in sequence. At each level, it determines:

1. **Is this level intact?** (motor function present)
2. **Should we continue downward?** (looking for lower intact levels)
3. **Is there variability?** (are there NT or other non-standard grades that affect interpretation?)

The algorithm uses different evaluation strategies depending on the region:

#### 1. Sensory Regions (C1–C3, T2–T12, S2–S3)

These levels have **no key muscles** to test. The algorithm uses **sensory function** (light touch and pin prick) as a proxy for motor level determination.

**Clinical Rationale:** If sensation is intact at a level with no testable muscles, we infer the motor level may also be intact at that level.

**Decision:** If sensory function at the next level is abnormal, the current level becomes the motor level.

#### 2. Before Key Muscles (C4, L1)

These levels are just **above the first key muscle** in their region (C5 for cervical, L2 for lumbar).

**Clinical Rationale:** C4 (diaphragm) and L1 (no key muscle) are evaluated by checking the first testable muscle below (C5 or L2).

**Decision:**
- If the next key muscle (C5 or L2) is severely impaired (grade 0–2), the motor level is C4 or L1.
- If the next key muscle is testable (grade 3 or higher, or NT), continue downward.

#### 3. Key Motor Regions (C5–C8, L2–L5)

These levels have **testable key muscles**:

- **C5:** Elbow flexors (biceps, brachialis)
- **C6:** Wrist extensors
- **C7:** Elbow extensors (triceps)
- **C8:** Finger flexors (FDP middle finger)
- **L2:** Hip flexors
- **L3:** Knee extensors
- **L4:** Ankle dorsiflexors
- **L5:** Long toe extensors

**Clinical Rationale:** At these levels, motor grades directly reflect voluntary motor control.

**Decision:**
- If the current level is grade 3 or higher and the next level is not severely impaired (0–2), continue downward.
- If the current level is grade 0–2, this level is **not** the motor level (an error is raised—this should not happen in valid exams).
- If the next level is severely impaired (0–2), the current level is the motor level.

#### 4. End of Key Muscles (T1, S1)

T1 (end of cervical key muscles) and S1 (end of lumbar key muscles) are **transition points** where motor function shifts from key muscles to sensory-based evaluation.

**Clinical Rationale:** At these levels, the algorithm checks both the motor grade at T1/S1 **and** the sensory function below (C5–T1 for cervical, L2–S1 for lumbar).

**Decision:**
- If the motor grade at T1/S1 is 3 or 4 (not full strength), it becomes the motor level.
- If the motor grade is 5 (normal) but sensory function below indicates impairment, T1/S1 may still be the motor level.
- If all are normal, continue downward.

#### 5. Voluntary Anal Contraction (VAC) Handling (S4_5)

At S4_5, the algorithm handles **voluntary anal contraction (VAC)** to determine whether S3 and/or INT (intact) should be reported.

**VAC = No:**
- **Interpretation:** No voluntary motor control at the lowest sacral level.
- **Decision:** The motor level is **S3** (or below S3 if already identified). If S3 was already determined, do not add it again.

**VAC = NT (Not Testable):**
- **Interpretation:** Unable to assess voluntary anal contraction (e.g., patient unable to cooperate, rectal injury).
- **Decision:** Report **S3 and INT** to indicate uncertainty. Both levels are added (S3 if not already present, then INT).

**VAC = Yes:**
- **Interpretation:** Voluntary anal contraction is present, indicating intact motor function at the lowest sacral level.
- **Decision:** The motor level is **INT** (intact).

### Variable Indicator (*)

The **asterisk (*)** indicates **variability** in the exam findings. It means that one or more values in the evaluation pathway were:

- **Non-testable (NT):** The patient could not be tested (e.g., due to pain, cooperation, injury).
- **Variable grades:** Grades with ** (e.g., 0**, 1**, 2**) indicate NT values that may affect interpretation.

**Clinical Significance:**
- A variable motor level (e.g., **C5\***) means the determination is less certain due to NT or variable values.
- This flag helps clinicians recognize when exam findings should be interpreted with caution.
- Variable levels may require re-examination when the patient's condition stabilizes.

### Entry Points

The motor level module provides two functions:

```typescript
// Get the final motor level result
determineMotorLevel(side: ExamSide, vac: BinaryObservation): string

// Step through the algorithm (for training/review)
motorLevelSteps(side: ExamSide, vac: BinaryObservation): Generator<MotorLevelStep>
```

**Example output:**
- `"C5"` – Motor level is C5, no variability
- `"C5*"` – Motor level is C5, with variability
- `"S3,INT"` – Motor level includes both S3 and INT (VAC=NT)
- `"INT*"` – Motor level is intact, with variability

---

## Sensory Level

### Clinical Definition

The **sensory level** is defined as:

> The most caudal dermatome with normal (2/2) sensation for both light touch and pin prick.

In simpler terms: the lowest level where you can reliably demonstrate intact sensation, assuming all levels above are normal.

### How the Algorithm Works

The sensory level algorithm evaluates dermatomes from **C2 to S4_5** in sequence. At each level, it checks the **next level's** sensory function:

1. **Are light touch and pin prick both normal (2/2)?** → Continue downward.
2. **Is either modality abnormal (0, 1, 0*, 1*)?** → Current level is the sensory level. Stop.
3. **Is either modality NT or NT*?** → Handle based on variability rules (see below).
4. **Reached S4_5 with all normal?** → Sensory level is INT (intact).

#### Sensory Value Interpretation

| Value | Meaning                          | Action                                                |
|-------|----------------------------------|-------------------------------------------------------|
| **2** | Normal sensation                 | Continue evaluating lower levels                      |
| **1** | Impaired sensation               | Sensory level is the **current** level (not next)     |
| **0** | Absent sensation                 | Sensory level is the **current** level (not next)     |
| **NT**| Not testable                     | Check for variability (see below)                     |
| **0\***, **1\*** | Abnormal with variability | Sensory level is current level with `*`               |
| **NT\*** | Not testable with variability | Sensory level is current level with `*`, mark variable|
| **0\*\***, **1\*\***, **2\*\***, **NT\*\*** | Variable NT values | Continue, but mark as variable                    |

#### Decision Branches

The algorithm follows these decision rules at each level:

**1. Both Normal (LT=2, PP=2):**
- **Interpretation:** Sensation is intact at the next level.
- **Decision:** Continue to the next level.

**2. Abnormal (LT or PP is 0, 1, 0*, or 1*):**
- **Interpretation:** Sensation is impaired at the next level.
- **Decision:** The **current level** is the sensory level. Stop.

**3. NT* at Next Level:**
- **Interpretation:** The next level is not testable, and this affects interpretation.
- **Decision:** The current level is the sensory level with `*`. Stop. Mark as variable.

**4. NT with Variable Sensory (0**, 1**):**
- **Interpretation:** The next level is NT, but there's variable sensory data.
- **Decision:** Add the current level to the result. Mark as variable. Continue downward.

**5. NT with Non-Variable Sensory (2, NT, NT**):**
- **Interpretation:** The next level is NT, but sensory data suggests possible normality.
- **Decision:** Add the current level to the result. Continue downward (do not mark variable unless already variable).

**6. Other Variable Values:**
- **Interpretation:** The next level has variable sensory values (e.g., 0**, 1**, NT** without NT).
- **Decision:** Mark as variable and continue downward.

**7. Reached S4_5:**
- **Interpretation:** All dermatomes from C2 to S4_5 have been evaluated without finding impairment.
- **Decision:** The sensory level is **INT** (intact).

### Variable Indicator (*)

The **asterisk (*)** indicates **variability** in sensory exam findings. It means that one or more sensory values in the evaluation pathway were:

- **Not testable (NT or NT*):** The patient could not be tested.
- **Variable grades (0**, 1**, 2**, NT**):** Values indicating NT or uncertain findings.

**Clinical Significance:**
- A variable sensory level (e.g., **T4\***) means the determination is less certain.
- Clinicians should interpret variable levels with caution and consider re-examination.

### Entry Points

The sensory level module provides two functions:

```typescript
// Get the final sensory level result
determineSensoryLevel(side: ExamSide): string

// Step through the algorithm (for training/review)
sensoryLevelSteps(side: ExamSide): Generator<SensoryLevelStep>
```

**Example output:**
- `"C5"` – Sensory level is C5, no variability
- `"T4*"` – Sensory level is T4, with variability
- `"INT"` – Sensory level is intact (all dermatomes normal)
- `"INT*"` – Sensory level is intact, with variability

---

## Step-Based Architecture

### Why Step-Based?

Traditional ISNCSCI algorithms are implemented as complex conditional logic that can be difficult to understand, verify, and teach. This module uses a **step-based, chain-of-command pattern** that:

1. **Expresses the algorithm as a sequence of explicit steps** – Each step has a clear purpose, inputs, outputs, and clinical explanation.
2. **Makes the logic self-documenting** – The step chain documents the algorithm's decision-making process.
3. **Enables step-through execution** – Clinicians can step through the algorithm to understand how a result was determined.

### How It Works

Each step in the algorithm:

1. **Receives state** – Current exam data, levels determined so far, variable flag, current index.
2. **Performs an action** – Evaluates the current level using clinical decision rules.
3. **Updates state** – Adds a level to the result, updates the variable flag, advances the index.
4. **Chains to the next step** – Either continues to the next level or stops (returns null).

### Using the Step-Through Feature

The step-through feature is designed for:

- **Training and education** – Teaching the ISNCSCI algorithm to new clinicians.
- **Case review and verification** – Understanding how the algorithm determined a specific result.
- **Debugging complex cases** – Identifying where and why a result differs from expectations.

#### For Motor Level

```typescript
import { motorLevelSteps } from './motorLevel';

// Create exam data for left side
const leftSide: ExamSide = {
  motor: { C5: '5', C6: '5', C7: '3', C8: '0', T1: '0', L2: '0', L3: '0', L4: '0', L5: '0', S1: '0' },
  lightTouch: { /* ... sensory values ... */ },
  pinPrick: { /* ... sensory values ... */ }
};

// Step through the algorithm
for (const step of motorLevelSteps(leftSide, 'No')) {
  console.log('Description:', step.description);
  console.log('Actions:', step.actions);
  console.log('Current levels:', step.state.levels);
  console.log('Variable:', step.state.variable);
  console.log('---');
}
```

Each step yields:

- **`description`** – A human-readable explanation of what the step is checking (e.g., "Check motor/sensory function at C7").
- **`actions`** – A list of actions performed in this step (e.g., "Key motor region. Evaluate using motor grade at C7 and C8").
- **`state.levels`** – The motor levels determined so far.
- **`state.variable`** – Whether variability has been encountered.

#### For Sensory Level

```typescript
import { sensoryLevelSteps } from './sensoryLevel';

// Create exam data for left side
const leftSide: ExamSide = {
  lightTouch: { C2: '2', C3: '2', C4: '2', C5: '2', C6: '1', /* ... */ },
  pinPrick: { C2: '2', C3: '2', C4: '2', C5: '2', C6: '1', /* ... */ },
  motor: { /* ... motor values ... */ }
};

// Step through the algorithm
for (const step of sensoryLevelSteps(leftSide)) {
  console.log('Description:', step.description);
  console.log('Actions:', step.actions);
  console.log('Current levels:', step.state.levels);
  console.log('Variable:', step.state.variable);
  console.log('---');
}
```

Each step provides the same level of detail as motor level steps.

### Benefits for Clinicians

1. **Transparency** – Every decision made by the algorithm is visible and explainable.
2. **Verification** – Clinicians can verify that the algorithm is following ISNCSCI rules correctly.
3. **Education** – Step-through execution is an excellent teaching tool for ISNCSCI training.
4. **Debugging** – When results are unexpected, step-through shows exactly where and why the algorithm made a specific decision.

---

## Clinical Use Cases

### Use Case 1: Complete Motor Examination

**Scenario:** A patient with a C7 spinal cord injury. Exam findings:

- C5: 5/5, C6: 5/5, C7: 3/5, C8: 0/5, T1: 0/5
- Lower extremity: All 0/5
- VAC: No

**Expected Motor Level:** C7 (lowest level with grade ≥3)

**Step-by-Step Reasoning:**
1. C1–C4: Sensory evaluation (all normal) → Continue
2. C5: Motor 5/5, C6 not 0–2 → Continue
3. C6: Motor 5/5, C7 not 0–2 → Continue
4. C7: Motor 3/5, C8 is 0 → **Stop. Motor level is C7.**

**Result:** `"C7"`

---

### Use Case 2: Incomplete Examination with NT

**Scenario:** A patient with pain limiting cervical motor testing. Exam findings:

- C5: NT, C6: NT, C7: 4/5, C8: 3/5, T1: 0/5
- Lower extremity: All 0/5
- VAC: No

**Expected Motor Level:** C8* (lowest level with grade ≥3, variable due to NT above)

**Step-by-Step Reasoning:**
1. C1–C4: Sensory evaluation → Continue
2. C5: Motor NT → Variable flag set, Continue
3. C6: Motor NT → Variable flag remains, Continue
4. C7: Motor 4/5, C8 not 0–2 → Continue
5. C8: Motor 3/5, T1 is 0 → **Stop. Motor level is C8, variable due to NT above.**

**Result:** `"C8*"`

---

### Use Case 3: VAC Not Testable

**Scenario:** A patient with sacral sparing but unable to perform VAC due to rectal injury. Exam findings:

- Upper extremity: All 5/5
- Lower extremity: All 5/5
- Sensory: All 2/2 through S4_5
- VAC: NT

**Expected Motor Level:** S3,INT* (S3 added because VAC=NT, then INT added)

**Step-by-Step Reasoning:**
1. C1–S3: All normal → Continue
2. S4_5: VAC=NT, S3 not already in levels → **Add S3, then add INT. Stop.**

**Result:** `"S3,INT*"`

---

### Use Case 4: Sensory Level with Abnormal Finding

**Scenario:** A patient with sensory loss below T4. Exam findings:

- Light touch: C2–T4 all 2/2, T5 is 0/2
- Pin prick: C2–T4 all 2/2, T5 is 0/2

**Expected Sensory Level:** T4 (last level with normal sensation)

**Step-by-Step Reasoning:**
1. C2: Check C3 → Both 2/2 → Continue
2. C3: Check C4 → Both 2/2 → Continue
3. ...
4. T4: Check T5 → Both 0/2 (abnormal) → **Stop. Sensory level is T4.**

**Result:** `"T4"`

---

### Use Case 5: Intact Sensory Level

**Scenario:** A patient with complete recovery. Exam findings:

- Light touch: All 2/2 through S4_5
- Pin prick: All 2/2 through S4_5

**Expected Sensory Level:** INT (intact)

**Step-by-Step Reasoning:**
1. C2–S3: All normal → Continue
2. S4_5: Reached end of dermatomes → **Add INT. Stop.**

**Result:** `"INT"`

---

### Use Case 6: Edge Case - VAC=No with S3 Already Determined

**Scenario:** A patient with S3 as the last sensory level but no VAC. Exam findings:

- Sensory determined S3 as the last level
- VAC: No

**Expected Motor Level:** S3 (do not add S3 again)

**Step-by-Step Reasoning:**
1. Algorithm reaches S4_5, VAC=No, S3 already in levels → **Stop without adding level.**

**Result:** `"S3"` (assuming S3 was added by sensory evaluation earlier)

---

### Edge Cases and Special Considerations

#### Not Testable (NT) Values

- **NT** indicates the patient could not be tested at that level (e.g., pain, cooperation, cast, bandage).
- NT values trigger the **variable flag (*)** in most cases.
- The algorithm attempts to continue evaluation when possible, using adjacent levels to infer function.

#### Motor Grades with Asterisks

- **0\*, 1\*, 2\*, 3\*, 4\*** – Grades with variability (e.g., due to NT at an adjacent level).
- **0\*\*, 1\*\*, 2\*\*, 3\*\*, 4\*\*, NT\*\*** – Grades indicating high variability or NT-related uncertainty.
- These grades affect the variable flag and may cause the motor level to be marked with `*`.

#### Multiple Levels in Result

- Results like `"S3,INT"` indicate **two levels** in the motor level.
- This occurs when VAC=NT: the algorithm adds S3 (if not present) and then INT to indicate both the last testable level and intact function.

#### Incomplete Examinations

- If large portions of the exam are NT, the motor or sensory level may be **highly variable** (marked with `*`).
- Clinicians should interpret these results with caution and consider re-examination when feasible.

---

## Key Terminology

### Exam Data Types

| Term            | Definition                                                                                     |
|-----------------|------------------------------------------------------------------------------------------------|
| **ExamSide**    | Exam data for one side (left or right), including motor grades, light touch, and pin prick.   |
| **Motor grade** | Numeric score (0–5) or NT indicating strength of a key muscle. 0=absent, 5=normal.             |
| **Sensory value** | Numeric score (0, 1, 2) or NT for light touch or pin prick. 0=absent, 2=normal.             |
| **VAC**         | Voluntary Anal Contraction. Values: Yes, No, NT. Indicates motor function at the lowest sacral level. |

### Motor Levels

| Level | Key Muscle                | Clinical Relevance                                |
|-------|---------------------------|---------------------------------------------------|
| **C5** | Elbow flexors (biceps)   | Shoulder abduction, elbow flexion                 |
| **C6** | Wrist extensors          | Wrist extension, forearm supination              |
| **C7** | Elbow extensors (triceps)| Elbow extension, wrist flexion                    |
| **C8** | Finger flexors (FDP)     | Finger flexion (grip strength)                    |
| **T1** | Hand intrinsics          | Finger abduction and adduction (pinch strength)   |
| **L2** | Hip flexors              | Hip flexion                                       |
| **L3** | Knee extensors           | Knee extension (quadriceps)                       |
| **L4** | Ankle dorsiflexors       | Ankle dorsiflexion (foot lift)                    |
| **L5** | Long toe extensors       | Great toe extension                               |
| **S1** | Ankle plantarflexors     | Ankle plantarflexion (calf strength)              |

### Sensory Levels

| Level      | Dermatome                    | Clinical Relevance                                |
|------------|------------------------------|---------------------------------------------------|
| **C2**     | Occipital region             | Upper neck sensation                              |
| **C3**     | Supraclavicular region       | Lower neck sensation                              |
| **C4**     | Top of shoulder (acromial)   | Shoulder sensation                                |
| **C5**     | Lateral arm                  | Deltoid region sensation                          |
| **C6**     | Thumb                        | Radial forearm and thumb sensation                |
| **C7**     | Middle finger                | Middle finger sensation                           |
| **C8**     | Little finger                | Ulnar forearm and little finger sensation         |
| **T1**     | Medial elbow                 | Medial arm sensation                              |
| **T2-T12** | Trunk dermatomes             | Chest, abdomen sensation (T4=nipple, T10=umbilicus)|
| **L1**     | Inguinal region              | Upper thigh sensation                             |
| **L2**     | Anterior thigh               | Mid-thigh sensation                               |
| **L3**     | Medial knee                  | Knee sensation                                    |
| **L4**     | Medial ankle                 | Medial leg and ankle sensation                    |
| **L5**     | Dorsum of foot               | Top of foot sensation                             |
| **S1**     | Heel and lateral foot        | Heel and lateral foot sensation                   |
| **S2**     | Popliteal fossa              | Back of knee sensation                            |
| **S3**     | Ischial tuberosity           | Buttock sensation                                 |
| **S4_5**   | Perianal region              | Perianal sensation (sacral sparing)               |

### Special Terms

| Term              | Definition                                                                                 |
|-------------------|--------------------------------------------------------------------------------------------|
| **NLI**           | Neurological Level of Injury. The most caudal segment with normal function (motor and sensory). |
| **AIS**           | ASIA Impairment Scale. Grades A–E indicating completeness of spinal cord injury.           |
| **ZPP**           | Zone of Partial Preservation. Levels below NLI with partial function (AIS A only).         |
| **NT**            | Not Testable. Indicates the patient could not be tested at that level.                    |
| **INT**           | Intact. Indicates function is intact at all levels (motor or sensory level is normal).     |
| **Variable (*)** | Indicates variability in exam findings (e.g., due to NT values).                           |
| **Dermatome**     | A skin area innervated by a single spinal nerve root.                                      |
| **Myotome**       | A group of muscles innervated by a single spinal nerve root.                               |

---

## References

### ISNCSCI Standard

- **American Spinal Injury Association (ASIA).** International Standards for Neurological Classification of Spinal Cord Injury (ISNCSCI). Revised 2019.  
  [https://asia-spinalinjury.org/international-standards-neurological-classification-sci-isncsci-worksheet/](https://asia-spinalinjury.org/international-standards-neurological-classification-sci-isncsci-worksheet/)

### Algorithm Documentation

- **Motor Level Architecture:** `docs/motorLevel-architecture.md`
- **Sensory Level Architecture:** `docs/sensoryLevel-architecture.md`

### Code Implementation

- **Motor Level:** `src/classification/neurologicalLevels/motorLevel.ts`
- **Sensory Level:** `src/classification/neurologicalLevels/sensoryLevel.ts`

---

## Questions or Feedback?

This documentation is designed for clinicians using the ISNCSCI algorithm. If you have questions about:

- **Clinical interpretation** of results → Consult the ASIA ISNCSCI standard or a trained clinician.
- **Algorithm behavior** or unexpected results → Review the step-by-step execution using the generator functions.
- **Technical implementation** → Refer to the architecture documents in the `docs/` folder.

**Last Updated:** February 25, 2026
