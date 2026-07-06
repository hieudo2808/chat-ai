/* @vitest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModelForm } from './ModelForm';

describe('ModelForm', () => {
    it('should render the form in create mode with default openrouter preset', () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        render(<ModelForm mode="create" onSubmit={onSubmit} onCancel={onCancel} />);

        // Title is now in Vietnamese
        expect(screen.getByText('➕ Thêm Model mới')).toBeInTheDocument();

        // OpenRouter is the default preset
        const baseUrlInput = screen.getByLabelText(/Base URL/i) as HTMLInputElement;
        expect(baseUrlInput.value).toBe('https://openrouter.ai/api/v1');
    });

    it('should update baseUrl and modelName when preset changes', () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        render(<ModelForm mode="create" onSubmit={onSubmit} onCancel={onCancel} />);

        const providerSelect = screen.getByLabelText(/Provider/i) as HTMLSelectElement;
        fireEvent.change(providerSelect, { target: { value: 'ollama' } });

        const baseUrlInput = screen.getByLabelText(/Base URL/i) as HTMLInputElement;
        expect(baseUrlInput.value).toBe('http://localhost:11434/v1');

        const modelNameInput = screen.getByLabelText(/Tên Model/i) as HTMLInputElement;
        expect(modelNameInput.value).toBe('llama3');
    });

    it('should submit the form with correct data', () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        render(<ModelForm mode="create" onSubmit={onSubmit} onCancel={onCancel} />);

        // Fill name (label: "Tên hiển thị")
        const nameInput = screen.getByRole('textbox', { name: /Tên hiển thị/i });
        fireEvent.change(nameInput, { target: { value: 'My Model' } });

        // Submit button is now "Thêm Model" in create mode
        const submitButton = screen.getByText('Thêm Model');
        fireEvent.click(submitButton);

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit.mock.calls[0][0].name).toBe('My Model');
        expect(onSubmit.mock.calls[0][0].provider).toBe('openrouter'); // default
    });

    it('should submit the form with custom topP and repetitionPenalty parameters', () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        render(<ModelForm mode="create" onSubmit={onSubmit} onCancel={onCancel} />);

        // Fill name
        const nameInput = screen.getByRole('textbox', { name: /Tên hiển thị/i });
        fireEvent.change(nameInput, { target: { value: 'My Test Model' } });

        // Fill topP
        const topPInput = screen.getByLabelText(/Top P/i) as HTMLInputElement;
        fireEvent.change(topPInput, { target: { value: '0.85' } });

        // Fill repetitionPenalty
        const repPenaltyInput = screen.getByLabelText(/Repetition Penalty/i) as HTMLInputElement;
        fireEvent.change(repPenaltyInput, { target: { value: '1.2' } });

        // Submit
        const submitButton = screen.getByText('Thêm Model');
        fireEvent.click(submitButton);

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit.mock.calls[0][0].name).toBe('My Test Model');
        expect(onSubmit.mock.calls[0][0].topP).toBe(0.85);
        expect(onSubmit.mock.calls[0][0].repetitionPenalty).toBe(1.2);
    });
});
