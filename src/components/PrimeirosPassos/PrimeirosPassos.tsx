import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import './PrimeirosPassos.css'

// O guia só usa rotas que já existem na API: cada etapa está feita quando a
// lista correspondente tem pelo menos um item.
type Etapa = {
  titulo: string
  /** por que a etapa existe / o que ela libera */
  porque: string
  rota: string
  acao: string
  /** rótulo da contagem, ex.: "empresa(s)" */
  unidade: [singular: string, plural: string]
  contar: () => Promise<number>
}

type Usuario = { role: string | null }
type Sensor = { total_leituras: number }

const tamanho = (rota: string) => () => apiFetch<unknown[]>(rota).then((lista) => lista.length)

const ETAPAS: Etapa[] = [
  {
    titulo: 'Cadastrar a empresa',
    porque: 'É o cliente da plataforma: propriedades, usuários e culturas próprias pertencem a uma empresa.',
    rota: '/empresas',
    acao: 'Ir para Empresas',
    unidade: ['empresa', 'empresas'],
    contar: tamanho('/empresas'),
  },
  {
    titulo: 'Criar o usuário produtor',
    porque: 'O produtor da empresa acompanha os lotes e pode cadastrar os próprios sensores e culturas.',
    rota: '/usuarios',
    acao: 'Ir para Usuários',
    unidade: ['produtor', 'produtores'],
    contar: () => apiFetch<Usuario[]>('/usuarios').then((l) => l.filter((u) => u.role === 'produtor').length),
  },
  {
    titulo: 'Cadastrar a propriedade',
    porque: 'A fazenda ou sítio da empresa, com a localização no mapa onde ficam os lotes.',
    rota: '/propriedades',
    acao: 'Ir para Propriedades',
    unidade: ['propriedade', 'propriedades'],
    contar: tamanho('/propriedades'),
  },
  {
    titulo: 'Cadastrar a cultura',
    porque: 'O que é plantado (ex.: Manga Palmer), com a faixa ideal de temperatura e umidade usada nos alertas.',
    rota: '/culturas',
    acao: 'Ir para Culturas',
    unidade: ['cultura', 'culturas'],
    contar: tamanho('/culturas'),
  },
  {
    titulo: 'Criar o lote',
    porque: 'A área plantada dentro da propriedade: escolha a cultura e marque o retângulo no mapa.',
    rota: '/cultivos',
    acao: 'Ir para Cultivos e Lotes',
    unidade: ['lote', 'lotes'],
    contar: tamanho('/lotes'),
  },
  {
    titulo: 'Cadastrar o sensor',
    porque: 'Escolha o lote e os dados que ele envia (ex.: temperatura). O app gera o usuário e a senha do dispositivo.',
    rota: '/sensores',
    acao: 'Ir para Sensores',
    unidade: ['sensor', 'sensores'],
    contar: tamanho('/sensores'),
  },
  {
    titulo: 'Receber a primeira leitura',
    porque:
      'Grave a biblioteca FruitVale no ESP32 e configure pelo portal (rede "FruitVale-XXXX") com o usuário e a senha do sensor.',
    rota: '/sensores',
    acao: 'Ver os sensores',
    unidade: ['leitura', 'leituras'],
    contar: () => apiFetch<Sensor[]>('/sensores').then((l) => l.reduce((s, x) => s + x.total_leituras, 0)),
  },
]

const CHAVE_OCULTO = 'fruitvale:primeiros-passos-oculto'

function lerOculto() {
  try {
    return localStorage.getItem(CHAVE_OCULTO) === '1'
  } catch {
    return false
  }
}

/** Guia do administrador: a ordem dos cadastros até o sensor enviar dados. */
function PrimeirosPassos() {
  const [contagens, setContagens] = useState<(number | null)[] | null>(null)
  const [oculto, setOculto] = useState(lerOculto)

  useEffect(() => {
    if (oculto) return
    let ativo = true
    // uma etapa que falhar ao carregar fica como "não verificada", sem travar as outras
    Promise.all(ETAPAS.map((e) => e.contar().catch(() => null))).then((valores) => ativo && setContagens(valores))
    return () => {
      ativo = false
    }
  }, [oculto])

  function ocultar(valor: boolean) {
    setOculto(valor)
    try {
      if (valor) localStorage.setItem(CHAVE_OCULTO, '1')
      else localStorage.removeItem(CHAVE_OCULTO)
    } catch {
      // sem armazenamento (ex.: navegação privada): vale só nesta visita
    }
  }

  if (oculto)
    return (
      <button type="button" className="primeiros-passos__reabrir" onClick={() => ocultar(false)}>
        Mostrar o guia de primeiros passos
      </button>
    )
  if (!contagens) return null

  const feitas = contagens.map((c) => (c ?? 0) > 0)
  const total = feitas.filter(Boolean).length
  // tudo configurado: o guia sai do caminho
  if (total === ETAPAS.length) return null
  const atual = feitas.indexOf(false)

  return (
    <section className="primeiros-passos" aria-label="Primeiros passos">
      <header className="primeiros-passos__topo">
        <div>
          <span className="primeiros-passos__eyebrow">PRIMEIROS PASSOS</span>
          <h2>Configure a plataforma nesta ordem</h2>
          <p>
            Cada etapa depende da anterior. {total} de {ETAPAS.length} concluídas.
          </p>
        </div>
        <button type="button" className="primeiros-passos__ocultar" onClick={() => ocultar(true)}>
          Ocultar guia
        </button>
      </header>

      <div
        className="primeiros-passos__progresso"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={ETAPAS.length}
        aria-valuenow={total}
        aria-label={`${total} de ${ETAPAS.length} etapas concluídas`}
      >
        <span style={{ width: `${(total / ETAPAS.length) * 100}%` }} />
      </div>

      <ol className="primeiros-passos__lista">
        {ETAPAS.map((etapa, i) => {
          const contagem = contagens[i]
          const estado = feitas[i] ? 'feita' : i === atual ? 'atual' : 'pendente'
          return (
            <li key={etapa.titulo} className={`primeiro-passo primeiro-passo--${estado}`}>
              <span className="primeiro-passo__marca" aria-hidden="true">
                {feitas[i] ? '✓' : i + 1}
              </span>
              <div className="primeiro-passo__texto">
                <strong>
                  {etapa.titulo}
                  <span className="primeiro-passo__estado">
                    {feitas[i]
                      ? ` — ${contagem!.toLocaleString('pt-BR')} ${contagem === 1 ? etapa.unidade[0] : etapa.unidade[1]}`
                      : contagem === null
                        ? ' — não foi possível verificar'
                        : ''}
                  </span>
                </strong>
                {/* a explicação aparece na etapa da vez, para não poluir a lista */}
                {estado === 'atual' && <p>{etapa.porque}</p>}
              </div>
              {estado === 'atual' ? (
                <Link to={etapa.rota} className="btn-primary primeiro-passo__acao">
                  {etapa.acao}
                </Link>
              ) : (
                <Link to={etapa.rota} className="primeiro-passo__link">
                  {feitas[i] ? 'Abrir' : 'Ir'}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default PrimeirosPassos
