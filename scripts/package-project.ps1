# PowerShell Script: Safely export project using strict positive allowlist
param(
    [string]$OutputZipPath = "$HOME\Desktop\SkillThinker-Dev-Package.zip",
    [string]$VerifyZipPath = ""
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Assert-PackageZipSafe {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ZipPath,
        [switch]$RemoveOnFailure
    )

    if (-not (Test-Path -LiteralPath $ZipPath)) {
        throw "Zip verification failed: archive not found at '$ZipPath'."
    }

    $benignPlaceholders = @("password", "postgres", "pass", "****", "<password>", "[password]")
    $violations = New-Object System.Collections.Generic.List[string]
    $archive = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $ZipPath))
    try {
        foreach ($entry in $archive.Entries) {
            $normalizedPath = $entry.FullName -replace '\\', '/'
            $fileName = [System.IO.Path]::GetFileName($normalizedPath)

            if ($fileName -like "*.env*") {
                $violations.Add("Forbidden env file in zip: $normalizedPath")
                continue
            }

            if ($normalizedPath -match '(^|/)(scratch|audit_reports|STAGE_[^/]*|\.git|node_modules|\.next|\.venv|venv)(/|$)') {
                $violations.Add("Forbidden directory in zip: $normalizedPath")
                continue
            }

            if ($fileName -like "*.zip" -or $fileName -like "*.pyc") {
                $violations.Add("Forbidden archive/bytecode file in zip: $normalizedPath")
                continue
            }

            if ($entry.Length -eq 0 -or $normalizedPath.EndsWith("/") -or $normalizedPath -match '\.(png|jpg|jpeg|gif|ico|webp|svg|woff2?|ttf|eot|pdf)$') {
                continue
            }

            $stream = $entry.Open()
            $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8, $true)
            try {
                $content = $reader.ReadToEnd()
            } finally {
                $reader.Dispose()
                $stream.Dispose()
            }

            $matches = [regex]::Matches(
                $content,
                '(?i)postgres(?:ql)?(?:\+[a-z0-9_]+)?://[^\s:/"''`]+:([^\s@"''`]+)@'
            )
            foreach ($m in $matches) {
                $pw = $m.Groups[1].Value
                if ($benignPlaceholders -notcontains $pw) {
                    $violations.Add("PostgreSQL URI with non-placeholder password in zip entry: $normalizedPath")
                    break
                }
            }
        }
    } finally {
        $archive.Dispose()
    }

    if ($violations.Count -gt 0) {
        if ($RemoveOnFailure -and (Test-Path -LiteralPath $ZipPath)) {
            Remove-Item -LiteralPath $ZipPath -Force
        }
        throw ("Package security check failed:`n - " + ($violations -join "`n - "))
    }
}

if ($VerifyZipPath) {
    Assert-PackageZipSafe -ZipPath $VerifyZipPath
    Write-Host "Verified package archive safely: $VerifyZipPath" -ForegroundColor Green
    exit 0
}

$ProjectDir = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $ProjectDir "package.json"))) {
    $ProjectDir = (Get-Location).Path
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Packaging SkillThinker Web Project" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Project Directory: $ProjectDir"
Write-Host "Target ZIP Path:   $OutputZipPath"

if (Test-Path -LiteralPath $OutputZipPath) {
    Remove-Item -LiteralPath $OutputZipPath -Force
    Write-Host "Removed existing zip file at destination." -ForegroundColor Yellow
}

$StagingRoot = Join-Path $env:TEMP ("skillthinker_pkg_" + [guid]::NewGuid().ToString("N"))
$StagingDir = Join-Path $StagingRoot "skillthinker"
New-Item -ItemType Directory -Path $StagingDir -Force | Out-Null

try {
    # Positive allowlist only: root configs + active application directories
    $AllowedRootFiles = @(
        ".gitignore",
        "AGENTS.md",
        "MIGRATION_PROGRESS.md",
        "README.md",
        "eslint.config.mjs",
        "next-env.d.ts",
        "next.config.ts",
        "package-lock.json",
        "package.json",
        "postcss.config.mjs",
        "run-all.bat",
        "run-backend.bat",
        "run-frontend.bat",
        "tsconfig.json"
    )
    $AllowedRootDirs = @("src", "backend", "public", "scripts", "docs")

    foreach ($fileName in $AllowedRootFiles) {
        $srcPath = Join-Path $ProjectDir $fileName
        if (Test-Path -LiteralPath $srcPath -PathType Leaf) {
            Copy-Item -LiteralPath $srcPath -Destination (Join-Path $StagingDir $fileName) -Force
        }
    }

    foreach ($dirName in $AllowedRootDirs) {
        $dirRoot = Join-Path $ProjectDir $dirName
        if (-not (Test-Path -LiteralPath $dirRoot -PathType Container)) {
            continue
        }

        $files = Get-ChildItem -LiteralPath $dirRoot -Recurse -File -Force | Where-Object {
            $rel = $_.FullName.Substring($ProjectDir.Length + 1) -replace '\\', '/'
            $name = $_.Name
            $isBlockedDir = $rel -match '(^|/)(node_modules|\.next|\.git|__pycache__|\.pytest_cache|\.venv|venv|scratch|audit_reports|STAGE_[^/]*)(/|$)'
            $isBlockedFile = ($name -like "*.env*") -or ($name -like "*.zip") -or ($name -like "*.pyc") -or ($name -like "*.pyo") -or ($name -like "*.pem") -or ($name -eq "tsconfig.tsbuildinfo")
            (-not $isBlockedDir) -and (-not $isBlockedFile)
        }

        foreach ($file in $files) {
            $relPath = $file.FullName.Substring($ProjectDir.Length + 1)
            $destPath = Join-Path $StagingDir $relPath
            $destParent = Split-Path -Parent $destPath
            if (-not (Test-Path -LiteralPath $destParent)) {
                New-Item -ItemType Directory -Path $destParent -Force | Out-Null
            }
            Copy-Item -LiteralPath $file.FullName -Destination $destPath -Force
        }
    }

    $outputParent = Split-Path -Parent $OutputZipPath
    if ($outputParent -and -not (Test-Path -LiteralPath $outputParent)) {
        New-Item -ItemType Directory -Path $outputParent -Force | Out-Null
    }

    [System.IO.Compression.ZipFile]::CreateFromDirectory(
        $StagingDir,
        $OutputZipPath,
        [System.IO.Compression.CompressionLevel]::Optimal,
        $false
    )

    # Mandatory final safety verification
    Assert-PackageZipSafe -ZipPath $OutputZipPath -RemoveOnFailure
} finally {
    if (Test-Path -LiteralPath $StagingRoot) {
        Remove-Item -Recurse -Force -LiteralPath $StagingRoot
    }
}

$ZipInfo = Get-Item -LiteralPath $OutputZipPath
$SizeMB = [math]::Round($ZipInfo.Length / 1MB, 2)

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host " SUCCESS! Package generated and verified." -ForegroundColor Green
Write-Host " File: $OutputZipPath" -ForegroundColor White
Write-Host " Size: $SizeMB MB" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Green
