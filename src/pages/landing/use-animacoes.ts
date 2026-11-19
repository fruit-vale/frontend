import { useLayoutEffect, type RefObject } from 'react'
import { animate, createTimeline, stagger, svg } from 'animejs'

/**
 * Animações da landing com anime.js. Marcadores no HTML:
 *  - data-hero: entra em sequência ao abrir a página
 *  - data-reveal: surge ao rolar até o elemento (filhos com data-item entram em cascata)
 *  - data-contador="N": conta de 0 até N ao aparecer
 *  - data-flutua: flutua em loop
 *  - data-linha: traço SVG que se desenha
 * Com "reduzir movimento" ativo no sistema, nada é escondido nem animado.
 */
export function useAnimacoes(raiz: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = raiz.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const animacoes: { revert: () => unknown }[] = []
    const escondidos = Array.from(
      el.querySelectorAll<HTMLElement>('[data-hero], [data-reveal], [data-reveal] [data-item]'),
    )
    for (const e of escondidos) e.style.opacity = '0'

    // entrada do topo da página
    const abertura = createTimeline({ defaults: { ease: 'outExpo', duration: 900 } })
    const hero = el.querySelectorAll('[data-hero]')
    if (hero.length) {
      abertura.add(hero, { opacity: [0, 1], y: [32, 0], delay: stagger(110) })
    }
    animacoes.push(abertura)

    // elementos que flutuam
    el.querySelectorAll<HTMLElement>('[data-flutua]').forEach((alvo, i) => {
      animacoes.push(
        animate(alvo, {
          y: [-10, 10],
          duration: 3200 + i * 500,
          ease: 'inOutSine',
          loop: true,
          alternate: true,
        }),
      )
    })

    // linhas do gráfico se desenhando em loop suave
    const linhas = el.querySelectorAll('[data-linha]')
    if (linhas.length) {
      animacoes.push(
        animate(svg.createDrawable(linhas), {
          draw: ['0 0', '0 1'],
          duration: 2600,
          ease: 'inOutQuad',
          delay: stagger(350, { start: 700 }),
        }),
      )
    }

    // barras de progresso enchendo até o valor
    el.querySelectorAll<HTMLElement>('[data-barra]').forEach((barra) => {
      animacoes.push(
        animate(barra, {
          width: ['0%', `${Number(barra.dataset.barra)}%`],
          duration: 1800,
          delay: 900,
          ease: 'outExpo',
        }),
      )
    })

    const contar = (c: HTMLElement) => {
      const fim = Number(c.dataset.contador)
      const estado = { v: 0 }
      animacoes.push(
        animate(estado, {
          v: fim,
          duration: 1600,
          delay: 500,
          ease: 'outExpo',
          onUpdate: () => {
            c.textContent = String(Math.round(estado.v))
          },
        }),
      )
    }
    // contadores do topo (fora das seções reveladas ao rolar)
    el.querySelectorAll<HTMLElement>('[data-contador]').forEach((c) => {
      if (!c.closest('[data-reveal]')) contar(c)
    })

    // contadores e blocos ao rolar
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue
          const alvo = entrada.target as HTMLElement
          observador.unobserve(alvo)

          const itens = alvo.querySelectorAll('[data-item]')
          if (itens.length) {
            animacoes.push(
              animate(itens, {
                opacity: [0, 1],
                y: [36, 0],
                scale: [0.96, 1],
                delay: stagger(110),
                duration: 800,
                ease: 'outExpo',
              }),
            )
          }
          animacoes.push(
            animate(alvo, { opacity: [0, 1], y: [20, 0], duration: 700, ease: 'outExpo' }),
          )

          alvo.querySelectorAll<HTMLElement>('[data-contador]').forEach(contar)
        }
      },
      { threshold: 0.18 },
    )
    el.querySelectorAll('[data-reveal]').forEach((alvo) => observador.observe(alvo))

    return () => {
      observador.disconnect()
      for (const a of animacoes) a.revert()
      for (const e of escondidos) e.style.opacity = ''
    }
  }, [raiz])
}
