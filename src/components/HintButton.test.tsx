import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HintButton from './HintButton'

describe('HintButton', () => {
  it('toggles the popover on click', async () => {
    const user = userEvent.setup()
    render(<HintButton text="Some explanation" label="Section hint" />)

    const trigger = screen.getByRole('button', { name: /section hint/i })
    expect(screen.queryByText('Some explanation')).not.toBeInTheDocument()

    await user.click(trigger)
    expect(screen.getByText('Some explanation')).toBeInTheDocument()

    await user.click(trigger)
    expect(screen.queryByText('Some explanation')).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(<HintButton text="Some explanation" label="Section hint" />)

    await user.click(screen.getByRole('button', { name: /section hint/i }))
    expect(screen.getByText('Some explanation')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByText('Some explanation')).not.toBeInTheDocument()
  })
})
