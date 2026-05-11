import {
  Directive,
  EventEmitter,
  HostBinding,
  HostListener,
  Output,
} from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';

import { FileHandle } from '../Model/file-handle.model';

@Directive({
  selector: '[appDrag]',
  standalone: false,  // ← add this
})
export class DragDirective {

  @Output() files = new EventEmitter<FileHandle>();

  @HostBinding('class.dragover')
  isDragOver = false;

  constructor(private sanitizer: DomSanitizer) {}

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (!event.dataTransfer?.files?.length) {
      return;
    }

    const file = event.dataTransfer.files[0];

    const fileHandle: FileHandle = {
      file,
      url: this.sanitizer.bypassSecurityTrustUrl(
        window.URL.createObjectURL(file)
      ),
    };

    this.files.emit(fileHandle);
  }
}