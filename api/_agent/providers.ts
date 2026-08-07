// api/_agent/providers.ts
// Registre des fournisseurs de modele.
//
// Deux notions distinctes :
//   - CATALOGUE : les quatre fournisseurs qui existent en droit, statique.
//   - DISPONIBLES : ceux dont la cle est posee dans l'environnement ici
//     et maintenant. Le service ne tombe pas si une cle manque : il le dit.
//
// MiniMax-M3 passe par le fournisseur Anthropic muni d'une baseURL
// (point d'entree compatible Anthropic expose par MiniMax). C'est la voie
// qui ne consomme pas les quotas Anthropic.

import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'

export type ProviderId = 'minimax' | 'anthropic' | 'openai' | 'google'

export interface ProviderSpec {
  id: ProviderId
  label: string
  model: string
  envVar: string
  build(): LanguageModel
}

// NOTE : la baseURL est '.../anthropic/v1' et non '.../anthropic' comme
// annonce dans le brief. Le SDK @ai-sdk/anthropic concatene '/messages'
// a la baseURL ; le vrai chemin appele est donc
// 'https://api.minimax.io/anthropic/v1/messages'. Avec '/anthropic'
// seul, MiniMax renvoie 404 (la route /v1 manque).
const MINIMAX_BASE_URL = 'https://api.minimax.io/anthropic/v1'
const MINIMAX_MODEL = 'MiniMax-M3'

const CATALOG: Record<ProviderId, ProviderSpec> = {
  minimax: {
    id: 'minimax',
    label: 'MiniMax-M3 (via Anthropic)',
    model: MINIMAX_MODEL,
    envVar: 'MINIMAX_API_KEY',
    build() {
      // Reutilise createAnthropic pour beneficier du client preconstruit
      // (cache, retries) ; il suffit d'ecraser la cle et la baseURL.
      const client = createAnthropic({
        apiKey: process.env.MINIMAX_API_KEY,
        baseURL: MINIMAX_BASE_URL,
      })
      return client(MINIMAX_MODEL)
    },
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic Claude',
    model: 'claude-sonnet-4-6',
    envVar: 'ANTHROPIC_API_KEY',
    build() {
      return anthropic('claude-sonnet-4-6')
    },
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    model: 'gpt-5.5',
    envVar: 'OPENAI_API_KEY',
    build() {
      return openai('gpt-5.5')
    },
  },
  google: {
    id: 'google',
    label: 'Google Gemini',
    model: 'gemini-3-flash',
    envVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
    build() {
      // L'export par defaut de @ai-sdk/google lit deja
      // GOOGLE_GENERATIVE_AI_API_KEY ; on n'a rien a passer.
      return google('gemini-3-flash')
    },
  },
}

export function getProvider(id: ProviderId): ProviderSpec {
  return CATALOG[id]
}

export function listProviders(): ProviderSpec[] {
  return Object.values(CATALOG)
}

/** Prefixes de cle attendus, quand le fournisseur en impose un.
 *
 *  Presence ne vaut pas validite. Sur cette machine, le shell exporte la cle
 *  MiniMax (`sk-cp-…`) sous le nom `ANTHROPIC_API_KEY` — c'est ce qui permet de
 *  deleguer a M3 avec le CLI Anthropic. Un simple test de presence annoncait
 *  donc Anthropic « disponible », et l'appel partait chez api.anthropic.com
 *  avec une cle MiniMax pour revenir en « Invalid API key » — une panne dont la
 *  cause est invisible depuis l'interface.
 *
 *  On refuse donc une cle dont le prefixe trahit une autre origine. Une cle
 *  sans prefixe connu reste acceptee : mieux vaut laisser passer un format
 *  inattendu que bloquer un fournisseur legitime.
 */
const PREFIXE_ATTENDU: Partial<Record<ProviderId, string>> = {
  anthropic: 'sk-ant-',
}

export function isProviderAvailable(id: ProviderId): boolean {
  const cle = process.env[CATALOG[id].envVar]
  if (!cle) return false
  const attendu = PREFIXE_ATTENDU[id]
  return attendu ? cle.startsWith(attendu) : true
}

export function listAvailableProviders(): ProviderSpec[] {
  return listProviders().filter((spec) => isProviderAvailable(spec.id))
}

export interface ProviderStatus {
  id: ProviderId
  label: string
  model: string
  available: boolean
}

export function listProviderStatuses(): ProviderStatus[] {
  return listProviders().map((spec) => ({
    id: spec.id,
    label: spec.label,
    model: spec.model,
    available: isProviderAvailable(spec.id),
  }))
}

export function resolveProviderId(raw: string | undefined): ProviderId {
  if (raw && raw in CATALOG) return raw as ProviderId
  return 'minimax'
}