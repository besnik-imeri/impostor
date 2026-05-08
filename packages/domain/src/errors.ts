export class GameRuleError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GameRuleError";
    this.code = code;
  }
}

export function assertRule(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new GameRuleError(code, message);
  }
}
