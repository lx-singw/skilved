param(
    [string]$RepositoryRoot = (Join-Path $PSScriptRoot '../..')
)

$ErrorActionPreference = 'Stop'
$taskRoot = (Get-Item -LiteralPath $RepositoryRoot).FullName
$docsRoot = Join-Path $taskRoot 'docs'
$archiveRoot = Join-Path $docsRoot 'archive/2026-09-11-pre-strategy-refresh'
$manifest = Get-Content -LiteralPath (Join-Path $archiveRoot 'manifest.json') -Raw | ConvertFrom-Json
$issues = [Collections.Generic.List[string]]::new()
$currentFiles = @(Get-ChildItem -LiteralPath (Join-Path $docsRoot 'current') -Recurse -File -Filter '*.md')
$activeFiles = @(Get-ChildItem -LiteralPath $docsRoot -Recurse -File -Filter '*.md' | Where-Object {
    -not $_.FullName.StartsWith((Join-Path $docsRoot 'archive') + [IO.Path]::DirectorySeparatorChar)
}) + @(Get-Item -LiteralPath (Join-Path $taskRoot 'README.md'), (Join-Path $taskRoot 'CLAUDE.md'))
$linkCount = 0

foreach ($file in $activeFiles) {
    $body = [IO.File]::ReadAllText($file.FullName)
    $relative = [IO.Path]::GetRelativePath($taskRoot, $file.FullName).Replace('\', '/')
    if ([string]::IsNullOrWhiteSpace($body)) { $issues.Add("Empty active document: $relative") }
    foreach ($match in [regex]::Matches($body, '\[[^\]\r\n]+\]\(([^\s\)]+)\)')) {
        $link = $match.Groups[1].Value
        if ($link -match '^[a-zA-Z][a-zA-Z0-9+.-]*:' -or $link.StartsWith('#')) { continue }
        $linkCount++
        $destination = ($link -split '#', 2)[0]
        $path = [IO.Path]::GetFullPath((Join-Path $file.DirectoryName ([uri]::UnescapeDataString($destination))))
        if (-not (Test-Path -LiteralPath $path)) { $issues.Add("Broken local target in ${relative}: $link") }
    }
    # Historical retained documents can contain original formatting defects.
    if ($file.FullName.StartsWith((Join-Path $docsRoot 'current') + [IO.Path]::DirectorySeparatorChar)) {
        if (([regex]::Matches($body, '(?m)^\s*```')).Count % 2 -ne 0) {
            $issues.Add("Unbalanced fenced-code markers: $relative")
        }
        if ($body -match 'file://') { $issues.Add("Machine-specific file URI: $relative") }
    }
}

$verified = 0
foreach ($entry in $manifest) {
    $path = Join-Path $archiveRoot $entry.Original
    if (-not (Test-Path -LiteralPath $path)) { $issues.Add("Missing archive copy: $($entry.Original)"); continue }
    $actualHash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
    if ($actualHash -ne $entry.SHA256 -or (Get-Item -LiteralPath $path).Length -ne $entry.Bytes) {
        $issues.Add("Archive mismatch: $($entry.Original)")
    } else { $verified++ }
}

$prd = [IO.File]::ReadAllText((Join-Path $docsRoot 'current/product/02_PRODUCT_REQUIREMENTS.md'))
$requirementIds = @([regex]::Matches($prd, '(?m)^\| (PRD-\d{3}) \|') | ForEach-Object { $_.Groups[1].Value })
$expectedRequirements = @(1..64 | ForEach-Object { 'PRD-{0:D3}' -f $_ })
if ($requirementIds.Count -ne 64 -or @(Compare-Object $expectedRequirements $requirementIds).Count -ne 0) {
    $issues.Add('Requirement definitions do not match PRD-001 through PRD-064 exactly once.')
}
$matrix = [IO.File]::ReadAllText((Join-Path $docsRoot 'current/planning/02_REQUIREMENT_DELIVERY_MATRIX.md'))
$mappedIds = @([regex]::Matches($matrix, '(?m)^\| (PRD-\d{3}) \|') | ForEach-Object { $_.Groups[1].Value })
if ($mappedIds.Count -ne 64 -or @(Compare-Object $expectedRequirements $mappedIds).Count -ne 0) {
    $issues.Add('Delivery matrix must allocate all 64 requirements exactly once.')
}
$backlog = [IO.File]::ReadAllText((Join-Path $docsRoot 'current/planning/16_SPRINT_BACKLOG.md'))
$packageIds = @([regex]::Matches($backlog, '(?m)^(?:### |\| )(S\d{2}) —') | ForEach-Object { $_.Groups[1].Value })
$expectedPackages = @(1..35 | ForEach-Object { 'S{0:D2}' -f $_ })
if ($packageIds.Count -ne 35 -or @(Compare-Object $expectedPackages $packageIds).Count -ne 0) {
    $issues.Add('Work-package definitions do not match S01 through S35 exactly once.')
}

$roadmap = [IO.File]::ReadAllText((Join-Path $docsRoot 'current/planning/15_BUILD_ROADMAP.md'))
$phaseRows = @([regex]::Matches($roadmap, '(?m)^\| R([0-5])[^|]+\|[^|]+\|[^|]+\| ([\d,]+)–([\d,]+) h \| ([\d,]+)–([\d,]+) h \|'))
$totals = @{}
$low = 0
$high = 0
foreach ($row in $phaseRows) {
    $phase = 'R' + $row.Groups[1].Value
    $low += [int]$row.Groups[2].Value.Replace(',', '')
    $high += [int]$row.Groups[3].Value.Replace(',', '')
    if ($low -ne [int]$row.Groups[4].Value.Replace(',', '') -or $high -ne [int]$row.Groups[5].Value.Replace(',', '')) {
        $issues.Add("Inconsistent cumulative effort: $phase")
    }
    $totals[$phase] = @($low, $high)
}
if ($phaseRows.Count -ne 6 -or $low -ne 1290 -or $high -ne 2180) {
    $issues.Add('Roadmap phase totals differ from the stated 1,290-2,180-hour baseline.')
}
$calendarRows = @([regex]::Matches($roadmap, '(?m)^\| (R[0-5]) \| (\d+)–(\d+) weeks \| (\d+)–(\d+) weeks \| (\d+)–(\d+) weeks \|'))
$capacities = @(7.5, 15, 26.25)
foreach ($row in $calendarRows) {
    $phase = $row.Groups[1].Value
    for ($i = 0; $i -lt 3; $i++) {
        $expectedLow = [math]::Ceiling($totals[$phase][0] / $capacities[$i])
        $expectedHigh = [math]::Ceiling($totals[$phase][1] / $capacities[$i])
        if ($expectedLow -ne [int]$row.Groups[2 + 2 * $i].Value -or $expectedHigh -ne [int]$row.Groups[3 + 2 * $i].Value) {
            $issues.Add("Calendar arithmetic mismatch: $phase at $($capacities[$i]) planned hours/week")
        }
    }
}
if ($calendarRows.Count -ne 6) { $issues.Add('Expected six cumulative calendar rows.') }

# M0 companion additions are subcriteria/slices, not extra PRD or S packages.
$companionTests = [IO.File]::ReadAllText((Join-Path $docsRoot 'current/quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md'))
$companionIds = @([regex]::Matches($companionTests, '(?m)^\| (DCF-\d{2}) \|') | ForEach-Object { $_.Groups[1].Value })
$expectedCompanionIds = @(1..24 | ForEach-Object { 'DCF-{0:D2}' -f $_ })
if ($companionIds.Count -ne 24 -or @(Compare-Object $expectedCompanionIds $companionIds).Count -ne 0) {
    $issues.Add('Expected DCF-01 through DCF-24 exactly once.')
}
$ideaText = [IO.File]::ReadAllText((Join-Path $docsRoot 'current/governance/06_DISCOVERY_STRATEGY_TRACEABILITY.md'))
$ideaIds = @([regex]::Matches($ideaText, '(?m)^\| (A\d{2}) \|') | ForEach-Object { $_.Groups[1].Value })
$expectedIdeaIds = @(1..24 | ForEach-Object { 'A{0:D2}' -f $_ })
if ($ideaIds.Count -ne 24 -or @(Compare-Object $expectedIdeaIds $ideaIds).Count -ne 0) {
    $issues.Add('Expected accepted-idea records A01 through A24 exactly once.')
}
$m0Plan = [IO.File]::ReadAllText((Join-Path $docsRoot 'current/planning/03_M0_COMPANION_DELIVERY_PLAN.md'))
$m0Rows = @([regex]::Matches($m0Plan, '(?m)^\| (B\d{2}) \|[^|\r\n]+\|[^|\r\n]+\|[^|\r\n]+\| (\d+)–(\d+) h \|'))
$m0Ids = @($m0Rows | ForEach-Object { $_.Groups[1].Value })
$expectedM0Ids = @(1..10 | ForEach-Object { 'B{0:D2}' -f $_ })
if ($m0Rows.Count -ne 10 -or @(Compare-Object $expectedM0Ids $m0Ids).Count -ne 0) {
    $issues.Add('Expected delivery slices B01 through B10 exactly once.')
}
$m0Low = 0
$m0High = 0
foreach ($row in $m0Rows) {
    $m0Low += [int]$row.Groups[2].Value
    $m0High += [int]$row.Groups[3].Value
}
if ($m0Low -ne 160 -or $m0High -ne 288) { $issues.Add('M0 slice estimates do not total 160–288 hours.') }
$m0Calendar = @([regex]::Matches($m0Plan, '(?m)^\| (10|20|35) \| ([\d.]+) \| (\d+)–(\d+) weeks \|'))
foreach ($row in $m0Calendar) {
    $grossHours = [double]::Parse($row.Groups[1].Value, [cultureinfo]::InvariantCulture)
    $plannedHours = [double]::Parse($row.Groups[2].Value, [cultureinfo]::InvariantCulture)
    if ($plannedHours -ne ($grossHours * 0.75) -or [int]$row.Groups[3].Value -ne [math]::Ceiling($m0Low / $plannedHours) -or [int]$row.Groups[4].Value -ne [math]::Ceiling($m0High / $plannedHours)) {
        $issues.Add("M0 calendar mismatch at $grossHours gross hours/week.")
    }
}
if ($m0Calendar.Count -ne 3) { $issues.Add('Expected three M0 calendar scenarios.') }

$result = [ordered]@{
    CheckedAt = (Get-Date).ToUniversalTime().ToString('o')
    CurrentMarkdownFiles = $currentFiles.Count
    DisciplineFolders = @(Get-ChildItem -LiteralPath (Join-Path $docsRoot 'current') -Directory).Count
    ActiveMarkdownFiles = $activeFiles.Count
    LocalLinkTargetsChecked = $linkCount
    ArchiveManifestEntries = $manifest.Count
    ArchiveCopiesVerified = $verified
    RequirementDefinitions = $requirementIds.Count
    RequirementDeliveryMappings = $mappedIds.Count
    WorkPackageDefinitions = $packageIds.Count
    PhaseTotalsChecked = $phaseRows.Count
    CalendarScenarioCellsChecked = $calendarRows.Count * 3
    AcceptedCompanionIdeas = $ideaIds.Count
    CompanionAcceptanceCases = $companionIds.Count
    M0DeliverySlices = $m0Rows.Count
    M0EffortHours = @($m0Low, $m0High)
    M0CalendarScenariosChecked = $m0Calendar.Count
    Issues = @($issues)
    Passed = ($issues.Count -eq 0)
}
$result | ConvertTo-Json -Depth 4
if ($issues.Count -gt 0) { exit 1 }
