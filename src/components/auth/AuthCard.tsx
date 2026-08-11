/**
 * AuthCard — la zone sanctuaire : le formulaire de connexion / inscription.
 *
 * Invariants : position, taille, ordre de tabulation et contraste sont
 * FIXES. Aucun decor n'a le droit de modifier la geometrie de cette carte.
 * C'est la zone ou l'utilisateur tape ses identifiants ; elle ne bouge pas.
 *
 * La carte pose en plus son propre voile opaque pour garantir la
 * lisibilite quel que soit le skin affiche derriere.
 *
 * Validation client :
 *   - courriel : presence + format HTML5 (`type="email"` + check manuel)
 *   - mot de passe : >= 8 caracteres ; l'inscription exige aussi
 *     confirmation et 12 caracteres minimum
 *
 * Aucune logique reseau ici : les appels Supabase sont faits par le
 * composant parent. On remonte via `onSubmit({ email, password })`.
 */

import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export type AuthMode = 'signin' | 'signup';

export interface AuthCardValues {
  email: string;
  password: string;
  /** Niveau d'entree (voir authProviders.ts). Non pertinent pour la
   *  connexion, requis pour l'inscription. */
  level: 'architect' | 'coach';
}

export interface AuthCardProps {
  mode: AuthMode;
  onModeChange: (m: AuthMode) => void;
  onSubmit: (v: AuthCardValues) => void | Promise<void>;
  /** Niveau par defaut pour l'inscription ; surchargeable plus tard. */
  defaultLevel?: AuthCardValues['level'];
  /** Vrai si on est en train d'attendre la reponse reseau. */
  loading?: boolean;
  /** Message d'erreur a afficher dans la carte (par exemple "mot de passe
   *  incorrect" renvoye par Supabase). */
  errorMessage?: string | null;
}

