"use client";

import React from "react";
import { TwentyFirstToolbar } from "@21st-extension/toolbar-next";
import { ReactPlugin } from "@21st-extension/react";

export default function ToolbarClient() {
  if (process.env.NODE_ENV !== "development") return null;

  return <TwentyFirstToolbar config={{ plugins: [ReactPlugin] }} />;
}
