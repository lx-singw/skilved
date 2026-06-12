import { Award, ShieldCheck } from "lucide-react"
import { cn } from "@/utils/classNames"
import type { Certificate } from "@/types/user"

interface ProfileCertificatesProps {
  certificates: Certificate[]
}

function formatDate(ym: string): string {
  const [y, m] = ym.split("-")
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-ZA", {
    month: "short",
    year: "numeric",
  })
}

function isExpired(expiresDate?: string): boolean {
  if (!expiresDate) return false
  const [y, m] = expiresDate.split("-")
  return new Date(Number(y), Number(m) - 1) < new Date()
}

function CertCard({ cert }: { cert: Certificate }) {
  const expired = isExpired(cert.expiresDate)
  const isVerified = cert.status === "verified"

  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md",
          isVerified ? "bg-verified/10 text-verified" : "bg-muted text-muted-foreground",
        )}
        aria-hidden
      >
        <Award className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <p className="font-semibold leading-snug text-foreground">{cert.name}</p>
          <div className="flex items-center gap-1.5">
            {cert.nqfLevel && (
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                NQF {cert.nqfLevel}
              </span>
            )}
            {isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-verified/40 bg-verified/10 px-2 py-0.5 text-xs font-medium text-verified">
                <ShieldCheck className="h-3 w-3" aria-hidden />
                Verified
              </span>
            ) : (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Self-reported
              </span>
            )}
          </div>
        </div>

        <p className="mt-0.5 text-sm text-muted-foreground">{cert.issuer}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Issued {formatDate(cert.issuedDate)}</span>
          {cert.expiresDate && (
            <>
              <span className="text-border">·</span>
              <span className={expired ? "font-medium text-amber" : ""}>
                {expired ? "Expired" : "Expires"} {formatDate(cert.expiresDate)}
              </span>
            </>
          )}
        </div>
      </div>
    </li>
  )
}

export function ProfileCertificates({ certificates }: ProfileCertificatesProps) {
  if (certificates.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
        <Award className="h-5 w-5 flex-none text-muted-foreground/50" aria-hidden />
        <p className="text-sm text-muted-foreground">No certificates added yet.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3" aria-label="Certificates and qualifications">
      {certificates.map((cert) => (
        <CertCard key={cert.id} cert={cert} />
      ))}
    </ul>
  )
}
