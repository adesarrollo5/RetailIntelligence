import { useRef } from "react"

type Props = {
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  describedBy?: string
  onComplete?: () => void
}

/** Seis casillas para el código de doble factor, con pegado y navegación. */
export function OtpInput({
  value,
  onChange,
  invalid,
  describedBy,
  onComplete,
}: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "")

  const commit = (next: string, focusIndex: number) => {
    onChange(next)
    refs.current[Math.min(focusIndex, 5)]?.focus()
    if (next.length === 6) onComplete?.()
  }

  return (
    <div className="flex gap-2.5" role="group" aria-label="Código de 6 dígitos">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          autoFocus={i === 0}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Dígito ${i + 1} de 6`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          value={d}
          maxLength={1}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const char = e.target.value.replace(/\D/g, "").slice(-1)
            const arr = digits.slice()
            arr[i] = char
            const next = arr.join("").slice(0, 6)
            if (char) commit(arr.slice(0, 6).join(""), i + 1)
            else onChange(next)
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              e.preventDefault()
              const arr = digits.slice()
              arr[i - 1] = ""
              onChange(arr.join(""))
              refs.current[i - 1]?.focus()
            } else if (e.key === "ArrowLeft" && i > 0) {
              refs.current[i - 1]?.focus()
            } else if (e.key === "ArrowRight" && i < 5) {
              refs.current[i + 1]?.focus()
            }
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, 6)
            if (!pasted) return
            e.preventDefault()
            commit(pasted, pasted.length)
          }}
          className={`h-14 min-w-0 flex-1 rounded-lg border bg-white text-center text-xl font-semibold text-slate-900 outline-none transition focus:ring-4 ${
            invalid
              ? "border-red-500 focus:ring-red-100"
              : "border-slate-300 focus:border-[var(--brand)] focus:ring-[color-mix(in_srgb,var(--brand)_18%,transparent)]"
          }`}
        />
      ))}
    </div>
  )
}
