import { expect } from '@open-wc/testing';
import { html, fixture } from '@open-wc/testing';
import '../../../components/atoms/skeleton/skeleton.js';

describe('NeoSkeleton', () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-skeleton></neo-skeleton>`);
  });

  describe('Basic rendering', () => {
    it('should render successfully', () => {
      expect(element).to.exist;
      expect(element.tagName).to.equal('NEO-SKELETON');
    });

    it('should have default properties', () => {
      expect(element.variant).to.equal('text');
      expect(element.width).to.equal('');
      expect(element.height).to.equal('');
      expect(element.lines).to.equal(1);
      expect(element.size).to.equal('md');
      expect(element.animated).to.be.true;
      expect(element.borderRadius).to.equal('');
      expect(element.theme).to.equal('light');
      expect(element.count).to.equal(1);
      expect(element.spacing).to.equal('');
    });

    it('should render skeleton container', () => {
      const container = element.shadowRoot.querySelector('.skeleton-container');
      expect(container).to.exist;
    });

    it('should have proper accessibility attributes', () => {
      const container = element.shadowRoot.querySelector('.skeleton-container');
      expect(container.getAttribute('role')).to.equal('status');
      expect(container.getAttribute('aria-live')).to.equal('polite');
      expect(container.getAttribute('aria-label')).to.equal('Content loading');
    });

    it('should have screen reader text', () => {
      const srText = element.shadowRoot.querySelector('.sr-only');
      expect(srText).to.exist;
      expect(srText.textContent).to.equal('Loading content, please wait...');
    });
  });

  describe('Properties and attributes', () => {
    it('should reflect boolean properties as attributes', async () => {
      element.animated = false;
      await element.updateComplete;

      expect(element.hasAttribute('animated')).to.be.false;
    });

    it('should reflect string properties as attributes', async () => {
      element.size = 'lg';
      element.theme = 'dark';
      await element.updateComplete;

      expect(element.getAttribute('size')).to.equal('lg');
      expect(element.getAttribute('theme')).to.equal('dark');
    });
  });

  describe('Skeleton variants', () => {
    it('should render text variant by default', async () => {
      const skeleton = element.shadowRoot.querySelector('.skeleton.text');
      expect(skeleton).to.exist;
    });

    it('should render heading variant', async () => {
      element.variant = 'heading';
      await element.updateComplete;

      const skeleton = element.shadowRoot.querySelector('.skeleton.heading');
      expect(skeleton).to.exist;
    });

    it('should render paragraph variant with multiple lines', async () => {
      element.variant = 'paragraph';
      element.lines = 3;
      await element.updateComplete;

      const skeletons = element.shadowRoot.querySelectorAll('.skeleton.paragraph');
      expect(skeletons).to.have.length(3);
    });

    it('should render circle variant', async () => {
      element.variant = 'circle';
      await element.updateComplete;

      const skeleton = element.shadowRoot.querySelector('.skeleton.circle');
      expect(skeleton).to.exist;
    });

    it('should render rectangle variant', async () => {
      element.variant = 'rectangle';
      await element.updateComplete;

      const skeleton = element.shadowRoot.querySelector('.skeleton.rectangle');
      expect(skeleton).to.exist;
    });

    it('should render card variant with complex structure', async () => {
      element.variant = 'card';
      await element.updateComplete;

      const cardSkeleton = element.shadowRoot.querySelector('.skeleton.card');
      const cardHeader = element.shadowRoot.querySelector('.card-header');
      const cardAvatar = element.shadowRoot.querySelector('.card-avatar');
      const cardTitle = element.shadowRoot.querySelector('.card-title');
      const cardContent = element.shadowRoot.querySelector('.card-content');
      
      expect(cardSkeleton).to.exist;
      expect(cardHeader).to.exist;
      expect(cardAvatar).to.exist;
      expect(cardTitle).to.exist;
      expect(cardContent).to.exist;
    });
  });

  describe('Size variants', () => {
    ['xs', 'sm', 'md', 'lg', 'xl'].forEach(size => {
      it(`should apply ${size} size attribute`, async () => {
        element.size = size;
        await element.updateComplete;

        expect(element.hasAttribute('size')).to.be.true;
        expect(element.getAttribute('size')).to.equal(size);
      });
    });
  });

  describe('Theme variants', () => {
    it('should apply light theme by default', async () => {
      expect(element.theme).to.equal('light');
      expect(element.hasAttribute('theme')).to.be.true;
      expect(element.getAttribute('theme')).to.equal('light');
    });

    it('should apply dark theme when set', async () => {
      element.theme = 'dark';
      await element.updateComplete;

      expect(element.getAttribute('theme')).to.equal('dark');
    });
  });

  describe('Animation', () => {
    it('should be animated by default', async () => {
      expect(element.animated).to.be.true;
      expect(element.hasAttribute('animated')).to.be.true;
    });

    it('should not show animated attribute when disabled', async () => {
      element.animated = false;
      await element.updateComplete;

      expect(element.hasAttribute('animated')).to.be.false;
    });
  });

  describe('Custom dimensions', () => {
    it('should apply custom width', async () => {
      element.width = '200px';
      await element.updateComplete;

      const customStyles = element.customStyles;
      expect(customStyles).to.include('--custom-width: 200px');
    });

    it('should apply custom height', async () => {
      element.height = '50px';
      await element.updateComplete;

      const customStyles = element.customStyles;
      expect(customStyles).to.include('--custom-height: 50px');
    });

    it('should apply custom border radius', async () => {
      element.borderRadius = '8px';
      await element.updateComplete;

      const customStyles = element.customStyles;
      expect(customStyles).to.include('--skeleton-border-radius: 8px');
    });

    it('should apply custom spacing', async () => {
      element.spacing = '12px';
      await element.updateComplete;

      const customStyles = element.customStyles;
      expect(customStyles).to.include('--spacing: 12px');
    });

    it('should combine multiple custom styles', async () => {
      element.width = '300px';
      element.height = '60px';
      element.borderRadius = '10px';
      await element.updateComplete;

      const customStyles = element.customStyles;
      expect(customStyles).to.include('--custom-width: 300px');
      expect(customStyles).to.include('--custom-height: 60px');
      expect(customStyles).to.include('--skeleton-border-radius: 10px');
    });
  });

  describe('Multiple skeletons', () => {
    it('should render single skeleton by default', async () => {
      const skeletonItems = element.shadowRoot.querySelectorAll('.skeleton-item');
      expect(skeletonItems).to.have.length(1);
    });

    it('should render multiple skeletons when count is set', async () => {
      element.count = 5;
      await element.updateComplete;

      const skeletonItems = element.shadowRoot.querySelectorAll('.skeleton-item');
      expect(skeletonItems).to.have.length(5);
    });

    it('should render multiple text skeletons', async () => {
      element.variant = 'text';
      element.count = 3;
      await element.updateComplete;

      const skeletonItems = element.shadowRoot.querySelectorAll('.skeleton-item');
      expect(skeletonItems).to.have.length(3);
      
      skeletonItems.forEach(item => {
        const textSkeleton = item.querySelector('.skeleton.text');
        expect(textSkeleton).to.exist;
      });
    });

    it('should render multiple card skeletons', async () => {
      element.variant = 'card';
      element.count = 2;
      await element.updateComplete;

      const skeletonItems = element.shadowRoot.querySelectorAll('.skeleton-item');
      expect(skeletonItems).to.have.length(2);
      
      skeletonItems.forEach(item => {
        const cardSkeleton = item.querySelector('.skeleton.card');
        expect(cardSkeleton).to.exist;
      });
    });
  });

  describe('Card variant structure', () => {
    beforeEach(async () => {
      element.variant = 'card';
      await element.updateComplete;
    });

    it('should have card header with avatar and title group', () => {
      const cardHeader = element.shadowRoot.querySelector('.card-header');
      const cardAvatar = element.shadowRoot.querySelector('.card-avatar');
      const titleGroup = element.shadowRoot.querySelector('.card-title-group');
      
      expect(cardHeader).to.exist;
      expect(cardAvatar).to.exist;
      expect(titleGroup).to.exist;
    });

    it('should have title and subtitle in title group', () => {
      const cardTitle = element.shadowRoot.querySelector('.card-title');
      const cardSubtitle = element.shadowRoot.querySelector('.card-subtitle');
      
      expect(cardTitle).to.exist;
      expect(cardSubtitle).to.exist;
    });

    it('should have card content with multiple lines', () => {
      const cardContent = element.shadowRoot.querySelector('.card-content');
      const cardLines = element.shadowRoot.querySelectorAll('.card-line');
      
      expect(cardContent).to.exist;
      expect(cardLines).to.have.length.greaterThan(0);
    });
  });

  describe('Paragraph variant', () => {
    it('should render default number of lines', async () => {
      element.variant = 'paragraph';
      await element.updateComplete;

      const paragraphSkeletons = element.shadowRoot.querySelectorAll('.skeleton.paragraph');
      expect(paragraphSkeletons).to.have.length(1);
    });

    it('should render specified number of lines', async () => {
      element.variant = 'paragraph';
      element.lines = 5;
      await element.updateComplete;

      const paragraphSkeletons = element.shadowRoot.querySelectorAll('.skeleton.paragraph');
      expect(paragraphSkeletons).to.have.length(5);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero count gracefully', async () => {
      element.count = 0;
      await element.updateComplete;

      const skeletonItems = element.shadowRoot.querySelectorAll('.skeleton-item');
      expect(skeletonItems).to.have.length(0);
    });

    it('should handle zero lines gracefully', async () => {
      element.variant = 'paragraph';
      element.lines = 0;
      await element.updateComplete;

      const paragraphSkeletons = element.shadowRoot.querySelectorAll('.skeleton.paragraph');
      expect(paragraphSkeletons).to.have.length(0);
    });

    it('should handle unknown variant gracefully', async () => {
      element.variant = 'unknown';
      await element.updateComplete;

      // Should fallback to text variant
      const textSkeleton = element.shadowRoot.querySelector('.skeleton.text');
      expect(textSkeleton).to.exist;
    });

    it('should handle empty custom styles', async () => {
      const customStyles = element.customStyles;
      expect(customStyles).to.equal('');
    });
  });

  describe('CSS Custom Properties', () => {
    it('should generate correct custom styles object', () => {
      element.width = '100px';
      element.height = '20px';
      element.borderRadius = '5px';
      element.spacing = '8px';
      
      const styles = element.customStyles;
      const expectedStyles = [
        '--custom-width: 100px',
        '--custom-height: 20px', 
        '--skeleton-border-radius: 5px',
        '--spacing: 8px'
      ].join('; ');
      
      expect(styles).to.equal(expectedStyles);
    });

    it('should handle partial custom styles', () => {
      element.width = '150px';
      element.borderRadius = '3px';
      
      const styles = element.customStyles;
      expect(styles).to.include('--custom-width: 150px');
      expect(styles).to.include('--skeleton-border-radius: 3px');
      expect(styles).to.not.include('--custom-height');
      expect(styles).to.not.include('--spacing');
    });
  });
});