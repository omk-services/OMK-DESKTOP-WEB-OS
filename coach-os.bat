@echo off
REM coach-os.bat — démarre Coach OS en local et l'ouvre comme une vraie app Windows.
REM
REM Pré-requis : Chrome ou Edge installé. Vite et Node déjà sur le PATH.
REM
REM Trois effets, dans l'ordre :
REM   1. Tue l'instance Vite precedente (si relance). Sans ça, le port 5173
REM      reste occupe et Vite tombe en ERR_ADDRESS_IN_USE.
REM   2. Lance `npm run dev` en arriere-plan, journal dans %TEMP%.
REM   3. Attend que le port reponde, puis ouvre Chromium en mode `--app=`.
REM      Le mode --app supprime la barre d'URL, les favoris, les extensions —
REM      c'est la fenetre "comme un exe" sans le packaging.
REM
REM Pour éviter que GNU coreutils (sur Git Bash par exemple) n'intercepte
REM `timeout`, on utilise `ping -n 2 127.0.0.1` qui dort ~1s et n'a pas
REM d'homologue GNU problématique.

setlocal

set DEPOT=C:\Users\amado\ASpace_OS_V2\20_Life_OS\24_PARA_Enterprise\03_Resources_Geordi\05_From_V2_Domains\30_Business_OS\10_Projects\omk\repos\coach-os
set URL=http://localhost:5173/
set PORT=5173
set JOURNAL=%TEMP%\coach-os-dev.log

REM 1. Tue l'ancien Vite sur ce port. On ne kill PAS le navigateur : si tu
REM    fermes Coach OS et que tu le rouvres, le browser se rouvre, c'est tout.
echo [coach-os] liberation du port %PORT%...
for /f "tokens=5" %%P in ('netstat -aon ^| findstr ":%PORT%" ^| findstr LISTENING') do (
  taskkill /F /PID %%P >nul 2>&1
)
ping -n 2 127.0.0.1 >nul

REM 2. Demarre Vite en arriere-plan. `start /B` rend la main tout de suite,
REM    sans attendre que Vite soit pret. Le wait_for_port ci-dessous compense.
echo [coach-os] demarrage de Vite...
cd /d "%DEPOT%"
start "vite" /B cmd /c "npm run dev > %JOURNAL% 2>&1"

REM 3. Attend que Vite reponde. Boucle 30 fois avec ~1s d'attente — 30s max,
REM    plus que suffisant pour un dev server chaud.
echo [coach-os] attente du port %PORT%...
set /a TENTATIVES=0
:wait_port
set /a TENTATIVES+=1
ping -n 2 127.0.0.1 >nul
curl -s -o nul -w "" "%URL%" >nul 2>&1
if not errorlevel 1 goto port_ok
if %TENTATIVES% geq 30 (
  echo [coach-os] Vite n'a pas repondu apres 30s. Voir %JOURNAL%.
  exit /b 1
)
goto wait_port

:port_ok
echo [coach-os] Vite pret sur %URL%.

REM 4. Ouvre le navigateur en mode app. Chrome d'abord, Edge en repli.
REM    `--app=%URL%` : pas de barre d'URL ni de favoris.
REM    `--window-size=1440,900` : taille pensee pour un bureau.
REM    `--new-window` : ouvre une nouvelle fenetre dediee, pas un onglet.
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
  echo [coach-os] ouverture Chrome --app...
  start "Coach OS" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
    --app="%URL%" ^
    --window-size=1440,900 ^
    --new-window ^
    --user-data-dir="%LOCALAPPDATA%\coach-os-profile"
  exit /b 0
)

if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
  echo [coach-os] ouverture Edge --app (Chrome absent)...
  start "Coach OS" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" ^
    --app="%URL%" ^
    --window-size=1440,900 ^
    --new-window ^
    --user-data-dir="%LOCALAPPDATA%\coach-os-profile"
  exit /b 0
)

echo [coach-os] ERREUR : ni Chrome ni Edge n'a ete trouve.
exit /b 2
