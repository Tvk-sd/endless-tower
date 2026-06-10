import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stone } from '../components/stone'

const meta: Meta = {
  title: 'Endless Tower / Tower Stack',
  parameters: { layout: 'centered' },
}
export default meta

const STONE_H = 208
const OVERLAP = 72
const STEP = STONE_H - OVERLAP
const PAD_TOP = 48

const tasks = [
  { id: 'id1', text: 'Buy groceries' },
  { id: 'id2', text: 'Call dentist' },
  { id: 'id3', text: 'Read book' },
  { id: 'id4', text: 'Water the plants' },
  { id: 'id5', text: 'Fix the bike' },
]

function TowerStack({ count = 3, expandedIndex = -1 }: { count?: number; expandedIndex?: number }) {
  const stones = tasks.slice(0, count)
  const towerH = PAD_TOP + STONE_H + (stones.length - 1) * STEP + 4
  const expandedId = expandedIndex >= 0 ? stones[expandedIndex]?.id : null

  return (
    <div style={{ width: 390, height: 844, background: '#F7F5F0', position: 'relative', overflow: 'hidden', fontFamily: "'IBM Plex Mono', monospace" }}>
      <div style={{ position: 'relative', width: '100%', height: towerH, marginTop: 0 }}>
        {stones.map((task, i) => (
          <div
            key={task.id}
            style={{ position: 'absolute', top: PAD_TOP + i * STEP, left: 0, right: 0, zIndex: stones.length - i, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <Stone
              id={task.id}
              text={task.text}
              createdAt={Date.now()}
              isExpanded={expandedId === task.id}
              isFaded={expandedId !== null && expandedId !== task.id}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export const TwoStones: StoryObj = {
  render: () => <TowerStack count={2} />,
}

export const ThreeStones: StoryObj = {
  render: () => <TowerStack count={3} />,
}

export const FiveStones: StoryObj = {
  render: () => <TowerStack count={5} />,
}

export const WithExpandedStone: StoryObj = {
  render: () => <TowerStack count={3} expandedIndex={1} />,
}
