#!/bin/bash
agents=(
  'analyst:Analyst'
  'application:Application'
  'career:Career'
  'customer-success:Customer Success'
  'growth:Growth'
  'matching:Matching'
  'notification:Notification'
  'outcome-tracker:Outcome Tracker'
  'quality:Quality'
  'revenue:Revenue'
  'scout:Scout'
  'webhook-handler:Webhook Handler'
)

for entry in "${agents[@]}"; do
  slug="${entry%%:*}"
  name="${entry##*:}"
  base="/home/lx_singw/projects/skilved/apps/agents/$slug/src/app"

  cat > "$base/layout.tsx" << EOF
export const metadata = { title: "Skilved Agent — ${name}" }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
EOF

  safe_name="${name// /}"
  cat > "$base/page.tsx" << EOF
export default function ${safe_name}AgentPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">${name} Agent</h1>
      <p className="mt-2 text-gray-600">Skilved ${name} agent dashboard</p>
    </main>
  )
}
EOF

done
echo "all agent pages created"
