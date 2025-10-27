import '@testing-library/jest-dom';

// Mock WebGL context for Three.js testing
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return {
      canvas: document.createElement('canvas'),
      drawingBufferWidth: 800,
      drawingBufferHeight: 600,
      getExtension: jest.fn(),
      getParameter: jest.fn(),
      getShaderPrecisionFormat: jest.fn(() => ({
        precision: 1,
        rangeMin: 1,
        rangeMax: 1,
      })),
    };
  }
  return null;
}) as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  cb(0);
  return 0;
});

global.cancelAnimationFrame = jest.fn();
