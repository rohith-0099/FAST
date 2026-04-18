# FAST Project Memory

This file logs all professional decisions, architectural changes, and logic updates for the FAST (Fuel Aware Smart Travel) application.

## 2026-04-18: Project Overhaul & Feature Expansion

### Objective
- Modernize the UI with a professional "Glassmorphism" aesthetic.
- Add advanced features: CO2 tracking, Multi-stop routing, and Vehicle Comparison.
- Reach 50+ logical commits to demonstrate professional development workflow.

### Architectural Decisions
1. **CO2 Tracking**: Added constants to `fuel_estimator.py` based on standard fuel emission factors (Petrol: ~2.31 kg/L, Diesel: ~2.68 kg/L).
2. **Design System**: Switched to a unified Emerald/Midnight theme using CSS variables for consistency.
3. **Sidebar Navigation**: Decoupled navigation from the main page to improve UX and scalability.

### Commit History (Abbreviated)
1. **Commit 1**: Initialize `memory.md` and document project overhaul strategy.
