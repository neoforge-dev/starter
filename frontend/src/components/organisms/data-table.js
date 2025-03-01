import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class DataTable extends LitElement {
  static properties = {
    columns: { type: Array },
    data: { type: Array },
    pageSize: { type: Number, attribute: "page-size" },
    currentPage: { type: Number, attribute: "current-page" },
    sortField: { type: String, attribute: "sort-field" },
    sortDirection: { type: String, attribute: "sort-direction" },
    filter: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    th {
      cursor: pointer;
    }

    tr:hover {
      background-color: #f5f5f5;
    }

    .pagination {
      margin-top: 16px;
      display: flex;
      gap: 8px;
    }

    button {
      padding: 4px 8px;
      cursor: pointer;
    }
  `;

  constructor() {
    super();
    this.data = [];
    this.columns = [];
    this.pageSize = 10;
    this.currentPage = 1;
    this.sortField = null;
    this.sortDirection = "asc";
    this.filter = null;
  }

  get displayData() {
    let data = [...this.data];

    // Apply filter
    if (this.filter && this.filter.field && this.filter.value) {
      data = data.filter((item) =>
        String(item[this.filter.field])
          .toLowerCase()
          .includes(String(this.filter.value).toLowerCase())
      );
    }

    // Apply sort
    if (this.sortField) {
      data.sort((a, b) => {
        const aVal = a[this.sortField];
        const bVal = b[this.sortField];
        const direction = this.sortDirection === "asc" ? 1 : -1;
        return aVal < bVal ? -direction : aVal > bVal ? direction : 0;
      });
    }

    // Apply pagination
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return data.slice(start, end);
  }

  _handleHeaderClick(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDirection = "asc";
    }
    this.requestUpdate();
  }

  _handleRowClick(row) {
    this.dispatchEvent(
      new CustomEvent("row-select", {
        detail: row,
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const displayData = this.displayData;

    return html`
      <table>
        <thead>
          <tr>
            ${this.columns.map(
              (col) => html`
                <th
                  data-field="${col.field}"
                  @click=${() => this._handleHeaderClick(col.field)}
                >
                  ${col.header}
                </th>
              `
            )}
          </tr>
        </thead>
        <tbody>
          ${displayData.map(
            (row) => html`
              <tr @click=${() => this._handleRowClick(row)}>
                ${this.columns.map(
                  (col) => html`
                    <td data-field="${col.field}">${row[col.field]}</td>
                  `
                )}
              </tr>
            `
          )}
        </tbody>
      </table>
      ${this.pageSize < this.data.length
        ? html`
            <div class="pagination">
              <button
                class="pagination-prev"
                ?disabled=${this.currentPage === 1}
                @click=${() => {
                  this.currentPage--;
                  this.requestUpdate();
                }}
              >
                Previous
              </button>
              <button
                class="pagination-next"
                ?disabled=${this.currentPage * this.pageSize >=
                this.data.length}
                @click=${() => {
                  this.currentPage++;
                  this.requestUpdate();
                }}
              >
                Next
              </button>
            </div>
          `
        : ""}
    `;
  }
}

customElements.define("neo-data-table", DataTable);
