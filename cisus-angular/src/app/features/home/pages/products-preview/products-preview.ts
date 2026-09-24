import { Component } from '@angular/core';
import { Portfolio } from '../../components/portfolio/portfolio';
import { MarketingContent } from '../../../../core/services/marketing-content';
import { CommerceGateway } from '../../../../core/services/commerce-gateway';
import { PublicMediaUrlService } from '../../../../core/services/public-media-url';
import { PORTFOLIO_PREVIEW_PRODUCTS } from './products-preview.fixtures';

@Component({
  imports: [Portfolio],
  selector: 'app-products-preview',
  styleUrl: './products-preview.scss',
  templateUrl: './products-preview.html',
  providers: [
    {
      provide: MarketingContent,
      useFactory: () => new MarketingContent(),
    },
    {
      provide: CommerceGateway,
      useValue: { listPublicProducts: async () => PORTFOLIO_PREVIEW_PRODUCTS },
    },
    {
      provide: PublicMediaUrlService,
      useValue: {
        observeHomePortfolioBackground: (listener: (url: string | null) => void) => {
          listener(null);
          return () => undefined;
        },
      },
    },
  ],
})
export class ProductsPreview {}
