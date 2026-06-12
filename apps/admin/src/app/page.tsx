import Link from "next/link"
export default function AdminHome() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Skilved Admin</h1>
      <nav className="space-y-2">
        {["agents","autonomy","metrics","opportunities","users","graph","setas","employers"].map(s => (
          <div key={s}><Link href={`/${s}`} className="text-blue-400 hover:underline capitalize">{s}</Link></div>
        ))}
      </nav>
    </main>
  )
}
