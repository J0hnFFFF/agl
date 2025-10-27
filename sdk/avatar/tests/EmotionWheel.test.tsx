import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmotionWheel } from '../src/components/EmotionWheel';
import type { EmotionType } from '../src/types';

describe('EmotionWheel', () => {
  const mockOnEmotionChange = jest.fn();

  beforeEach(() => {
    mockOnEmotionChange.mockClear();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <EmotionWheel
        currentEmotion="happy"
        currentIntensity={0.5}
        onEmotionChange={mockOnEmotionChange}
      />
    );

    expect(container).toBeInTheDocument();
  });

  it('should display current emotion icon', () => {
    const { container } = render(
      <EmotionWheel
        currentEmotion="happy"
        currentIntensity={0.5}
        onEmotionChange={mockOnEmotionChange}
      />
    );

    // Happy emoji should be visible
    expect(container.textContent).toContain('😊');
  });

  it('should expand when toggle button is clicked', () => {
    render(
      <EmotionWheel
        currentEmotion="happy"
        currentIntensity={0.5}
        onEmotionChange={mockOnEmotionChange}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /happy/i });
    fireEvent.click(toggleButton);

    // After expanding, should show more emotion buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(1);
  });

  it('should call onEmotionChange when emotion is selected', () => {
    render(
      <EmotionWheel
        currentEmotion="happy"
        currentIntensity={0.5}
        onEmotionChange={mockOnEmotionChange}
      />
    );

    // Expand the wheel
    const toggleButton = screen.getByRole('button', { name: /happy/i });
    fireEvent.click(toggleButton);

    // Click on sad emotion
    const sadButton = screen.getByRole('button', { name: /sad/i });
    fireEvent.click(sadButton);

    expect(mockOnEmotionChange).toHaveBeenCalledWith('sad', 0.5);
  });

  it('should update intensity when slider is changed', () => {
    render(
      <EmotionWheel
        currentEmotion="happy"
        currentIntensity={0.5}
        onEmotionChange={mockOnEmotionChange}
      />
    );

    // Expand the wheel
    const toggleButton = screen.getByRole('button', { name: /happy/i });
    fireEvent.click(toggleButton);

    // Find and change the intensity slider
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0.8' } });

    expect(mockOnEmotionChange).toHaveBeenCalledWith('happy', 0.8);
  });

  it('should display intensity percentage', () => {
    render(
      <EmotionWheel
        currentEmotion="happy"
        currentIntensity={0.75}
        onEmotionChange={mockOnEmotionChange}
      />
    );

    // Expand the wheel
    const toggleButton = screen.getByRole('button', { name: /happy/i });
    fireEvent.click(toggleButton);

    expect(screen.getByText(/75%/)).toBeInTheDocument();
  });

  it('should apply custom size', () => {
    const { container } = render(
      <EmotionWheel
        currentEmotion="happy"
        currentIntensity={0.5}
        onEmotionChange={mockOnEmotionChange}
        size={250}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: '250px' });
  });

  it('should apply custom className', () => {
    const { container } = render(
      <EmotionWheel
        currentEmotion="happy"
        currentIntensity={0.5}
        onEmotionChange={mockOnEmotionChange}
        className="custom-wheel"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-wheel');
  });

  it('should handle all emotion types', () => {
    const emotions: EmotionType[] = [
      'happy',
      'sad',
      'angry',
      'fearful',
      'disgusted',
      'surprised',
      'neutral',
      'excited',
      'proud',
      'confident',
      'disappointed',
      'frustrated',
    ];

    emotions.forEach((emotion) => {
      const { unmount } = render(
        <EmotionWheel
          currentEmotion={emotion}
          currentIntensity={0.5}
          onEmotionChange={mockOnEmotionChange}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();

      unmount();
    });
  });

  it('should collapse when toggle button is clicked again', () => {
    render(
      <EmotionWheel
        currentEmotion="happy"
        currentIntensity={0.5}
        onEmotionChange={mockOnEmotionChange}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /happy/i });

    // Expand
    fireEvent.click(toggleButton);
    let buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(1);

    // Collapse
    fireEvent.click(toggleButton);
    buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(1);
  });
});
