/** Últimas respostas por chave, para reabrir uma tela sem esperar a rede. */
const cache = new Map<string, unknown>()

export const lerCache = <T>(chave: string) => cache.get(chave) as T | undefined
export const gravarCache = (chave: string, dado: unknown) => void cache.set(chave, dado)
/** Chamado ao trocar de sessão: nada de um usuário pode aparecer para outro. */
export const limparCache = () => cache.clear()
