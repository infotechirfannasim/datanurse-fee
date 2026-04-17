// ─────────────────────────────────────────────────────────────
// Raw API response shapes — exactly what the backend returns.
// Never use these directly in templates; go through CaseDetailDto.
// ─────────────────────────────────────────────────────────────

export interface RawUserRef {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
}

export interface RawHospitalRef {
    _id: string;
    code: string;
    name: string;
}

export interface RawPatient {
    _id: string;
    mrn: string;
    createdByUserId: string;
    citizenNumber?: string;
    localId?: string;
    deviceOrigin?: string;
    name: string;
    phone?: string;
    dob: string;
    bloodGroup?: string;
    gender?: string;
    weight?: string;
    country?: string;
    province?: string;
    city?: string;
    primaryPayor?: string;
    secondaryPayor?: string;
    isBirthLocationKnown?: boolean;
    syncVersion?: number;
    lastModifiedAt?: string;
    isDeleted?: boolean;
    createdAt: string;
    updatedAt: string;
}

/** Shape returned by the patient LIST endpoint */
export interface RawPatientListItem extends RawPatient {
    doctor?: {
        _id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        fullName?: string;
    };
    casesCount?: number;
}

/** Shape returned by the patient DETAIL endpoint (patient + embedded cases) */
export interface RawPatientWithCases extends RawPatient {
    cases?: RawCase[];
}

export interface RawAbnormality {
    abnormalityGroup: string;
    abnormality: string;
    name: string;
}

export interface RawDiagnosis {
    id: number;
    name: string;
    code: string;
    displayCode: string;
    isPrimary: boolean;
    category?: string;
    subsection?: string;
}

export interface RawProcedure {
    id: number;
    name: string;
    code: string;
    displayCode: string;
    isCompatible: boolean;
    category?: string;
    subsection?: string;
}

export interface RawStep5 {
    hospitalName?: string;
    admissionDate?: string;
    admittedFrom?: string;
    surgeryDate?: string;
    heightCm?: string;
    weightKg?: string;
    calculatedAge?: string;
    primaryPayor?: string;
    secondaryPayor?: string | null;
}

export interface RawStep10 {
    procedureLocation?: string;
    operationStatus?: string;
    operationType?: string;
    primarySurgeon?: string;
    secondarySurgeon?: string;
    orEntryTime?: string;
    skinIncisionStart?: string;
    skinClosure?: string;
    orExitTime?: string;
    extendedThroughMidnight?: boolean;
    endotrachealIntubation?: boolean;
    extubatedInOP?: boolean;
    reIntubated?: boolean;
    pvrMeasured?: boolean;
    priorCtOps?: string;
    priorCpbOps?: string;
    cerebralNirs?: boolean;
    somaticNirs?: boolean;
    autologousTransfusion?: boolean;
    cpbTime?: string;
    crossClampTimeCpb?: string;
    crossClampTimeNoCpb?: string;
    circulatoryArrestTime?: string;
    [key: string]: unknown;
}

export interface RawStep11 {
    hematocritFirst?: string;
    hematocritLast?: string;
    transfusionUsage?: string;
    transfusionDuringProc?: boolean;
    transfusionWithin24h?: boolean;
    transfusionAfter24h?: boolean;
    autologousTransfusion?: boolean;
    cellSaverReinfused?: boolean;
    bpDuringPackedRbc?: number;
    bpWithinPackedRbc?: number;
    bpAfterPackedRbc?: number;
    bpDuringFfp?: number;
    bpWithinFfp?: number;
    bpAfterFfp?: number;
    bpDuringFreshPlasma?: number;
    bpWithinFreshPlasma?: number;
    bpAfterFreshPlasma?: number;
    bpDuringSdp?: number;
    bpWithinSdp?: number;
    bpAfterSdp?: number;
    bpDuringIndivPlatelets?: number;
    bpWithinIndivPlatelets?: number;
    bpAfterIndivPlatelets?: number;
    bpDuringCryo?: number;
    bpWithinCryo?: number;
    bpAfterCryo?: number;
    bpDuringFwb?: number;
    bpWithinFwb?: number;
    bpAfterFwb?: number;
    bpDuringWholeBlood?: number;
    bpWithinWholeBlood?: number;
    bpAfterWholeBlood?: number;
    antifibrinolyticsIntraOp?: boolean;
    [key: string]: unknown;
}

