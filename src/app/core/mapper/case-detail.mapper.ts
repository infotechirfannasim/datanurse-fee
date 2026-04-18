import {lovName, LovStore} from './../models/lov.types.model';
import {
    RawCase,
    RawFollowup,
    RawPatientListItem,
    RawPatientWithCases,
    RawStep11,
} from './../models/case-raw-type.model';
import {
    AbnormalitiesDto,
    AnesthesiaDto,
    BloodProductsDto,
    CaseDetailDto,
    CaseListItemDto,
    CaseMetaDto,
    ChromosomalDto,
    ComplicationsDto,
    DiagnosesDto,
    DischargeDto,
    DisplayBloodProductRow,
    DisplayComplication,
    DisplayDate,
    DisplayFollowup,
    DisplayTag,
    HospitalAdmissionDto,
    ListDiagnosisSummary,
    ListProcedureSummary,
    OperativeDataDto,
    OrTimelineItem, PatientDetailDto,
    PatientInfoDto, PatientListItemDto,
    PreOpFactorsDto,
    ProceduresDto,
    StatusChip,
} from './../models/case.model';


// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const DASH = '—';

/** Coerce to string, return DASH if blank/null/undefined */
function str(v: unknown): string {
    if (v === null || v === undefined) return DASH;
    const s = String(v).trim();
    return s === '' ? DASH : s;
}

/** Return ISO string or null */
function date(v: string | null | undefined): DisplayDate {
    return v ?? null;
}

/** Boolean with safe fallback */
function bool(v: boolean | undefined | null): boolean {
    return v === true;
}

/**
 * Flattens a Record<string, boolean> to an array of its true keys,
 * excluding the sentinel 'None' / 'none' key.
 */
function trueKeys(record: Record<string, boolean> | undefined | null): string[] {
    if (!record) return [];
    return Object.entries(record)
        .filter(([k, v]) => v === true && k !== 'None' && k !== 'none')
        .map(([k]) => k);
}

/** Doctor full name from first/last */
function doctorName(ref?: { firstName?: string; lastName?: string } | null): string {
    if (!ref) return DASH;
    const full = [ref.firstName, ref.lastName].filter(Boolean).join(' ').trim();
    return full || DASH;
}

// ─────────────────────────────────────────────────────────────
// Section mappers
// ─────────────────────────────────────────────────────────────

function mapMeta(raw: RawCase): CaseMetaDto {
    return {
        id:              raw._id ?? '',
        localId:         str(raw.localId ?? raw.caseId),
        status:          str(raw.status),
        stage:           str(raw.stage),
        isSoloSubmission: bool(raw.isSoloSubmission),
        hospitalName:    raw.hospitalId?.name ?? DASH,
        hospitalCode:    raw.hospitalId?.code ?? raw.hospitalCode ?? DASH,
        ownerDoctor:     doctorName(raw.ownerDoctorId),
        ownerDoctorId:   raw.ownerDoctorId?._id ?? '',
        createdBy:       doctorName(raw.createdByUserId),
        createdAt:       date(raw.createdAt),
    };
}

function mapPatient(raw: RawCase, lovs: LovStore): PatientInfoDto {
    const p = raw.patientId;
    if (!p) {
        return {
            filled: false,
            mrn: str(raw.patientMrn),
            citizenNumber: DASH, name: DASH, gender: DASH, dob: null,
            bloodGroup: DASH, phone: DASH, primaryPayor: DASH, secondaryPayor: DASH,
            country: DASH, province: DASH, city: DASH, location: DASH,
        };
    }

    const countryName  = lovName(lovs, 'country',  p.country);
    const provinceName = lovName(lovs, 'province', p.province);
    const cityName     = lovName(lovs, 'city',     p.city);

    const locationParts = [cityName, provinceName, countryName].filter(
        (s) => s && s !== DASH
    );

    return {
        filled: true,
        mrn:            str(raw.patientMrn),
        citizenNumber:  str(p.citizenNumber),
        name:           str(p.name),
        gender:         lovName(lovs, 'gender', p.gender),
        dob:            date(p.dob),
        bloodGroup:     lovName(lovs, 'bloodGroup', p.bloodGroup),
        phone:          str(p.phone),
        primaryPayor:   lovName(lovs, 'funding', p.primaryPayor),
        secondaryPayor: lovName(lovs, 'funding', p.secondaryPayor),
        country:        countryName,
        province:       provinceName,
        city:           cityName,
        location:       locationParts.length ? locationParts.join(', ') : DASH,
    };
}

