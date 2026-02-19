import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabase } from "@/lib/supabase"
import { Link, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

/** ---------- UI tiny helpers ---------- */
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs uppercase tracking-wider text-muted-foreground">{children}</label>
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-md bg-muted/60 border border-border px-3 py-2 outline-none",
        "focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/60",
        props.className
      )}
    />
  )
}
function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }
) {
  const { variant = "primary", className, ...rest } = props
  const map =
    variant === "primary"
      ? "bg-cyan-400 text-black hover:opacity-90"
      : variant === "secondary"
      ? "bg-muted text-foreground hover:bg-muted/80"
      : "hover:bg-muted/50"
  return (
    <button
      {...rest}
      className={cn(
        "h-10 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
        map,
        className
      )}
    />
  )
}

/** ---------- Validation ---------- */
const LoginSchema = z.object({
  email: z.string().email("Некоректний email"),
  password: z.string().min(6, "Мінімум 6 символів"),
})

const RegisterSchema = z
  .object({
    displayName: z.string().min(2, "Вкажи імʼя (2+)"),
    email: z.string().email("Некоректний email"),
    password: z.string().min(6, "Мінімум 6 символів"),
    confirm: z.string().min(6),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Паролі не співпадають" })

type LoginForm = z.infer<typeof LoginSchema>
type RegisterForm = z.infer<typeof RegisterSchema>

/** ---------- Animated Aside (40%) ---------- */
function AnimatedAside({ mode }: { mode: "login" | "register" }) {
  return (
    <div className="relative hidden md:flex md:w-[40%] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#0a0f14,60%,#0b1b1b)]">
      {/* animated cyan orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
      </div>

      <div className="relative z-10 px-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 px-3 py-1 text-[11px] tracking-wider text-cyan-300/90">
          SENZO CRYPTO
        </div>
        <h2 className="text-3xl font-semibold leading-tight">
          {mode === "login" ? "Повертаємось у гру" : "Стартуємо новий трек"}
        </h2>
        <p className="mt-3 text-sm text-white/70">
          {mode === "login"
            ? "Знання + практика + системність. Увійди та продовжуй свій шлях."
            : "Ти на старті системного шляху: навчання, практика та рефлексія щодня."}
        </p>
      </div>
    </div>
  )
}

/** ---------- Main ---------- */
export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const nav = useNavigate()

  // Redirect if already authed
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) nav("/learn")
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) nav("/learn")
    })
    return () => subscription.unsubscribe()
  }, [nav])

  // Login form
  const {
    register: rl,
    handleSubmit: handleLogin,
    formState: { errors: le, isSubmitting: lloading },
  } = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) })

  // Register form
  const {
    register: rr,
    handleSubmit: handleRegister,
    formState: { errors: re, isSubmitting: rloading },
  } = useForm<RegisterForm>({ resolver: zodResolver(RegisterSchema) })

  const onLogin = async (v: LoginForm) => {
    const { error } = await supabase.auth.signInWithPassword({ email: v.email, password: v.password })
    if (error) throw error
    nav("/learn")
  }

  const onRegister = async (v: RegisterForm) => {
    const { data, error } = await supabase.auth.signUp({
      email: v.email,
      password: v.password,
      options: { data: { full_name: v.displayName } },
    })
    if (error) throw error
    // Update display_name in user_profiles (trigger created the row already)
    if (data.user) {
      await supabase
        .from("user_profiles")
        .update({ display_name: v.displayName })
        .eq("id", data.user.id)
    }
    nav("/onboarding")
  }

  const loginGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/learn" },
    })
    if (error) throw error
    // OAuth redirects the page — nav() not needed
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a0f14] text-foreground flex">
      {/* ASIDE 40% */}
      <AnimatedAside mode={mode} />

      {/* FORM 60% */}
      <div className="relative flex w-full md:w-[60%] items-center justify-center">
        {/* Subtle moving gradient backplate */}
        <div className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(50%_50%_at_50%_40%,#000_30%,transparent_80%)]">
          <div className="absolute -right-24 -top-24 h-72 w-72 animate-slow-spin rounded-full bg-[conic-gradient(from_0deg,transparent_0_140deg,#22d3ee_160deg,#1c1f24_220deg,#22d3ee_260deg,transparent_320deg)]" />
        </div>

        <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/70 p-6 shadow-[0_0_40px_-10px_rgba(34,211,238,.25)] backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{mode === "login" ? "Вхід" : "Реєстрація"}</h1>
            <button
              className="text-xs text-cyan-300 hover:underline"
              onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
            >
              {mode === "login" ? "Створити акаунт" : "У мене вже є акаунт"}
            </button>
          </div>

          {mode === "login" ? (
            <form className="grid gap-4" onSubmit={handleLogin(onLogin)}>
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="you@domain.com" {...rl("email")} />
                {le.email && <p className="text-xs text-red-400">{le.email.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label>Пароль</Label>
                <Input type="password" placeholder="••••••••" {...rl("password")} />
                {le.password && <p className="text-xs text-red-400">{le.password.message}</p>}
              </div>
              <Button type="submit" disabled={lloading} className="mt-2">
                {lloading ? "Входимо..." : "Увійти"}
              </Button>
              <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> або <span className="h-px flex-1 bg-border" />
              </div>
              <Button type="button" variant="secondary" onClick={loginGoogle}>
                Увійти через Google
              </Button>
              <p className="mt-4 text-xs opacity-70">
                Натискаючи «Увійти», ти погоджуєшся з нашими{" "}
                <Link to="#" className="text-cyan-300 hover:underline">
                  умовами
                </Link>
                .
              </p>
            </form>
          ) : (
            <form className="grid gap-4" onSubmit={handleRegister(onRegister)}>
              <div className="grid gap-1.5">
                <Label>Імʼя профілю</Label>
                <Input placeholder="senzo_trader" {...rr("displayName")} />
                {re.displayName && <p className="text-xs text-red-400">{re.displayName.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="you@domain.com" {...rr("email")} />
                {re.email && <p className="text-xs text-red-400">{re.email.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label>Пароль</Label>
                <Input type="password" placeholder="••••••••" {...rr("password")} />
                {re.password && <p className="text-xs text-red-400">{re.password.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label>Повтор пароля</Label>
                <Input type="password" placeholder="••••••••" {...rr("confirm")} />
                {re.confirm && <p className="text-xs text-red-400">{re.confirm.message}</p>}
              </div>
              <Button type="submit" disabled={rloading} className="mt-2">
                {rloading ? "Створюємо..." : "Зареєструватися"}
              </Button>
              <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> або <span className="h-px flex-1 bg-border" />
              </div>
              <Button type="button" variant="secondary" onClick={loginGoogle}>
                Продовжити з Google
              </Button>
              <p className="mt-4 text-xs opacity-70">
                Вже є акаунт?{" "}
                <button className="text-cyan-300 hover:underline" onClick={() => setMode("login")}>
                  Увійти
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
