import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { VariableStoneSpike } from "../components/variable-stone-spike"

const meta: Meta = {
  title: "Endless Tower / Variable Stone Spike",
  parameters: { layout: "fullscreen" },
}
export default meta

export const SideBySide: StoryObj = {
  render: () => (
    <div style={{ background: "#E8E6E1", minHeight: "100vh", padding: 24 }}>
      <VariableStoneSpike viewportScale={1} />
    </div>
  ),
}

export const NarrowViewport: StoryObj = {
  render: () => (
    <div style={{ background: "#E8E6E1", minHeight: "100vh", padding: 24 }}>
      <VariableStoneSpike viewportScale={0.85} />
    </div>
  ),
}
