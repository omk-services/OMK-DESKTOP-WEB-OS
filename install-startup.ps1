# install-startup.ps1 — pose Coach OS dans le dossier Demarrage de Windows.
#
# Après execution, Coach OS demarre automatiquement a chaque ouverture de
# session : Vite + Chrome en mode --app, comme une vraie app desktop.
#
# Pour desinstaller : relancer avec -Uninstall. Plus simple que d'aller
# fouiller dans shell:startup a la main.
#
# Usage (PowerShell, depuis le depot coach-os) :
#   .\install-startup.ps1             # installer
#   .\install-startup.ps1 -Uninstall  # retirer

param([switch]$Uninstall)

$ErrorActionPreference = 'Stop'

$racine = Split-Path -Parent $MyInvocation.MyCommand.Path
$bat = Join-Path $racine 'coach-os.bat'
$startup = [Environment]::GetFolderPath('Startup')
$nom = 'Coach OS.lnk'

# WScript.Shell sert a creer le .lnk. C'est l'API COM historique pour les
# raccourcis Windows — presente partout depuis Win95, pas de module a
# importer. Si elle echoue, on tombe sur le message d'erreur standard.
$ws = New-Object -ComObject WScript.Shell

if ($Uninstall) {
    $cible = Join-Path $startup $nom
    if (Test-Path $cible) {
        Remove-Item $cible -Force
        Write-Host "[coach-os] raccourci retire de $startup"
    } else {
        Write-Host "[coach-os] aucun raccourci a retirer"
    }
    exit 0
}

if (-not (Test-Path $bat)) {
    Write-Error "coach-os.bat introuvable : $bat"
    exit 1
}

$lnk = $ws.CreateShortcut((Join-Path $startup $nom))
$lnk.TargetPath = $bat
$lnk.WorkingDirectory = $racine
$lnk.WindowStyle = 7  # minimise au demarrage — sinon la fenetre s'ouvre devant l'utilisateur
$lnk.Description = 'Coach OS — bureau local'
# Icone : si public\favicon.ico existe, on l'utilise. Sinon Windows prend
# l'icone par defaut du .bat (cmd.exe), ce qui est laid mais fonctionnel.
$ico = Join-Path $racine 'public\favicon.ico'
if (Test-Path $ico) {
    $lnk.IconLocation = "$ico,0"
}
$lnk.Save()

Write-Host "[coach-os] raccourci pose : $startup\$nom"
Write-Host "[coach-os] prochaine ouverture de session : Coach OS demarre automatiquement."
Write-Host "[coach-os] pour retirer : .\install-startup.ps1 -Uninstall"
