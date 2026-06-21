# ============================================================
# install_skills.ps1
# Parses sk01.txt and installs ALL Global skills into
# C:\Users\<User>\.claude\skills\
# Run from: d:\GT CRM WEB PROJECT\gtgroupcrmproject\
# ============================================================

$skillsBase  = "$env:USERPROFILE\.claude\skills"
$sourceFile  = "$PSScriptRoot\sk01.txt"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Claude Skills Installer" -ForegroundColor Cyan
Write-Host "  Source : $sourceFile" -ForegroundColor Cyan
Write-Host "  Target : $skillsBase" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Read raw lines (strip \r)
$lines = (Get-Content $sourceFile -Encoding UTF8) | ForEach-Object { $_.TrimEnd("`r") }

# ---- Parse skills -----------------------------------------------
# Format in the file:
#   <skill-name>
#   Global          <- or "Global\r\nPlugin: <plugin>"
#   <description line(s)>
#   <blank line>
# -----------------------------------------------------------------

$skills   = [System.Collections.Generic.List[hashtable]]::new()
$i        = 0
$total    = $lines.Count

while ($i -lt $total) {
    $line = $lines[$i].Trim()

    # Skip empty lines and section headers
    if ([string]::IsNullOrWhiteSpace($line) -or $line -eq "Installed MCP Servers") {
        $i++
        continue
    }

    # A skill block starts with a non-empty name line followed by "Global"
    if ($i + 1 -lt $total -and $lines[$i + 1].Trim() -eq "Global") {
        $name = $line

        # Skip name + "Global"
        $j = $i + 2

        # Optionally skip "Plugin: ..." line
        $plugin = ""
        if ($j -lt $total -and $lines[$j].Trim() -match "^Plugin:") {
            $plugin = $lines[$j].Trim()
            $j++
        }

        # Collect description (may span multiple non-empty lines)
        $descLines = [System.Collections.Generic.List[string]]::new()
        while ($j -lt $total -and -not [string]::IsNullOrWhiteSpace($lines[$j])) {
            $descLines.Add($lines[$j].Trim())
            $j++
        }

        $description = ($descLines -join " ").Trim()
        if ([string]::IsNullOrWhiteSpace($description)) {
            $description = "Use when working with $name"
        }

        $skills.Add(@{
            Name        = $name
            Plugin      = $plugin
            Description = $description
        })

        $i = $j
    } else {
        $i++
    }
}

Write-Host ""
Write-Host "Found $($skills.Count) Global skills to install." -ForegroundColor Yellow
Write-Host ""

# ---- Create skill directories + SKILL.md ------------------------
$created  = 0
$skipped  = 0
$errors   = 0

foreach ($skill in $skills) {
    $skillName = $skill.Name
    $desc      = $skill.Description
    $plugin    = $skill.Plugin

    $skillDir  = Join-Path $skillsBase $skillName
    $skillFile = Join-Path $skillDir "SKILL.md"

    try {
        if (-not (Test-Path $skillDir)) {
            New-Item -ItemType Directory -Path $skillDir -Force | Out-Null
        }

        if (Test-Path $skillFile) {
            # Already exists - skip to avoid overwriting customised files
            $skipped++
            Write-Host "  [SKIP]    $skillName (already installed)" -ForegroundColor DarkGray
            continue
        }

        # Build SKILL.md content
        $pluginNote = if ($plugin) { "`n> $plugin`n" } else { "" }

        $content = @"
---
name: $skillName
description: $desc
---
$pluginNote
# $skillName

$desc

## When to Use

Use this skill when: $desc

## Instructions

Follow these steps to apply the **$skillName** skill:

1. Understand the user's request in the context of this skill.
2. Apply domain expertise related to **$skillName**.
3. Provide clear, actionable guidance or implementation.
4. Verify the output meets the user's requirements.

## Best Practices

- Always follow industry standards for this domain.
- Provide concrete examples and working code where applicable.
- Consider edge cases and error handling.
- Document your reasoning clearly.
"@

        Set-Content -Path $skillFile -Value $content -Encoding UTF8
        $created++
        Write-Host "  [CREATED] $skillName" -ForegroundColor Green
    }
    catch {
        $errors++
        Write-Host "  [ERROR]   $skillName - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DONE!" -ForegroundColor Green
Write-Host "  Created : $created  skills" -ForegroundColor Green
Write-Host "  Skipped : $skipped  (already existed)" -ForegroundColor Yellow
Write-Host "  Errors  : $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "  Skills dir: $skillsBase" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
