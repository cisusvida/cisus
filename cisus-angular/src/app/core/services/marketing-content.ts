import { Service } from '@angular/core';
import type { ProductFamily } from '../models/portfolio-item';
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
      subtitle:
        'Preparamos cada pieza para que llegue a tus manos o a las personas con quienes quieras compartirla.',
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

  readonly productFamilies: ProductFamily[] = [
    {
      id: 'tablas',
      label: 'Tablas de cocina',
      heading: 'TABLAS DE COCINA',
      claim: 'Arte funcional para tu espacio',
      types: [
        {
          id: 'animales',
          label: 'Conceptuales de animales',
          icon: 'paw',
          models: [
            { productId: 'cisus_tabla_felino' },
            { productId: 'cisus_tabla_delfin' },
            { productId: 'cisus_tabla_zorro' },
          ],
        },
        {
          id: 'relieve',
          label: 'Relieve de paisajes',
          icon: 'relief',
          models: [{ productId: 'cisus_tabla_relieve' }],
        },
      ],
    },
    {
      id: 'pomos_tiradores',
      label: 'Pomos y tiradores',
      heading: 'POMOS Y TIRADORES',
      claim: 'El detalle que cambia tus muebles.',
      commercialState: 'design_concept',
      conceptLabel: 'Colección en desarrollo',
      imageDisclosure: 'Visualización de diseño',
      detailNotice:
        'Modelo en desarrollo. Medidas, madera, fijación y disponibilidad por confirmar.',
      types: [
        {
          id: 'pomos',
          label: 'Pomos',
          icon: 'knob',
          models: [
            {
              productId: 'cisus_pomo_orbita',
              metadata: 'Pomo de disco · Madera',
              sceneObjectFit: 'contain',
            },
            {
              productId: 'cisus_pomo_boton',
              metadata: 'Pomo redondo · Madera',
              sceneObjectFit: 'contain',
            },
            {
              productId: 'cisus_pomo_canto',
              metadata: 'Pomo cuadrado · Madera',
              sceneObjectFit: 'contain',
            },
          ],
        },
        {
          id: 'tiradores',
          label: 'Tiradores',
          icon: 'handle',
          models: [
            {
              productId: 'cisus_tirador_encuentro',
              metadata: 'Tirador en pareja · Madera',
              sceneObjectFit: 'contain',
            },
            {
              productId: 'cisus_tirador_brisa',
              metadata: 'Tirador orgánico · Madera',
              sceneObjectFit: 'contain',
            },
            {
              productId: 'cisus_tirador_borde',
              metadata: 'Tirador de perfil · Madera',
              sceneObjectFit: 'contain',
            },
            {
              productId: 'cisus_tirador_tallo',
              metadata: 'Tirador vertical · Madera',
              sceneObjectFit: 'contain',
            },
          ],
        },
      ],
    },
  ];

  readonly portfolioCompanionProductIds = [
    'cisus_mesa_cauce',
    'cisus_mueble_linde',
    'cisus_repisa_senda',
    'cisus_banco_raiz',
    'cisus_lampara_claro',
    'cisus_pedestal_brote',
  ];

  readonly commercialLines = [
    {
      id: 'series',
      title: 'Series especiales',
      description:
        'Series de temporada y ediciones mediante empresas asociadas, sujetas a disponibilidad y acuerdo.',
    },
    {
      id: 'corporativo',
      title: 'Línea corporativa',
      description:
        'Productos Cisus para vínculos duraderos, con modelos mayoristas, consignación o comisión.',
    },
  ];
}
