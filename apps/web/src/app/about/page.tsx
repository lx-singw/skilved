import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, Bookmark, Compass, FileText, GitBranch, Info, Link2, Route } from "lucide-react"
import { CATEGORY_LABELS, CategorySchema } from "@skilved/types/opportunities"
import { Header } from "@/components/layout/Header"
import { OpportunityGlyph } from "@/components/catalogue/OpportunityIdentity"
import { opportunityIdentity } from "@/lib/opportunity-presentation"
export const dynamic = "force-dynamic"
export const metadata = { title: "About Skilved" }

const journey=[
  {number:"01",title:"Find a possibility.",text:"Browse work, study and learning notices. Use the place, field and source-stated stage filters to narrow your feed.",href:"/",action:"Open your feed",icon:Compass},
  {number:"02",title:"Read how it fits together.",text:"Follow the notice’s original wording, alternative routes and conditions. Open an instruction to inspect its details and sources.",href:"#about-evidence-question",action:"Understand the evidence",icon:GitBranch},
  {number:"03",title:"Keep your place.",text:"Build a shortlist and keep a personal stage in this browser. Return to the current notice when you are ready to continue.",href:"/saved",action:"Visit Saved",icon:Bookmark},
  {number:"04",title:"Follow the stated method.",text:"Read the application instructions for the website, email, postal or in-person route given in the notice. You complete and submit the application yourself.",href:"#about-application-question",action:"Read about applying",icon:Route},
] as const

