import { Component, input, output } from '@angular/core';
import { Movie } from '../../models/movie.model';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  templateUrl: './movie-card.component.html',
  styleUrl: './movie-card.component.css',
})
export class MovieCardComponent {
  movie = input.required<Movie>();
  cardClick = output<Movie>();

  onCardClick(): void {
    this.cardClick.emit(this.movie());
  }
}
