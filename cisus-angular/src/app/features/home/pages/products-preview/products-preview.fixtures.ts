import type { CatalogProduct } from '../../../../core/models/commerce';

type PreviewProduct = Omit<CatalogProduct, 'basePrice'> & {
  basePrice: number | null;
  status: 'available' | 'design_concept';
  purchaseEnabled: boolean;
};

const table = (
  id: string,
  name: string,
  description: string,
  basePrice: number,
): PreviewProduct => ({
  id,
  sku: id.toUpperCase(),
  name,
  description,
  shortDescription: description,
  materialLabel: 'Madera',
  imagePath: null,
  imageUrl: `/preview-media/${id.replace('cisus_tabla_', '')}.png`,
  sceneImagePath: null,
  sceneImageUrl: `/preview-media/${id.replace('cisus_tabla_', '')}.png`,
  basePrice,
  currency: 'CLP',
  status: 'available',
  purchaseEnabled: true,
});

const concept = (
  product: Omit<
    PreviewProduct,
    'imagePath' | 'sceneImagePath' | 'basePrice' | 'currency' | 'status' | 'purchaseEnabled'
  >,
): PreviewProduct => ({
  ...product,
  imagePath: null,
  sceneImagePath: null,
  basePrice: null,
  currency: 'CLP',
  status: 'design_concept',
  purchaseEnabled: false,
});

/** Existing catalogue-route fixtures kept commercial and structurally compatible. */
export const PREVIEW_PRODUCTS: CatalogProduct[] = [
  {
    id: 'demo_felino',
    sku: 'DEMO-FELINO',
    name: 'Felino',
    description:
      'Una pieza alargada de presencia vertical, con una composición lineal de felino sobre madera.',
    imageUrl: '/preview-media/felino.png',
    basePrice: 29990,
  },
  {
    id: 'demo_delfin',
    sku: 'DEMO-DELFIN',
    name: 'Delfín',
    description:
      'Un formato redondeado que acompaña el movimiento del delfín y la fluidez de sus líneas.',
    imageUrl: '/preview-media/delfin.png',
    basePrice: 24990,
  },
  {
    id: 'demo_relieve',
    sku: 'DEMO-RELIEVE',
    name: 'Con relieve',
    description:
      'Tabla de madera con canal perimetral, asa integrada y un paisaje lineal en su superficie.',
    imageUrl: '/preview-media/relieve.png',
    basePrice: 34990,
  },
  {
    id: 'demo_modelo',
    sku: 'DEMO-MODELO',
    name: 'Modelo de prueba',
    description: 'Contenido aislado para revisar rutas del catálogo.',
    imageUrl: null,
    basePrice: 9990,
  },
].map((product) => ({ ...product, imagePath: null, currency: 'CLP' }));

/** Local-only Products composition. It is never imported into Firestore or the public catalog. */
export const PORTFOLIO_PREVIEW_PRODUCTS: PreviewProduct[] = [
  table(
    'cisus_tabla_felino',
    'Felino',
    'Una pieza alargada de presencia vertical, con una composición lineal de felino sobre madera.',
    29990,
  ),
  table(
    'cisus_tabla_delfin',
    'Delfín',
    'Un formato redondeado que acompaña el movimiento del delfín y la fluidez de sus líneas.',
    24990,
  ),
  table(
    'cisus_tabla_relieve',
    'Con relieve',
    'Tabla de madera con canal perimetral, asa integrada y un paisaje lineal en su superficie.',
    34990,
  ),
  concept({
    id: 'cisus_pomo_orbita',
    sku: 'CIS-POM-ORB',
    name: 'Órbita',
    materialLabel: 'Madera',
    shortDescription:
      'Un frente circular amplio para convertir el agarre en un detalle protagonista.',
    description:
      'Órbita combina un disco amplio con una base recogida. Su forma circular crea un punto de atención sobre frentes de líneas simples, para quienes quieren que el tirador también forme parte del diseño.',
    imageUrl: '/preview-media/orbita.png',
    sceneImageUrl: '/preview-media/orbita-instalado.png',
  }),
  concept({
    id: 'cisus_pomo_boton',
    sku: 'CIS-POM-BOT',
    name: 'Botón',
    materialLabel: 'Madera',
    shortDescription: 'Curvas suaves y presencia discreta para acompañar el diseño de tus muebles.',
    description:
      'Botón propone una forma circular compacta y redondeada. Un detalle visualmente suave para acompañar cajones y puertas, sin competir con el resto del mueble.',
    imageUrl: '/preview-media/boton.png',
    sceneImageUrl: '/preview-media/boton.png',
  }),
  concept({
    id: 'cisus_pomo_canto',
    sku: 'CIS-POM-CAN',
    name: 'Canto',
    materialLabel: 'Madera',
    shortDescription: 'Geometría de bordes suaves para dar un acento definido a cajones y puertas.',
    description:
      'Canto combina un frente cuadrado con esquinas redondeadas. Una alternativa para dar orden y carácter a muebles de líneas rectas sin recurrir a una forma rígida o puntiaguda.',
    imageUrl: '/preview-media/canto.png',
    sceneImageUrl: '/preview-media/canto.png',
  }),
  concept({
    id: 'cisus_tirador_encuentro',
    sku: 'CIS-TIR-ENC',
    name: 'Encuentro',
    materialLabel: 'Madera',
    shortDescription: 'Dos mitades que dibujan un círculo al encontrarse las puertas.',
    description:
      'Encuentro se presenta como una pareja de tiradores semicirculares. En dos puertas contiguas, sus formas completan un círculo y convierten la unión del mueble en parte de su diseño.',
    imageUrl: '/preview-media/encuentro.png',
    sceneImageUrl: '/preview-media/encuentro.png',
  }),
  concept({
    id: 'cisus_tirador_brisa',
    sku: 'CIS-TIR-BRI',
    name: 'Brisa',
    materialLabel: 'Madera',
    shortDescription: 'Una línea orgánica y asimétrica que aporta movimiento al frente del mueble.',
    description:
      'Brisa parte de un extremo fino y se ensancha suavemente hacia el otro. Su perfil orgánico introduce un contraste expresivo en cajones y muebles de frentes rectos.',
    imageUrl: '/preview-media/brisa.png',
    sceneImageUrl: '/preview-media/brisa.png',
  }),
  concept({
    id: 'cisus_tirador_borde',
    sku: 'CIS-TIR-BOR',
    name: 'Borde',
    materialLabel: 'Madera',
    shortDescription: 'Un perfil horizontal discreto que acompaña las líneas del cajón.',
    description:
      'Borde propone un frente alargado con una concavidad continua. Su silueta horizontal acompaña la composición del mueble y ofrece una alternativa visualmente recogida a los tiradores más escultóricos.',
    imageUrl: '/preview-media/borde.png',
    sceneImageUrl: '/preview-media/borde.png',
  }),
  concept({
    id: 'cisus_tirador_tallo',
    sku: 'CIS-TIR-TAL',
    name: 'Tallo',
    materialLabel: 'Madera',
    shortDescription: 'Una silueta alargada que acentúa la verticalidad de puertas y armarios.',
    description:
      'Tallo combina un cuerpo esbelto con extremos suavemente ensanchados. Su orientación vertical acompaña puertas y armarios, haciendo visible la veta a lo largo de la pieza.',
    imageUrl: '/preview-media/tallo.png',
    sceneImageUrl: '/preview-media/tallo.png',
  }),
];