function mapHospitalAdmission(raw: RawCase, lovs: LovStore): HospitalAdmissionDto {
    const s = raw.step5HospitalAdmission;
    if (!s) {
        return {
            filled: false,
            hospitalName: raw.hospitalId?.name ?? DASH,
            admissionDate: null, surgeryDate: null, admittedFrom: DASH,
            heightCm: DASH, weightKg: DASH, primaryPayor: DASH, secondaryPayor: DASH,
        };
    }
    return {
        filled: true,
        hospitalName:   str(s.hospitalName ?? raw.hospitalId?.name),
        admissionDate:  date(s.admissionDate),
        surgeryDate:    date(s.surgeryDate),
        admittedFrom:   lovName(lovs, 'status', s.admittedFrom),
        heightCm:       s.heightCm ? `${s.heightCm} cm` : DASH,
        weightKg:       s.weightKg ? `${s.weightKg} kg` : DASH,
        primaryPayor:   lovName(lovs, 'funding', s.primaryPayor),
        secondaryPayor: lovName(lovs, 'funding', s.secondaryPayor),
    };
}

function mapAbnormalities(raw: RawCase): AbnormalitiesDto {
    const s = raw.step3Abnormalities;
    if (!s) return { filled: false, noAbnormality: false, items: [] };
    const items: DisplayTag[] = (s.selectedAbnormalities ?? []).map((a) => ({
        code: a.abnormality,
        name: a.name || a.abnormality,
    }));
    return {
        filled: items.length > 0 || s.noAbnormality === true,
        noAbnormality: bool(s.noAbnormality),
        items,
    };
}

function mapChromosomal(raw: RawCase, lovs: LovStore): ChromosomalDto {
    const s = raw.step4ChromosomalSyndromes;
    if (!s) return { filled: false, noChromosomal: false, noSyndromic: false, chromosomal: [], syndromes: [] };

    const chromosomal: DisplayTag[] = (s.selectedChromosomal ?? []).map((c) => ({
        code: c,
        name: lovName(lovs, 'chromosomalAbnormality', c, c),
    }));
    const syndromes: DisplayTag[] = (s.selectedSyndromes ?? []).map((c) => ({
        code: c,
        name: lovName(lovs, 'syndrome', c, c),
    }));

    return {
        filled: chromosomal.length > 0 || syndromes.length > 0
            || s.noChromosomalAbnormality === true || s.noSyndromicAbnormality === true,
        noChromosomal: bool(s.noChromosomalAbnormality),
        noSyndromic:   bool(s.noSyndromicAbnormality),
        chromosomal,
        syndromes,
    };
}

function mapPreOpFactors(raw: RawCase, lovs: LovStore): PreOpFactorsDto {
    const codes = raw.step6PreOpMeds?.selectedPreOpFactors ?? [];
    const items: DisplayTag[] = codes.map((c) => ({
        code: c,
        name: lovName(lovs, 'preOpFactor', c, c),
    }));
    return { filled: items.length > 0, items };
}

function mapDiagnoses(raw: RawCase): DiagnosesDto {
    const items = (raw.step7Diagnosis?.selectedDiagnoses ?? []).map((d) => ({
        id:          d.id,
        code:        d.code,
        displayCode: d.displayCode,
        name:        d.name,
        isPrimary:   bool(d.isPrimary),
        category:    str(d.category),
        subsection:  str(d.subsection),
    }));
    return { filled: items.length > 0, items };
}