export interface RawStep13 {
    anesPresent?: boolean;
    primAnesName?: string;
    inductionDt?: string;
    pLocTransDt?: string;
    preopMedCat?: string[];
    preopSed?: boolean;
    preopO2Sat?: string;
    pacuArrivalDt?: string;
    pacuFiO2?: string;
    pacuMechSupport?: string;
    pacuPulseOx?: string;
    pacuTempSite?: string;
    pacuPacemaker?: boolean;
    pacuPacemakerSite?: string;
    pacuPacemakerType?: string;
    pacuDemise?: boolean;
    artLine?: boolean;
    percCentPress?: boolean;
    cutdown?: boolean;
    cvpPlaced?: boolean;
    ultraGuide?: string;
    neuroMonitor?: boolean;
    tee?: boolean;
    icuTypeVent?: boolean;
    lowIntraopTemp?: string;
    airwaySite?: string;
    airwaySizeLma?: string;
    airwaySizeIntub?: string;
    cuffed?: boolean;
    indTypeInh?: boolean;
    indTypeIv?: boolean;
    indTypeIm?: boolean;
    intraopPharm?: Record<string, boolean>;
    pacuPharm?: Record<string, boolean>;
    anesAdverseEvents?: Record<string, boolean>;
    [key: string]: unknown;
}

export interface RawComplicationDetail {
    date?: string;
    notes?: string;
}

export interface RawStep14 {
    selectedComplications?: string[];
    noComplications?: boolean;
    complicationDetails?: Record<string, RawComplicationDetail>;
}

export interface RawStep15 {
    dischargeDate?: string;
    dischargeStatus?: string;
    dischargeLocation?: string;
    databaseDischargeDate?: string | null;
    databaseDischargeStatus?: string;
    readmission30Day?: string;
    readmissionDate?: string | null;
    readmissionReason?: string;
    status30Days?: string;
    verificationMethod?: string;
}

export interface RawFollowup {
    _id: string;
    caseId: string;
    patientId: string;
    doctorId?: RawUserRef;
    followupDate?: string;
    patientStatus?: string;
    causeOfDeath?: string;
    readmissionRequested?: boolean;
    readmissionDate?: string | null;
    readmissionReason?: string;
    notes?: string;
    conductedByName?: string;
    lastModifiedAt?: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface RawCase {
    _id: string;
    ownerDoctorId?: RawUserRef;
    createdByUserId?: RawUserRef;
    hospitalId?: RawHospitalRef;
    hospitalCode?: string;
    status?: string;
    teamId?: string | null;
    patientId?: RawPatient;
    patientLocalId?: string;
    patientCitizenNo?: string;
    patientMrn?: string;
    localId?: string;
    caseId?: string;
    stage?: string;
    isSoloSubmission?: boolean;
    step3Abnormalities?: {
        selectedAbnormalities?: RawAbnormality[];
        noAbnormality?: boolean;
    };
    step4ChromosomalSyndromes?: {
        selectedChromosomal?: string[];
        selectedSyndromes?: string[];
        noChromosomalAbnormality?: boolean;
        noSyndromicAbnormality?: boolean;
        otherChromosomalSelected?: boolean;
        otherSyndromeSelected?: boolean;
        otherChromosomalText?: string;
    };
    step5HospitalAdmission?: RawStep5;
    step6PreOpMeds?: { selectedPreOpFactors?: string[] };
    step7Diagnosis?: { selectedDiagnoses?: RawDiagnosis[] };
    step8Procedures?: { selectedProcedures?: RawProcedure[] };
    step9ProSpecificFactor?: { proSpecificFactor?: string | null };
    step10OperativeData?: RawStep10;
    step11BloodProducts?: RawStep11;
    step13Anesthesia?: RawStep13;
    step14Complications?: RawStep14;
    step15Discharge?: RawStep15;
    stageHistory?: unknown[];
    followups?: RawFollowup[];
    syncVersion?: number;
    deviceOrigin?: string;
    lastModifiedAt?: string;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
