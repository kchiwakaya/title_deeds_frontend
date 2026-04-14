import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SurveyorInterface from './SurveyorInterface'
import axios from 'axios'

vi.mock('axios')

describe('SurveyorInterface', () => {
    const mockSelectedApp = {
        id: 1,
        farmer: 'John Doe',
        farmer_details: { national_id: '12-345678-A-12' },
        farm_name: 'Test Farm',
        farm_extent: '100.0000'
    }

    const mockOnClose = vi.fn()
    const mockOnSuccess = vi.fn()
    const mockOnError = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the surveyor interface correctly', () => {
        render(
            <SurveyorInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        expect(screen.getByText('Surveyor General - Survey Verification')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('allows entering official farm details', () => {
        render(
            <SurveyorInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const confirmModeButton = screen.getByText(/Farm Is Surveyed/i)
        fireEvent.click(confirmModeButton)

        const nameInput = screen.getByPlaceholderText(/Enter official surveyed farm name/i)
        const hectarageInput = screen.getByPlaceholderText(/Enter exact hectarage from survey/i)

        fireEvent.change(nameInput, { target: { value: 'Official Farm' } })
        fireEvent.change(hectarageInput, { target: { value: '99.5' } })

        expect(nameInput.value).toBe('Official Farm')
        expect(hectarageInput.value).toBe('99.5')
    })

    it('confirms survey successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        render(
            <SurveyorInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const confirmModeButton = screen.getByText(/Farm Is Surveyed/i)
        fireEvent.click(confirmModeButton)

        const nameInput = screen.getByPlaceholderText(/Enter official surveyed farm name/i)
        const hectarageInput = screen.getByPlaceholderText(/Enter exact hectarage from survey/i)

        fireEvent.change(nameInput, { target: { value: 'Official Farm' } })
        fireEvent.change(hectarageInput, { target: { value: '99.5' } })

        const confirmButton = screen.getByText(/Confirm Survey Completed/i)
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `/api/applications/${mockSelectedApp.id}/confirm_survey_completed/`,
                expect.objectContaining({
                    official_farm_name: 'Official Farm',
                    official_hectarage: 99.5
                })
            )
            expect(mockOnSuccess).toHaveBeenCalled()
        })
    })

    it('requests survey successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        render(
            <SurveyorInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const requestModeButton = screen.getByText(/Request Survey/i)
        fireEvent.click(requestModeButton)

        const feeInput = screen.getByPlaceholderText(/Enter survey fee amount if known/i)
        fireEvent.change(feeInput, { target: { value: '5000' } })

        const requestButton = screen.getByText(/Send Survey Request/i)
        fireEvent.click(requestButton)

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `/api/applications/${mockSelectedApp.id}/request_survey/`,
                expect.objectContaining({
                    survey_fee_amount: 5000
                })
            )
            expect(mockOnSuccess).toHaveBeenCalled()
        })
    })

    it('validates required fields for survey confirmation', async () => {
        render(
            <SurveyorInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const confirmModeButton = screen.getByText(/Farm Is Surveyed/i)
        fireEvent.click(confirmModeButton)

        const nameInput = screen.getByPlaceholderText(/Enter official surveyed farm name/i)
        fireEvent.change(nameInput, { target: { value: '' } })

        const confirmButton = screen.getByText(/Confirm Survey Completed/i)
        expect(confirmButton).toBeDisabled()
    })

    it('handles API error gracefully', async () => {
        axios.post.mockRejectedValueOnce({
            response: { data: { error: 'API Error' } }
        })

        render(
            <SurveyorInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const confirmModeButton = screen.getByText(/Farm Is Surveyed/i)
        fireEvent.click(confirmModeButton)

        const nameInput = screen.getByPlaceholderText(/Enter official surveyed farm name/i)
        const hectarageInput = screen.getByPlaceholderText(/Enter exact hectarage from survey/i)

        fireEvent.change(nameInput, { target: { value: 'Official Farm' } })
        fireEvent.change(hectarageInput, { target: { value: '99.5' } })

        const confirmButton = screen.getByText(/Confirm Survey Completed/i)
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith('API Error')
        })
    })
})
