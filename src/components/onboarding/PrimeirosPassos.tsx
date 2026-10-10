import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon, EyeOffIcon, ListChecksIcon } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ROUTES } from '@/config/routes'
import { plural } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  culturasService,
  empresasService,
  lotesService,
  propriedadesService,
  sensoresService,
  usuariosService,
} from '@/services'

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

const ETAPAS: Etapa[] = [
  {
    titulo: 'Cadastrar a empresa',
    porque:
      'É o cliente da plataforma: propriedades, usuários e culturas próprias pertencem a uma empresa.',
    rota: ROUTES.empresas,
    acao: 'Ir para Empresas',
    unidade: ['empresa', 'empresas'],
    contar: () => empresasService.listar().then((l) => l.length),
  },
  {
    titulo: 'Criar o usuário produtor',
    porque:
      'O produtor da empresa acompanha os lotes e pode cadastrar os próprios sensores e culturas.',
    rota: ROUTES.usuarios,
    acao: 'Ir para Usuários',
    unidade: ['produtor', 'produtores'],
    contar: () =>
      usuariosService.listar().then((l) => l.filter((u) => u.role === 'produtor').length),
  },
  {
    titulo: 'Cadastrar a propriedade',
    porque: 'A fazenda ou sítio da empresa, com a localização no mapa onde ficam os lotes.',
    rota: ROUTES.propriedades,
    acao: 'Ir para Propriedades',
    unidade: ['propriedade', 'propriedades'],
    contar: () => propriedadesService.listar().then((l) => l.length),
  },
  {
    titulo: 'Cadastrar a cultura',
    porque:
      'O que é plantado (ex.: Manga Palmer), com a faixa ideal de temperatura e umidade usada nos alertas.',
    rota: ROUTES.culturas,
    acao: 'Ir para Culturas',
    unidade: ['cultura', 'culturas'],
    contar: () => culturasService.listar().then((l) => l.length),
  },
  {
    titulo: 'Criar o lote',
    porque:
      'A área plantada dentro da propriedade: escolha a cultura e marque o retângulo no mapa.',
    rota: ROUTES.cultivos,
    acao: 'Ir para Cultivos e Lotes',
    unidade: ['lote', 'lotes'],
    contar: () => lotesService.listar().then((l) => l.length),
  },
  {
    titulo: 'Cadastrar o sensor',
    porque:
      'Escolha o lote e os dados que ele envia (ex.: temperatura). O app gera o usuário e a senha do dispositivo.',
    rota: ROUTES.sensores,
    acao: 'Ir para Sensores',
    unidade: ['sensor', 'sensores'],
    contar: () => sensoresService.listar().then((l) => l.length),
  },
  {
    titulo: 'Receber a primeira leitura',
    porque:
      'Grave a biblioteca FruitVale no ESP32 e configure pelo portal (rede "FruitVale-XXXX") com o usuário e a senha do sensor.',
    rota: ROUTES.sensores,
    acao: 'Ver os sensores',
    unidade: ['leitura', 'leituras'],
    contar: () =>
      sensoresService.listar().then((l) => l.reduce((soma, s) => soma + s.total_leituras, 0)),
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
export function PrimeirosPassos() {
  const [contagens, setContagens] = useState<(number | null)[] | null>(null)
  const [oculto, setOculto] = useState(lerOculto)

  useEffect(() => {
    if (oculto) return
    let ativo = true
    // uma etapa que falhar ao carregar fica como "não verificada", sem travar as outras
    Promise.all(ETAPAS.map((e) => e.contar().catch(() => null))).then(
      (valores) => ativo && setContagens(valores),
    )
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
      <Button variant="outline" className="w-fit" onClick={() => ocultar(false)}>
        <ListChecksIcon />
        Mostrar o guia de primeiros passos
      </Button>
    )
  if (!contagens) return null

  const feitas = contagens.map((c) => (c ?? 0) > 0)
  const total = feitas.filter(Boolean).length
  // tudo configurado: o guia sai do caminho
  if (total === ETAPAS.length) return null
  const atual = feitas.indexOf(false)

  return (
    <Card aria-label="Primeiros passos">
      <CardContent className="flex flex-col gap-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Primeiros passos
            </span>
            <h2 className="text-xl font-semibold">Configure a plataforma nesta ordem</h2>
            <p className="text-sm text-muted-foreground">
              Cada etapa depende da anterior. {total} de {ETAPAS.length} concluídas.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => ocultar(true)}>
            <EyeOffIcon />
            Ocultar guia
          </Button>
        </header>

        <Progress
          value={(total / ETAPAS.length) * 100}
          aria-label={`${total} de ${ETAPAS.length} etapas concluídas`}
        />

        <ol className="flex flex-col gap-2">
          {ETAPAS.map((etapa, i) => {
            const contagem = contagens[i]
            const estado = feitas[i] ? 'feita' : i === atual ? 'atual' : 'pendente'
            return (
              <li
                key={etapa.titulo}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3',
                  estado === 'atual' && 'border-primary/40 bg-secondary/50',
                  estado === 'pendente' && 'opacity-70',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                    estado === 'feita' && 'border-success bg-success-soft text-success',
                    estado === 'atual' && 'border-primary bg-primary text-primary-foreground',
                  )}
                >
                  {feitas[i] ? <CheckIcon className="size-4" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="text-sm">
                    {etapa.titulo}
                    <span className="font-normal text-muted-foreground">
                      {feitas[i]
                        ? ` — ${contagem!.toLocaleString('pt-BR')} ${plural(contagem!, ...etapa.unidade)}`
                        : contagem === null
                          ? ' — não foi possível verificar'
                          : ''}
                    </span>
                  </strong>
                  {/* a explicação aparece na etapa da vez, para não poluir a lista */}
                  {estado === 'atual' && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{etapa.porque}</p>
                  )}
                </div>
                {estado === 'atual' ? (
                  <Link to={etapa.rota} className={buttonVariants({ size: 'lg' })}>
                    {etapa.acao}
                  </Link>
                ) : (
                  <Link to={etapa.rota} className={buttonVariants({ variant: 'ghost' })}>
                    {feitas[i] ? 'Abrir' : 'Ir'}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
