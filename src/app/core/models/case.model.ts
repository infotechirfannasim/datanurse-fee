// ─────────────────────────────────────────────────────────────
// CaseDetailDto — display-ready, template-safe DTO.
//
// Rules:
//   • Every string field is either a resolved value or '—' (never null/undefined)
//   • Every boolean flag is a real boolean (never undefined)
//   • Every array is always an array (never null/undefined)
//   • LOV codes are resolved to their display names
//   • Dates remain as ISO strings so Angular's date pipe can format them;
//     undefined dates are null (date pipe handles null gracefully)
//   • Each major step gets a `filled: boolean` flag so templates can show
//     "Section not filled" without checking multiple nested fields
// ─────────────────────────────────────────────────────────────

// ── Shared primitives ─────────────────────────────────────────

export type DisplayDate = string | null; // ISO string or null

export interface DisplayTag {
  code: string;
  name: string;   // LOV-resolved
}

export interface DisplayDiagnosis {
  id: number;
  code: string;
  displayCode: string;
  name: string;
  isPrimary: boolean;
  category: string;
  subsection: string;
}

export interface DisplayProcedure {
  id: number;
  code: string;
  displayCode: string;
  name: string;
  isCompatible: boolean;
  category: string;
  subsection: string;
}

export interface DisplayBloodProductRow {
  label: string;
  during: number;
  within24h: number;
  after24h: number;
}

export interface DisplayComplication {
  key: string;
  label: string;
  date: DisplayDate;
  notes: string;
}

export interface DisplayFollowup {
  id: string;
  followupDate: DisplayDate;
  patientStatus: string;         // LOV-resolved
  causeOfDeath: string;
  readmissionRequested: boolean;
  readmissionDate: DisplayDate;
  readmissionReason: string;
  conductedByName: string;
  notes: string;
}

// ── OR Timeline ───────────────────────────────────────────────

export interface OrTimelineItem {
  time: string;
  label: string;
  isExit: boolean;
}

// ── Section DTOs ──────────────────────────────────────────────

export interface PatientInfoDto {
  filled: boolean;
  mrn: string;
  citizenNumber: string;
  name: string;
  gender: string;          // LOV-resolved
  dob: DisplayDate;
  bloodGroup: string;      // LOV-resolved
  phone: string;
  primaryPayor: string;    // LOV-resolved
  secondaryPayor: string;
  country: string;         // LOV-resolved
  province: string;        // LOV-resolved
  city: string;            // LOV-resolved
  location: string;        // pre-built "City, Province, Country"
}

export interface HospitalAdmissionDto {
  filled: boolean;
  hospitalName: string;
  admissionDate: DisplayDate;
  surgeryDate: DisplayDate;
  admittedFrom: string;    // LOV-resolved
  heightCm: string;
  weightKg: string;
  primaryPayor: string;    // LOV-resolved
  secondaryPayor: string;
}

export interface AbnormalitiesDto {
  filled: boolean;
  noAbnormality: boolean;
  items: DisplayTag[];
}

export interface ChromosomalDto {
  filled: boolean;
  noChromosomal: boolean;
  noSyndromic: boolean;
  chromosomal: DisplayTag[];
  syndromes: DisplayTag[];
}

export interface PreOpFactorsDto {
  filled: boolean;
  items: DisplayTag[];
}

export interface DiagnosesDto {
  filled: boolean;
  items: DisplayDiagnosis[];
}

export interface ProceduresDto {
  filled: boolean;
  items: DisplayProcedure[];
}

export interface OperativeDataDto {
  filled: boolean;
  operationStatus: string;    // LOV-resolved
  operationStatusCode: string;
  operationType: string;      // LOV-resolved
  procedureLocation: string;  // LOV-resolved
  primarySurgeon: string;
  secondarySurgeon: string;
  priorCtOps: string;
  priorCpbOps: string;
  cpbTime: string;
  crossClampTime: string;
  circulatoryArrestTime: string;
  cerebralNirs: boolean;
  somaticNirs: boolean;
  pvrMeasured: boolean;
  autologousTransfusion: boolean;
  extendedThroughMidnight: boolean;
  endotrachealIntubation: boolean;
  extubatedInOR: boolean;
  reIntubated: boolean;
  timeline: OrTimelineItem[];
}

