import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/header/header';
import { Toast as ToastView } from './shared/toast/toast';

@Component({
  imports: [RouterOutlet, Header, ToastView],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