function mapProcedures(raw: RawCase): ProceduresDto {
    const items = (raw.step8Procedures?.selectedProcedures ?? []).map((p) => ({
        id:          p.id,
        code:        p.code,
        displayCode: p.displayCode,
        name:        p.name,
        isCompatible: bool(p.isCompatible),
        category:    str(p.category),
        subsection:  str(p.subsection),
    }));
    return { filled: items.length > 0, items };
}

function mapOperativeData(raw: RawCase, lovs: LovStore): OperativeDataDto {
    const s = raw.step10OperativeData;
    if (!s) {
        return {
            filled: false,
            operationStatus: DASH, operationStatusCode: '',
            operationType: DASH, procedureLocation: DASH,
            primarySurgeon: DASH, secondarySurgeon: DASH,
            priorCtOps: DASH, priorCpbOps: DASH,
            cpbTime: DASH, crossClampTime: DASH, circulatoryArrestTime: DASH,
            cerebralNirs: false, somaticNirs: false, pvrMeasured: false,
            autologousTransfusion: false, extendedThroughMidnight: false,
            endotrachealIntubation: false, extubatedInOR: false, reIntubated: false,
            timeline: [],
        };
    }

    const timeline: OrTimelineItem[] = [];
    if (s.orEntryTime)        timeline.push({ time: s.orEntryTime,        label: 'OR Entry',       isExit: false });
    if (s.skinIncisionStart)  timeline.push({ time: s.skinIncisionStart,  label: 'Skin Incision',  isExit: false });
    if (s.skinClosure)        timeline.push({ time: s.skinClosure,        label: 'Skin Closure',   isExit: false });
    if (s.orExitTime)         timeline.push({ time: s.orExitTime,         label: 'OR Exit',        isExit: true  });

    return {
        filled: true,
        operationStatus:      lovName(lovs, 'odStatus', s.operationStatus),
        operationStatusCode:  str(s.operationStatus),
        operationType:        lovName(lovs, 'operationType',   s.operationType),
        procedureLocation:    lovName(lovs, 'procedureLocation', s.procedureLocation),
        primarySurgeon:       str(s.primarySurgeon),
        secondarySurgeon:     s.secondarySurgeon?.trim() ? s.secondarySurgeon : DASH,
        priorCtOps:           s.priorCtOps?.trim() ? s.priorCtOps : DASH,
        priorCpbOps:          s.priorCpbOps?.trim() ? s.priorCpbOps : DASH,
        cpbTime:              s.cpbTime?.trim() ? `${s.cpbTime} min` : DASH,
        crossClampTime:       s.crossClampTimeCpb?.trim() ? `${s.crossClampTimeCpb} min` : DASH,
        circulatoryArrestTime: s.circulatoryArrestTime?.trim() ? `${s.circulatoryArrestTime} min` : DASH,
        cerebralNirs:         bool(s.cerebralNirs),
        somaticNirs:          bool(s.somaticNirs),
        pvrMeasured:          bool(s.pvrMeasured),
        autologousTransfusion: bool(s.autologousTransfusion),
        extendedThroughMidnight: bool(s.extendedThroughMidnight),
        endotrachealIntubation:  bool(s.endotrachealIntubation),
        extubatedInOR:           bool(s.extubatedInOP),
        reIntubated:             bool(s.reIntubated),
        timeline,
    };
}

function buildProductRow(
    s: RawStep11,
    label: string,
    duringKey: keyof RawStep11,
    withinKey: keyof RawStep11,
    afterKey: keyof RawStep11
): DisplayBloodProductRow | null {
    const during  = (s[duringKey]  as number) || 0;
    const within  = (s[withinKey]  as number) || 0;
    const after   = (s[afterKey]   as number) || 0;
    if (!during && !within && !after) return null;
    return { label, during, within24h: within, after24h: after };
}

