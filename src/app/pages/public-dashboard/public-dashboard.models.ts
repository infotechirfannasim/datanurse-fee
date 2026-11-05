import {HierGroup} from '../../shared/components/hierarchy-chart/hierarchy-chart.component';

export type Period = 'all' | 'month' | 'year';
export type Scope = 'national' | 'personal';

/** Global, URL-synchronised filter state. Empty = complete national dataset. */
export interface PublicFilters {
    scope: Scope;
    period?: Period;          // kept for the API; the page no longer offers month/year
    province?: string;
    district?: string;
    city?: string;
    hospital?: string;
    surgeon?: string;
    gender?: string;
    ageGroup?: string;
    payer?: string;
    theatre?: string;
    procedure?: string;
    procGroup?: string;
    procSub?: string;
    dxGroup?: string;
    dxSub?: string;
    anLine?: string;
    anLineSite?: string;
    diagnosis?: string;
    birthWeight?: string;
    opWeight?: string;
    complication?: string;
    induction?: string;
    anaesAgent?: string;
}

export const FILTER_KEYS: (keyof PublicFilters)[] = [
    'province', 'district', 'city', 'hospital', 'surgeon', 'gender', 'ageGroup', 'payer', 'theatre',
    'procedure', 'diagnosis', 'birthWeight', 'opWeight', 'complication', 'induction', 'anaesAgent',
    'procGroup', 'procSub', 'dxGroup', 'dxSub', 'anLine', 'anLineSite',
];

export const FILTER_LABELS: Record<string, string> = {
    province: 'Province', district: 'District', city: 'City', hospital: 'Hospital', surgeon: 'Surgeon',
    gender: 'Gender', ageGroup: 'Age group', payer: 'Funding', theatre: 'Theatre', procedure: 'Procedure',
    diagnosis: 'Diagnosis', birthWeight: 'Birth weight', opWeight: 'Weight at operation',
    complication: 'Complication', induction: 'Induction', anaesAgent: 'Anaesthetic agent',
    procGroup: 'Procedure group', procSub: 'Procedure sub-group', dxGroup: 'Diagnosis group', dxSub: 'Diagnosis sub-group',
    anLine: 'Monitoring', anLineSite: 'Line / probe site',
};

/** Mean with its formula parts: mean = sum ÷ n. */
export interface Mean { mean: number | null; sum: number; n: number; }

export interface GeoRow { code: string; name: string; count: number; province?: string | null; district?: string | null; }
export interface DistItem { code: string | null; name: string; count: number; percentage: number; isOther?: boolean; group?: string; }
export interface LovDist { recorded: number; notRecorded: number; notRecordedLabel: string; items: DistItem[]; }

