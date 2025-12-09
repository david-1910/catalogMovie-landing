import { Component, input, output, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Movie } from '../../models/movie.model';

export type SortOption =
  | 'rating_desc'
  | 'rating_asc'
  | 'year_desc'
  | 'year_asc'
  | 'title_asc'
  | 'title_desc';

export interface FilterState {
  genre: string;
  yearFrom: number | null;
  yearTo: number | null;
  sort: SortOption;
}

@Component({
  selector: 'app-movie-filters',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './movie-filters.component.html',
  styleUrl: './movie-filters.component.css',
})
export class MovieFiltersComponent {
  movies = input.required<Movie[]>();
  filterChange = output<FilterState>();

  selectedGenre = '';
  yearFrom: number | null = null;
  yearTo: number | null = null;
  selectedSort: SortOption = 'rating_desc';

  readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'rating_desc', label: 'С высоким рейтингом' },
    { value: 'rating_asc', label: 'С низким рейтингом' },
    { value: 'year_desc', label: 'Сначала новые' },
    { value: 'year_asc', label: 'Сначала старые' },
    { value: 'title_asc', label: 'По названию А-Я' },
    { value: 'title_desc', label: 'По названию Я-А' },
  ];

  readonly availableGenres = computed(() => {
    const genres = new Set<string>();
    this.movies().forEach((movie) => {
      movie.genres.forEach((genre) => genres.add(genre));
    });
    return Array.from(genres).sort();
  });

  readonly yearRange = computed(() => {
    const years = this.movies().map((m) => m.year);
    return {
      min: Math.min(...years),
      max: Math.max(...years),
    };
  });

  onFilterChange(): void {
    this.filterChange.emit({
      genre: this.selectedGenre,
      yearFrom: this.yearFrom,
      yearTo: this.yearTo,
      sort: this.selectedSort,
    });
  }

  resetFilters(): void {
    this.selectedGenre = '';
    this.yearFrom = null;
    this.yearTo = null;
    this.selectedSort = 'rating_desc';
    this.onFilterChange();
  }

  get hasActiveFilters(): boolean {
    return !!this.selectedGenre || !!this.yearFrom || !!this.yearTo || this.selectedSort !== 'rating_desc';
  }
}
