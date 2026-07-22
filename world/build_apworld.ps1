param(
    [string]$Root = (Split-Path -Parent $MyInvocation.MyCommand.Path)
)

$src = Join-Path $Root "APWorldSource"
$outDir = Join-Path $Root "APWorld"
$zipPath = Join-Path $src "Wikipelago.zip"
$apPath = Join-Path $outDir "Wikipelago.apworld"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path $apPath) { Remove-Item $apPath -Force }

Compress-Archive -Path (Join-Path $src "archipelago.json"), (Join-Path $src "Wikipelago") -DestinationPath $zipPath
Rename-Item -Path $zipPath -NewName "Wikipelago.apworld"
Move-Item -Path (Join-Path $src "Wikipelago.apworld") -Destination $apPath -Force

Write-Host "Built: $apPath"
