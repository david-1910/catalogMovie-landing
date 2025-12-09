import { Component, input, output, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Movie } from '../../models/movie.model';

@Component({
  selector: 'app-movie-modal',
  standalone: true,
  templateUrl: './movie-modal.component.html',
  styleUrl: './movie-modal.component.css',
})
export class MovieModalComponent implements OnInit, OnDestroy {
  movie = input.required<Movie>();
  close = output<void>();

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeModal();
  }

  closeModal(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal__backdrop')) {
      this.closeModal();
    }
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}мин`;
  }
}
