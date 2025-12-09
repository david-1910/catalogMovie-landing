import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Movie } from '../models/movie.model';

interface MoviesResponse {
  movies: Movie[];
}

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/data/movies.json';

  getMovies(): Observable<Movie[]> {
    return this.http.get<MoviesResponse>(this.apiUrl).pipe(
      map((response) => response.movies),
      catchError((error) => {
        console.error('Error fetching movies:', error);
        return throwError(() => new Error('Не удалось загрузить фильмы. Попробуйте позже.'));
      })
    );
  }

  getMovieById(id: number): Observable<Movie | undefined> {
    return this.getMovies().pipe(map((movies) => movies.find((movie) => movie.id === id)));
  }

  searchMovies(query: string): Observable<Movie[]> {
    return this.getMovies().pipe(
      map((movies) =>
        movies.filter((movie) => movie.title.toLowerCase().includes(query.toLowerCase()))
      )
    );
  }
}
