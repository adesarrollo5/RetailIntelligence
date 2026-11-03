import { useState, type FormEvent } from "react"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"
import type { Client } from "../../types"
import { BrandMark } from "../BrandMark"
import { OtpInput } from "./OtpInput"
import { SsoButtons } from "./SsoButtons"
import type { LoginTheme } from "./loginTheme"

const DEMO_PASSWORD = "demoretail123"
const DEMO_CODE = "123456"
const MAX_ATTEMPTS = 5

type Props = {
  client: Client
  theme: LoginTheme
  onSuccess: () => void
}

type Errors = { email?: string; password?: string }

const inputBase =
  "h-12 w-full rounded-lg border bg-white px-3.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4"

function fieldClass(invalid: boolean) {
  return `${inputBase} ${
    invalid
      ? "border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-[var(--brand)] focus:ring-[color-mix(in_srgb,var(--brand)_18%,transparent)]"
  }`
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-5 text-red-700"
    >
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      {message}
    </p>
  )
}

export function LoginForm({ client, theme, onSuccess }: Props) {
  const adminEmail = `admin@${client.appearance.subdomain}.co`
  const [step, setStep] = useState<"credentials" | "code">("credentials")
  const [email, setEmail] = useState(adminEmail)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [attempts, setAttempts] = useState(0)
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState("")
  const [codeError, setCodeError] = useState("")

  const locked = attempts >= MAX_ATTEMPTS
  const hasSso = client.plan === "Avanzado"

  const validateEmail = (value: string): string | undefined => {
    const v = value.trim().toLowerCase()
    if (!v) return "Escriba su correo electrónico."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
      return "El correo no tiene un formato válido. Use el formato nombre@empresa.co."
    const domain = v.split("@")[1]
    if (!domain.includes(client.appearance.subdomain))
      return `Este correo no pertenece a ${client.name}. Use su correo corporativo, por ejemplo ${adminEmail}.`
    return undefined
  }

  const submitCredentials = (e: FormEvent) => {
    e.preventDefault()
    setNotice("")
    if (locked) return
    const next: Errors = { email: validateEmail(email) }
    if (!password) next.password = "Escriba su contraseña."
    else if (password.length < 8)
      next.password = "La contraseña tiene al menos 8 caracteres."
    if (next.email || next.password) {
      setErrors(next)
      return
    }
    if (password !== DEMO_PASSWORD) {
      const used = attempts + 1
      setAttempts(used)
      setErrors({
        password:
          used >= MAX_ATTEMPTS
            ? "Cuenta bloqueada por 15 minutos tras 5 intentos fallidos. Restablezca su contraseña para ingresar antes."
            : `La contraseña no es correcta. Revise mayúsculas y minúsculas. Le quedan ${MAX_ATTEMPTS - used} ${
                MAX_ATTEMPTS - used === 1 ? "intento" : "intentos"
              } antes del bloqueo temporal.`,
      })
      return
    }
    setErrors({})
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      setStep("code")
    }, 450)
  }

  const submitCode = (e?: FormEvent) => {
    e?.preventDefault()
    if (code.length < 6) {
      setCodeError(
        `Faltan ${6 - code.length} ${
          6 - code.length === 1 ? "dígito" : "dígitos"
        }. Complete los 6 dígitos del código.`,
      )
      return
    }
    if (code !== DEMO_CODE) {
      setCodeError(
        "El código no es correcto o ya venció. Abra su aplicación de autenticación e ingrese el código actual.",
      )
      setCode("")
      return
    }
    setCodeError("")
    setBusy(true)
    window.setTimeout(onSuccess, 350)
  }

  const forgotPassword = () => {
    const err = validateEmail(email)
    if (err) {
      setErrors({
        email:
          email.trim() === ""
            ? "Escriba su correo para enviarle las instrucciones de recuperación."
            : err,
      })
      setNotice("")
      return
    }
    setErrors({})
    setNotice(
      `Enviamos las instrucciones para restablecer la contraseña a ${email.trim()}.`,
    )
  }

  const primaryButton =
    "flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] text-[15px] font-semibold text-white hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-60"

  return (
    <div className="w-full max-w-[380px]">
      <div className="mb-8 flex items-center gap-3">
        <BrandMark
          client={client}
          compact
          appearanceOverride={{
            ...client.appearance,
            primaryColor: theme.primary,
            accentColor: theme.accent,
          }}
        />
        <span className="text-lg font-semibold text-slate-900">
          {client.shortName}
        </span>
      </div>

      {step === "credentials" ? (
        <>
          <h1 className="mb-7 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-slate-900">
            Ingrese a su cuenta
          </h1>
          <form className="space-y-5" onSubmit={submitCredentials} noValidate>
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors((p) => ({ ...p, email: undefined }))
                  setNotice("")
                }}
                aria-invalid={!!errors.email}
                aria-describedby={
                  errors.email ? "login-email-error" : undefined
                }
                className={fieldClass(!!errors.email)}
                placeholder={adminEmail}
              />
              <FieldError id="login-email-error" message={errors.email} />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrors((p) => ({ ...p, password: undefined }))
                  }}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "login-password-error" : undefined
                  }
                  className={`${fieldClass(!!errors.password)} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? (
                    <EyeOff className="size-[18px]" />
                  ) : (
                    <Eye className="size-[18px]" />
                  )}
                </button>
              </div>
              <FieldError id="login-password-error" message={errors.password} />
              <button
                type="button"
                onClick={forgotPassword}
                className="mt-2.5 text-sm font-medium text-[var(--brand)] hover:underline"
              >
                ¿Olvidó su contraseña?
              </button>
              {notice && (
                <p
                  role="status"
                  className="mt-2 flex items-start gap-1.5 text-[13px] leading-5 text-emerald-700"
                >
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                  {notice}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={busy || locked}
              className={primaryButton}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              Ingresar
            </button>
          </form>

          {hasSso && (
            <div className="mt-6">
              <div className="mb-4 flex items-center gap-3 text-[13px] text-slate-500">
                <span className="h-px flex-1 bg-slate-200" />o continúe con
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <SsoButtons busy={busy} onSelect={() => onSuccess()} />
            </div>
          )}
        </>
      ) : (
        <form onSubmit={submitCode} noValidate>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-slate-900">
            Verifique su identidad
          </h1>
          <p className="mb-6 mt-2 text-[15px] leading-6 text-slate-600">
            Ingrese el código de 6 dígitos de su aplicación de autenticación.
          </p>
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v)
              setCodeError("")
            }}
            invalid={!!codeError}
            describedBy={codeError ? "login-code-error" : undefined}
          />
          <FieldError id="login-code-error" message={codeError} />
          <p className="mt-3 text-[13px] text-slate-500">
            Código de demostración: {DEMO_CODE}
          </p>
          <button
            type="submit"
            disabled={busy}
            className={`${primaryButton} mt-6`}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Verificar
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("credentials")
              setCode("")
              setCodeError("")
            }}
            className="mt-4 w-full text-center text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Volver
          </button>
        </form>
      )}
    </div>
  )
}
