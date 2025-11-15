"use client";

import dynamic from "next/dynamic";

// Toolbar is client-side only, so we keep ssr: false here in a client file
const TwentyFirstToolbar = dynamic(
  () => import("@21st-extension/toolbar-next").then((m) => m.TwentyFirstToolbar),
  { ssr: false }
);

// ReactPlugin is only used in development
let ReactPlugin: any = undefined;

if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line unicorn/prefer-module, @typescript-eslint/no-var-requires
  ReactPlugin = require("@21st-extension/react").ReactPlugin;
}

export function DevToolbarClient() {
  return (
    <TwentyFirstToolbar
      config={{
        plugins: ReactPlugin ? [ReactPlugin] : [],
      }}
    />
  );
}
