param(
    [string]$Root = (Split-Path -Parent $MyInvocation.MyCommand.Path),
    [switch]$BuildApworld
)

$ErrorActionPreference = "Stop"

function Write-Pass($message) {
    Write-Host "[PASS] $message" -ForegroundColor Green
}

function Write-Fail($message) {
    Write-Host "[FAIL] $message" -ForegroundColor Red
}

function Test-StrictUtf8File([string]$Path) {
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $utf8 = [System.Text.UTF8Encoding]::new($false, $true)
    try {
        [void]$utf8.GetString($bytes)
        return $true
    } catch {
        return $false
    }
}

function Assert-NoPattern([string]$Path, [string]$Pattern, [string]$Message) {
    if (Select-String -Path $Path -Pattern $Pattern -Quiet) {
        throw "$Message [$Path]"
    }
}

function Assert-HasPattern([string]$Path, [string]$Pattern, [string]$Message) {
    if (-not (Select-String -Path $Path -Pattern $Pattern -Quiet)) {
        throw "$Message [$Path]"
    }
}

$srcRoot = Join-Path $Root "APWorldSource"
$worldRoot = Join-Path $srcRoot "Wikipelago"
$bridgePath = Join-Path (Split-Path -Parent $Root) "bridge\bridge.py"
$webAppPath = Join-Path (Split-Path -Parent $Root) "web\app.js"
$webIndexPath = Join-Path (Split-Path -Parent $Root) "web\index.html"
$yamlPath = Join-Path (Split-Path -Parent $Root) "yaml\Wiki.yaml"
$fallbackYamlPath = Join-Path (Split-Path -Parent $Root) "yaml\Wiki_Entertainment_Fixed.yaml"
$apworldPath = Join-Path $Root "APWorld\Wikipelago.apworld"

if ($BuildApworld) {
    & (Join-Path $Root "build_apworld.ps1") -Root $Root
}

$failures = New-Object System.Collections.Generic.List[string]

try {
    if (-not (Test-Path $worldRoot)) { throw "Missing APWorldSource\Wikipelago folder" }
    Write-Pass "Found world source folder"
} catch {
    $failures.Add($_.Exception.Message)
    Write-Fail $_.Exception.Message
}

try {
    $filesToCheck = Get-ChildItem -Path $worldRoot -Filter *.py -File
    foreach ($file in $filesToCheck) {
        if (-not (Test-StrictUtf8File $file.FullName)) {
            throw "File is not strict UTF-8: $($file.FullName)"
        }
    }
    Write-Pass "All APWorld source .py files are strict UTF-8"
} catch {
    $failures.Add($_.Exception.Message)
    Write-Fail $_.Exception.Message
}

try {
    if (Test-Path $bridgePath) {
        if (-not (Test-StrictUtf8File $bridgePath)) {
            throw "Bridge file is not strict UTF-8: $bridgePath"
        }
        Write-Pass "Bridge file is strict UTF-8"
    } else {
        throw "Missing bridge.py at $bridgePath"
    }
} catch {
    $failures.Add($_.Exception.Message)
    Write-Fail $_.Exception.Message
}

try {
    $yamlToCheck = if (Test-Path $yamlPath) {
        $yamlPath
    } elseif (Test-Path $fallbackYamlPath) {
        $fallbackYamlPath
    } else {
        $yamlSearchRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $Root))
        $discoveredYaml = Get-ChildItem -Path $yamlSearchRoot -Filter "Wiki.yaml" -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
        if ($discoveredYaml) { $discoveredYaml } else { throw "No Wikipelago YAML template found" }
    }
    if (-not (Test-StrictUtf8File $yamlToCheck)) {
        throw "YAML template is not strict UTF-8: $yamlToCheck"
    }
    Assert-NoPattern $yamlToCheck 'goal_article_preset:\s*pokemon\s*$' 'Invalid YAML preset alias found'
    Assert-HasPattern $yamlToCheck 'searchsanity:\s*(true|false)' 'YAML template is missing searchsanity'
    Assert-HasPattern $yamlToCheck 'scrollsanity:\s*(true|false)' 'YAML template is missing scrollsanity'
    Assert-HasPattern $yamlToCheck 'search_starting_letters:\s*(none|all_vowels|etaoi|raise)' 'YAML template is missing search_starting_letters'
    Write-Pass "YAML template encoding and preset values look sane"
} catch {
    $failures.Add($_.Exception.Message)
    Write-Fail $_.Exception.Message
}

