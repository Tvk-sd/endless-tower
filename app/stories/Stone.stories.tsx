import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stone } from '../components/stone'

const meta: Meta<typeof Stone> = {
  title: 'Endless Tower / Stone',
  component: Stone,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    completionProgress: { control: { type: 'range', min: 0, max: 100, step: 1 } },
  },
}

export default meta
type Story = StoryObj<typeof Stone>

const SAMPLE_ID = 'abc123'
const CREATED_AT = Date.now()

// --- Default states ---

export const Default: Story = {
  args: {
    id: SAMPLE_ID,
    text: 'Buy groceries',
    createdAt: CREATED_AT,
  },
}

export const LongText: Story = {
  args: {
    id: 'longtext1',
    text: 'Send follow-up email to client re: feedback on wireframes',
    createdAt: CREATED_AT,
  },
}

export const ShortText: Story = {
  args: {
    id: 'short1',
    text: 'Call mom',
    createdAt: CREATED_AT,
  },
}

// --- Expanded (tapped) ---

export const Expanded: Story = {
  args: {
    id: SAMPLE_ID,
    text: 'Buy groceries',
    createdAt: CREATED_AT,
    isExpanded: true,
  },
}

export const ExpandedLongText: Story = {
  args: {
    id: 'longtext1',
    text: 'Send follow-up email to client re: feedback on wireframes',
    createdAt: CREATED_AT,
    isExpanded: true,
  },
}

// --- Faded (another stone is selected) ---

export const Faded: Story = {
  args: {
    id: SAMPLE_ID,
    text: 'Buy groceries',
    createdAt: CREATED_AT,
    isFaded: true,
  },
}

// --- Hold to complete (in progress) ---

export const Completing25: Story = {
  name: 'Completing 25%',
  args: {
    id: SAMPLE_ID,
    text: 'Buy groceries',
    createdAt: CREATED_AT,
    isCompleting: true,
    completionProgress: 25,
  },
}

export const Completing75: Story = {
  name: 'Completing 75%',
  args: {
    id: SAMPLE_ID,
    text: 'Buy groceries',
    createdAt: CREATED_AT,
    isCompleting: true,
    completionProgress: 75,
  },
}

// --- Completed ---

export const Completed: Story = {
  args: {
    id: SAMPLE_ID,
    text: 'Buy groceries',
    createdAt: CREATED_AT,
    isCompleted: true,
  },
}

export const CompletedExpanded: Story = {
  args: {
    id: SAMPLE_ID,
    text: 'Buy groceries',
    createdAt: CREATED_AT,
    isCompleted: true,
    isExpanded: true,
  },
}

// --- Interactive playground ---

export const Playground: Story = {
  args: {
    id: SAMPLE_ID,
    text: 'Edit me in the controls below',
    createdAt: CREATED_AT,
    isExpanded: false,
    isFaded: false,
    isCompleting: false,
    completionProgress: 0,
    isCompleted: false,
  },
}
