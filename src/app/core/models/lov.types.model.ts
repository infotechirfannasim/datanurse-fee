// ─────────────────────────────────────────────────────────────
// lov.types.ts
//
// Every key in LovStore is IDENTICAL to the string the API uses
// in response.body.data['<key>'].  No aliasing — the API key IS
// the LovStore key IS the argument you pass to lovName().
// ─────────────────────────────────────────────────────────────

export interface LovItem {
    _id: string;
    type: string;
    code: string;
    name: string;
    description?: string;
    status: 'active' | 'inactive';
    sortOrder: number;
    parents: { type: string; code: string; isPrimary: boolean }[];
    isActive: boolean;
    isDeleted: boolean;
    dialCode?: string;
    isoCode?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * One key per SEED_ORDER entry.
 * All optional — store may be partially loaded; resolver degrades gracefully.
 *
 * Inline comments show which raw case field each LOV resolves.
 */
export interface LovStore {
    // ── geography ──────────────────────────────────────────────
    country?: LovItem[];            // patientId.country
    province?: LovItem[];           // patientId.province
    district?: LovItem[];           // patientId.district (if present)
    city?: LovItem[];               // patientId.city

    // ── patient demographics ───────────────────────────────────
    gender?: LovItem[];             // patientId.gender
    bloodGroup?: LovItem[];         // patientId.bloodGroup
    language?: LovItem[];
    maritalStatus?: LovItem[];
    religion?: LovItem[];
    deliveryMethod?: LovItem[];

    // ── admin / workflow ───────────────────────────────────────
    status?: LovItem[];             // case.status
    priority?: LovItem[];
    department?: LovItem[];
    jobTitle?: LovItem[];
    specialty?: LovItem[];
    hospitals?: LovItem[];          // hospitalId.code

    // ── clinical classification ────────────────────────────────
    diagnosisGroup?: LovItem[];
    procedureGroup?: LovItem[];
    abnormalityGroup?: LovItem[];   // step3.selectedAbnormalities[].abnormalityGroup
    complicationGroup?: LovItem[];
    chromosomalAbnormality?: LovItem[];  // step4.selectedChromosomal[]
    syndrome?: LovItem[];                // step4.selectedSyndromes[]
    symptom?: LovItem[];
    investigation?: LovItem[];
    medication?: LovItem[];
    preOpFactor?: LovItem[];        // step6.selectedPreOpFactors[]

    // ── diagnosis / procedure / abnormality / complication ─────
    diagnosisSub?: LovItem[];
    abnormality?: LovItem[];        // step3.selectedAbnormalities[].abnormality
    complication?: LovItem[];       // step14.selectedComplications[]
    diagnosis?: LovItem[];          // step7.selectedDiagnoses[].code  (usually embedded name)
    procedure?: LovItem[];          // step8.selectedProcedures[].code (usually embedded name)

    // ── operative ─────────────────────────────────────────────
    odStatus?: LovItem[];           // step10.operationStatus  ← "E11", "E12" etc.
    reOperationStatus?: LovItem[];
    procedureLocation?: LovItem[];  // step10.procedureLocation  ← "CL2" etc.
    operationType?: LovItem[];      // step10.operationType       ← "IC" etc.
    funding?: LovItem[];            // step5/patientId.primaryPayor / secondaryPayor

    // ── anesthesia drugs & routes ──────────────────────────────
    anesthesiaMed?: LovItem[];
    sedationDrug?: LovItem[];       // step13.preopSedDrugs  Record keys
    sedationRoute?: LovItem[];      // step13.preopSedRoute  Record keys
    inhalationAgent?: LovItem[];    // step13.indTypeInhAgents Record keys
    ivInductionAgent?: LovItem[];   // step13.indTypeIvAgents  Record keys
    imInductionAgent?: LovItem[];   // step13.indTypeImAgents  Record keys
    intraopMed?: LovItem[];         // step13.intraopPharm     Record keys
    pacuMed?: LovItem[];            // step13.pacuPharm        Record keys
    regionalAnesthesiaSite?: LovItem[];  // step13.regAnesSite Record keys
    regionalAnesthesiaDrug?: LovItem[];  // step13.regAnesDrug Record keys
    adverseEvent?: LovItem[];            // step13.anesAdverseEvents Record keys

