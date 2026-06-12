import { ImageResponse } from "next/og"
export const runtime = "edge"
export const size = { width: 1200, height: 630 }
export default function OgImage() {
  return new ImageResponse(
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:"100%", height:"100%", background:"#0f172a" }}>
      <span style={{ color:"white", fontSize:48, fontWeight:700 }}>Skilved</span>
    </div>
  )
}
