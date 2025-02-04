// src/plugins/ui-components/alight-card-component/alight-card-component.ts
import './styles/alight-card-component.scss';

export class CKAlightCard extends HTMLElement {
  private wrapper: HTMLDivElement;
  private header: HTMLDivElement | null = null;
  private _title: HTMLDivElement | null = null;
  private content: HTMLDivElement;
  private footer: HTMLDivElement | null = null;

  constructor() {
    super();

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('cka-card');

    this.content = document.createElement('div');
    this.content.classList.add('cka-card-content');

    this.setupHeader();
    this.wrapper.appendChild(this.content);
    this.setupFooter();

    this.processSlottedContent();

    this.appendChild(this.wrapper);
  }

  private setupHeader() {
    if (this.hasAttribute('header') || this.querySelector('[slot="header"]')) {
      this.header = document.createElement('div');
      this.header.classList.add('cka-card-header');

      if (this.hasAttribute('header')) {
        this._title = document.createElement('div');
        this._title.classList.add('cka-card-title');
        this._title.textContent = this.getAttribute('header');
        this.header.appendChild(this._title);
      }

      this.wrapper.appendChild(this.header);
    }
  }

  private setupFooter() {
    if (this.querySelector('[slot="footer"]')) {
      this.footer = document.createElement('div');
      this.footer.classList.add('cka-card-footer');
      this.wrapper.appendChild(this.footer);
    }
  }

  private processSlottedContent() {
    const headerContent = this.querySelector('[slot="header"]');
    if (headerContent && this.header) {
      this.header.appendChild(headerContent);
      headerContent.removeAttribute('slot');
    }

    const defaultContent = Array.from(this.childNodes).filter(
      node => !(node as Element).getAttribute || !(node as Element).getAttribute('slot')
    );
    defaultContent.forEach(node => this.content.appendChild(node.cloneNode(true)));

    const footerContent = this.querySelector('[slot="footer"]');
    if (footerContent && this.footer) {
      this.footer.appendChild(footerContent);
      footerContent.removeAttribute('slot');
    }
  }

  static get observedAttributes() {
    return ['header'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'header' && this._title) {
      this._title.textContent = newValue;
    }
  }

  override get title(): string {
    return this._title?.textContent || '';
  }

  override set title(value: string) {
    if (this._title) {
      this._title.textContent = value;
    }
  }

  override focus() {
    this.wrapper.focus();
  }
}

customElements.define('cka-card', CKAlightCard);