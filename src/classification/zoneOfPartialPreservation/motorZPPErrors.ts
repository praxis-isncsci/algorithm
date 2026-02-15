/**
 * Centralized error messages for motor ZPP calculation.
 * Enables consistency and future i18n (messages can be used as translation keys).
 */
export const MOTOR_ZPP_ERROR_MESSAGES = {
  LEVELS_RANGE_UNDETERMINED:
    'getLevelsRange :: Unable to determine the topLevel, bottomLevel, or lastLevelWithConsecutiveNormalValues',
  CHECK_FOR_SENSORY_FUNCTION_CURRENT_LEVEL_REQUIRED:
    'checkForSensoryFunction :: state.currentLevel is null. A SideLevel value is required.',
  CHECK_FOR_MOTOR_FUNCTION_CURRENT_LEVEL_REQUIRED:
    'checkForMotorFunction :: state.currentLevel is null. A SideLevel value is required.',
  CHECK_FOR_MOTOR_FUNCTION_MOTOR_REQUIRED:
    'checkForMotorFunction :: state.currentLevel.motor is null.',
} as const;

export type MotorZPPErrorCode = keyof typeof MOTOR_ZPP_ERROR_MESSAGES;

/**
 * Domain error for motor ZPP calculation failures.
 * Enables programmatic error handling (e.g. by error code) and consistent messaging.
 */
export class MotorZPPError extends Error {
  readonly code: MotorZPPErrorCode;

  constructor(
    code: MotorZPPErrorCode,
    message?: string,
  ) {
    const resolvedMessage =
      message ?? MOTOR_ZPP_ERROR_MESSAGES[code];
    super(resolvedMessage);
    this.name = 'MotorZPPError';
    this.code = code;
    Object.setPrototypeOf(this, MotorZPPError.prototype);
  }
}
