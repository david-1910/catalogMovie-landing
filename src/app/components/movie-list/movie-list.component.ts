import { Component, computed, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MovieService } from '../../services/movie.service';
import { Movie } from '../../models/movie.model';
import { MovieCardComponent } from '../movie-card/movie-card.component';
import { MovieModalComponent } from '../movie-modal/movie-modal.component';
import { SkeletonCardComponent } from '../skeleton-card/skeleton-card.component';
import { MovieFiltersComponent, FilterState, SortOption } from '../movie-filters/movie-filters.component';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [
    FormsModule,
    ScrollingModule,
    MovieCardComponent,
    MovieModalComponent,
    SkeletonCardComponent,
    MovieFiltersComponent,
  ],
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
  readonly filters = signal<FilterState>({ genre: '', yearFrom: null, yearTo: null, sort: 'rating_desc' });
  readonly showFilters = signal(false);

  readonly skeletonItems = Array(8).fill(0);

  readonly filteredMovies = computed(() => {
    let result = this.movies();
    const query = this.searchQuery().toLowerCase().trim();
    const { genre, yearFrom, yearTo, sort } = this.filters();

    // Фильтр по поиску
    if (query) {
      result = result.filter((movie) => movie.title.toLowerCase().includes(query));
    }

    // Фильтр по жанру
    if (genre) {
      result = result.filter((movie) => movie.genres.includes(genre));
    }

    // Фильтр по году
    if (yearFrom) {
      result = result.filter((movie) => movie.year >= yearFrom);
    }
    if (yearTo) {
      result = result.filter((movie) => movie.year <= yearTo);
    }

    // Сортировка
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'rating_desc':
          return b.rating - a.rating;
        case 'rating_asc':
          return a.rating - b.rating;
        case 'year_desc':
          return b.year - a.year;
        case 'year_asc':
          return a.year - b.year;
        case 'title_asc':
          return a.title.localeCompare(b.title, 'ru');
        case 'title_desc':
          return b.title.localeCompare(a.title, 'ru');
        default:
          return 0;
      }
    });

    return result;
  });

  readonly hasNoResults = computed(
    () => !this.isLoading() && !this.error() && this.filteredMovies().length === 0
  );

  readonly resultsCount = computed(() => this.filteredMovies().length);
  readonly totalCount = computed(() => this.movies().length);

  readonly hasActiveFilters = computed(() => {
    const { genre, yearFrom, yearTo, sort } = this.filters();
    return !!this.searchQuery() || !!genre || !!yearFrom || !!yearTo || sort !== 'rating_desc';
  });

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
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.searchQuery.set(query);
      });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onFilterChange(filterState: FilterState): void {
    this.filters.set(filterState);
  }

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
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
    this.movieService.clearCache();
    this.loadMovies();
  }
}
