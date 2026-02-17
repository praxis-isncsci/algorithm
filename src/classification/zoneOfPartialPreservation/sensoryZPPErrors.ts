/**
 * Centralized error messages for sensory ZPP calculation.
 * Enables consistency and future i18n (messages can be used as translation keys).
 */
export const SENSORY_ZPP_ERROR_MESSAGES = {
  CHECK_LEVEL_C1_INVALID:
    'checkLevelForSensoryZPP :: invalid argument level: C1',
  CURRENT_LEVEL_REQUIRED: 'checkLevel :: state.currentLevel is required.',
} as const;

export type SensoryZPPErrorCode = keyof typeof SENSORY_ZPP_ERROR_MESSAGES;

/**
 * Domain error for sensory ZPP calculation failures.
 * Enables programmatic error handling (e.g. by error code) and consistent messaging.
 */
export class SensoryZPPError extends Error {
  readonly code: SensoryZPPErrorCode;

  constructor(code: SensoryZPPErrorCode, message?: string) {
    const resolvedMessage = message ?? SENSORY_ZPP_ERROR_MESSAGES[code];
    super(resolvedMessage);
    this.name = 'SensoryZPPError';
    this.code = code;
    Object.setPrototypeOf(this, SensoryZPPError.prototype);
  }
}
