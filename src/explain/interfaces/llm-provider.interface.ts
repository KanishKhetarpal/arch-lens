/**
 * Minimal seam for plugging in a real LLM backend. `ExplanationPromptBuilder`
 * only ever produces a prompt string and hands it to a provider — arch-lens
 * itself ships no concrete implementation or API keys.
 */
export interface LlmProvider {
  readonly name: string;
  complete(prompt: string): Promise<string>;
}
