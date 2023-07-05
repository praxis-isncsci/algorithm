import {MotorLevel, SensoryLevels} from '../interfaces';

export class ZPPTester extends HTMLElement {
  public static get is(): string {
    return 'zpp-tester';
  }

  public static get observedAttributes(): string[] {
    const attributes: string[] = ['left', 'motor-level', 'current-level'];

    SensoryLevels.forEach((level) => {
      if (level === 'C1') {
        return;
      }

      const motor = ['C5', 'C6', 'C7', 'C8', 'T1', 'L2', 'L3', 'L4', 'L5', 'S1'].includes(level) ? level as MotorLevel : null;
      const levelToLower = level.toLowerCase();
      attributes.push(`${levelToLower}-light-touch`);
      attributes.push(`${levelToLower}-pin-prick`);

      if (motor) {
        attributes.push(`${levelToLower}-motor`);
      }
    });

    return attributes;
  }

  private rightHeaderTemplate = `
    <div>.</div>
    <div>M</div>
    <div>LT</div>
    <div>PP</div>
  `;

  private leftHeaderTemplate = `
    <div>LT</div>
    <div>PP</div>
    <div>M</div>
    <div>.</div>
  `;

  private template = `
    <style>
      :host {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
      }

      div {
        border: solid 1px #CCC;
        padding: 8px 16px;
        text-align: center;
      }

      .motor-level {
        background-color: rgba(255, 226, 0, 1);
      }

      .motor-level ~ .motor-level {
        background-color: rgba(255, 226, 0, 0.5);
      }

      .current {
        background-color: rgba(255, 0, 0, 0.5);
      }
    </style>
  `;

  private currentLevel: HTMLElement | null | undefined = null;

  public constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    // this.messageElement = shadowRoot.querySelector('[bind-to=message]');
  }

  public connectedCallback(): void {
    this.updateView(this.hasAttribute('left'));
  }

  private updateView(left: boolean) {
    if (!this.shadowRoot) {
      throw new Error(`${ZPPTester.is} :: updateView :: No shadow root available`);
    }

    this.shadowRoot.innerHTML = `
      ${this.template}
      ${left ? this.leftHeaderTemplate : this.rightHeaderTemplate}
      ${this.getLevels(left)}
    `;
  }

  private highlightMotorLevel(motorLevel: string): void {
    const levels = motorLevel.split(/,\s*/);

    levels.forEach(level => {
      const levelHeader = this.shadowRoot?.querySelector(`[${level.toLowerCase().replace(/\*/g, '')}]`);

      if (!levelHeader) {
        return;
      }

      levelHeader.classList.add('motor-level');
    });
  }

  private setCurrentLevel(levelName: string): void {
    if (this.currentLevel) {
      this.currentLevel.classList.remove('current');
    }

    try {
      this.currentLevel = this.shadowRoot?.querySelector(`[${levelName.toLowerCase()}]`);
    } catch(error) {
      this.currentLevel = null;
    }

    if (this.currentLevel) {
      this.currentLevel.classList.add('current');
    }
  }

  public attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string,
  ): void {
    if (oldValue === newValue) {
      return;
    }

    if (name === 'motor-level') {
      this.highlightMotorLevel(newValue);
      return;
    }

    if (name === 'current-level') {
      this.setCurrentLevel(newValue);
      return;
    }

    this.updateValue(name, newValue);
  }

  private getLevels(left: boolean) {
    let levels = '';

    SensoryLevels.forEach((level) => {
      if (level === 'C1') {
        return;
      }

      levels += left
        ? `<div ${level.toLowerCase()}-light-touch></div><div ${level.toLowerCase()}-pin-prick></div><div ${level.toLowerCase()}-motor></div><div ${level.toLowerCase()}>${level}</div>`
        : `<div ${level.toLowerCase()}>${level}</div><div ${level.toLowerCase()}-motor></div><div ${level.toLowerCase()}-light-touch></div><div ${level.toLowerCase()}-pin-prick></div>`;
    });

    return levels;
  }

  private updateValue(name: string, value: string) {
    const cell: Element | null | undefined = this.shadowRoot?.querySelector(`[${name}]`);

    if (cell) {
      cell.textContent = value;
    }
  }
}

window.customElements.define(ZPPTester.is, ZPPTester);
