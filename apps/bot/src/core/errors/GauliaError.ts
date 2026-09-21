import type { TranslationVars } from "../../i18n";

/**
 * Expected error (failed validation, missing permission, ...) whose message is meant for the
 * member. It carries a translation key rather than a sentence, so the text is resolved in the
 * reader's own language when the reply is built.
 */
export class GauliaError extends Error {
  public readonly key: string;
  public readonly vars: TranslationVars | undefined;

  constructor(key: string, vars?: TranslationVars) {
    super(key);
    this.name = "GauliaError";
    this.key = key;
    this.vars = vars;
  }
}