function mapBloodProducts(raw: RawCase): BloodProductsDto {
    const s = raw.step11BloodProducts;
    if (!s) {
        return {
            filled: false,
            transfusionUsage: DASH, hematocritFirst: DASH, hematocritLast: DASH,
            transfusionDuringProc: false, transfusionWithin24h: false,
            transfusionAfter24h: false, autologousTransfusion: false,
            cellSaverReinfused: false, productRows: [],
        };
    }

    const candidateRows: (DisplayBloodProductRow | null)[] = [
        buildProductRow(s, 'Packed RBC',       'bpDuringPackedRbc',      'bpWithinPackedRbc',      'bpAfterPackedRbc'),
        buildProductRow(s, 'FFP',              'bpDuringFfp',            'bpWithinFfp',            'bpAfterFfp'),
        buildProductRow(s, 'Fresh Plasma',     'bpDuringFreshPlasma',    'bpWithinFreshPlasma',    'bpAfterFreshPlasma'),
        buildProductRow(s, 'SDP',              'bpDuringSdp',            'bpWithinSdp',            'bpAfterSdp'),
        buildProductRow(s, 'Indiv. Platelets', 'bpDuringIndivPlatelets', 'bpWithinIndivPlatelets', 'bpAfterIndivPlatelets'),
        buildProductRow(s, 'Cryo',             'bpDuringCryo',           'bpWithinCryo',           'bpAfterCryo'),
        buildProductRow(s, 'Fresh Whole Blood','bpDuringFwb',            'bpWithinFwb',            'bpAfterFwb'),
        buildProductRow(s, 'Whole Blood',      'bpDuringWholeBlood',     'bpWithinWholeBlood',     'bpAfterWholeBlood'),
    ];

    return {
        filled: true,
        transfusionUsage:     str(s.transfusionUsage),
        hematocritFirst:      s.hematocritFirst?.trim() ? `${s.hematocritFirst}%` : DASH,
        hematocritLast:       s.hematocritLast?.trim()  ? `${s.hematocritLast}%`  : DASH,
        transfusionDuringProc: bool(s.transfusionDuringProc),
        transfusionWithin24h:  bool(s.transfusionWithin24h),
        transfusionAfter24h:   bool(s.transfusionAfter24h),
        autologousTransfusion: bool(s.autologousTransfusion),
        cellSaverReinfused:    bool(s.cellSaverReinfused),
        productRows: candidateRows.filter((r): r is DisplayBloodProductRow => r !== null),
    };
}

