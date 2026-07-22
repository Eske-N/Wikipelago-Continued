param(
    [int]$TargetCount = 5000,
    [switch]$Replace,
    [double]$RandomShare = 0.35,
    [int]$Seed = 1337
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = Join-Path $root "build_article_pool.py"

if (!(Test-Path $script)) {
    throw "Could not find $script"
}

$pyCmd = $null
if (Get-Command py -ErrorAction SilentlyContinue) {
    $pyCmd = "py"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pyCmd = "python"
} else {
    throw "Neither 'py' nor 'python' was found in PATH. Install Python first."
}

$args = @($script, "--target-count", "$TargetCount", "--random-share", "$RandomShare", "--seed", "$Seed")
if ($Replace) { $args += "--replace" }

& $pyCmd @args
if ($LASTEXITCODE -ne 0) {
    throw "build_article_pool.py failed with exit code $LASTEXITCODE"
}
