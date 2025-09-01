import { LitElement, html, css } from 'lit';

export class AppShell extends LitElement {
    static styles = css`
        :host {
            display: block;
            min-height: 100vh;
            --primary-color: #3b82f6;
            --text-color: #1f2937;
        }

        header {
            background: var(--primary-color);
            color: white;
            padding: 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        main {
            padding: 2rem;
            color: var(--text-color);
        }

        footer {
            padding: 1rem;
            text-align: center;
            color: #6b7280;
        }
    `;

    render() {
        return html`
            <header>
                <h1>NeoForge</h1>
                <nav>
                    <slot name="navigation"></slot>
                </nav>
            </header>

            <main>
                <slot></slot>
            </main>

            <footer>
                <p>© ${new Date().getFullYear()} NeoForge. Built with web standards.</p>
            </footer>
        `;
    }
}

customElements.define('app-shell', AppShell);