    // ── monitoring / lines ─────────────────────────────────────
    artLineType?: LovItem[];        // step13.artLineType      Record keys
    cutdownType?: LovItem[];        // step13.cutdownType      Record keys
    centralLineLocation?: LovItem[];// step13.percCentPressLoc Record keys
    neuroMonitoringType?: LovItem[];// step13.neuroMonitorType Record keys
    temperatureSite?: LovItem[];    // step13.intraopTempSite  Record keys
    ultrasoundGuidance?: LovItem[]; // step13.ultraGuide (single string)

    // ── airway ─────────────────────────────────────────────────
    airwayType?: LovItem[];
    airwaySite?: LovItem[];         // step13.airwaySite
    airwaySizeLma?: LovItem[];      // step13.airwaySizeLma
    airwaySizeIntubation?: LovItem[];// step13.airwaySizeIntub
    endobronchialIsolationMethod?: LovItem[];

    // ── PACU ───────────────────────────────────────────────────
    pacuTemperatureSite?: LovItem[];// step13.pacuTempSite
    pacuPacemakerSite?: LovItem[];  // step13.pacuPacemakerSite
    pacuPacemakerType?: LovItem[];  // step13.pacuPacemakerType
    pacuDisposition?: LovItem[];    // step13.pacuDisposition  Record keys
    pacuMechanicalSupport?: LovItem[];// step13.pacuMechSupport

    // ── blood products ─────────────────────────────────────────
    bloodProduct?: LovItem[];
    antifibrinolyticIntraOp?: LovItem[];
    procoagulantIntraOp?: LovItem[];
    pocCoagulationTest?: LovItem[];

    // ── discharge / follow-up ──────────────────────────────────
    vadDischargeStatus?: LovItem[]; // step15.dischargeStatus / followup.patientStatus
    verificationMethod?: LovItem[]; // step15.verificationMethod

    // ── CHSS / VAD / IMA / Valve ───────────────────────────────
    chssEligibility?: LovItem[];
    vadOption?: LovItem[];
    vadIndication?: LovItem[];
    vadExplantReason?: LovItem[];
    vadImplantType?: LovItem[];
    vadComplication?: LovItem[];
    vadDeviceProduct?: LovItem[];
    imaOption?: LovItem[];
    valveExplantType?: LovItem[];
    valveLocation?: LovItem[];
    valveImplantType?: LovItem[];
    valveMaterial?: LovItem[];

    // ── misc ───────────────────────────────────────────────────
    yesNo?: LovItem[];

    // index signature — lets lovName() accept any string key safely
    [key: string]: LovItem[] | undefined;
}

// ─────────────────────────────────────────────────────────────
// Resolver utilities
// ─────────────────────────────────────────────────────────────

/**
 * Resolves one code → display name.
 *
 * Fallback chain:
 *   1. LOV match found          → item.name
 *   2. LOV array missing/empty  → raw code   (graceful — LOV not loaded yet)
 *   3. code is null/undefined   → fallback   (default '—')
 */
export function lovName(
    store: LovStore,
    type: keyof LovStore,
    code: string | null | undefined,
    fallback = '—'
): string {
    if (code === null || code === undefined || String(code).trim() === '') return fallback;
    const list = store[type];
    if (!list?.length) return code;    // LOV not loaded → show raw code, not a crash
    const match = list.find(
        (i) => i.code === code || i.code.toLowerCase() === code.toLowerCase()
    );
    return match?.name ?? code;        // unknown code → show raw code, not blank
}

/**
 * Resolves an array of codes to their names.
 */
export function lovNames(
    store: LovStore,
    type: keyof LovStore,
    codes: string[] | null | undefined
): string[] {
    if (!codes?.length) return [];
    return codes.map((c) => lovName(store, type, c, c));
}

/**
 * Flattens a Record<string, boolean> to resolved display names.
 * Only true entries are included; the sentinel 'None'/'none' is stripped.
 *
 * Used for step13 fields like intraopPharm, pacuPharm, anesAdverseEvents, etc.
 */
export function lovKeysFromRecord(
    store: LovStore,
    type: keyof LovStore,
    record: Record<string, boolean> | null | undefined
): string[] {
    if (!record) return [];
    return Object.entries(record)
        .filter(([k, v]) => v === true && k.toLowerCase() !== 'none')
        .map(([k]) => lovName(store, type, k, k));
}
