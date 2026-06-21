/**
 * Streak computation result.
 */

export type StreakUpdate = {
  /** The streak length after accounting for today. */
  streak: number;
  /** True if today is the first active day recorded (i.e. streak advanced). */
  isNewActiveDay: boolean;
};
