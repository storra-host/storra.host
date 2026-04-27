export type LegalTocSection = { id: string; label: string };

export const TOS_SECTIONS: LegalTocSection[] = [
  { id: "service", label: "Service" },
  { id: "user-responsibility", label: "User responsibility" },
  { id: "data-storage", label: "Data and storage" },
  { id: "limits", label: "Limits" },
  { id: "availability", label: "Availability" },
  { id: "enforcement", label: "Enforcement" },
  { id: "disclaimer", label: "Disclaimer" },
  { id: "acceptance", label: "Acceptance" },
];

export const AUP_SECTIONS: LegalTocSection[] = [
  { id: "general-use", label: "General use" },
  { id: "abuse", label: "Abuse" },
  { id: "content-control", label: "Content control" },
  { id: "no-guarantees", label: "No guarantees" },
  { id: "aup-enforcement", label: "Enforcement" },
];
