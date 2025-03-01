import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

export class DatePicker extends LitElement {
  static properties = {
    value: { type: String },
    min: { type: String },
    max: { type: String },
    disabled: { type: Boolean },
    format: { type: String },
    placeholder: { type: String },
    showWeekNumbers: { type: Boolean },
    firstDayOfWeek: { type: Number },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: inline-block;
        position: relative;
      }

      .date-input {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: var(--font-size-base);
        color: var(--text-color);
        background: var(--surface-color);
        cursor: pointer;
        width: 100%;
      }

      .date-input:disabled {
        background: var(--surface-2);
        cursor: not-allowed;
      }

      .calendar {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: var(--z-dropdown);
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        padding: var(--spacing-md);
        margin-top: var(--spacing-xs);
        min-width: 280px;
        display: none;
      }

      .calendar.open {
        display: block;
      }

      .calendar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-md);
      }

      .month-nav {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .nav-button {
        padding: var(--spacing-xs);
        border: none;
        background: none;
        color: var(--text-color);
        cursor: pointer;
        border-radius: var(--radius-sm);
      }

      .nav-button:hover {
        background: var(--surface-2);
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: var(--spacing-xs);
        text-align: center;
      }

      .weekday {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        padding: var(--spacing-xs);
      }

      .day {
        padding: var(--spacing-xs);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .day:hover {
        background: var(--surface-2);
      }

      .day.selected {
        background: var(--primary-color);
        color: white;
      }

      .day.today {
        border: 1px solid var(--primary-color);
      }

      .day.disabled {
        color: var(--text-tertiary);
        cursor: not-allowed;
      }

      .day.outside-month {
        color: var(--text-tertiary);
      }
    `,
  ];

  constructor() {
    super();
    this.value = "";
    this.min = "";
    this.max = "";
    this.disabled = false;
    this.format = "yyyy-MM-dd";
    this.placeholder = "Select date";
    this.showWeekNumbers = false;
    this.firstDayOfWeek = 0; // 0 = Sunday, 1 = Monday
    this._currentMonth = new Date();
    this._isOpen = false;
  }

  _formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  _parseDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString);
  }

  _getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  _getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  _generateCalendarDays() {
    const year = this._currentMonth.getFullYear();
    const month = this._currentMonth.getMonth();
    const daysInMonth = this._getDaysInMonth(year, month);
    const firstDay = this._getFirstDayOfMonth(year, month);
    const days = [];

    // Previous month days
    const prevMonthDays = (firstDay - this.firstDayOfWeek + 7) % 7;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = this._getDaysInMonth(prevYear, prevMonth);

    for (
      let i = daysInPrevMonth - prevMonthDays + 1;
      i <= daysInPrevMonth;
      i++
    ) {
      days.push({
        date: new Date(prevYear, prevMonth, i),
        isOutsideMonth: true,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isOutsideMonth: false,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(nextYear, nextMonth, i),
        isOutsideMonth: true,
      });
    }

    return days;
  }

  _isDateDisabled(date) {
    if (!date) return true;
    const dateValue = this._formatDate(date);
    if (this.min && dateValue < this.min) return true;
    if (this.max && dateValue > this.max) return true;
    return false;
  }

  _handleDateClick(date) {
    if (this._isDateDisabled(date)) return;
    this.value = this._formatDate(date);
    this._isOpen = false;
    this.requestUpdate();
    this._dispatchChangeEvent();
  }

  _dispatchChangeEvent() {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleInputClick() {
    if (!this.disabled) {
      this._isOpen = !this._isOpen;
      this.requestUpdate();
    }
  }

  _handlePrevMonth() {
    this._currentMonth = new Date(
      this._currentMonth.getFullYear(),
      this._currentMonth.getMonth() - 1
    );
    this.requestUpdate();
  }

  _handleNextMonth() {
    this._currentMonth = new Date(
      this._currentMonth.getFullYear(),
      this._currentMonth.getMonth() + 1
    );
    this.requestUpdate();
  }

  render() {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return html`
      <div class="date-picker">
        <input
          type="text"
          class="date-input"
          .value=${this.value}
          placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          readonly
          @click=${this._handleInputClick}
        />

        <div class="calendar ${this._isOpen ? "open" : ""}">
          <div class="calendar-header">
            <div class="month-nav">
              <button class="nav-button" @click=${this._handlePrevMonth}>
                <span class="material-icons">chevron_left</span>
              </button>
              <span>
                ${monthNames[this._currentMonth.getMonth()]}
                ${this._currentMonth.getFullYear()}
              </span>
              <button class="nav-button" @click=${this._handleNextMonth}>
                <span class="material-icons">chevron_right</span>
              </button>
            </div>
          </div>

          <div class="calendar-grid">
            ${weekdays.map((day) => html` <div class="weekday">${day}</div> `)}
            ${this._generateCalendarDays().map(
              ({ date, isOutsideMonth }) => html`
                <div
                  class="day ${isOutsideMonth ? "outside-month" : ""}
                         ${this._formatDate(date) === this.value
                    ? "selected"
                    : ""}
                         ${this._isDateDisabled(date) ? "disabled" : ""}
                         ${this._formatDate(date) ===
                  this._formatDate(new Date())
                    ? "today"
                    : ""}"
                  @click=${() => this._handleDateClick(date)}
                >
                  ${date.getDate()}
                </div>
              `
            )}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("date-picker", DatePicker);
