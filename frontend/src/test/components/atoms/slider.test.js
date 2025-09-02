import { expect } from '@open-wc/testing';
import { html, fixture } from '@open-wc/testing';
import '../../../components/atoms/slider/slider.js';

describe('NeoSlider', () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-slider></neo-slider>`);
  });

  describe('Basic rendering', () => {
    it('should render successfully', () => {
      expect(element).to.exist;
      expect(element.tagName).to.equal('NEO-SLIDER');
    });

    it('should have default properties', () => {
      expect(element.value).to.equal(50);
      expect(element.min).to.equal(0);
      expect(element.max).to.equal(100);
      expect(element.step).to.equal(1);
      expect(element.disabled).to.be.false;
      expect(element.readonly).to.be.false;
      expect(element.showValue).to.be.true;
      expect(element.showTicks).to.be.false;
      expect(element.showLabels).to.be.false;
      expect(element.size).to.equal('md');
      expect(element.variant).to.equal('default');
    });

    it('should render slider input element', () => {
      const input = element.shadowRoot.querySelector('.slider-input');
      expect(input).to.exist;
      expect(input.type).to.equal('range');
    });

    it('should render slider track and fill', () => {
      const track = element.shadowRoot.querySelector('.slider-track');
      const fill = element.shadowRoot.querySelector('.slider-fill');
      const thumb = element.shadowRoot.querySelector('.slider-thumb');
      
      expect(track).to.exist;
      expect(fill).to.exist;
      expect(thumb).to.exist;
    });
  });

  describe('Properties and attributes', () => {
    it('should reflect boolean properties as attributes', async () => {
      element.disabled = true;
      element.readonly = true;
      await element.updateComplete;

      expect(element.hasAttribute('disabled')).to.be.true;
      expect(element.hasAttribute('readonly')).to.be.true;
    });

    it('should update input attributes when properties change', async () => {
      element.min = 10;
      element.max = 90;
      element.step = 5;
      element.name = 'test-slider';
      await element.updateComplete;

      const input = element.shadowRoot.querySelector('.slider-input');
      expect(input.min).to.equal('10');
      expect(input.max).to.equal('90');
      expect(input.step).to.equal('5');
      expect(input.name).to.equal('test-slider');
    });

    it('should handle value property changes', async () => {
      element.value = 75;
      await element.updateComplete;

      const input = element.shadowRoot.querySelector('.slider-input');
      expect(parseInt(input.value)).to.equal(75);
    });

    it('should calculate percentage correctly', async () => {
      element.min = 0;
      element.max = 100;
      element.value = 25;
      await element.updateComplete;

      expect(element.percentage).to.equal(25);
    });

    it('should calculate percentage with custom range', async () => {
      element.min = 10;
      element.max = 20;
      element.value = 15;
      await element.updateComplete;

      expect(element.percentage).to.equal(50);
    });
  });

  describe('Label rendering', () => {
    it('should render label when provided', async () => {
      element.label = 'Volume';
      await element.updateComplete;

      const label = element.shadowRoot.querySelector('.label');
      expect(label).to.exist;
      expect(label.textContent).to.equal('Volume');
    });

    it('should not render header when no label and showValue is false', async () => {
      element.showValue = false;
      await element.updateComplete;

      const header = element.shadowRoot.querySelector('.slider-header');
      expect(header).to.be.null;
    });

    it('should render header when showValue is true', async () => {
      element.showValue = true;
      await element.updateComplete;

      const header = element.shadowRoot.querySelector('.slider-header');
      const valueDisplay = element.shadowRoot.querySelector('.value-display');
      
      expect(header).to.exist;
      expect(valueDisplay).to.exist;
    });
  });

  describe('Value display', () => {
    it('should show current value by default', async () => {
      element.value = 60;
      await element.updateComplete;

      const valueDisplay = element.shadowRoot.querySelector('.value-display');
      expect(valueDisplay.textContent).to.equal('60');
    });

    it('should show value with prefix', async () => {
      element.value = 100;
      element.valuePrefix = '$';
      await element.updateComplete;

      const valueDisplay = element.shadowRoot.querySelector('.value-display');
      expect(valueDisplay.textContent).to.equal('$100');
    });

    it('should show value with suffix', async () => {
      element.value = 75;
      element.valueSuffix = '%';
      await element.updateComplete;

      const valueDisplay = element.shadowRoot.querySelector('.value-display');
      expect(valueDisplay.textContent).to.equal('75%');
    });

    it('should show value with both prefix and suffix', async () => {
      element.value = 250;
      element.valuePrefix = '$';
      element.valueSuffix = '.00';
      await element.updateComplete;

      const valueDisplay = element.shadowRoot.querySelector('.value-display');
      expect(valueDisplay.textContent).to.equal('$250.00');
    });

    it('should use custom formatValue function when provided', async () => {
      element.value = 1500;
      element.formatValue = (value) => `${(value / 1000).toFixed(1)}k`;
      await element.updateComplete;

      expect(element.displayValue).to.equal('1.5k');
    });
  });

  describe('Size variants', () => {
    ['sm', 'md', 'lg'].forEach(size => {
      it(`should apply ${size} size attribute`, async () => {
        element.size = size;
        await element.updateComplete;

        expect(element.hasAttribute('size')).to.be.true;
        expect(element.getAttribute('size')).to.equal(size);
      });
    });
  });

  describe('Visual variants', () => {
    ['default', 'primary', 'success', 'warning', 'error'].forEach(variant => {
      it(`should apply ${variant} variant attribute`, async () => {
        element.variant = variant;
        await element.updateComplete;

        expect(element.hasAttribute('variant')).to.be.true;
        expect(element.getAttribute('variant')).to.equal(variant);
      });
    });
  });

  describe('Tick marks', () => {
    it('should not show ticks by default', async () => {
      await element.updateComplete;

      const ticks = element.shadowRoot.querySelector('.slider-ticks');
      expect(ticks).to.be.null;
    });

    it('should show ticks when enabled', async () => {
      element.showTicks = true;
      await element.updateComplete;

      const ticks = element.shadowRoot.querySelector('.slider-ticks');
      expect(ticks).to.exist;
    });

    it('should render individual tick elements when ticks are enabled', async () => {
      element.showTicks = true;
      element.min = 0;
      element.max = 10;
      element.step = 1;
      await element.updateComplete;

      const tickElements = element.shadowRoot.querySelectorAll('.tick');
      expect(tickElements.length).to.be.greaterThan(0);
    });
  });

  describe('Min/Max labels', () => {
    it('should not show labels by default', async () => {
      await element.updateComplete;

      const labels = element.shadowRoot.querySelector('.slider-labels');
      expect(labels).to.be.null;
    });

    it('should show min/max labels when enabled', async () => {
      element.showLabels = true;
      element.min = 10;
      element.max = 90;
      await element.updateComplete;

      const labels = element.shadowRoot.querySelector('.slider-labels');
      expect(labels).to.exist;
      
      const labelSpans = labels.querySelectorAll('span');
      expect(labelSpans).to.have.length(2);
      expect(labelSpans[0].textContent).to.equal('10');
      expect(labelSpans[1].textContent).to.equal('90');
    });
  });

  describe('Custom marks', () => {
    it('should not show marks when none are provided', async () => {
      await element.updateComplete;

      const marks = element.shadowRoot.querySelector('.slider-marks');
      expect(marks).to.be.null;
    });

    it('should show custom marks when provided', async () => {
      element.marks = [
        { value: 0, label: 'Low' },
        { value: 50, label: 'Medium' },
        { value: 100, label: 'High' }
      ];
      await element.updateComplete;

      const marks = element.shadowRoot.querySelector('.slider-marks');
      expect(marks).to.exist;
      
      const markElements = marks.querySelectorAll('.mark');
      expect(markElements).to.have.length(3);
      expect(markElements[0].textContent.trim()).to.equal('Low');
      expect(markElements[1].textContent.trim()).to.equal('Medium');
      expect(markElements[2].textContent.trim()).to.equal('High');
    });

    it('should highlight active mark based on current value', async () => {
      element.value = 50;
      element.step = 1;
      element.marks = [
        { value: 50, label: 'Active' },
        { value: 100, label: 'Inactive' }
      ];
      await element.updateComplete;

      const markElements = element.shadowRoot.querySelectorAll('.mark');
      expect(markElements[0].classList.contains('active')).to.be.true;
      expect(markElements[1].classList.contains('active')).to.be.false;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      element.label = 'Volume Control';
      element.value = 75;
      await element.updateComplete;

      const input = element.shadowRoot.querySelector('.slider-input');
      expect(input.getAttribute('aria-label')).to.equal('Volume Control');
      expect(input.getAttribute('aria-valuemin')).to.equal('0');
      expect(input.getAttribute('aria-valuemax')).to.equal('100');
      expect(input.getAttribute('aria-valuenow')).to.equal('75');
      expect(input.getAttribute('aria-valuetext')).to.equal('75');
    });

    it('should use default aria-label when no label provided', async () => {
      await element.updateComplete;

      const input = element.shadowRoot.querySelector('.slider-input');
      expect(input.getAttribute('aria-label')).to.equal('Slider input');
    });

    it('should update aria-valuetext with formatted value', async () => {
      element.value = 50;
      element.valueSuffix = '%';
      await element.updateComplete;

      const input = element.shadowRoot.querySelector('.slider-input');
      expect(input.getAttribute('aria-valuetext')).to.equal('50%');
    });
  });

  describe('Events', () => {
    it('should dispatch input event when value changes', async () => {
      let eventFired = false;
      let eventDetail = null;

      element.addEventListener('input', (e) => {
        eventFired = true;
        eventDetail = e.detail;
      });

      const input = element.shadowRoot.querySelector('.slider-input');
      input.value = '75';
      input.dispatchEvent(new Event('input'));

      expect(eventFired).to.be.true;
      expect(eventDetail.value).to.equal(75);
    });

    it('should dispatch change event', async () => {
      let eventFired = false;
      let eventDetail = null;

      element.addEventListener('change', (e) => {
        eventFired = true;
        eventDetail = e.detail;
      });

      const input = element.shadowRoot.querySelector('.slider-input');
      input.value = '80';
      element.value = 80;
      input.dispatchEvent(new Event('change'));

      expect(eventFired).to.be.true;
      expect(eventDetail.value).to.equal(80);
    });

    it('should update component value when input event fires', async () => {
      const input = element.shadowRoot.querySelector('.slider-input');
      input.value = '90';
      input.dispatchEvent(new Event('input'));

      expect(element.value).to.equal(90);
    });
  });

  describe('Public methods', () => {
    it('should have focus method', () => {
      expect(element.focus).to.be.a('function');
    });

    it('should have blur method', () => {
      expect(element.blur).to.be.a('function');
    });
  });

  describe('Disabled and readonly states', () => {
    it('should disable input when disabled property is set', async () => {
      element.disabled = true;
      await element.updateComplete;

      const input = element.shadowRoot.querySelector('.slider-input');
      expect(input.disabled).to.be.true;
    });

    it('should set readonly attribute when readonly property is set', async () => {
      element.readonly = true;
      await element.updateComplete;

      const input = element.shadowRoot.querySelector('.slider-input');
      expect(input.hasAttribute('readonly')).to.be.true;
    });

    it('should have disabled attribute when disabled', async () => {
      element.disabled = true;
      await element.updateComplete;

      expect(element.hasAttribute('disabled')).to.be.true;
    });
  });

  describe('Slider fill positioning', () => {
    it('should position fill correctly based on percentage', async () => {
      element.value = 25;
      element.min = 0;
      element.max = 100;
      await element.updateComplete;

      const fill = element.shadowRoot.querySelector('.slider-fill');
      expect(fill.style.width).to.equal('25%');
    });

    it('should position thumb correctly based on percentage', async () => {
      element.value = 75;
      element.min = 0;
      element.max = 100;
      await element.updateComplete;

      const thumb = element.shadowRoot.querySelector('.slider-thumb');
      expect(thumb.style.left).to.equal('75%');
    });
  });
});