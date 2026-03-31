# Run this from the project root in PowerShell.
# It creates a Python 3.11 virtual environment and installs TensorFlow DirectML.

Set-Location -Path $PSScriptRoot

$pythonLauncher = 'py'
$pythonVersion = '3.11'
$venvPath = Join-Path $PSScriptRoot '.venv'

Write-Host "Checking for Python $pythonVersion..."
try {
    $pythonExe = & $pythonLauncher -$pythonVersion -c "import sys; print(sys.executable)" 2>$null
} catch {
    Write-Error "Python $pythonVersion is not available. Install Python 3.11 and retry."
    exit 1
}

if (-not (Test-Path $venvPath)) {
    Write-Host "Creating virtual environment at $venvPath"
    & $pythonLauncher -$pythonVersion -m venv $venvPath
}

Write-Host "Activating virtual environment..."
& "$venvPath\Scripts\Activate.ps1"

Write-Host "Upgrading pip and installing dependencies..."
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt

Write-Host "TensorFlow DirectML setup complete. Run '.\src\train.py' with the activated .venv to start training on GPU if available."