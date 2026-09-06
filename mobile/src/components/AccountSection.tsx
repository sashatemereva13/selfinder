import { useAuthStore } from '../store/authStore';
import { AuthForm } from './account/AuthForm';
import { LoggedInAccount } from './account/LoggedInAccount';

export function AccountSection() {
  const session = useAuthStore((s) => s.session);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);

  if (session) {
    return <LoggedInAccount session={session} onLogout={logout} />;
  }
  return <AuthForm onLogin={login} onRegister={register} />;
}
