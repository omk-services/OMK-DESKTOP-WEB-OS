"""Claude Code interface — implemente sur le meme contrat que agent_pi.run().

Une invocation = un tour non interactif de la CLI `claude`, en stream-json.
Le modele est impose par l'environnement (ANTHROPIC_*), pas par un drapeau :
c'est ainsi qu'on pointe la CLI sur MiniMax-M3 via sa passerelle compatible
Anthropic.

Trois pieges deja payes, ne pas les reintroduire :
  1. Le prompt part par STDIN, jamais en argument positionnel. Un prompt qui
     commence par `---` (frontmatter YAML) est sinon lu comme un drapeau et la
     CLI meurt sur `unknown option`.
  2. `claude` est un shim .cmd sous Windows : CreateProcess ne resout pas
     PATHEXT, donc CC_PATH doit etre absolu et porter son extension.
  3. Le shell exporte ANTHROPIC_BASE_URL=https://api.anthropic.com, qui ecrase
     la valeur de settings.json. On le repose explicitement ici, sinon la cle
     MiniMax part chez Anthropic et revient en `Invalid API key` avec exit 0.
"""

from __future__ import annotations

import json
import os
import subprocess
import uuid
from pathlib import Path
from typing import Callable, Optional

from .data_types import PiRequest, PiResult
from .utils import operator_env

CC_PATH = os.environ.get(
    "CC_PATH", str(Path.home() / "AppData/Roaming/npm/claude.cmd"))

# Le roster nomme les outils a la maniere de pi ; la CLI Claude Code a ses
# propres noms. Un outil absent de cette table est simplement ignore.
TOOL_MAP = {
    "read": "Read",
    "bash": "Bash",
    "edit": "Edit",
    "write": "Write",
    "grep": "Grep",
    "find": "Glob",
    "ls": "Glob",
}


def _cc_env() -> dict[str, str]:
    env = operator_env()
    for key in ("ANTHROPIC_BASE_URL", "ANTHROPIC_API_KEY",
                "ANTHROPIC_MODEL", "ANTHROPIC_SMALL_FAST_MODEL"):
        value = os.environ.get(key)
        if value:
            env[key] = value
    # La CLI ne doit pas heriter d'une session interactive en cours.
    env.pop("CLAUDE_CODE_ENTRYPOINT", None)
    return env


def _pi_shaped_usage(usage: dict) -> dict:
    """Traduit la comptabilite Claude vers la forme que lisent le tracer et
    UsageBreakdown, tous deux ecrits pour pi."""
    return {
        "input": usage.get("input_tokens") or 0,
        "output": usage.get("output_tokens") or 0,
        "cacheRead": usage.get("cache_read_input_tokens") or 0,
        "cacheWrite": usage.get("cache_creation_input_tokens") or 0,
    }


def _text_of(message: dict) -> str:
    return "".join(
        part.get("text", "") for part in message.get("content", []) or []
        if isinstance(part, dict) and part.get("type") == "text")


def _uuid_session(session_id: str) -> str:
    """La CLI Claude Code exige un UUID ; la factory forge des ids courts.

    uuid5 est deterministe, donc les relances de parsing et les corrections de
    gate retombent sur la MEME session cote CLI — le contexte survit, ce qui est
    tout l'interet du design (`re-prompt the SAME session with a correction`).
    """
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"sssf://{session_id}"))


def run(request: PiRequest, on_event: Optional[Callable[[dict], None]] = None,
        on_spawn: Optional[Callable[[int], None]] = None,
        on_exit: Optional[Callable[[int], None]] = None) -> PiResult:
    """Un tour Claude Code, rendu dans la meme enveloppe que agent_pi.run()."""
    cmd = [
        CC_PATH, "-p",
        "--output-format", "stream-json",
        "--verbose",
        "--session-id", _uuid_session(request.session_id),
        "--append-system-prompt", request.system_prompt,
        "--permission-mode", "bypassPermissions",
    ]
    if request.tools:
        allowed = [TOOL_MAP[t] for t in request.tools if t in TOOL_MAP]
        if allowed:
            cmd += ["--allowedTools", ",".join(sorted(set(allowed)))]

    result = PiResult(session_id=request.session_id)
    raw_path = Path(request.raw_output_path)
    raw_path.parent.mkdir(parents=True, exist_ok=True)

    process = subprocess.Popen(
        cmd, cwd=request.cwd, env=_cc_env(),
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, encoding="utf-8", errors="replace", bufsize=1,
    )
    if on_spawn:
        on_spawn(process.pid)

    # Le prompt par stdin, puis fermeture : la CLI attend EOF avant de repondre.
    if process.stdin:
        process.stdin.write(request.prompt)
        process.stdin.close()

    with raw_path.open("w", encoding="utf-8") as raw:
        for line in process.stdout or []:
            line = line.strip()
            if not line:
                continue
            raw.write(line + "\n")
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue

            kind = event.get("type")
            if kind == "assistant":
                message = event.get("message", {}) or {}
                text = _text_of(message)
                if text:
                    result.text = text          # le dernier tour l'emporte
                usage = _pi_shaped_usage(message.get("usage", {}) or {})
                turn = sum(usage.values())
                if turn:
                    result.tokens += turn
                    result.usage.add_turn(usage, turn)
                    result.context_tokens = turn
            elif kind == "result":
                # `result` porte le texte final et le cout consolide ; il fait
                # foi sur les deux, la CLI l'emet en dernier.
                if event.get("result"):
                    result.text = event["result"]
                result.cost += float(event.get("total_cost_usd") or 0.0)

            if on_event:
                on_event(event)

    stderr = process.stderr.read() if process.stderr else ""
    result.returncode = process.wait()
    if on_exit:
        on_exit(process.pid)
    if result.returncode != 0 and not result.text:
        raise RuntimeError(
            f"claude exited {result.returncode}: {stderr.strip()[-800:]}")
    return result
