# Preserved prototype sources — not routed or built

These files were moved out of `src/app` or the public catalogue during B01 stabilisation. They preserve earlier UI and agent experiments for selective later reuse. They are not a runnable application or a deployed feature.

The sample opportunities contain invented requirements, companies, relative dates and verification flags. The old API handlers use shared identity and simulated results. Do not import these files into the public app, seed them into real inventory, or restore handlers without the appropriate source, identity and release controls. The web lint rules reject prototype/agent imports from production source.

`prototype/` is excluded from web TypeScript and lint checks. Whole-workspace/agent readiness is separate from the scoped web checks. Moving these files does not retire the six-category, personal-career or institutional roadmap.
