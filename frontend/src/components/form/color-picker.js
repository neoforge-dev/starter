import { 
  LitElement,
  html,
  css,
 } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class ColorPicker extends LitElement {
  static properties = {
    value: { type: String },
    mode: { type: String },
    format: { type: String },
    variant: { type: String },
    disabled: { type: Boolean },
    showHistory: { type: Boolean },
    showOpacity: { type: Boolean },
    presetColors: { type: Array },
    _hue: { type: Number, state: true },
    _saturation: { type: Number, state: true },
    _lightness: { type: Number, state: true },
    _opacity: { type: Number, state: true },
    _history: { type: Array, state: true },
    _isOpen: { type: Boolean, state: true },
    _gradientStops: { type: Array, state: true },
    _gradientAngle: { type: Number, state: true },
  };

  static styles = css`
    :host {
      display: inline-block;
      font-family: system-ui, sans-serif;
    }

    .color-picker {
      position: relative;
    }

    /* Trigger Button */
    .color-trigger {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      background: white;
      cursor: pointer;
      min-width: 120px;
    }

    .color-trigger:hover {
      border-color: #d1d5db;
    }

    .color-trigger:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }

    .color-trigger.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .color-preview {
      width: 24px;
      height: 24px;
      border-radius: 0.25rem;
      border: 1px solid #e5e7eb;
    }

    .color-value {
      font-size: 0.875rem;
      color: #374151;
    }

    /* Popover */
    .color-popover {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 0.5rem;
      padding: 1rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      z-index: 10;
      min-width: 240px;
      display: none;
    }

    .color-popover.open {
      display: block;
    }

    /* Color Area */
    .color-area {
      position: relative;
      width: 100%;
      padding-bottom: 100%;
      border-radius: 0.375rem;
      margin-bottom: 1rem;
      cursor: crosshair;
    }

    .color-area-overlay {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(to right, white, transparent),
        linear-gradient(to top, black, transparent);
    }

    .color-pointer {
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid white;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
      pointer-events: none;
    }

    /* Sliders */
    .slider-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .slider-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .slider-label {
      font-size: 0.75rem;
      color: #6b7280;
      width: 2rem;
    }

    .slider {
      flex: 1;
      -webkit-appearance: none;
      height: 8px;
      border-radius: 4px;
      background: #e5e7eb;
    }

    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: white;
      border: 1px solid #d1d5db;
      cursor: pointer;
    }

    .hue-slider {
      background: linear-gradient(
        to right,
        hsl(0, 100%, 50%),
        hsl(60, 100%, 50%),
        hsl(120, 100%, 50%),
        hsl(180, 100%, 50%),
        hsl(240, 100%, 50%),
        hsl(300, 100%, 50%),
        hsl(360, 100%, 50%)
      );
    }

    .opacity-slider {
      background-image:
        linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
      background-size: 8px 8px;
      background-position:
        0 0,
        0 4px,
        4px -4px,
        -4px 0px;
    }

    .opacity-slider::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(to right, transparent, var(--current-color));
    }

    /* Format Tabs */
    .format-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .format-tab {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      border-radius: 0.25rem;
      cursor: pointer;
      color: #6b7280;
    }

    .format-tab:hover {
      background: #f3f4f6;
    }

    .format-tab.active {
      background: #e5e7eb;
      color: #1f2937;
    }

    /* Preset Colors */
    .preset-colors {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .preset-color {
      width: 24px;
      height: 24px;
      border-radius: 0.25rem;
      border: 1px solid #e5e7eb;
      cursor: pointer;
    }

    .preset-color:hover {
      transform: scale(1.1);
    }

    /* History */
    .color-history {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .history-color {
      width: 20px;
      height: 20px;
      border-radius: 0.25rem;
      border: 1px solid #e5e7eb;
      cursor: pointer;
    }

    .history-color:hover {
      transform: scale(1.1);
    }

    /* Gradient Mode */
    .gradient-controls {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .gradient-stops {
      position: relative;
      height: 24px;
      background-image:
        linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
      background-size: 8px 8px;
      border-radius: 0.25rem;
      margin: 0.5rem 0;
    }

    .gradient-preview {
      position: absolute;
      inset: 0;
      border-radius: 0.25rem;
    }

    .gradient-stop {
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid white;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      top: 50%;
      cursor: pointer;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    }

    .gradient-stop.active {
      z-index: 1;
      transform: translate(-50%, -50%) scale(1.2);
    }

    .angle-control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Variants */
    .variant-compact .color-popover {
      padding: 0.5rem;
      min-width: 200px;
    }

    .variant-compact .preset-colors {
      grid-template-columns: repeat(6, 1fr);
    }

    .variant-inline {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .variant-inline .color-popover {
      position: static;
      box-shadow: none;
      border: none;
      padding: 0;
      margin: 0;
      min-width: 0;
    }

    /* Responsive Design */
    @media (max-width: 640px) {
      .color-popover {
        position: fixed;
        inset: 1rem;
        margin: 0;
        max-height: calc(100vh - 2rem);
        overflow-y: auto;
      }

      .preset-colors {
        grid-template-columns: repeat(6, 1fr);
      }
    }
  `;

  constructor() {
    super();
    this.value = "#2563eb";
    this.mode = "simple";
    this.format = "hex";
    this.variant = "default";
    this.disabled = false;
    this.showHistory = true;
    this.showOpacity = false;
    this.presetColors = [];
    this._hue = 0;
    this._saturation = 100;
    this._lightness = 50;
    this._opacity = 100;
    this._history = [];
    this._isOpen = false;
    this._gradientStops = [
      { position: 0, color: "#2563eb" },
      { position: 100, color: "#7c3aed" },
    ];
    this._gradientAngle = 135;
  }

  _parseColor(color) {
    if (color.startsWith("#")) {
      // Parse hex
      const hex = color.substring(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return { r, g, b };
    } else if (color.startsWith("rgb")) {
      // Parse rgb/rgba
      const matches = color.match(/\d+/g);
      return {
        r: parseInt(matches[0]),
        g: parseInt(matches[1]),
        b: parseInt(matches[2]),
        a: matches[3] ? parseFloat(matches[3]) : 1,
      };
    }
    return null;
  }

  _rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  _hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  _rgbToHex(r, g, b) {
    const toHex = (n) => {
      const hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  _formatColor() {
    if (this.mode === "gradient") {
      return `linear-gradient(${this._gradientAngle}deg, ${this._gradientStops
        .map((stop) => `${stop.color} ${stop.position}%`)
        .join(", ")})`;
    }

    const rgb = this._hslToRgb(this._hue, this._saturation, this._lightness);

    switch (this.format) {
      case "hex":
        return this._rgbToHex(rgb.r, rgb.g, rgb.b);
      case "rgb":
        return this.showOpacity && this._opacity < 100
          ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this._opacity / 100})`
          : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      case "hsl":
        return this.showOpacity && this._opacity < 100
          ? `hsla(${this._hue}, ${this._saturation}%, ${this._lightness}%, ${this._opacity / 100})`
          : `hsl(${this._hue}, ${this._saturation}%, ${this._lightness}%)`;
      default:
        return this.value;
    }
  }

  _updateColor(color) {
    if (this._history[0] !== color) {
      this._history = [color, ...this._history.slice(0, 8)];
    }

    this.value = color;
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: color },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleAreaClick(e) {
    if (this.disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    this._saturation = Math.round(x * 100);
    this._lightness = Math.round((1 - y) * 100);

    this._updateColor(this._formatColor());
  }

  _handleHueChange(e) {
    this._hue = parseInt(e.target.value);
    this._updateColor(this._formatColor());
  }

  _handleOpacityChange(e) {
    this._opacity = parseInt(e.target.value);
    this._updateColor(this._formatColor());
  }

  _handlePresetClick(color) {
    if (this.disabled) return;

    if (this.mode === "gradient") {
      const activeStop = this._gradientStops.find((stop) => stop.active);
      if (activeStop) {
        activeStop.color = color;
        this._updateColor(this._formatColor());
      }
    } else {
      const parsed = this._parseColor(color);
      if (parsed) {
        const hsl = this._rgbToHsl(parsed.r, parsed.g, parsed.b);
        this._hue = hsl.h;
        this._saturation = hsl.s;
        this._lightness = hsl.l;
        this._opacity = parsed.a ? Math.round(parsed.a * 100) : 100;
        this._updateColor(this._formatColor());
      }
    }
  }

  _handleGradientStopClick(stop, e) {
    e.stopPropagation();
    this._gradientStops.forEach((s) => (s.active = s === stop));
    this.requestUpdate();
  }

  _handleGradientStopMove(e) {
    if (!this._gradientStops.some((s) => s.active)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const position = Math.round(
      Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    );

    const activeStop = this._gradientStops.find((s) => s.active);
    if (activeStop) {
      activeStop.position = position;
      this._updateColor(this._formatColor());
    }
  }

  _handleAngleChange(e) {
    this._gradientAngle = parseInt(e.target.value);
    this._updateColor(this._formatColor());
  }

  _renderColorArea() {
    const background = `hsl(${this._hue}, 100%, 50%)`;
    const pointerLeft = `${this._saturation}%`;
    const pointerTop = `${100 - this._lightness}%`;

    return html`
      <div
        class="color-area"
        style="background: ${background}"
        @click=${this._handleAreaClick}
      >
        <div class="color-area-overlay"></div>
        <div
          class="color-pointer"
          style="left: ${pointerLeft}; top: ${pointerTop}; background: ${this
            .value}"
        ></div>
      </div>
    `;
  }

  _renderSliders() {
    return html`
      <div class="slider-group">
        <div class="slider-row">
          <span class="slider-label">H</span>
          <input
            type="range"
            class="slider hue-slider"
            min="0"
            max="360"
            .value=${this._hue}
            @input=${this._handleHueChange}
            ?disabled=${this.disabled}
          />
        </div>
        ${this.showOpacity
          ? html`
              <div class="slider-row">
                <span class="slider-label">A</span>
                <input
                  type="range"
                  class="slider opacity-slider"
                  min="0"
                  max="100"
                  .value=${this._opacity}
                  @input=${this._handleOpacityChange}
                  ?disabled=${this.disabled}
                  style="--current-color: ${this.value}"
                />
              </div>
            `
          : ""}
      </div>
    `;
  }

  _renderGradientControls() {
    return html`
      <div class="gradient-controls">
        <div
          class="gradient-stops"
          @click=${this._handleGradientStopMove}
          @mousemove=${this._handleGradientStopMove}
        >
          <div class="gradient-preview" style="background: ${this.value}"></div>
          ${this._gradientStops.map(
            (stop) => html`
              <div
                class="gradient-stop ${stop.active ? "active" : ""}"
                style="left: ${stop.position}%; background: ${stop.color}"
                @click=${(e) => this._handleGradientStopClick(stop, e)}
              ></div>
            `
          )}
        </div>
        <div class="angle-control">
          <span class="slider-label">Angle</span>
          <input
            type="range"
            class="slider"
            min="0"
            max="360"
            .value=${this._gradientAngle}
            @input=${this._handleAngleChange}
            ?disabled=${this.disabled}
          />
          <span class="slider-label">${this._gradientAngle}°</span>
        </div>
      </div>
    `;
  }

  _renderPresetColors() {
    return html`
      <div class="preset-colors">
        ${this.presetColors.map(
          (color) => html`
            <div
              class="preset-color"
              style="background: ${typeof color === "string"
                ? color
                : color.gradient}"
              @click=${() =>
                this._handlePresetClick(
                  typeof color === "string" ? color : color.gradient
                )}
            ></div>
          `
        )}
      </div>
    `;
  }

  _renderHistory() {
    if (!this.showHistory || !this._history.length) return "";

    return html`
      <div class="color-history">
        ${this._history.map(
          (color) => html`
            <div
              class="history-color"
              style="background: ${color}"
              @click=${() => this._handlePresetClick(color)}
            ></div>
          `
        )}
      </div>
    `;
  }

  render() {
    return html`
      <div class="color-picker variant-${this.variant}">
        <button
          class="color-trigger ${this.disabled ? "disabled" : ""}"
          @click=${() => (this._isOpen = !this._isOpen)}
          ?disabled=${this.disabled}
        >
          <div class="color-preview" style="background: ${this.value}"></div>
          <span class="color-value">${this.value}</span>
        </button>

        <div class="color-popover ${this._isOpen ? "open" : ""}">
          ${this.mode === "gradient"
            ? this._renderGradientControls()
            : html`
                ${this.mode === "advanced" ? this._renderColorArea() : ""}
                ${this.mode !== "palette" ? this._renderSliders() : ""}
              `}
          ${this.mode === "advanced"
            ? html`
                <div class="format-tabs">
                  ${["hex", "rgb", "hsl"].map(
                    (f) => html`
                      <div
                        class="format-tab ${this.format === f ? "active" : ""}"
                        @click=${() => (this.format = f)}
                      >
                        ${f.toUpperCase()}
                      </div>
                    `
                  )}
                </div>
              `
            : ""}
          ${this.presetColors.length ? this._renderPresetColors() : ""}
          ${this._renderHistory()}
        </div>
      </div>
    `;
  }
}

customElements.define("ui-color-picker", ColorPicker);
