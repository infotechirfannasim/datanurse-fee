export type Period = 'all' | 'month' | 'year';

/** Global, URL-synchronised filter state. Empty = complete Pakistan dataset. */
export interface PublicFilters {
    period: Period;
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
    diagnosis?: string;
}

export const FILTER_KEYS: (keyof PublicFilters)[] = [
    'province', 'district', 'city', 'hospital', 'surgeon', 'gender',
    'ageGroup', 'payer', 'theatre', 'procedure', 'diagnosis',
];

export const FILTER_LABELS: Record<string, string> = {
    province: 'Province', district: 'District', city: 'City', hospital: 'Hospital', surgeon: 'Surgeon',
    gender: 'Gender', ageGroup: 'Age group', payer: 'Who pays', theatre: 'Theatre', procedure: 'Procedure',
    diagnosis: 'Diagnosis',
};

export interface GeoRow { code: string; name: string; count: number; province?: string | null; district?: string | null; }
export interface DistItem { code: string | null; name: string; count: number; percentage: number; isOther?: boolean; }
export interface LovDist { recorded: number; notRecorded: number; notRecordedLabel: string; items: DistItem[]; }

export interface PublicDashboardData {
    generatedAt: string;
    period: Period;
    expiresAt: string | null;
    kpis: {
        totalCases: number; totalPatients: number; totalSurgeons: number; totalHospitals: number;
        assistantSurgeons: number; kpos: number;
    };
    geography: { provinces: GeoRow[]; districts: GeoRow[]; cities: GeoRow[]; notRecorded: number; unmatched: number; };
    demographics?: {
        ageGroups: { code: string; label: string; color: string; count: number; percentage: number;
            gender: { code: string; label: string; count: number }[] }[];
        knownAge: number; unknownAge: number;
        gender: { code: string; label: string; count: number; percentage: number }[];
    };
    procedures?: { total: number; distinct: number; casesWithProcedure: number; items: DistItem[] };
    diagnoses?: { total: number; distinct: number; items: DistItem[] };
    activity?: { granularity: 'day' | 'month' | 'year'; undated: number;
        points: { key: string; label: string; range: string; count: number }[] };
    surgeons?: { code: string; label: string; cases: number; hospitals: { code: string | null; name: string; cases: number }[] }[];
    hospitals?: { code: string; name: string; cases: number; surgeons: { code: string; label: string; cases: number }[] }[];
    payers?: LovDist;
    theatre?: {
        locations: LovDist; operationTypes: LovDist;
        urgency: { name: string; count: number; percentage: number }[];
        indicators: { key: string; label: string; count: number; denominator: number; percentage: number }[];
        cpbMinutes: { n: number; median: number | null };
        crossClampMinutes: { n: number; median: number | null };
        cpbByProcedure: { n: number; distinct: number;
            items: { code: string; name: string; n: number; min: number; q1: number; median: number; q3: number; max: number }[] };
    };
    outcomes?: {
        eligible: number; followedUp: number; followupRate: number; casesWithFollowup: number;
        latestStatus: { alive: number; deceased: number; unknown: number };
        survivalAmongKnown: number; readmitted: number; readmissionRate: number;
        discharge: { cases: number; recorded: number; completeness: number;
            statuses: { name: string; count: number; percentage: number }[];
            lengthOfStayMedianDays: number | null; lengthOfStayN: number };
    };
}

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
