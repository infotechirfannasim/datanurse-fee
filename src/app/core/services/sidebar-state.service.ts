import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {

  private _isOpen = signal<boolean>(window.innerWidth >= 768);
  isOpen = this._isOpen.asReadonly();

  get isMobile(): boolean {
    return window.innerWidth < 1025;
  }

  toggle(): void {
    this._isOpen.update(v => !v);
  }

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }
}