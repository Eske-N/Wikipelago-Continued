param(
    [string]$Root = (Split-Path -Parent $MyInvocation.MyCommand.Path)
)

$ErrorActionPreference = "Stop"

& (Join-Path $Root "build_apworld.ps1") -Root $Root
& (Join-Path $Root "smoke_test.ps1") -Root $Root
