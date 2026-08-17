# tools/watchdog-agentgateway.ps1
# Surveille agentgateway.exe toutes les 60 s. Si le port 15000 ne répond pas,
# tue le process et relance via le .vbs du dossier Démarrage.
#
# Installation (HITL, 1 min) :
#   1. Ouvrir Task Scheduler (taskschd.msc)
#   2. Create Task > Run whether user is logged on or not
#   3. Trigger : At system startup (delay 2 min)
#   4. Action : powershell.exe -ExecutionPolicy Bypass -File "C:/Users/.../tools/watchdog-agentgateway.ps1"
#   5. Settings : "If the task fails, restart every 5 minutes"
#
# Sortie : log dans .cache/gauntlet/watchdog-agentgateway.log

$ErrorActionPreference = "Continue"
$log = "C:\Users\amado\.cache\gauntlet\watchdog-agentgateway.log"
$endpoint = "http://127.0.0.1:15000/"
$restartScript = "C:\Users\amado\Démarrage\agentgateway.vbs"

New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
Add-Content -Path $log -Value "$(Get-Date -Format 'o') watchdog start"

$failed = $true
for ($i = 0; $i -lt 3; $i++) {
    try {
        $code = (Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 3 -MaximumRedirection 0 -ErrorAction Stop).StatusCode
        if ($code -eq 308 -or $code -eq 200) {
            $failed = $false
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if ($failed) {
    Add-Content -Path $log -Value "$(Get-Date -Format 'o') gateway_down — restarting"

    # Tue les instances existantes (idempotent)
    Get-Process agentgateway -ErrorAction SilentlyContinue | Stop-Process -Force

    # Relance via le .vbs (chemin canonique du dossier Démarrage)
    if (Test-Path $restartScript) {
        try {
            Start-Process -FilePath "wscript.exe" -ArgumentList "`"$restartScript`"" -ErrorAction Stop
            Add-Content -Path $log -Value "$(Get-Date -Format 'o') restart_launched"
        } catch {
            Add-Content -Path $log -Value "$(Get-Date -Format 'o') restart_failed: $($_.Exception.Message)"
        }
    } else {
        Add-Content -Path $log -Value "$(Get-Date -Format 'o') restart_script_missing: $restartScript"
    }
}

Add-Content -Path $log -Value "$(Get-Date -Format 'o') watchdog end (failed=$failed)"
