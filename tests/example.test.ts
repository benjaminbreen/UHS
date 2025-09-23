import { describe, it, expect } from 'vitest';

describe('Test Environment', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to DOM', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    document.body.appendChild(div);

    expect(document.body.textContent).toContain('Hello World');
  });

  it('should have localStorage mocked', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.setItem).toHaveBeenCalledWith('test', 'value');
  });
});