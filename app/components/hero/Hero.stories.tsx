import type { Meta, StoryObj } from "@storybook/react";
import { Hero } from "./DefaultHero";

const meta: Meta<typeof Hero> = { title: "Marketing/Hero", component: Hero };
export default meta;

type Story = StoryObj<typeof Hero>;
export const Default: Story = {
  args: {
    title: "Testsieger Check",
    subtitle: "Prüfe Produkte mit einem Klick",
    ctaLabel: "Jetzt starten",
  },
};
