import { computed, Service, signal } from '@angular/core';
import type { PortfolioItem } from '../models/portfolio-item';
import type { ProcessIdea, ProcessStep } from '../models/process-step';

@Service()
export class MarketingContent {
  /** Catalogue order only; the orbit computes positions for any number of ideas. */
  readonly processIdeas: ProcessIdea[] = [
    { id: 'portavasos', label: 'Portavasos', illustration: 'coaster', status: 'realized' },
    { id: 'tablas', label: 'Tablas', illustration: 'kitchen-board', status: 'developing' },
  ];

  readonly processSteps: ProcessStep[] = [
    {
      id: 'idea',
      number: '01',
      title: 'Idea',
      subtitle: 'Detectamos una oportunidad de producto útil y memorable.',
      icon: '✦',
    },
    {
      id: 'sketch',
      number: '02',
      title: 'Boceto',
      subtitle: 'Exploramos forma, materiales y una fabricación responsable.',
      icon: '⌁',
    },
    {
      id: 'design',
      number: '03',
      title: 'Diseño',
      subtitle: 'Resolvemos estética, función y detalles técnicos.',
      icon: '◌',
    },
    {
      id: 'prototype',
      number: '04',
      title: 'Prototipo',
      subtitle: 'Validamos proporciones, resistencia y experiencia de uso.',
      icon: '◇',
    },
    {
      id: 'production',
      number: '05',
      title: 'Fabricación',
      subtitle: 'Producimos con trazabilidad y control de calidad.',
      icon: '⚙',
    },
    {
      id: 'delivery',
      number: '06',
      title: 'Distribución',
      subtitle: 'Llegamos a empresas asociadas y sus sucursales.',
      icon: '↗',
    },
    {
      id: 'result',
      number: '07',
      title: 'Hecho realidad',
      subtitle: 'La idea se convierte en un producto real, listo para usar y compartir.',
      icon: '✓',
    },
  ];

  private readonly portfolioState = signal<PortfolioItem[]>([
    {
      id: 'tablas',
      title: 'Tablas Cisus',
      summary: 'Una pieza noble pensada para compartir.',
      description:
        'Productos de madera diseñados y fabricados por Cisus para regalos y experiencias cotidianas.',
      category: 'Madera',
      tags: ['Cisus', 'Madera', 'Diseño local'],
      price: 28990,
      cover: '/images/home_card.jpeg',
      featured: true,
      deliverables: ['Diseño Cisus', 'Fabricación trazable', 'Control de calidad'],
    },
    {
      id: 'series',
      title: 'Series especiales',
      summary: 'Ediciones disponibles mediante empresas asociadas.',
      description:
        'Series de temporada y promociones comerciales definidas por suscripción y acuerdo.',
      category: 'Ediciones',
      tags: ['Temporada', 'Promociones'],
      price: 34990,
      cover: '/images/portfolio_002.svg',
      featured: true,
      deliverables: ['Producto original', 'Disponibilidad por sucursal'],
    },
    {
      id: 'corporativo',
      title: 'Línea corporativa',
      summary: 'Productos Cisus para vínculos duraderos.',
      description:
        'Soluciones comerciales para empresas, con modelos mayoristas, consignación o comisión.',
      category: 'Corporativo',
      tags: ['Empresa', 'Regalos'],
      price: 45990,
      cover: '/images/portfolio_003.svg',
      featured: true,
      deliverables: ['Acuerdo comercial', 'Distribución multisucursal'],
    },
  ]);

  readonly portfolio = this.portfolioState.asReadonly();
  readonly featured = computed(() => this.portfolioState().filter((item) => item.featured));
}
