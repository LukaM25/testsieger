// app/visual/page.tsx
import { PLASMIC } from "@/plasmic-init";
import { PlasmicRootProvider, PlasmicComponent } from "@plasmicapp/loader-nextjs";

// Name must match your Plasmic page/section (e.g., "Homepage")
export const revalidate = 60; // ISR: refresh every minute in prod

export default async function Visual() {
  const componentName = "Homepage"; // or "Hero"
  const plasmicData = await PLASMIC.fetchComponentData(componentName);
  if (!plasmicData) return null;

  return (
    <PlasmicRootProvider loader={PLASMIC} prefetchedData={plasmicData}>
      <PlasmicComponent component={componentName} />
    </PlasmicRootProvider>
  );
}
