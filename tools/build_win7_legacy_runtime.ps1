param(
    [string]$PythonVersion = "3.8.10",
    [string]$RuntimeDir = "",
    [string]$CacheDir = "",
    [switch]$ForceDownload
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $RuntimeDir) {
    $RuntimeDir = Join-Path $Root "runtime\python38-win7"
}
if (-not $CacheDir) {
    $CacheDir = Join-Path $Root "build\win7-legacy"
}

function Get-FullPath([string]$Path) {
    return [System.IO.Path]::GetFullPath($Path)
}

function Assert-UnderPath([string]$Child, [string]$Parent) {
    $childFull = Get-FullPath $Child
    $parentFull = (Get-FullPath $Parent).TrimEnd('\') + '\'
    if (-not $childFull.StartsWith($parentFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Unsafe target path outside expected folder: $childFull"
    }
}

function Get-EffectiveRequirementLines([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Missing requirements file: $Path"
    }
    return @(Get-Content -LiteralPath $Path | Where-Object {
        $line = $_.Trim()
        $line -and -not $line.StartsWith("#")
    })
}

$RuntimeRoot = Join-Path $Root "runtime"
$RuntimeDir = Get-FullPath $RuntimeDir
$CacheDir = Get-FullPath $CacheDir
Assert-UnderPath $RuntimeDir $RuntimeRoot

$EmbedZipName = "python-$PythonVersion-embed-amd64.zip"
$EmbedZip = Join-Path $CacheDir $EmbedZipName
$EmbedUrl = "https://www.python.org/ftp/python/$PythonVersion/$EmbedZipName"
$RequirementsFile = Join-Path $Root "requirements-win7.txt"
$SitePackages = Join-Path $RuntimeDir "Lib\site-packages"

New-Item -ItemType Directory -Force -Path $CacheDir | Out-Null

if ($ForceDownload -or -not (Test-Path -LiteralPath $EmbedZip -PathType Leaf)) {
    Write-Host "downloading official Python $PythonVersion embeddable x64 runtime"
    Write-Host $EmbedUrl
    Invoke-WebRequest -Uri $EmbedUrl -OutFile $EmbedZip
} else {
    Write-Host "using cached embeddable runtime: $EmbedZip"
}

if (Test-Path -LiteralPath $RuntimeDir) {
    Write-Host "cleaning runtime: $RuntimeDir"
    Remove-Item -LiteralPath $RuntimeDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

Write-Host "extracting runtime to runtime\python38-win7"
Expand-Archive -LiteralPath $EmbedZip -DestinationPath $RuntimeDir -Force
New-Item -ItemType Directory -Force -Path $SitePackages | Out-Null

$PthFile = Join-Path $RuntimeDir "python38._pth"
if (-not (Test-Path -LiteralPath $PthFile -PathType Leaf)) {
    throw "Embedded runtime is missing python38._pth: $PthFile"
}

@(
    "python38.zip",
    ".",
    "Lib\site-packages",
    "import site"
) | Set-Content -LiteralPath $PthFile -Encoding ASCII

$requirements = @(Get-EffectiveRequirementLines $RequirementsFile)
if ($requirements.Count -gt 0) {
    $PythonExe = Join-Path $RuntimeDir "python.exe"
    $GetPip = Join-Path $CacheDir "get-pip-3.8.py"
    $GetPipUrl = "https://bootstrap.pypa.io/pip/3.8/get-pip.py"

    if ($ForceDownload -or -not (Test-Path -LiteralPath $GetPip -PathType Leaf)) {
        Write-Host "downloading get-pip for Python 3.8"
        Write-Host $GetPipUrl
        Invoke-WebRequest -Uri $GetPipUrl -OutFile $GetPip
    } else {
        Write-Host "using cached get-pip: $GetPip"
    }

    Write-Host "bootstrapping pip inside embedded Python"
    & $PythonExe $GetPip --no-warn-script-location
    if ($LASTEXITCODE -ne 0) {
        throw "get-pip failed with exit code $LASTEXITCODE"
    }

    Write-Host "installing requirements-win7.txt into embedded site-packages"
    & $PythonExe -m pip install --no-warn-script-location --target $SitePackages -r $RequirementsFile
    if ($LASTEXITCODE -ne 0) {
        throw "pip install failed with exit code $LASTEXITCODE"
    }
} else {
    Write-Host "requirements-win7.txt has no runtime dependencies; skipping pip bootstrap"
}

$PythonwExe = Join-Path $RuntimeDir "pythonw.exe"
if (-not (Test-Path -LiteralPath $PythonwExe -PathType Leaf)) {
    throw "Embedded runtime is missing pythonw.exe: $PythonwExe"
}

Write-Host "Windows 7 legacy runtime prepared"
Write-Host "runtime path: runtime\python38-win7"
Write-Host "python version: $PythonVersion"
