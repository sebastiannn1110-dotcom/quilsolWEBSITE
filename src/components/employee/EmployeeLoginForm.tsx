"use client";

import Image from "next/image";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { commerceClient } from "@/lib/platform-api/client";

export function EmployeeLoginForm({
  locale,
  mode,
}: {
  locale: string;
  mode: "mock" | "platform" | "pending";
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      await commerceClient.login({
        email: String(form.get("email") || ""),
        password: String(form.get("password") || ""),
        remember: form.get("remember") === "on",
      });
      router.replace(`/${locale}/employee`);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible iniciar sesión.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={`employee-portal-root grid min-h-dvh bg-[#f7f3ef] lg:grid-cols-[1.05fr_0.95fr] ${
        mode === "mock" ? "pt-9" : ""
      }`}
    >
      {mode === "mock" ? (
        <div className="fixed inset-x-0 top-0 z-50 flex h-9 items-center justify-center bg-orange-600 px-4 text-center text-xs font-extrabold tracking-[0.12em] text-white">
          MODO DEMOSTRACIÓN — Datos sintéticos
        </div>
      ) : null}
      <section className="relative hidden overflow-hidden bg-[#062f33] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,106,42,.44), transparent 30%), linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
            backgroundSize: "auto, 42px 42px, 42px 42px",
          }}
        />
        <Image
          src="/logos/quicksol-logo.svg"
          alt="Quiksol"
          width={230}
          height={58}
          priority
          className="relative brightness-0 invert"
        />
        <div className="relative max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-300">
            Área comercial
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight">
            Cotiza, aparta y acompaña cada venta.
          </h1>
        </div>
      </section>

      <section className="flex min-h-dvh items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <Image
            src="/logos/quicksol-logo.svg"
            alt="Quiksol"
            width={190}
            height={48}
            priority
            className="mb-10 lg:hidden"
          />
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-950/5 sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
              <LockKeyhole aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold text-slate-950">
              Iniciar sesión
            </h2>
            <p className="mt-2 leading-7 text-slate-600">
              Acceso exclusivo para empleados y vendedores.
            </p>

            {mode === "pending" ? (
              <div
                className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
                role="status"
              >
                <strong>Integración de autenticación pendiente.</strong> Las
                credenciales pueden ingresarse, pero el modo demostración debe
                habilitarse en la configuración segura del servidor.
              </div>
            ) : mode === "mock" ? (
              <div className="mt-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
                Modo demostración habilitado expresamente. Los datos de esta
                sesión son sintéticos y no tienen validez comercial.
              </div>
            ) : null}

            <form
              className="mt-7 grid gap-5"
              method="post"
              action="/api/employee/auth/session"
              onSubmit={submit}
            >
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Usuario o email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  className="focus-ring h-12 rounded-lg border border-slate-300 px-4 font-normal disabled:bg-slate-100"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Contraseña
                <span className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="focus-ring h-12 w-full rounded-lg border border-slate-300 px-4 pr-12 font-normal disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="focus-ring absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-600"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" size={19} />
                    ) : (
                      <Eye aria-hidden="true" size={19} />
                    )}
                  </button>
                </span>
              </label>
              <label className="flex min-h-11 items-center gap-3 text-sm text-slate-700">
                <input
                  name="remember"
                  type="checkbox"
                  className="h-5 w-5 accent-orange-600"
                />
                Recordar sesión
              </label>
              <button
                type="submit"
                disabled={pending}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {pending ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin"
                    size={19}
                  />
                ) : null}
                {pending ? "Validando…" : "Entrar al área comercial"}
              </button>
              {message ? (
                <p
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                  role="alert"
                >
                  {message}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
