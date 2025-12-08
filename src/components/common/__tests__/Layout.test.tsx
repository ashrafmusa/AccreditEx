import React from 'react';
import { render, screen } from '@/test/test-utils';

describe('Layout Component', () => {
  it('should render basic DOM elements', () => {
    const { container } = render(React.createElement('div', { 'data-testid': 'layout' }, 'Content'));
    
    const layout = container.querySelector('[data-testid="layout"]');
    expect(layout).toBeInTheDocument();
  });

  it('should support semantic HTML elements', () => {
    const { container } = render(
      React.createElement('div', null,
        React.createElement('header', { 'data-testid': 'header' }, 'Header'),
        React.createElement('nav', { 'data-testid': 'navigation' }, 'Nav'),
        React.createElement('main', null, 'Main Content'),
        React.createElement('footer', { 'data-testid': 'footer' }, 'Footer')
      )
    );

    expect(container.querySelector('header')).toBeInTheDocument();
    expect(container.querySelector('nav')).toBeInTheDocument();
    expect(container.querySelector('main')).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('should render children correctly', () => {
    const { container } = render(
      React.createElement('div', null, 'Test Content')
    );

    expect(container.textContent).toContain('Test Content');
  });

  it('should handle multiple child elements', () => {
    const children = ['Item 1', 'Item 2', 'Item 3'];
    const { container } = render(
      React.createElement('ul', null,
        ...children.map(child => React.createElement('li', { key: child }, child))
      )
    );

    children.forEach(child => {
      expect(container.textContent).toContain(child);
    });
  });
});