try {
    $initPath = Join-Path $worldRoot "__init__.py"
    $optionsPath = Join-Path $worldRoot "Options.py"
    $itemsPath = Join-Path $worldRoot "Items.py"
    $entertainmentPath = Join-Path $worldRoot "entertainment_articles.py"
    $commonPath = Join-Path $worldRoot "common_articles.py"

    Assert-NoPattern $initPath '`r`n' 'Literal backtick newline text regression found in __init__.py'
    Assert-NoPattern $initPath 'goal_article_preset:\s*pokemon\s*$' 'Invalid YAML preset text leaked into __init__.py'
    Assert-NoPattern $entertainmentPath '\bPokemon\b' 'Plain Pokemon title found in entertainment article pool'
    Assert-NoPattern $commonPath '\bPokemon\b' 'Plain Pokemon title found in common article pool'
    Assert-NoPattern $entertainmentPath '^\s*"La La Land \(film\)",?\s*$' 'Old La La Land redirect title still present'
    Assert-NoPattern $entertainmentPath '^\s*"Her \(film\)",?\s*$' 'Old Her redirect title still present'
    Assert-NoPattern $entertainmentPath '^\s*"Clue \(board game\)",?\s*$' 'Old Clue redirect title still present'
    Assert-HasPattern $initPath 'TOPIC_START_ARTICLES' 'Curated start article map is missing'
    Assert-HasPattern $optionsPath 'class Searchsanity' 'Searchsanity option is missing'
    Assert-HasPattern $optionsPath 'class Scrollsanity' 'Scrollsanity option is missing'
    Assert-HasPattern $optionsPath 'class SearchStartingLetters' 'Search Starting Letters option is missing'
    Assert-HasPattern $itemsPath '"Progressive Scroll Speed"' 'Progressive Scroll Speed item is missing'
    Assert-HasPattern $itemsPath 'for index, letter in enumerate\("ABCDEFGHIJKLMNOPQRSTUVWXYZ"' 'Search Letter item loop is missing'
    Write-Pass "Known bad title regressions are absent from source pools"
} catch {
    $failures.Add($_.Exception.Message)
    Write-Fail $_.Exception.Message
}

try {
    Assert-HasPattern $bridgePath 'TITLE_CANONICALS' 'Bridge canonical title map is missing'
    Assert-HasPattern $bridgePath '_canonicalize_title_sync' 'Bridge title canonicalization helper is missing'
    Assert-HasPattern $bridgePath '_fetch_resolved_title' 'Bridge resolved-title lookup is missing'
    Assert-HasPattern $bridgePath '_titles_match' 'Bridge title matcher is missing'
    Assert-HasPattern $bridgePath 'current_start' 'Bridge current start status helper is missing'
    Assert-HasPattern $bridgePath 'searchsanity' 'Bridge searchsanity state is missing'
    Assert-HasPattern $bridgePath 'scrollsanity' 'Bridge scrollsanity state is missing'
    Assert-HasPattern $bridgePath 'scroll_speed_level' 'Bridge scroll speed status is missing'
    Assert-HasPattern $bridgePath 'search_starting_letters' 'Bridge search_starting_letters state is missing'
    Assert-HasPattern $bridgePath '"round_access_count": self\.round_access_count\(\)' 'Bridge round access count status is missing'
    Assert-HasPattern $bridgePath '"unlocked_rounds": self\.unlocked_rounds\(\)' 'Bridge unlocked rounds status is missing'
    Write-Pass "Bridge title-matching safeguards are present"
} catch {
    $failures.Add($_.Exception.Message)
    Write-Fail $_.Exception.Message
}

try {
    Assert-HasPattern $webAppPath 'preferredResumeTitle' 'Web resume helper is missing'
    Assert-HasPattern $webAppPath 'restoreArticleView' 'Web restore-article flow is missing'
    Assert-HasPattern $webAppPath 'current_start' 'Web client is not using current_start resume data'
    Assert-HasPattern $webAppPath 'openSearchOverlay' 'Web search overlay helper is missing'
    Assert-HasPattern $webAppPath 'SCROLL_SPEED_FACTORS' 'Web scroll speed table is missing'
    Assert-HasPattern $webAppPath 'scrollFactor' 'Web scroll factor helper is missing'
    Assert-HasPattern $webAppPath 'sanitizeSearchInput' 'Web search letter gating helper is missing'
    Assert-HasPattern $webAppPath 'status\.round_access_count' 'Web round access count display is missing'
    Assert-HasPattern $webAppPath 'status\.unlocked_rounds' 'Web playable rounds display is missing'
    Assert-HasPattern $webIndexPath 'id="roundAccessItem"' 'Web round access count element is missing'
    Assert-HasPattern $webIndexPath 'id="playableRoundsText"' 'Web playable rounds element is missing'
    Write-Pass "Web reconnect/resume safeguards are present"
} catch {
    $failures.Add($_.Exception.Message)
    Write-Fail $_.Exception.Message
}

try {
    if (Test-Path $apworldPath) {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $temp = Join-Path ([System.IO.Path]::GetTempPath()) ("wikipelago_smoke_" + [guid]::NewGuid().ToString("N"))
        New-Item -ItemType Directory -Path $temp | Out-Null
        try {
            [System.IO.Compression.ZipFile]::ExtractToDirectory($apworldPath, $temp)
            $packagedPy = Get-ChildItem -Path (Join-Path $temp "Wikipelago") -Filter *.py -File
            foreach ($file in $packagedPy) {
                if (-not (Test-StrictUtf8File $file.FullName)) {
                    throw "Packaged APWorld file is not strict UTF-8: $($file.Name)"
                }
            }
            $packagedInit = Join-Path $temp "Wikipelago\__init__.py"
            Assert-NoPattern $packagedInit '`r`n' 'Literal backtick newline text regression found in packaged __init__.py'
            Write-Pass "Built .apworld package passed UTF-8 and syntax-regression checks"
        } finally {
            if (Test-Path $temp) { Remove-Item -Recurse -Force $temp }
        }
    } else {
        Write-Host "[INFO] No built APWorld found at $apworldPath, so package checks were skipped." -ForegroundColor Yellow
    }
} catch {
    $failures.Add($_.Exception.Message)
    Write-Fail $_.Exception.Message
}

Write-Host ""
if ($failures.Count -eq 0) {
    Write-Host "Smoke test passed." -ForegroundColor Green
    exit 0
}

Write-Host "Smoke test failed:" -ForegroundColor Red
foreach ($failure in $failures) {
    Write-Host " - $failure" -ForegroundColor Red
}
exit 1
