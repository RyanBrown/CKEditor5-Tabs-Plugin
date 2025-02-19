// src/plugins/ui-components/alight-file-upload-component/alight-file-upload-component.ts
import './styles/alight-file-upload-component.scss';

export interface FileUploaderOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
  onUpload?: (file: File) => void;
  onError?: (error: Error) => void;
}

export interface FileUploaderElements {
  dropZone: HTMLDivElement;
  input: HTMLInputElement;
  fileList: HTMLUListElement;
  toastContainer: HTMLDivElement;
}

export type ToastType = 'success' | 'error';

export class FileUploader {
  private readonly container: HTMLElement;
  private readonly options: Required<FileUploaderOptions>;
  private readonly elements: FileUploaderElements;
  private uploadedFiles: File[] = [];

  constructor(containerId: string, options: FileUploaderOptions = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    this.container = container;
    this.options = {
      maxFileSize: options.maxFileSize ?? 1000000, // 1MB default
      allowedTypes: options.allowedTypes ?? ['image/*', 'application/pdf'],
      multiple: options.multiple ?? true,
      onUpload: options.onUpload ?? this.defaultUploadHandler.bind(this),
      onError: options.onError ?? this.defaultErrorHandler.bind(this)
    };

    this.elements = this.createElements();
    this.initialize();
  }

  private createElements(): FileUploaderElements {
    const dropZone = document.createElement('div');
    dropZone.className = 'file-uploader__dropzone';

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = this.options.multiple;
    input.accept = this.options.allowedTypes.join(',');
    input.className = 'file-uploader__input';

    const fileList = document.createElement('ul');
    fileList.className = 'file-uploader__file-list';

    const toastContainer = document.createElement('div');
    toastContainer.className = 'file-uploader__toast';

    return { dropZone, input, fileList, toastContainer };
  }

  private initialize(): void {
    this.container.className = 'file-uploader';

    const uploadBtn = document.createElement('button');
    uploadBtn.textContent = 'Select Files';
    uploadBtn.className = 'file-uploader__button';

    // Assemble the DOM
    this.elements.dropZone.appendChild(this.elements.input);
    this.elements.dropZone.appendChild(uploadBtn);
    this.container.appendChild(this.elements.dropZone);
    this.container.appendChild(this.elements.fileList);
    this.container.appendChild(this.elements.toastContainer);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const { dropZone, input } = this.elements;

    // Button click handler
    const button = dropZone.querySelector('button');
    if (button) {
      button.addEventListener('click', () => {
        input.click();
      });
    }

    // File input change handler
    input.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        this.handleFiles(target.files);
      }
    });

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      dropZone.classList.add('file-uploader__dropzone--active');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('file-uploader__dropzone--active');
    });

    dropZone.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      dropZone.classList.remove('file-uploader__dropzone--active');
      if (e.dataTransfer?.files) {
        this.handleFiles(e.dataTransfer.files);
      }
    });
  }

  private handleFiles(files: FileList): void {
    Array.from(files).forEach(file => {
      // Validate file size
      if (file.size > this.options.maxFileSize) {
        this.showToast('error', `File ${file.name} is too large. Maximum size is ${this.formatSize(this.options.maxFileSize)}`);
        return;
      }

      // Validate file type
      if (!this.isValidFileType(file)) {
        this.showToast('error', `File ${file.name} is not an allowed type`);
        return;
      }

      // Add to uploaded files
      this.uploadedFiles.push(file);
      this.updateFileList();

      // Call upload handler
      try {
        this.options.onUpload(file);
        this.showToast('success', `File ${file.name} uploaded successfully`);
      } catch (error) {
        this.options.onError(error instanceof Error ? error : new Error('Unknown error'));
        this.showToast('error', `Failed to upload ${file.name}`);
      }
    });
  }

  private updateFileList(): void {
    const { fileList } = this.elements;
    fileList.innerHTML = '';

    this.uploadedFiles.forEach(file => {
      const li = document.createElement('li');
      li.className = 'file-uploader__file-item';

      const fileInfo = document.createElement('span');
      fileInfo.textContent = `${file.name} - ${this.formatSize(file.size)}`;

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.className = 'file-uploader__remove-btn';
      removeBtn.onclick = () => this.removeFile(file);

      li.appendChild(fileInfo);
      li.appendChild(removeBtn);
      fileList.appendChild(li);
    });
  }

  private removeFile(file: File): void {
    const index = this.uploadedFiles.indexOf(file);
    if (index > -1) {
      this.uploadedFiles.splice(index, 1);
      this.updateFileList();
    }
  }

  private showToast(type: ToastType, message: string): void {
    const toast = document.createElement('div');
    toast.className = `file-uploader__toast-message file-uploader__toast-message--${type}`;
    toast.textContent = message;

    this.elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  private isValidFileType(file: File): boolean {
    return this.options.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.slice(0, -2);
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private defaultUploadHandler(file: File): void {
    console.log('File uploaded:', file.name);
  }

  private defaultErrorHandler(error: Error): void {
    console.error('Upload error:', error);
  }

  // Public methods
  public clearFiles(): void {
    this.uploadedFiles = [];
    this.updateFileList();
  }

  public getFiles(): readonly File[] {
    return Object.freeze([...this.uploadedFiles]);
  }
}