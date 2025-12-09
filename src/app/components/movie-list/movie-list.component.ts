import { Component, computed, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap, startWith, catchError, of } from 'rxjs';
import { MovieService } from '../../services/movie.service';
import { Movie } from '../../models/movie.model';
import { MovieCardComponent } from '../movie-card/movie-card.component';
import { MovieModalComponent } from '../movie-modal/movie-modal.component';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [FormsModule, MovieCardComponent, MovieModalComponent],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.css',
})
export class MovieListComponent implements OnInit {
  private readonly movieService = inject(MovieService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  readonly movies = signal<Movie[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly selectedMovie = signal<Movie | null>(null);

  readonly filteredMovies = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.movies();
    }
    return this.movies().filter((movie) =>
      movie.title.toLowerCase().includes(query)
    );
  });

  readonly hasNoResults = computed(() =>
    !this.isLoading() && !this.error() && this.filteredMovies().length === 0
  );

  ngOnInit(): void {
    this.loadMovies();
    this.setupSearch();
  }

  private loadMovies(): void {
    this.movieService
      .getMovies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (movies) => {
          this.movies.set(movies);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err.message);
          this.isLoading.set(false);
        },
      });
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((query) => {
        this.searchQuery.set(query);
      });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  openMovieModal(movie: Movie): void {
    this.selectedMovie.set(movie);
  }

  closeMovieModal(): void {
    this.selectedMovie.set(null);
  }

  retryLoading(): void {
    this.error.set(null);
    this.isLoading.set(true);
    this.loadMovies();
  }
}