function mapAnesthesia(raw: RawCase): AnesthesiaDto {
    const s = raw.step13Anesthesia;
    if (!s) {
        return {
            filled: false,
            primaryAnesthesiologist: DASH, preopMedCategories: DASH,
            preopSedation: false, inductionDateTime: null, patientLocationTransfer: null,
            artLine: false, centralPressureLine: false, ultrasoundGuidance: DASH,
            neuroMonitor: false, tee: false, cutdown: false, cvpPlaced: false,
            icuTypeVent: false, lowIntraopTemp: DASH,
            airwaySite: DASH, airwaySizeLma: DASH, airwaySizeIntub: DASH, cuffed: false,
            intraopPharm: [], pacuPharm: [], adverseEvents: [],
            pacuArrivalDateTime: null, pacuFiO2: DASH, pacuMechSupport: DASH,
            pacuPulseOx: DASH, pacuTempSite: DASH,
            pacuPacemaker: false, pacuPacemakerSite: DASH, pacuPacemakerType: DASH,
            pacuDemise: false,
        };
    }

    const intraopPharm = trueKeys(s.intraopPharm);
    const pacuPharm    = trueKeys(s.pacuPharm);
    const adverseEvents = trueKeys(s.anesAdverseEvents);

    const preopMedCategories = (s.preopMedCat ?? [])
        .join(', ') || DASH;

    return {
        filled: true,
        primaryAnesthesiologist: s.primAnesName?.trim() || DASH,
        preopMedCategories,
        preopSedation:           bool(s.preopSed),
        inductionDateTime:       date(s.inductionDt),
        patientLocationTransfer: date(s.pLocTransDt),
        artLine:                 bool(s.artLine),
        centralPressureLine:     bool(s.percCentPress),
        ultrasoundGuidance:      (s.ultraGuide && s.ultraGuide !== 'None') ? s.ultraGuide : DASH,
        neuroMonitor:            bool(s.neuroMonitor),
        tee:                     bool(s.tee),
        cutdown:                 bool(s.cutdown),
        cvpPlaced:               bool(s.cvpPlaced),
        icuTypeVent:             bool(s.icuTypeVent),
        lowIntraopTemp:          s.lowIntraopTemp?.trim() ? `${s.lowIntraopTemp}°C` : DASH,
        airwaySite:              str(s.airwaySite),
        airwaySizeLma:           s.airwaySizeLma?.trim() || DASH,
        airwaySizeIntub:         s.airwaySizeIntub?.trim() || DASH,
        cuffed:                  bool(s.cuffed),
        intraopPharm,
        pacuPharm,
        adverseEvents,
        pacuArrivalDateTime:  date(s.pacuArrivalDt),
        pacuFiO2:             s.pacuFiO2?.trim() ? `${s.pacuFiO2}%` : DASH,
        pacuMechSupport:      str(s.pacuMechSupport),
        pacuPulseOx:          str(s.pacuPulseOx),
        pacuTempSite:         str(s.pacuTempSite),
        pacuPacemaker:        bool(s.pacuPacemaker),
        pacuPacemakerSite:    str(s.pacuPacemakerSite),
        pacuPacemakerType:    str(s.pacuPacemakerType),
        pacuDemise:           bool(s.pacuDemise),
    };
}

function mapComplications(raw: RawCase): ComplicationsDto {
    const s = raw.step14Complications;
    if (!s) return { filled: false, noComplications: false, items: [] };
    if (bool(s.noComplications)) return { filled: true, noComplications: true, items: [] };

    const details = s.complicationDetails ?? {};
    const items: DisplayComplication[] = Object.entries(details).map(([key, val]) => ({
        key,
        label: key.replace(/([A-Z])/g, ' $1').trim(),
        date:  date(val?.date),
        notes: str(val?.notes),
    }));

    return {
        filled: items.length > 0 || (s.selectedComplications?.length ?? 0) > 0,
        noComplications: false,
        items,
    };
}

function mapDischarge(raw: RawCase, lovs: LovStore): DischargeDto {
    const s = raw.step15Discharge;
    if (!s || !s.dischargeStatus) {
        return {
            filled: false,
            dischargeStatus: DASH, dischargeStatusCode: '',
            dischargeDate: null, dischargeLocation: DASH,
            databaseDischargeStatus: DASH, databaseDischargeDate: null,
            readmission30Day: DASH, readmissionDate: null, readmissionReason: DASH,
            status30Days: DASH, verificationMethod: DASH,
        };
    }
    return {
        filled: true,
        dischargeStatus:         lovName(lovs, 'vadDischargeStatus', s.dischargeStatus),
        dischargeStatusCode:     str(s.dischargeStatus),
        dischargeDate:           date(s.dischargeDate),
        dischargeLocation:       lovName(lovs, 'status', s.dischargeLocation),
        databaseDischargeStatus: str(s.databaseDischargeStatus),
        databaseDischargeDate:   date(s.databaseDischargeDate ?? undefined),
        readmission30Day:        str(s.readmission30Day),
        readmissionDate:         date(s.readmissionDate ?? undefined),
        readmissionReason:       str(s.readmissionReason),
        status30Days:            str(s.status30Days),
        verificationMethod:      str(s.verificationMethod),
    };
}

