export function mapAuthError(message: string | undefined): string {
  if (!message) return 'Something went wrong. Please try again.'
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email or password is incorrect.'
  if (m.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox.'
  if (m.includes('user already registered')) return 'An account with this email already exists.'
  if (m.includes('email rate limit')) return "You've requested this too many times. Wait a few minutes."
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Wait a minute and try again.'
  if (m.includes('password should be')) return message
  return message
}

export function isEmailNotConfirmed(message: string | undefined): boolean {
  return !!message && message.toLowerCase().includes('email not confirmed')
}
