import React from 'react';
import { render, screen } from '@testing-library/react';
import { AvatarRenderer } from '../src/components/AvatarRenderer';
import type { AvatarConfig } from '../src/types';

describe('AvatarRenderer', () => {
  const mockConfig: AvatarConfig = {
    customization: {
      character: 'warrior',
      skin: 'medium',
      hairstyle: 'short',
      outfit: 'armor',
    },
    initialEmotion: 'happy',
    visibilityMode: 'always',
  };

  it('should render without crashing', () => {
    const { container } = render(<AvatarRenderer config={mockConfig} />);
    expect(container).toBeInTheDocument();
  });

  it('should apply custom width and height', () => {
    const { container } = render(
      <AvatarRenderer config={mockConfig} width={400} height={600} />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: '400px', height: '600px' });
  });

  it('should apply custom className', () => {
    const { container } = render(
      <AvatarRenderer config={mockConfig} className="custom-avatar" />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-avatar');
  });

  it('should show debug overlay when debug=true', () => {
    render(<AvatarRenderer config={mockConfig} debug={true} />);

    expect(screen.getByText(/Character: warrior/)).toBeInTheDocument();
    expect(screen.getByText(/Emotion: happy/)).toBeInTheDocument();
  });

  it('should not show debug overlay when debug=false', () => {
    render(<AvatarRenderer config={mockConfig} debug={false} />);

    expect(screen.queryByText(/Character: warrior/)).not.toBeInTheDocument();
  });

  it('should apply background color from options', () => {
    const { container } = render(
      <AvatarRenderer
        config={mockConfig}
        options={{ backgroundColor: '#ff0000' }}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('should handle different emotions', () => {
    const configs = ['happy', 'sad', 'angry', 'neutral'] as const;

    configs.forEach((emotion) => {
      const config: AvatarConfig = {
        ...mockConfig,
        initialEmotion: emotion,
      };

      const { rerender } = render(<AvatarRenderer config={config} debug />);

      expect(screen.getByText(new RegExp(`Emotion: ${emotion}`))).toBeInTheDocument();

      rerender(<></>);
    });
  });

  it('should handle different character types', () => {
    const characters = ['warrior', 'mage', 'archer', 'cleric', 'assassin'] as const;

    characters.forEach((character) => {
      const config: AvatarConfig = {
        customization: {
          ...mockConfig.customization,
          character,
        },
      };

      const { rerender } = render(<AvatarRenderer config={config} debug />);

      expect(screen.getByText(new RegExp(`Character: ${character}`))).toBeInTheDocument();

      rerender(<></>);
    });
  });

  it('should accept custom renderer options', () => {
    const options = {
      shadows: false,
      antialias: false,
      alpha: false,
      autoRotate: true,
    };

    const { container } = render(<AvatarRenderer config={mockConfig} options={options} />);

    expect(container).toBeInTheDocument();
  });

  it('should handle custom camera settings', () => {
    const options = {
      camera: {
        fov: 60,
        near: 0.5,
        far: 500,
        position: { x: 0, y: 2, z: 10 },
      },
    };

    const { container } = render(<AvatarRenderer config={mockConfig} options={options} />);

    expect(container).toBeInTheDocument();
  });
});
