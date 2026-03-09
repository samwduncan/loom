---
created: 2026-03-02T20:28:27.414Z
title: Fix model selector showing wrong model
area: ui
files:
  - src/components/QuickSettingsPanel.jsx
---

## Problem

The model selector dropdown is broken in two ways:
1. No model selector is available/visible to the user
2. The dropdown shows "Sonnet" regardless of what model is actually being used

The user should be able to see and select which model is active, and the displayed model should reflect reality.

## Solution

TBD — investigate the model selector component, check if it's hidden or missing from the UI, and fix the display logic to show the actual active model.
