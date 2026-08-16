export const STEP_NAMES = [
  "ACTIVE SO & FG CREATION",
  "BOM CREATION",
  "SMV UPDATE",
  "PLANT EXT & CODE CHANGE",
  "CR RELEASE",
  "PO",
];

export const STEP_ICONS = ["①", "②", "③", "④", "⑤", "⑥"];

export const OVERALL_STATUSES = [
  "COMPLETE",
  "IN_PROGRESS",
  "BLOCKED",
  "NOT_STARTED",
  "OVERDUE",
] as const;

export const STEP_STATUSES = ["DONE", "IN_PROGRESS", "PENDING", "BLOCKED"] as const;
