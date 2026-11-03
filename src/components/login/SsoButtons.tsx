type Props = {
  onSelect: (provider: "Microsoft" | "Google") => void
  busy?: boolean
}

const btn =
  "flex h-12 flex-1 items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white text-[15px] font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"

export function SsoButtons({ onSelect, busy }: Props) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        className={btn}
        disabled={busy}
        onClick={() => onSelect("Microsoft")}
      >
        <svg viewBox="0 0 21 21" className="size-[18px]" aria-hidden="true">
          <rect x="1" y="1" width="9" height="9" fill="#f25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
          <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
        </svg>
        Microsoft
      </button>
      <button
        type="button"
        className={btn}
        disabled={busy}
        onClick={() => onSelect("Google")}
      >
        <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
          />
          <path
            fill="#FBBC05"
            d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
          />
        </svg>
        Google
      </button>
    </div>
  )
}
