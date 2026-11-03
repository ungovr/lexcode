/** A failure of the tool itself, never a finding. The CLI maps it to exit 2. */
export class ToolError extends Error {
  readonly exitCode = 2;
  constructor(message: string) {
    super(message);
    this.name = 'ToolError';
  }
}