export interface BloodProductsDto {
  filled: boolean;
  transfusionUsage: string;
  hematocritFirst: string;
  hematocritLast: string;
  transfusionDuringProc: boolean;
  transfusionWithin24h: boolean;
  transfusionAfter24h: boolean;
  autologousTransfusion: boolean;
  cellSaverReinfused: boolean;
  productRows: DisplayBloodProductRow[];  // only non-zero rows
}

export interface AnesthesiaDto {
  filled: boolean;
  primaryAnesthesiologist: string;
  preopMedCategories: string;
  preopSedation: boolean;
  inductionDateTime: DisplayDate;
  patientLocationTransfer: DisplayDate;
  artLine: boolean;
  centralPressureLine: boolean;
  ultrasoundGuidance: string;
  neuroMonitor: boolean;
  tee: boolean;
  cutdown: boolean;
  cvpPlaced: boolean;
  icuTypeVent: boolean;
  lowIntraopTemp: string;
  airwaySite: string;
  airwaySizeLma: string;
  airwaySizeIntub: string;
  cuffed: boolean;
  intraopPharm: string[];
  pacuPharm: string[];
  adverseEvents: string[];
  pacuArrivalDateTime: DisplayDate;
  pacuFiO2: string;
  pacuMechSupport: string;
  pacuPulseOx: string;
  pacuTempSite: string;
  pacuPacemaker: boolean;
  pacuPacemakerSite: string;
  pacuPacemakerType: string;
  pacuDemise: boolean;
}

export interface ComplicationsDto {
  filled: boolean;
  noComplications: boolean;
  items: DisplayComplication[];
}

export interface DischargeDto {
  filled: boolean;
  dischargeStatus: string;    // LOV-resolved
  dischargeStatusCode: string;
  dischargeDate: DisplayDate;
  dischargeLocation: string;  // LOV-resolved
  databaseDischargeStatus: string;
  databaseDischargeDate: DisplayDate;
  readmission30Day: string;
  readmissionDate: DisplayDate;
  readmissionReason: string;
  status30Days: string;
  verificationMethod: string;
}

// ── Top-level CaseDetailDto ───────────────────────────────────

export interface CaseMetaDto {
  id: string;
  localId: string;
  status: string;
  stage: string;
  isSoloSubmission: boolean;
  hospitalName: string;
  hospitalCode: string;
  ownerDoctor: string;
  ownerDoctorId: string;   // raw _id — needed for followup payload
  createdBy: string;
  createdAt: DisplayDate;
}

export interface CaseDetailDto {
  meta: CaseMetaDto;
  patient: PatientInfoDto;
  hospitalAdmission: HospitalAdmissionDto;
  abnormalities: AbnormalitiesDto;
  chromosomal: ChromosomalDto;
  preOpFactors: PreOpFactorsDto;
  diagnoses: DiagnosesDto;
  procedures: ProceduresDto;
  operativeData: OperativeDataDto;
  bloodProducts: BloodProductsDto;
  anesthesia: AnesthesiaDto;
  complications: ComplicationsDto;
  discharge: DischargeDto;
  followups: DisplayFollowup[];
}

// ─────────────────────────────────────────────────────────────
// CaseListItemDto — lean shape for table rows.
//
// Matches the actual list API response which only includes:
// identity, ownerDoctorId, hospitalId, patientId (partial),
// stage, status, step7Diagnosis, step8Procedures, timestamps.
//
// Rule: { code, label } chips for every status so the template
// binds [ngClass]="chip.code" and renders {{ chip.label }}
// without any helper calls.
// ─────────────────────────────────────────────────────────────

export interface StatusChip {
  code: string;   // raw value  — for [ngClass]
  label: string;  // resolved   — for display text
}

export interface OperationStatusChip {
  code: string;   // raw value  — for [ngClass]
  label: string;  // resolved   — for display text
}

export interface ListDiagnosisSummary {
  primaryName: string;       // name of isPrimary=true diagnosis, else first, else '—'
  primaryCode: string;       // its displayCode
  additionalCount: number;   // remaining diagnoses beyond the first shown
}

