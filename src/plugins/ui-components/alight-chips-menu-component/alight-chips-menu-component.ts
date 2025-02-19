// src/plugins/ui-components/alight-chips-menu-component/alight-chips-menu-component.ts
import './styles/alight-chips-menu-component.scss';

export interface ChipItem {
  id: string;
  label: string;
  removable?: boolean;
}

export interface ChipsOptions {
  placeholder?: string;
  maxChips?: number;
  allowDuplicates?: boolean;
  disabled?: boolean;
}

export class CkAlightChipsMenu {
  setConfig(arg0: { allowDuplicates: boolean; }) {
    throw new Error('Method not implemented.');
  }
  disable() {
    throw new Error('Method not implemented.');
  }
  enable() {
    throw new Error('Method not implemented.');
  }
  private container: HTMLElement;
  private chips: string[] = [];
  private inputElement: HTMLInputElement | null = null;
  private boundHandleKeyDown: (event: KeyboardEvent) => void;
  private boundHandlePaste: (event: ClipboardEvent) => void;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandlePaste = this.handlePaste.bind(this);
    this.initialize();
  }

  private initialize(): void {
    this.container.innerHTML = `
      <div class="cka-chips-container">
        <div class="cka-chips-list"></div>
        <input type="text" class="cka-chips-input" placeholder="Type and press Enter">
      </div>
    `;

    this.inputElement = this.container.querySelector('.cka-chips-input');
    if (this.inputElement) {
      this.inputElement.addEventListener('keydown', this.boundHandleKeyDown);
      this.inputElement.addEventListener('paste', this.boundHandlePaste);
    }
  }

  private handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text');

    if (pastedText) {
      // Split by commas and filter out empty strings
      const chips = pastedText
        .split(',')
        .map(text => text.trim())
        .filter(text => text.length > 0);

      // Add each chip
      chips.forEach(chip => {
        if (!this.chips.includes(chip)) {
          this.addChip(chip);
        }
      });
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.inputElement?.value.trim()) {
      event.preventDefault();
      this.addChip(this.inputElement.value.trim());
      this.inputElement.value = '';
    }
  }

  public addChip(text: string): void {
    if (!this.chips.includes(text)) {
      this.chips.push(text);
      this.renderChips();
      this.dispatchEvent('add', text);
    }
  }

  private removeChip(index: number): void {
    const removedChip = this.chips[index];
    this.chips.splice(index, 1);
    this.renderChips();
    this.dispatchEvent('remove', removedChip);
  }

  private renderChips(): void {
    const chipsList = this.container.querySelector('.cka-chips-list');
    if (chipsList) {
      chipsList.innerHTML = this.chips.map((chip, index) => `
        <div class="cka-chip">
          <span>${chip}</span>
          <button type="button" class="cka-chip-remove" data-index="${index}"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `).join('');

      // Add event listeners to remove buttons
      chipsList.querySelectorAll('.cka-chip-remove').forEach(button => {
        button.addEventListener('click', (e) => {
          const index = parseInt((e.target as HTMLElement).dataset.index || '0', 10);
          this.removeChip(index);
        });
      });
    }
  }

  private dispatchEvent(type: string, detail: any): void {
    const event = new CustomEvent(type, {
      detail,
      bubbles: true,
      cancelable: true
    });
    this.container.dispatchEvent(event);
  }

  public clear(): void {
    if (this.chips.length > 0) {
      const oldChips = [...this.chips];
      this.chips = [];
      this.renderChips();
      this.dispatchEvent('clear', oldChips);
    }
  }

  public destroy(): void {
    if (this.inputElement) {
      this.inputElement.removeEventListener('keydown', this.boundHandleKeyDown);
      this.inputElement.removeEventListener('paste', this.boundHandlePaste);
    }
    this.chips = [];
    this.container.innerHTML = '';
    this.inputElement = null;
  }

  public getChips(): string[] {
    return [...this.chips];
  }

  public setChips(chips: string[]): void {
    this.chips = [...new Set(chips)]; // Ensure uniqueness
    this.renderChips();
  }
}