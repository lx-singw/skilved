"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { ProfileCompletion } from "@/components/profile/ProfileCompletion"
import { PROVINCES } from "@/constants/provinces"
import { TRADES } from "@/constants/trades"
import { DEMO_USERNAME } from "@/lib/profiles"
import { cn } from "@/utils/classNames"
import type { UserProfile } from "@/types/user"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  )
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

const selectCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"

export default function ProfileEditPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state — only the editable flat fields
  const [displayName, setDisplayName] = useState("")
  const [headline, setHeadline] = useState("")
  const [bio, setBio] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")
  const [primaryTrade, setPrimaryTrade] = useState("")
  const [publicProfile, setPublicProfile] = useState(true)
  const [showWorkHistory, setShowWorkHistory] = useState(true)
  const [showCertificates, setShowCertificates] = useState(true)
  const [showCareerPlan, setShowCareerPlan] = useState(true)

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: UserProfile) => {
        setProfile(data)
        setDisplayName(data.displayName)
        setHeadline(data.headline ?? "")
        setBio(data.bio ?? "")
        setCity(data.city)
        setProvince(data.province)
        setPrimaryTrade(data.primaryTrade)
        setPublicProfile(data.visibility.publicProfile)
        setShowWorkHistory(data.visibility.showWorkHistory)
        setShowCertificates(data.visibility.showCertificates)
        setShowCareerPlan(data.visibility.showCareerPlan)
      })
      .catch(() => setError("Could not load profile."))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          headline: headline || undefined,
          bio: bio || undefined,
          city,
          province,
          primaryTrade,
          visibility: {
            publicProfile,
            showWorkHistory,
            showCertificates,
            showApplications: profile?.visibility.showApplications ?? false,
            showCareerPlan,
          },
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      const updated: UserProfile = await res.json()
      setProfile(updated)
      setSaved(true)
      setTimeout(() => {
        router.push(`/profile/${DEMO_USERNAME}`)
      }, 800)
    } catch {
      setError("Could not save changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-2xl px-4 pt-16 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">Loading profile…</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        {/* Back nav */}
        <Link
          href={`/profile/${DEMO_USERNAME}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to profile
        </Link>

        <h1 className="mb-2 text-xl font-bold text-foreground">Edit profile</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Changes are reflected on your public Skilved profile immediately.
        </p>

        {/* Live completion card */}
        <div className="mb-8">
          <ProfileCompletion profile={profile} showHints />
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* ---- Identity ---- */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Identity
            </legend>

            <Field label="Full name">
              <input
                className={inputCls}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
                required
                maxLength={80}
              />
            </Field>

            <Field
              label="Headline"
              hint="One line that appears below your name on the public profile."
            >
              <input
                className={inputCls}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Electrical apprentice · Eskom · Johannesburg"
                maxLength={120}
              />
            </Field>

            <Field label="About" hint="A short paragraph about your experience and goals.">
              <textarea
                className={cn(inputCls, "min-h-[96px] resize-y")}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell employers and the Career agent about yourself…"
                maxLength={600}
                rows={4}
              />
            </Field>
          </fieldset>

          {/* ---- Location ---- */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Location
            </legend>

            <div className="grid grid-cols-2 gap-4">
              <Field label="City">
                <input
                  className={inputCls}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Johannesburg"
                  required
                  maxLength={60}
                />
              </Field>

              <Field label="Province">
                <select
                  className={selectCls}
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  required
                >
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </fieldset>

          {/* ---- Trade ---- */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Trade
            </legend>

            <Field label="Primary trade" hint="The main trade the Career agent will use to match you.">
              <select
                className={selectCls}
                value={primaryTrade}
                onChange={(e) => setPrimaryTrade(e.target.value)}
                required
              >
                <option value="">Select trade</option>
                {TRADES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
          </fieldset>

          {/* ---- Visibility ---- */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Visibility
            </legend>

            {(
              [
                { key: "publicProfile",    label: "Public profile",    state: publicProfile,    set: setPublicProfile },
                { key: "showWorkHistory",  label: "Show work history", state: showWorkHistory,  set: setShowWorkHistory },
                { key: "showCertificates", label: "Show certificates", state: showCertificates, set: setShowCertificates },
                { key: "showCareerPlan",   label: "Show career plan",  state: showCareerPlan,   set: setShowCareerPlan },
              ] as const
            ).map(({ key, label, state, set }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <span className="text-sm font-medium text-foreground">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={state}
                  onClick={() => (set as (v: boolean) => void)(!state)}
                  className={cn(
                    "relative inline-flex h-5 w-9 flex-none items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    state ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                      state ? "translate-x-4" : "translate-x-1",
                    )}
                  />
                </button>
              </label>
            ))}
          </fieldset>

          {/* ---- Actions ---- */}
          {error && (
            <p role="alert" className="rounded-lg bg-amber/10 px-4 py-3 text-sm text-amber">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || saved}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
                saved
                  ? "bg-verified text-verified-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60",
              )}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              {saved ? "Saved!" : saving ? "Saving…" : "Save changes"}
            </button>

            <Link
              href={`/profile/${DEMO_USERNAME}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </>
  )
}
