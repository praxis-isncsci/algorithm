/**
 * Centralized error messages for sensory level calculation.
 * Enables consistency and future i18n (messages can be used as translation keys).
 */
export const SENSORY_LEVEL_ERROR_MESSAGES = {
  INVALID_NEXT_LEVEL:
    'checkSensoryLevel: invalid arguments level: {{level}} nextLevel: {{nextLevel}}',
  NT_BRANCH_UNMATCHED:
    'checkSensoryLevel: NT branch did not match expected values',
} as const;

export type SensoryLevelErrorCode = keyof typeof SENSORY_LEVEL_ERROR_MESSAGES;

/**
 * Domain error for sensory level calculation failures.
 * Enables programmatic error handling (e.g. by error code) and consistent messaging.
 */
export class SensoryLevelError extends Error {
  readonly code: SensoryLevelErrorCode;

  constructor(code: SensoryLevelErrorCode, message?: string) {
    const resolvedMessage = message ?? SENSORY_LEVEL_ERROR_MESSAGES[code];
    super(resolvedMessage);
    this.name = 'SensoryLevelError';
    this.code = code;
    Object.setPrototypeOf(this, SensoryLevelError.prototype);
  }
}
