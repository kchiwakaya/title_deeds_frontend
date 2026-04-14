import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import axios from 'axios'

vi.mock('axios')
import { BrowserRouter } from 'react-router-dom'
import ApplicationForm from '../pages/ApplicationForm'
import '@testing-library/jest-dom'

vi.mock('axios', () => {
    const mockAxiosInstance = {
        get: vi.fn(() => Promise.resolve({ data: [] })),
        post: vi.fn(() => Promise.resolve({ data: {} })),
        patch: vi.fn(() => Promise.resolve({ data: {} })),
        put: vi.fn(() => Promise.resolve({ data: {} })),
        delete: vi.fn(() => Promise.resolve({ data: {} })),
        interceptors: { request: { use: vi.fn(), eject: vi.fn() }, response: { use: vi.fn(), eject: vi.fn() } }
    }
    return {
        default: {
            ...mockAxiosInstance,
            create: vi.fn(() => mockAxiosInstance)
        }
    }
})

const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    )
}

beforeEach(() => {
    vi.clearAllMocks()
    axios.get.mockImplementation((url) => {
        if (url.includes('/users/profile/update/')) {
            // Return empty data but avoid overwriting marital_status if possible
            // In the test, we want to control this, but the form resets it.
            // So we return a default that tests can override or just 'Single'
            return Promise.resolve({ data: { marital_status: 'Single' } })
        }
        if (url.includes('/applications/')) {
            return Promise.resolve({ data: [] })
        }
        return Promise.resolve({ data: {} })
    })
    axios.post.mockResolvedValue({ data: {} })
})



describe('ApplicationForm - Phone Auto-Prefix', () => {
    it('should auto-prefix phone number with +263 on blur', async () => {
        renderWithRouter(<ApplicationForm user={{}} />)

        const phoneInput = screen.getByPlaceholderText(/\+263771234567/i)

        // Type phone without prefix
        fireEvent.change(phoneInput, { target: { value: '0771234567' } })
        fireEvent.blur(phoneInput)

        // Should auto-convert to +263 format
        await waitFor(() => {
            expect(phoneInput.value).toBe('+263771234567')
        })
    })

    it('should keep phone number with existing +263 prefix', async () => {
        renderWithRouter(<ApplicationForm user={{}} />)

        const phoneInput = screen.getByPlaceholderText(/\+263771234567/i)

        // Type phone with prefix
        fireEvent.change(phoneInput, { target: { value: '+263771234567' } })
        fireEvent.blur(phoneInput)

        // Should remain unchanged
        await waitFor(() => {
            expect(phoneInput.value).toBe('+263771234567')
        })
    })
})

describe('ApplicationForm - Citizenship Dropdown', () => {
    it('should display all citizenship options for farmer', () => {
        renderWithRouter(<ApplicationForm user={{}} />)

        const citizenshipSelect = screen.getAllByText(/citizenship/i)[0]
            .closest('div')
            .querySelector('select')

        // Check options exist
        expect(citizenshipSelect).toBeInTheDocument()

        const options = Array.from(citizenshipSelect.options).map(opt => opt.value)
        expect(options).toContain('Zimbabwean')
        expect(options).toContain('South African')
        expect(options).toContain('Zambian')
        expect(options).toContain('Mozambican')
        expect(options).toContain('Botswanan')
        expect(options).toContain('Other')
    })
})

