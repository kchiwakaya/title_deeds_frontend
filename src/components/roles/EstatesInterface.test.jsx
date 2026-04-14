import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EstatesInterface from './EstatesInterface'
import axios from 'axios'

vi.mock('axios')

describe('EstatesInterface', () => {
    const mockSelectedApp = {
        id: 1,
        farmer: 'John Doe',
        farmer_details: { national_id: '12-345678-A-12' },
        farm_name: 'Test Farm',
        farm_extent: '100.0000',
        district: 'Harare'
    }

    const mockOnClose = vi.fn()
    const mockOnSuccess = vi.fn()
    const mockOnError = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the estates interface correctly', () => {
        render(
            <EstatesInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        expect(screen.getByText(/Estates - Form Verification/i)).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('verifies application successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        render(
            <EstatesInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const verifyButton = screen.getByText(/Verify Form - Details Correct/i)
        fireEvent.click(verifyButton)

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `/api/applications/${mockSelectedApp.id}/verify_estates/`,
                expect.any(Object)
            )
            expect(mockOnSuccess).toHaveBeenCalled()
        })
    })

    it('requests correction successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        render(
            <EstatesInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        // Switch to correction mode
        const requestCorrectionButton = screen.getByText(/Request Corrections/i)
        fireEvent.click(requestCorrectionButton)

        const notesTextarea = screen.getByPlaceholderText(/Describe what needs to be corrected/i)
        fireEvent.change(notesTextarea, { target: { value: 'Fix boundary details' } })

        const sendButton = screen.getByText(/Send Correction Request/i)
        fireEvent.click(sendButton)

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `/api/applications/${mockSelectedApp.id}/request_correction_estates/`,
                expect.objectContaining({
                    notes: 'Fix boundary details'
                })
            )
            expect(mockOnSuccess).toHaveBeenCalled()
        })
    })

    it('validates notes are required for correction', async () => {
        render(
            <EstatesInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const requestCorrectionButton = screen.getByText(/Request Corrections/i)
        fireEvent.click(requestCorrectionButton)

        const sendButton = screen.getByText(/Send Correction Request/i)
        expect(sendButton).toBeDisabled()
    })

    it('handles API error gracefully', async () => {
        axios.post.mockRejectedValueOnce({
            response: { data: { error: 'API Error' } }
        })

        render(
            <EstatesInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const verifyButton = screen.getByText(/Verify Form - Details Correct/i)
        fireEvent.click(verifyButton)

        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith('API Error')
        })
    })
})
