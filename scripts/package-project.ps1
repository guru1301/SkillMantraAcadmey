# PowerShell Script: Safely export project for friends/collaborators
# Excludes: .env.local (cloud database secrets), node_modules, .next, .git
param(
    [string]$OutputZipPath = "$HOME\Desktop\SkillMantra-Dev-Package.zip"
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$ProjectDir\package.json")) {
    $ProjectDir = Get-Location
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Packaging Skill Mantra Web Project" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Project Directory: $ProjectDir"
Write-Host "Target ZIP Path:   $OutputZipPath"

# 1. Clean destination zip if it already exists
if (Test-Path $OutputZipPath) {
    Remove-Item $OutputZipPath -Force
    Write-Host "Removed existing zip file at destination." -ForegroundColor Yellow
}

# 2. Prepare staging directory in temp
$StagingRoot = Join-Path $env:TEMP "skillmantra_staging_export"
$StagingDir = Join-Path $StagingRoot "skill-mantra"

if (Test-Path $StagingRoot) {
    Remove-Item -Recurse -Force $StagingRoot
}
New-Item -ItemType Directory -Path $StagingDir -Force | Out-Null

Write-Host "Staging files (excluding secrets, node_modules, .next, .git)..." -ForegroundColor Green

# 3. List of items to exclude
$ExcludeNames = @(
    "node_modules",
    ".next",
    ".git",
    ".env.local",
    ".env",
    "tsconfig.tsbuildinfo"
)

Get-ChildItem -Path $ProjectDir -Force | ForEach-Object {
    if ($ExcludeNames -notcontains $_.Name) {
        if ($_.PSIsContainer) {
            Copy-Item -Path $_.FullName -Destination (Join-Path $StagingDir $_.Name) -Recurse -Force
        } else {
            Copy-Item -Path $_.FullName -Destination (Join-Path $StagingDir $_.Name) -Force
        }
    }
}

# 4. Verify that .env.local was NOT copied
$LeakedSecret = Join-Path $StagingDir ".env.local"
if (Test-Path $LeakedSecret) {
    Remove-Item -Force $LeakedSecret
    Write-Host "[SECURITY ALERT] Removed .env.local from staging." -ForegroundColor Red
}

# 5. Compress staging folder into ZIP
Write-Host "Compressing project into ZIP..." -ForegroundColor Green
Compress-Archive -Path "$StagingDir\*" -DestinationPath $OutputZipPath -CompressionLevel Optimal

# 6. Cleanup staging folder
Remove-Item -Recurse -Force $StagingRoot

$ZipInfo = Get-Item $OutputZipPath
$SizeMB = [math]::Round($ZipInfo.Length / 1MB, 2)

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host " SUCCESS! Zip file generated safely." -ForegroundColor Green
Write-Host " File: $OutputZipPath" -ForegroundColor White
Write-Host " Size: $SizeMB MB (Lightweight & Safe)" -ForegroundColor White
Write-Host " Cloud credentials (.env.local) excluded!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