export interface ListProcedureSummary {
  primaryName: string;
  primaryCode: string;
  additionalCount: number;
}

export interface CaseListItemDto {
  // ── identity ────────────────────────────────────────────────
  id: string;
  localId: string;

  // ── patient (partial — only what list API returns) ──────────
  patientName: string;
  patientMrn: string;
  patientCitizenNumber: string;
  patientGender: string;       // LOV-resolved
  patientGenderCode: string;   // raw  — for icon/class binding
  patientDob: DisplayDate;
  patientAgeLabel: string;     // e.g. "3y 2m" | "5 months" | "0 days" | "—"
  patientBloodGroup: string;   // LOV-resolved
  operationStatus: OperationStatusChip;

  // ── hospital ─────────────────────────────────────────────────
  hospitalName: string;
  hospitalCode: string;

  // ── workflow ─────────────────────────────────────────────────
  stage: string;               // raw stage code
  stageLabel: string;          // capitalised for display
  status: StatusChip;          // case.status
  followups: boolean;
  surgeryDate: string;
  operationType: string;
  isSoloSubmission: boolean;
  teamId: string | null;       // null = solo; string = team case

  // ── people ───────────────────────────────────────────────────
  ownerDoctor: string;         // "Dr. Affan Qaiser"

  // ── clinical summary ─────────────────────────────────────────
  diagnosis: ListDiagnosisSummary;
  procedure: ListProcedureSummary;

  // ── timestamps ───────────────────────────────────────────────
  createdAt: DisplayDate;
  lastModifiedAt: DisplayDate;

  // ── pre-built search string ──────────────────────────────────
  // Concatenation of all text fields lowercased.
  // Use: items.filter(i => i._search.includes(term))
  _search: string;
}

// ─────────────────────────────────────────────────────────────
// Patient DTOs
//
// PatientListItemDto  — one row in the patients table
// PatientDetailDto    — patient profile page with cases array
//
// Reuses CaseListItemDto for each embedded case so the patient
// detail page renders case rows with zero extra mapping logic.
// ─────────────────────────────────────────────────────────────

export interface PatientListItemDto {
  // ── identity ─────────────────────────────────────────────
  id: string;
  mrn: string;
  citizenNumber: string;

  // ── demographics ─────────────────────────────────────────
  name: string;
  gender: string;        // LOV-resolved
  genderCode: string;    // raw — for icon / class binding
  dob: DisplayDate;
  ageLabel: string;      // "7 years" | "3m 5d" | "—"
  bloodGroup: string;    // LOV-resolved

  // ── location (LOV-resolved) ───────────────────────────────
  country: string;
  province: string;
  city: string;
  location: string;      // "Raiwind, Punjab, Pakistan"

  // ── assigned doctor ───────────────────────────────────────
  doctorName: string;    // "Zaka Ul Hassan"
  doctorId: string;      // raw _id

  // ── summary ──────────────────────────────────────────────
  casesCount: number;

  // ── timestamps ───────────────────────────────────────────
  createdAt: DisplayDate;
  lastModifiedAt: DisplayDate;

  // ── client-side search string ─────────────────────────────
  _search: string;
}

export interface PatientDetailDto {
  // ── all patient fields (same as list item, fully resolved) ─
  id: string;
  mrn: string;
  citizenNumber: string;
  name: string;
  gender: string;
  genderCode: string;
  dob: DisplayDate;
  ageLabel: string;
  bloodGroup: string;
  phone: string;
  weight: string;
  primaryPayor: string;   // LOV-resolved
  secondaryPayor: string; // LOV-resolved
  country: string;
  province: string;
  city: string;
  location: string;

  // ── assigned doctor ───────────────────────────────────────
  doctorName: string;
  doctorId: string;

  // ── embedded cases — ready to render in a case list table ─
  // Each item is a full CaseListItemDto so the patient detail
  // page reuses the exact same case-row template/component.
  cases: CaseListItemDto[];

  // ── timestamps ───────────────────────────────────────────
  createdAt: DisplayDate;
  lastModifiedAt: DisplayDate;
}