interface FieldErrors {
  email?: string;
  password?: string;
  confirm?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(mode: AuthMode, email: string, password: string, confirm: string): FieldErrors {
  const e: FieldErrors = {};
  if (!email.trim()) e.email = 'Le courriel est requis.';
  else if (!EMAIL_RE.test(email.trim())) e.email = 'Ce courriel ne ressemble pas a une adresse valide.';
  if (!password) e.password = 'Le mot de passe est requis.';
  else if (mode === 'signup' && password.length < 12) e.password = 'Le mot de passe doit faire au moins 12 caracteres.';
  else if (mode === 'signin' && password.length < 8) e.password = 'Le mot de passe doit faire au moins 8 caracteres.';
  if (mode === 'signup') {
    if (!confirm) e.confirm = 'Confirme ton mot de passe.';
    else if (confirm !== password) e.confirm = 'Les deux mots de passe ne correspondent pas.';
  }
  return e;
}

export function AuthCard({
  mode,
  onModeChange,
  onSubmit,
  defaultLevel = 'architect',
  loading = false,
  errorMessage = null,
}: AuthCardProps): import('react').ReactNode {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; confirm?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(mode, email, password, confirm);
  const showError = (k: keyof FieldErrors): string | undefined =>
    (submitted || touched[k]) ? errors[k] : undefined;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || loading) return;
    await onSubmit({ email: email.trim().toLowerCase(), password, level: defaultLevel });
  };

  return (
    <motion.div
      // La carte ne bouge PAS. Pas de keyframes qui la deplacent, pas
      // d'animations parasites. Une legere montee a l'entree, c'est tout.
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-[420px] max-w-[calc(100vw-32px)] p-8 rounded-3xl"
      style={{
        // Voile opaque : quoi qu'il y ait derriere, le formulaire reste lisible.
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(18px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
        border: '1px solid rgba(15,23,42,0.10)',
        boxShadow: '0 30px 80px -28px rgba(15,23,42,0.40), 0 2px 8px -2px rgba(15,23,42,0.10)',
      }}
    >
      <div className="flex flex-col gap-1 mb-6">
        <h1
          className="text-[26px] font-bold tracking-tight text-stone-900"
          style={{ fontFamily: 'var(--theme-font-display)' }}
        >
          {mode === 'signup' ? 'Creer un compte Coach OS' : 'Se connecter a Coach OS'}
        </h1>
        <p className="text-sm text-stone-500">
          {mode === 'signup'
            ? 'Trois minutes suffisent. Tu pourras basculer entre tes projets sans te reconnecter.'
            : 'Heureux de te revoir. Reprends ton bureau la ou tu l’as laisse.'}
        </p>
      </div>

      {/* Bascule connexion / inscription */}
      <div
        className="flex p-1 rounded-full mb-6"
        style={{ background: 'rgba(15,23,42,0.06)' }}
        role="tablist"
      >
        {(['signin', 'signup'] as const).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onModeChange(m)}
              disabled={loading}
              className="flex-1 py-2 text-sm font-medium rounded-full transition-colors disabled:opacity-50"
              style={{
                background: active ? '#ffffff' : 'transparent',
                color: active ? '#0f172a' : '#57534e',
                boxShadow: active ? '0 1px 3px rgba(15,23,42,0.12)' : 'none',
              }}
            >
              {m === 'signin' ? 'Connexion' : 'Inscription'}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Champ courriel */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="auth-email" className="text-xs font-semibold text-stone-700">
            Adresse courriel
          </label>
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
            style={{
              borderColor: showError('email') ? '#dc2626' : 'rgba(15,23,42,0.12)',
              background: 'rgba(255,255,255,0.6)',
            }}
          >
            <Mail className="w-4 h-4 text-stone-400 shrink-0" aria-hidden />
            <input
              id="auth-email"
              type="email"
              autoComplete={mode === 'signup' ? 'email' : 'username'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              disabled={loading}
              placeholder="toi@exemple.fr"
              aria-invalid={Boolean(showError('email'))}
              aria-describedby={showError('email') ? 'auth-email-err' : undefined}
              className="flex-1 bg-transparent outline-none text-sm text-stone-900 placeholder:text-stone-400 disabled:opacity-60"
            />
          </div>
          {showError('email') && (
            <p id="auth-email-err" className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" /> {showError('email')}
            </p>
          )}
        </div>

        {/* Mot de passe */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="auth-pwd" className="text-xs font-semibold text-stone-700">
            Mot de passe
          </label>
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
            style={{
              borderColor: showError('password') ? '#dc2626' : 'rgba(15,23,42,0.12)',
              background: 'rgba(255,255,255,0.6)',
            }}
          >
            <Lock className="w-4 h-4 text-stone-400 shrink-0" aria-hidden />
            <input
              id="auth-pwd"
              type={showPwd ? 'text' : 'password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              disabled={loading}
              placeholder={mode === 'signup' ? 'Minimum 12 caracteres' : 'Minimum 8 caracteres'}
              aria-invalid={Boolean(showError('password'))}
              aria-describedby={showError('password') ? 'auth-pwd-err' : undefined}
              className="flex-1 bg-transparent outline-none text-sm text-stone-900 placeholder:text-stone-400 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              disabled={loading}
              aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="text-stone-400 hover:text-stone-600 disabled:opacity-50"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {showError('password') && (
            <p id="auth-pwd-err" className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" /> {showError('password')}
            </p>
          )}
        </div>

        {/* Confirmation a l'inscription */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-pwd-confirm" className="text-xs font-semibold text-stone-700">
              Confirme le mot de passe
            </label>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
              style={{
                borderColor: showError('confirm') ? '#dc2626' : 'rgba(15,23,42,0.12)',
                background: 'rgba(255,255,255,0.6)',
              }}
            >
              <Lock className="w-4 h-4 text-stone-400 shrink-0" aria-hidden />
              <input
                id="auth-pwd-confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                disabled={loading}
                placeholder="Le meme, une deuxieme fois"
                aria-invalid={Boolean(showError('confirm'))}
                aria-describedby={showError('confirm') ? 'auth-confirm-err' : undefined}
                className="flex-1 bg-transparent outline-none text-sm text-stone-900 placeholder:text-stone-400 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                disabled={loading}
                aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                className="text-stone-400 hover:text-stone-600 disabled:opacity-50"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {showError('confirm') && (
              <p id="auth-confirm-err" className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" /> {showError('confirm')}
              </p>
            )}
          </div>
        )}

        {errorMessage && (
          <div
            className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs"
            style={{ background: 'rgba(220,38,38,0.08)', color: '#991b1b' }}
            role="alert"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-70"
          style={{
            background: 'linear-gradient(135deg, #f08143 0%, #e07535 100%)',
            boxShadow: '0 10px 24px -10px rgba(240,129,67,0.6)',
          }}
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Patiente...
            </span>
          ) : mode === 'signup' ? 'Creer mon compte' : 'Me connecter'}
        </button>
      </form>
    </motion.div>
  );
}