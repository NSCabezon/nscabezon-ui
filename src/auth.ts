// Entrada "@nscabezon/ui/auth": login social (Google / Apple) sobre Supabase.
export {
  OAuthButtons,
  type OAuthButtonsProps,
  type OAuthProviderOptions,
  type OAuthSignInClient,
} from './auth/OAuthButtons'
export { AppleIcon, GoogleIcon, type AuthIconProps } from './auth/icons'
export {
  DEFAULT_LAST_AUTH_METHOD_KEY,
  getLastAuthMethod,
  setLastAuthMethod,
  type AuthMethod,
  type OAuthProvider,
} from './auth/lastAuthMethod'
