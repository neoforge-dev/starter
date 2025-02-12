import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

export class DataTable extends LitElement {
  static properties = {
    columns: { type: Array },
    data: { type: Array },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        text-align: left;
      }
      th {
        background: var(--surface-2);
        font-weight: bold;
      }
    `,
  ];

  constructor() {
    super();
    this.columns = [];
    this.data = [];
  }

  render() {
    return html`
      <table>
        <thead>
          <tr>
            ${this.columns.map((col) => html`<th>${col.header}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${this.data.map(
            (row) => html`
              <tr>
                ${this.columns.map((col) => html`<td>${row[col.field]}</td>`)}
              </tr>
            `
          )}
        </tbody>
      </table>
    `;
  }
}

customElements.define("data-table", DataTable);
