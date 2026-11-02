import { animate, stagger } from 'animejs';

/**
 * Utilitários de Animação com Anime.js v4 para o AlertaJá.
 * Focado em microinterações intencionais, desempenho e acessibilidade.
 */

export const isReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Anima a transição de entrada de componentes/páginas
 */
export const animatePageEnter = (target: any) => {
  if (isReducedMotion() || !target) return null;
  return animate(target, {
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 380,
    ease: 'outCubic',
  });
};

/**
 * Anima lista de itens em cascata (stagger) sutil
 */
export const animateStaggerList = (targets: any, step: number = 40) => {
  if (isReducedMotion() || !targets) return null;
  return animate(targets, {
    opacity: [0, 1],
    translateY: [8, 0],
    delay: stagger(step),
    duration: 350,
    ease: 'outQuad',
  });
};

/**
 * Pulso sutil de alarme tático em elementos críticos (Perigo/Alerta)
 */
export const animateCriticalPulse = (target: any) => {
  if (isReducedMotion() || !target) return null;
  return animate(target, {
    scale: [1, 1.025, 1],
    duration: 900,
    ease: 'inOutQuad',
  });
};

/**
 * Microinteração de atualização discreta de indicador telemétrico
 */
export const animateDataTick = (target: any) => {
  if (isReducedMotion() || !target) return null;
  return animate(target, {
    opacity: [0.4, 1],
    duration: 300,
    ease: 'outQuad',
  });
};
