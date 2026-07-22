param(
    [string]$Root = (Split-Path -Parent $MyInvocation.MyCommand.Path),
    [int]$Runs = 25,
    [string]$ArchipelagoRoot = "",
    [string]$PythonCommand = "",
    [switch]$KeepFiles,
    [switch]$NoPause
)

$ErrorActionPreference = "Stop"

function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Cyan
}

function Write-Fail($message) {
    Write-Host "[FAIL] $message" -ForegroundColor Red
}

function Pause-OnExit {
    if (-not $NoPause) {
        Read-Host "Press Enter to close"
    }
}

function Find-PythonCommand {
    if ($PythonCommand) {
        return $PythonCommand
    }

    foreach ($candidate in @("py", "python")) {
        $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($cmd) {
            return $candidate
        }
    }

    return ""
}

function Find-ArchipelagoRoot {
    if ($ArchipelagoRoot) {
        return $ArchipelagoRoot
    }

    $candidates = @(
        "C:\ProgramData\Archipelago",
        "C:\Archipelago",
        "C:\Games\Archipelago",
        "C:\Users\micha\AppData\Local\Programs\Archipelago"
    )

    foreach ($candidate in $candidates) {
        if (Test-Path (Join-Path $candidate "Generate.py")) {
            return $candidate
        }
    }

    return ""
}

try {
    $python = Find-PythonCommand
    $apRoot = Find-ArchipelagoRoot

    if (-not $python) {
        throw "Could not find a Python launcher. Try re-running with -PythonCommand `"py`" or -PythonCommand `"python`"."
    }

    if (-not $apRoot) {
        throw "Could not find your Archipelago folder automatically. Re-run with -ArchipelagoRoot `"C:\ProgramData\Archipelago`" or your real Archipelago folder."
    }

    $generatePy = Join-Path $apRoot "Generate.py"
    if (-not (Test-Path $generatePy)) {
        throw "Generate.py was not found in $apRoot"
    }

    $command = "cd `"$apRoot`"; $python Generate.py --player_files `"{{yaml}}`""

    Write-Info "Using Archipelago folder: $apRoot"
    Write-Info "Using Python command: $python"

    $params = @{
        Root = $Root
        Runs = $Runs
        GenerateCommand = $command
    }
    if ($KeepFiles) {
        $params["KeepFiles"] = $true
    }

    & (Join-Path $Root "fuzz_test.ps1") @params
}
catch {
    Write-Fail $_.Exception.Message
    Pause-OnExit
    exit 1
}

Pause-OnExit