export default function AboutPage() {
  const ready=process.env.SKILVED_CATALOGUE_READS==="true"
  return <><Header/><main id="main-content" className="workspace about-workspace">
    <section className="about-intro" aria-labelledby="about-title">
      <div className="about-intro-copy"><p className="eyebrow">A small guide to Skilved</p><h1 id="about-title">A next step,<br/><em>with the details.</em></h1><p>Work, study and learning possibilities, with the notice, its conditions and its references in one place. Explore at your own pace.</p><ul className="about-grounding"><li>Built for South Africa</li><li>Free to browse</li><li>No account needed</li></ul><div className="about-intro-actions"><Link className="primary-button" href="/">Explore your feed<ArrowUpRight size={17} aria-hidden/></Link><a href="#about-journey">Read the field guide<ArrowDownRight size={15} aria-hidden/></a></div></div>
      <figure className="about-notice-anatomy" aria-labelledby="about-anatomy-title"><figcaption><span className="mini-label">Anatomy of a notice</span><h2 id="about-anatomy-title">Read it in layers.</h2></figcaption><ol>
        <li><span className="about-layer-number">01</span><div><FileText size={19} aria-hidden/><h3>The notice’s wording</h3><p>What is offered, by whom, and what is stated.</p></div></li>
        <li><span className="about-layer-number">02</span><div><GitBranch size={19} aria-hidden/><h3>Connected requirements</h3><p>Read alternatives and conditions together.</p><span className="about-route-key">AND <i aria-hidden/> OR <i aria-hidden/> IF</span></div></li>
        <li><span className="about-layer-number">03</span><div><Link2 size={19} aria-hidden/><h3>Sources and checks</h3><p>Trace the references. Read the scope of each check.</p></div></li>
      </ol><p className="about-anatomy-caption">The reading layers, illustrated.</p></figure>
    </section>

    <section id="about-journey" className="about-journey" aria-labelledby="about-journey-title"><header><p className="mini-label">Your pace. Your next move.</p><h2 id="about-journey-title">From a possibility to a plan.</h2><p>You can start with a browse and come back when you know what you want to pursue.</p></header><ol>{journey.map(step=>{const Icon=step.icon;return <li key={step.number}><span className="about-step-number" aria-hidden>{step.number}</span><div><h3><Icon size={18} aria-hidden/>{step.title}</h3><p>{step.text}</p></div><Link href={step.href}>{step.action}<ArrowUpRight size={15} aria-hidden/></Link></li>})}</ol></section>

    <section className="about-pathways" aria-labelledby="about-pathways-title"><header><p className="mini-label">More than one way forward</p><h2 id="about-pathways-title">Choose a place to begin.</h2><p>Each category keeps its own work, study or training context.</p></header><nav className="about-category-grid" aria-label="Explore opportunity pathways">{CategorySchema.options.map(category=>{const identity=opportunityIdentity[category];return <Link key={category} className={`about-category-route ${identity.theme}`} href={`/?category=${category}`}><OpportunityGlyph category={category}/><span><strong>{CATEGORY_LABELS[category]}</strong><small>{identity.focus}</small></span><ArrowUpRight size={15} aria-hidden/></Link>})}</nav></section>

    <section className="about-questions" aria-labelledby="about-questions-title"><header><p className="mini-label">Before you make your move</p><h2 id="about-questions-title">A few useful things to know.</h2></header><div className="about-question-list">
      <details><summary id="about-saved-question">What does Saved remember?<ArrowDownRight size={17} aria-hidden/></summary><div><p>Your shortlist, personal stage and local activity history stay in this browser. Clearing site data, changing browsers or moving devices can lose that access. People using this browser may see it. There is no account backup or cross-device sync.</p><p>Requirement review ticks are temporary and are separate from your saved list. Marking a stage yourself does not establish an issuer’s application record.</p><Link href="/saved">Open your saved workspace<ArrowUpRight size={13} aria-hidden/></Link></div></details>
      <details><summary id="about-evidence-question">What do source checks tell me?<ArrowDownRight size={17} aria-hidden/></summary><div><p>Each check applies to a particular question. Read its scope, outcome, cited references and recorded time. A reachable website or a count of source references does not establish that you qualify or provide an overall verdict on an opportunity.</p><p>Stated, unclear, conflicting and missing details remain distinct. Follow the original conditions and ask the issuer through the notice’s contact details when something needs clarification.</p></div></details>
      <details><summary id="about-application-question">How do I apply?<ArrowDownRight size={17} aria-hidden/></summary><div><p>Open the notice’s application details and follow its stated method. Where a website or email action is available, Skilved checks the current listing before handing you over. Read any available postal or in-person instructions in the notice before making arrangements.</p><p>You submit the application yourself and keep any acknowledgement from the issuer. Opening a route or marking Applied in Saved does not confirm submission. Accounts, document uploads and application assistance are not available in this workspace.</p></div></details>
      <details><summary id="about-suggestion-question">Can I share a notice or flag a problem?<ArrowDownRight size={17} aria-hidden/></summary><div><p>Use the suggestion desk to pass on a public notice link when intake is available. Its page explains current availability and how private receipt access stays in this browser.</p><p>If an issue-report form is available on an opportunity, use it to describe what needs checking. Receipt confirms that a report arrived, rather than a verified issue or a completed correction.</p><Link href="/suggestions">Visit the suggestion desk<ArrowUpRight size={13} aria-hidden/></Link></div></details>
    </div></section>

    <section className="about-availability" aria-labelledby="about-availability-title"><Info size={22} aria-hidden/><div><p className="mini-label">Public browsing</p><h2 id="about-availability-title">{ready?"Published notices, when available.":"Public browsing is unavailable here."}</h2><p>{ready?"Visit the feed for the currently published notices. Their details and availability can change.":"Public catalogue access is not enabled here. This guide and the browser-local Saved workspace remain available."}</p><p className="about-scope-note">This workspace supports browsing, reading and personal preparation. You stay in control of your next step.</p></div></section>
    <footer className="about-finish"><div><p className="mini-label">A place to move forward</p><h2>Start with one possibility.</h2></div><Link className="primary-button" href="/">Explore your feed<ArrowUpRight size={17} aria-hidden/></Link></footer>
  </main></>
}