function mapFollowups(raw: RawCase, lovs: LovStore): DisplayFollowup[] {
    return (raw.followups ?? []).map((f: RawFollowup) => ({
        id:                   f._id,
        followupDate:         date(f.followupDate),
        patientStatus:        lovName(lovs, 'vadDischargeStatus', f.patientStatus, str(f.patientStatus)),
        causeOfDeath:         str(f.causeOfDeath),
        readmissionRequested: bool(f.readmissionRequested),
        readmissionDate:      date(f.readmissionDate ?? undefined),
        readmissionReason:    str(f.readmissionReason),
        conductedByName:      str(f.conductedByName),
        notes:                str(f.notes),
    }));
}

// ─────────────────────────────────────────────────────────────
// Main mapper
// ─────────────────────────────────────────────────────────────

/**
 * Transforms a raw API case response into a fully resolved,
 * template-safe CaseDetailDto.
 *
 * @param raw   The raw case object from the API
 * @param lovs  All LOV collections (can be partial; graceful fallback to code)
 */
export function mapToCaseDetailDto(raw: RawCase, lovs: LovStore = {}): CaseDetailDto {
    return {
        meta:              mapMeta(raw),
        patient:           mapPatient(raw, lovs),
        hospitalAdmission: mapHospitalAdmission(raw, lovs),
        abnormalities:     mapAbnormalities(raw),
        chromosomal:       mapChromosomal(raw, lovs),
        preOpFactors:      mapPreOpFactors(raw, lovs),
        diagnoses:         mapDiagnoses(raw),
        procedures:        mapProcedures(raw),
        operativeData:     mapOperativeData(raw, lovs),
        bloodProducts:     mapBloodProducts(raw),
        anesthesia:        mapAnesthesia(raw),
        complications:     mapComplications(raw),
        discharge:         mapDischarge(raw, lovs),
        followups:         mapFollowups(raw, lovs),
    };
}

// ─────────────────────────────────────────────────────────────
// CaseListItemDto mapper
// Matches the actual list API: only identity, patientId (partial),
// hospitalId, ownerDoctorId, stage, status, step7, step8, timestamps.
// ─────────────────────────────────────────────────────────────

/** Age label computed from dob to an optional reference date (e.g. today). */
function computeAgeLabel(dob: string | null | undefined): string {
    if (!dob) return DASH;
    const birth = new Date(dob);
    const now   = new Date();
    if (isNaN(birth.getTime()) || birth > now) return DASH;

    let years  = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth()    - birth.getMonth();
    let days   = now.getDate()     - birth.getDate();

    if (days < 0)   { months--; days   += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--;  months += 12; }

    const totalMonths = years * 12 + months;
    if (totalMonths < 1)  return days <= 1 ? '1 day'  : `${days} days`;
    if (totalMonths < 24) return days > 0  ? `${totalMonths}m ${days}d` : `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`;
    return months > 0 ? `${years}y ${months}m` : `${years} year${years !== 1 ? 's' : ''}`;
}

function chip(store: LovStore, key: keyof LovStore, code: string | null | undefined): StatusChip {
    const raw = (code ?? '').trim();
    return { code: raw, label: raw ? lovName(store, key, raw) : DASH };
}

function listDiagnosis(raw: RawCase): ListDiagnosisSummary {
    const list = raw.step7Diagnosis?.selectedDiagnoses ?? [];
    if (!list.length) return { primaryName: DASH, primaryCode: DASH, additionalCount: 0 };
    const primary = list.find((d) => d.isPrimary) ?? list[0];
    return {
        primaryName:     str(primary.name),
        primaryCode:     str(primary.displayCode),
        additionalCount: list.length - 1,
    };
}

function listProcedure(raw: RawCase): ListProcedureSummary {
    const list = raw.step8Procedures?.selectedProcedures ?? [];
    if (!list.length) return { primaryName: DASH, primaryCode: DASH, additionalCount: 0 };
    return {
        primaryName:     str(list[0].name),
        primaryCode:     str(list[0].displayCode),
        additionalCount: list.length - 1,
    };
}

