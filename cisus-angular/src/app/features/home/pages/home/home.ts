import { Component } from '@angular/core';
import { Hero } from '../../components/hero/hero';
import { Process } from '../../components/process/process';
import { Portfolio } from '../../components/portfolio/portfolio';
import { Contact } from '../../components/contact/contact';
import { Footer } from '../../../../shared/footer/footer';

@Component({
  imports: [Hero, Process, Portfolio, Contact, Footer],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {}
