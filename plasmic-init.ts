// plasmic-init.ts
import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: process.env.PLASMIC_PROJECT_ID!,    // from .env.local
      token: process.env.PLASMIC_API_TOKEN!,  // from .env.local
    },
  ],
  preview: process.env.NODE_ENV !== "production",
});
