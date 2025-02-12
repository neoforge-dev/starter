import { LitElement, html, css } from '/vendor/lit-core.min.js';
import { ThemeToggle } from '../styles/theme.js';

class ThemeToggleButton extends ThemeToggle(LitElement) {
  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 8px;
      border: none;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-color);
      cursor: pointer;
      transition: background-color var(--transition-fast);
    }

    button:hover {
      background-color: var(--surface-color);
    }

    button:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .icon {
      font-size: 24px;
      line-height: 1;
    }
  `;

  render() {
    const isDark = this.theme === 'dark' || (this.theme === 'system' && this._getSystemTheme() === 'dark');
    
    return html`
      <button
        @click=${this._handleClick}
        aria-label=${isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        title=${isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        <span class="icon material-icons">
          ${isDark ? 'light_mode' : 'dark_mode'}
        </span>
      </button>
    `;
  }

  _handleClick() {
    this.toggleTheme();
  }
}

customElements.define('theme-toggle', ThemeToggleButton); 