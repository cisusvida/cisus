import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close the mobile menu when clicking outside the header', async () => {
    const host = fixture.nativeElement as HTMLElement;
    const menuButton = host.querySelector<HTMLButtonElement>('.menu-button');
    const navigation = host.querySelector<HTMLElement>('.navigation');

    expect(menuButton).not.toBeNull();
    expect(navigation).not.toBeNull();

    menuButton!.click();
    await fixture.whenStable();
    expect(navigation!.classList.contains('navigation--open')).toBe(true);

    document.body.click();
    await fixture.whenStable();
    expect(navigation!.classList.contains('navigation--open')).toBe(false);
  });
});
