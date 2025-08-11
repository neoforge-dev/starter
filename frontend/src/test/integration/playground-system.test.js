/**
 * Native Playground System Test
 * 
 * Test the complete migration from Storybook to Native Web Components playground
 */
import { describe, it, expect } from 'vitest';

describe('Native Playground System', () => {
  it('should extract story information from existing .stories.js files', async () => {
    const { StoryExtractor } = await import('../../playground/utils/story-extractor.js');
    const extractor = new StoryExtractor();
    
    // Test with button stories (most complex example)
    const buttonStories = await extractor.extractFromFile(
      'src/components/atoms/button/button.stories.js'
    );
    
    expect(buttonStories).toBeDefined();
    expect(buttonStories.component).toBe('neo-button');
    expect(buttonStories.title).toBe('Atoms/Button');
    expect(buttonStories.examples).toBeInstanceOf(Array);
    expect(buttonStories.examples.length).toBeGreaterThan(5); // Has many variants
  });

  it('should dynamically load component playgrounds', async () => {
    const { ComponentLoader } = await import('../../playground/core/component-loader.js');
    const loader = new ComponentLoader();
    
    // Should be able to load our fixed components
    const buttonPlayground = await loader.loadPlayground('atoms', 'button');
    expect(buttonPlayground).toBeDefined();
    expect(buttonPlayground.examples).toBeDefined();
  });

  it('should provide interactive prop editing', async () => {
    const { PropEditor } = await import('../../playground/core/prop-editor.js');
    const editor = new PropEditor();
    
    // Test with button component argTypes
    const argTypes = {
      variant: { control: { type: 'select' }, options: ['primary', 'secondary'] },
      disabled: { control: { type: 'boolean' } }
    };
    
    const controls = editor.createControls(argTypes);
    expect(controls).toBeDefined();
    expect(controls.variant.type).toBe('select');
    expect(controls.disabled.type).toBe('boolean');
  });
});