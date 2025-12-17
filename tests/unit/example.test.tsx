import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';

const TestComponent = () => <div>MedFlow AI Test</div>;

describe('Infrastructure Test', () => {
    it('renders correctly', () => {
        render(<TestComponent />);
        expect(screen.getByText('MedFlow AI Test')).toBeInTheDocument();
    });
});