export function mapToCaseListItemDto(raw: RawCase, lovs: LovStore = {}): CaseListItemDto {
    const p     = raw.patientId;
    const operativeData = raw.step10OperativeData;
    const hospitalAdmission = raw.step5HospitalAdmission;
    const stage = str(raw.stage);

    const base = {
        id:                   raw._id,
        localId:              str(raw.localId ?? raw.caseId),
        patientName:          str(p?.name),
        patientMrn:           str(raw.patientMrn ?? p?.mrn),
        patientCitizenNumber: str(p?.citizenNumber ?? raw.patientCitizenNo),
        patientGender:        lovName(lovs, 'gender', p?.gender),
        operationStatus:      chip(lovs, 'odStatus', operativeData?.operationStatus),
        patientGenderCode:    str(p?.gender),
        patientDob:           date(p?.dob),
        patientAgeLabel:      computeAgeLabel(p?.dob),
        patientBloodGroup:    lovName(lovs, 'bloodGroup', p?.bloodGroup),
        hospitalName:         str(raw.hospitalId?.name),
        hospitalCode:         str(raw.hospitalId?.code ?? raw.hospitalCode),
        stage,
        stageLabel:           stage === DASH ? DASH : stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' '),
        status:               chip(lovs, 'status', raw.status),
        isSoloSubmission:     raw.isSoloSubmission === true,
        teamId:               raw.teamId ?? null,
        ownerDoctor:          doctorName(raw.ownerDoctorId),
        followups:            (raw.followups?.length ?? 0) > 0,
        surgeryDate:          str(hospitalAdmission?.surgeryDate),
        operationType:          lovName(lovs,'operationType', operativeData?.operationType),
        diagnosis:            listDiagnosis(raw),
        procedure:            listProcedure(raw),
        createdAt:            date(raw.createdAt),
        lastModifiedAt:       date(raw.lastModifiedAt),
    };

    const _search = [
        base.patientName, base.patientMrn, base.patientCitizenNumber,
        base.hospitalName, base.hospitalCode, base.ownerDoctor,
        base.diagnosis.primaryName, base.diagnosis.primaryCode,
        base.procedure.primaryName, base.procedure.primaryCode,
        base.status.label, base.stage,
    ].filter((s) => s && s !== DASH).join(' ').toLowerCase();

    return { ...base, _search };
}

/** Maps a raw array response (e.g. response.body.data) to CaseListItemDto[]. */
export function mapToCaseList(raws: RawCase[], lovs: LovStore = {}): CaseListItemDto[] {
    return raws.map((r) => mapToCaseListItemDto(r, lovs));
}

// ─────────────────────────────────────────────────────────────
// Patient mappers
// ─────────────────────────────────────────────────────────────
// Import the new raw types at the top of your file:
//   import { RawPatientListItem, RawPatientWithCases } from './case-raw.types';
// Import the new DTO types:
//   import { PatientListItemDto, PatientDetailDto } from './case-detail.dto';
// ─────────────────────────────────────────────────────────────

/**
 * Common patient field resolution.
 * Used by both list and detail mappers to avoid duplication.
 */
function mapPatientCore(p: {
    _id: string;
    mrn?: string;
    citizenNumber?: string;
    name?: string;
    gender?: string;
    dob?: string;
    bloodGroup?: string;
    country?: string;
    province?: string;
    city?: string;
    createdAt?: string;
    lastModifiedAt?: string;
}, lovs: LovStore) {
    const countryName  = lovName(lovs, 'country',  p.country);
    const provinceName = lovName(lovs, 'province', p.province);
    const cityName     = lovName(lovs, 'city',     p.city);

    const locationParts = [cityName, provinceName, countryName]
        .filter((s) => s && s !== DASH);

    return {
        id:            p._id,
        mrn:           str(p.mrn),
        citizenNumber: str(p.citizenNumber),
        name:          str(p.name),
        gender:        lovName(lovs, 'gender', p.gender),
        genderCode:    str(p.gender),
        dob:           date(p.dob),
        ageLabel:      computeAgeLabel(p.dob),
        bloodGroup:    lovName(lovs, 'bloodGroup', p.bloodGroup),
        country:       countryName,
        province:      provinceName,
        city:          cityName,
        location:      locationParts.length ? locationParts.join(', ') : DASH,
        createdAt:     date(p.createdAt),
        lastModifiedAt: date(p.lastModifiedAt),
    };
}

