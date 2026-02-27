import type { IrrigationResult } from "./api";

// NOTE:
// This file is now only used for irrigation mocks in the planner.
// Weather, advisory, and market price data are fetched from the backend APIs.

export const mockIrrigationResult: IrrigationResult = {
  waterNeeded: 2400,
  schedule: "Every 3 days, morning 6-8 AM",
  nextIrrigation: "Tomorrow, 6:00 AM",
  efficiency: 85,
};