export interface PublicDashboardData {
    generatedAt: string;
    period: Period;
    scope: Scope;
    expiresAt: string | null;
    kpis: {
        totalCases: number; firstRecordedAt?: string | null; totalPatients: number; totalSurgeons: number; totalHospitals: number;
        assistantSurgeons: number; kpos: number;
    };
    geography: { provinces: GeoRow[]; districts: GeoRow[]; cities: GeoRow[]; notRecorded: number; unmatched: number; };
    demographics?: {
        ageGroups: { code: string; label: string; color: string; count: number; percentage: number;
            gender: { code: string; label: string; count: number }[] }[];
        knownAge: number; unknownAge: number;
        gender: { code: string; label: string; count: number; percentage: number }[];
    };
    procedures?: { total: number; distinct: number; casesWithProcedure: number; items: DistItem[]; others: DistItem[]; tree: HierTree };
    diagnoses?: { total: number; distinct: number; items: DistItem[]; others: DistItem[]; tree: HierTree };
    activity?: { granularity: 'day' | 'month' | 'year'; undated: number;
        points: { key: string; label: string; range: string; count: number }[] };
    surgeons?: { code: string; label: string; cases: number; hospitals: { code: string | null; name: string; cases: number }[] }[];
    hospitals?: { code: string; name: string; cases: number; surgeons: { code: string; label: string; cases: number }[] }[];
    payers?: LovDist;
    theatre?: {
        locations: LovDist; operationTypes: LovDist;
        urgency: { name: string; count: number; percentage: number }[];
        indicators: { key: string; label: string; count: number; denominator: number; percentage: number }[];
        times: {
            cpb: Mean & { bands: TimeBand[] };
            crossClamp: Mean & { bands: TimeBand[] };
            clampShareOfBypass: number | null;
        };
        cpbByProcedure: { n: number; distinct: number; items: ProcedureTimes[]; others: ProcedureTimes[] };
    };
    outcomes?: {
        discharge: {
            cases: number; recorded: number; notRecorded: number;
            alive: number; deceased: number; other: number; aliveRate: number;
            lengthOfStay: Mean;
        };
        followup: {
            eligible: number; followedEligible: number; rate: number; cases: number;
            alive: number; deceased: number; unknown: number; aliveRate: number;
            readmitted: number; readmissionRate: number;
        };
    };
    weights?: {
        birth: Mean & { bands: WeightBand[] };
        operation: Mean & { bands: WeightBand[] };
    };
    complications?: {
        cases: number; recorded: number; withAny: number; rate: number; distinct: number;
        groups: { name: string; count: number; percentage: number }[];
        items: DistItem[]; others: DistItem[];
        byProcedure: ProcedureComplications[]; byProcedureOthers: ProcedureComplications[];
    };
    anaesthesia?: {
        recorded: number;                       // operations with anaesthesia recorded (base for every %)
        team: AnNode[];
        techniques: { code: string; name: string; count: number; percentage: number; agents: AnLeaf[] }[];
        agents: DistItem[]; agentOthers: DistItem[];
        preop: { medicationCases: number; medicationPercentage: number; medications: AnTop; sedation: AnNode };
        lines: AnNode[];
        temperature: AnLeaf[];
        intraop: AnTop;
        pacu: { medications: AnTop; support: AnNode[] };
        adverse: { cases: number; recorded: number; percentage: number; distinct: number; items: DistItem[]; others: DistItem[] };
        disposition: AnLeaf[];
    };
}

export interface ProcedureComplications {
    code: string; name: string;
    assessed: number;   // cases (with this primary procedure) where complications were assessed
    withAny: number;    // of those, cases with ≥1 complication
    rate: number;
    top: { code: string; name: string; count: number } | null;
    complications: { code: string; name: string; count: number }[];
}

/** Anaesthesia: leaf = one option; node = a yes/no item with its detail options (child % = share of the parent). */
export interface AnLeaf { code: string; name: string; count: number; percentage: number; kind?: string; }
export interface AnNode { key: string; label: string; count: number; percentage: number; children: AnLeaf[]; }
export interface AnTop { items: AnLeaf[]; others: AnLeaf[]; distinct: number; otherLabel: string; }

export interface HierTree { total: number; groups: HierGroup[]; }

export interface TimeBand { label: string; min: number; max: number | null; count: number; }
export interface WeightBand { code: string; label: string; short: string; count: number; percentage: number; mean: number | null; }
export interface ProcedureTimes { code: string; name: string; cpb: Mean; crossClamp: Mean; }

// ── Official map asset (assets/maps/pakistan-official-map.json) ──────────────
export interface MapProvince {
    id: string; name: string; aliases: string[]; fill: string; path: string;
    label: string; lx: number; ly: number; rot: number; cx: number; cy: number; leader: [number, number] | null; bbox: [number, number, number, number];
}
export interface MapDistrict { id: string; name: string; province: string; aliases: string[]; path: string; cx: number; cy: number; }
export interface MapInsetLayer { key: string; path: string; }
export interface PakistanMapAsset {
    meta: { title: string; projection: string; sources: string[]; reference: string };
    width: number; height: number;
    provinces: MapProvince[];
    districts: MapDistrict[];
    disputed: { id: string; name: string; path: string; lx: number; ly: number; fadeX0: number; fadeX1: number;
        frontierX: number; frontierY: number };
    lines: { international: string; provincial: string; loc: string; working: string; iiojkIndia: string };
    neighbours: { code: string; name: string; path: string }[];
    labels: { text: string; x: number; y: number; rot: number; size: number }[];
    rivers: string;
    graticule: string;
    cities: { name: string; x: number; y: number; kind: 'capital' | 'hq' | 'other' }[];
    insets: {
        junagadh: { w: number; h: number; layers: MapInsetLayer[]; manavadar: [number, number]; label: [number, number] };
        sirCreek: { w: number; h: number; layers: MapInsetLayer[]; creek: [number, number] };
    };
}

/** Normalises names/codes for matching map features to LOV records. */
export const geoKey = (v: string | null | undefined): string =>
    String(v ?? '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
