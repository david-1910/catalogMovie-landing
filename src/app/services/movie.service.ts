import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { Movie } from '../models/movie.model';

interface MoviesResponse {
  movies: Movie[];
}

interface CacheData {
  movies: Movie[];
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = '/data/movies.json';
  private readonly cacheKey = 'movies_cache';
  private readonly cacheExpiry = 5 * 60 * 1000; // 5 минут

  private memoryCache: Movie[] | null = null;

  getMovies(): Observable<Movie[]> {
    // Проверяем memory cache сначала
    if (this.memoryCache) {
      return of(this.memoryCache);
    }

    // Проверяем localStorage cache
    const cachedData = this.getFromCache();
    if (cachedData) {
      this.memoryCache = cachedData;
      return of(cachedData);
    }

    // Загружаем с сервера
    return this.http.get<MoviesResponse>(this.apiUrl).pipe(
      map((response) => response.movies),
      tap((movies) => {
        this.memoryCache = movies;
        this.saveToCache(movies);
      }),
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

  clearCache(): void {
    this.memoryCache = null;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.cacheKey);
    }
  }

  private getFromCache(): Movie[] | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;

      const data: CacheData = JSON.parse(cached);
      const now = Date.now();

      if (now - data.timestamp > this.cacheExpiry) {
        localStorage.removeItem(this.cacheKey);
        return null;
      }

      return data.movies;
    } catch {
      return null;
    }
  }

  private saveToCache(movies: Movie[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const data: CacheData = {
        movies,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(data));
    } catch {
      // localStorage может быть недоступен или переполнен
    }
  }
}