/**
 * Maps one raw patient list item → PatientListItemDto.
 * Expects the shape returned by GET /patients (with doctor + casesCount).
 */
export function mapToPatientListItemDto(
    raw:RawPatientListItem,
    lovs: LovStore = {}
): PatientListItemDto {
    const core = mapPatientCore(raw, lovs);

    const doctorName =
        raw.doctor?.fullName ||
        [raw.doctor?.firstName, raw.doctor?.lastName].filter(Boolean).join(' ') ||
        DASH;

    const base = {
        ...core,
        doctorName,
        doctorId:   raw.doctor?._id ?? '',
        casesCount: raw.casesCount ?? 0,
    };

    const _search = [
        base.name, base.mrn, base.citizenNumber,
        base.gender, base.bloodGroup,
        base.country, base.province, base.city,
        base.doctorName,
    ].filter((s) => s && s !== DASH).join(' ').toLowerCase();

    return { ...base, _search };
}

/**
 * Maps a raw array from GET /patients → PatientListItemDto[].
 */
export function mapToPatientList(
    raws: RawPatientListItem[],
    lovs: LovStore = {}
):PatientListItemDto[] {
    return raws.map((r) => mapToPatientListItemDto(r, lovs));
}

/**
 * Maps a raw patient detail response → PatientDetailDto.
 * The embedded cases[] array is mapped using mapToCaseListItemDto
 * so case rows render identically to the standalone case list page.
 */
export function mapToPatientDetailDto(
    raw: RawPatientWithCases,
    lovs: LovStore = {}
): PatientDetailDto {
    const core = mapPatientCore(raw, lovs);

    // Doctor comes from the first case's ownerDoctorId when not on root
    const firstCase = raw.cases?.[0];
    const doctorRef = firstCase?.ownerDoctorId;
    const doctorName = doctorName_from(doctorRef);

    // Map each embedded case using the existing case-list mapper
    const cases = (raw.cases ?? []).map((c) => {
        // Patch patientId into the raw case so the mapper can read patient fields.
        // The detail API returns patientId as a string on the case; we inject the
        // full patient object from the parent so field resolution works.
        const patchedCase = {
            ...c,
            patientId: {
                _id:           raw._id,
                mrn:           raw.mrn,
                citizenNumber: raw.citizenNumber,
                name:          raw.name,
                gender:        raw.gender,
                dob:           raw.dob,
                bloodGroup:    raw.bloodGroup,
                phone:         raw.phone,
                country:       raw.country,
                province:      raw.province,
                city:          raw.city,
                primaryPayor:  raw.primaryPayor,
                secondaryPayor: raw.secondaryPayor,
                createdAt:     raw.createdAt,
                updatedAt:     raw.updatedAt,
                isDeleted:     raw.isDeleted ?? false,
            },
            patientMrn: raw.mrn,
        };
        return mapToCaseListItemDto(patchedCase as RawCase, lovs);
    });

    return {
        ...core,
        phone:          str((raw as any).phone),
        weight:         (raw as any).weight ? `${(raw as any).weight} kg` : DASH,
        primaryPayor:   lovName(lovs, 'funding', (raw as any).primaryPayor),
        secondaryPayor: lovName(lovs, 'funding', (raw as any).secondaryPayor),
        doctorName,
        doctorId:       doctorRef?._id ?? '',
        cases,
    };
}

/** Helper — resolves a doctor ref to "First Last" */
function doctorName_from(ref?: { firstName?: string; lastName?: string } | null): string {
    if (!ref) return DASH;
    const full = [ref.firstName, ref.lastName].filter(Boolean).join(' ').trim();
    return full || DASH;
}
