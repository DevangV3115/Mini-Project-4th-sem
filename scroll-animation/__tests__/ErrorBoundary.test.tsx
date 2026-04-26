import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../src/components/ErrorBoundary'

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child Content</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })

  // Testing the error state would require mocking console.error
  // to avoid noisy test output, which we'll skip for this basic test
})
