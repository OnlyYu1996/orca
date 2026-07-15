const CODEBUDDY_HEADLESS_PROMPT_FLAGS = new Set(['--print', '-p'])

function optionName(token: string): string {
  const equalsIndex = token.indexOf('=')
  return equalsIndex === -1 ? token : token.slice(0, equalsIndex)
}

export function isCodeBuddyHeadlessOneShotCommand(tokens: readonly string[]): boolean {
  for (let index = 1; index < tokens.length; index += 1) {
    const name = optionName(tokens[index])
    if (CODEBUDDY_HEADLESS_PROMPT_FLAGS.has(name) || /^-p[^-]/.test(name)) {
      return true
    }
  }
  return false
}
