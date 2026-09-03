import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicMediaUrlService } from '../../../../core/services/public-media-url';
import { Hero } from './hero';

describe('Hero', () => {
  let component: Hero;
  let fixture: ComponentFixture<Hero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],
      providers: [
        {
          provide: PublicMediaUrlService,
          useValue: { observeHomeHero: () => () => undefined },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Hero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