describe('ApplicationForm - Conditional Spouse Section', () => {
    it('should hide spouse section when marital status is Single', async () => {
        renderWithRouter(<ApplicationForm user={{}} />)

        // Select marital status as Single
        const maritalLabel = screen.getByText(/marital status/i)
        const maritalStatusSelect = maritalLabel.nextElementSibling
        fireEvent.change(maritalStatusSelect, { target: { value: 'Single' } })

        // Fill required fields and go to step 3
        const titleLabel = screen.getByText(/Title \*/i)
        const titleSelect = titleLabel.nextElementSibling
        fireEvent.change(titleSelect, { target: { value: 'Mr' } })

        const genderLabel = screen.getByText(/Gender \*/i)
        const genderSelect = genderLabel.nextElementSibling
        fireEvent.change(genderSelect, { target: { value: 'Male' } })

        // Move to step 2
        const nextButton = screen.getByText(/next/i)
        fireEvent.click(nextButton)

        // Wait for Step 2
        await waitFor(() => {
            expect(screen.getByText(/farm details/i)).toBeInTheDocument()
        })

        // Move to step 3
        const nextButton2 = screen.getByText(/next/i)
        fireEvent.click(nextButton2)

        // Wait for step transition
        await waitFor(() => {
            // Should see "No Spouse Details Required" message
            expect(screen.getByText(/no spouse details required/i)).toBeInTheDocument()
        })
    })

    it('should show spouse section when marital status is Married', async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes('/users/profile/update/')) {
                return Promise.resolve({ data: { marital_status: 'Married' } })
            }
            return Promise.resolve({ data: [] })
        })
        renderWithRouter(<ApplicationForm user={{}} />)

        // Select marital status as Married
        const maritalLabel = screen.getByText(/marital status/i)
        const maritalStatusSelect = maritalLabel.nextElementSibling
        fireEvent.change(maritalStatusSelect, { target: { value: 'Married' } })

        // Fill required fields and go to step 3
        const titleLabel = screen.getByText(/Title \*/i)
        const titleSelect = titleLabel.nextElementSibling
        fireEvent.change(titleSelect, { target: { value: 'Mr' } })

        const genderLabel = screen.getByText(/Gender \*/i)
        const genderSelect = genderLabel.nextElementSibling
        fireEvent.change(genderSelect, { target: { value: 'Male' } })

        // Move to step 2
        const nextButton = screen.getByText(/next/i)
        fireEvent.click(nextButton)

        // Wait for Step 2
        await waitFor(() => {
            expect(screen.getByText(/farm details/i)).toBeInTheDocument()
        })

        // Move to step 3
        const nextButton2 = screen.getByText(/next/i)
        fireEvent.click(nextButton2)

        // Wait for step transition  
        await waitFor(() => {
            // Should see spouse form fields
            expect(screen.getByText(/add spouse/i)).toBeInTheDocument()
        })
    })
})

describe('ApplicationForm - Years of Service', () => {
    it('should show years of service field when Civil Servant is checked', async () => {
        renderWithRouter(<ApplicationForm user={{}} />)

        // Check Civil Servant checkbox
        const civilServantLabel = screen.getByText(/Civil Servant/i)
        fireEvent.click(civilServantLabel)

        // Years in Service field should appear
        await waitFor(() => {
            const yosLabel = screen.getByText(/Years in Service \*/i)
            expect(yosLabel).toBeInTheDocument()
            expect(yosLabel.nextElementSibling).toBeInTheDocument()
        })
    })

    it('should show years of service field when Uniformed Forces is checked', async () => {
        renderWithRouter(<ApplicationForm user={{}} />)

        // Check Uniformed Forces checkbox
        const uniformedLabel = screen.getByText(/Uniformed Forces/i)
        fireEvent.click(uniformedLabel)

        // Years of Service field should appear
        await waitFor(() => {
            const yosLabel = screen.getByText(/Years of Service \*/i)
            expect(yosLabel).toBeInTheDocument()
            expect(yosLabel.nextElementSibling).toBeInTheDocument()
        })
    })

    it('should hide years of service when neither is checked', () => {
        renderWithRouter(<ApplicationForm user={{}} />)

        // Years of Service should not be visible initially
        expect(screen.queryByText(/Years of Service \*/i)).not.toBeInTheDocument()
    })
})

describe('ApplicationForm - No Beneficiary Duplication', () => {
    it('should not show beneficiary categories in Farm Details step', async () => {
        renderWithRouter(<ApplicationForm user={{}} />)

        // Fill required fields to reach step 2
        const titleLabel = await screen.findByText(/Title \*/i)
        const titleSelect = titleLabel.nextElementSibling
        fireEvent.change(titleSelect, { target: { value: 'Mr' } })

        const genderLabel = screen.getByText(/Gender \*/i)
        const genderSelect = genderLabel.nextElementSibling
        fireEvent.change(genderSelect, { target: { value: 'Male' } })

        // Move to step 2 (Farm Details)
        const nextButton = screen.getByText(/next/i)
        fireEvent.click(nextButton)

        await waitFor(() => {
            // Farm Details step should be visible
            expect(screen.getByText(/farm details/i)).toBeInTheDocument()
        })

        // Should NOT see duplicate "Beneficiary Categories" heading in Step 2
        const beneficiaryCategoryHeadings = screen.queryAllByText(/beneficiary categories/i)
        // We should only have one in Personal Profile (Step 1), not in Farm Details (Step 2)
        expect(beneficiaryCategoryHeadings.length).toBeLessThanOrEqual(1)
    })
})
