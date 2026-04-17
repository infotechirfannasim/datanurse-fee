import {AppConstants} from "../../utils/app-constants";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {GET_LOV_BULK_API_URL} from "../../utils/api.url.constants";
import {ToastService} from "./toast.service";
import {RequestService} from "./request.service";
import {Injectable, signal} from "@angular/core";
import {LovStore} from "../models/lov.types.model";

@Injectable({providedIn: 'root'})
export class LovService {

    readonly store = signal<LovStore>({});

    constructor(
        private requestService: RequestService,
        private toastService: ToastService,
    ) {
    }

    load(types: string[]): void {
        if (!types?.length) return;

        this.requestService
            .postRequest(GET_LOV_BULK_API_URL, {types})
            .subscribe({
                next: (response: HttpResponse<any>) => {
                    if (response.status === 200 && response.body?.data) {
                        this.store.update((current) => ({
                            ...current,
                            ...response.body.data,
                        }));
                    }
                },
                error: (error: HttpErrorResponse) => {
                    const msg =
                        error.error?.message ||
                        error.message ||
                        'Failed to load LOVs';
                    this.toastService.show(msg, 'error');
                },
            });
    }

    /** Load single LOV by key */
    loadGroup(group: keyof typeof AppConstants.LOV_GROUPS): void {
        const type = AppConstants.LOV_GROUPS[group];
        this.load([type]);
    }

    /** Load multiple LOVs */
    loadGroups(...groups: (keyof typeof AppConstants.LOV_GROUPS)[]): void {
        const types = [
            ...new Set(groups.map((g) => AppConstants.LOV_GROUPS[g])),
        ];
        this.load(types);
    }

    /** Load ALL LOVs (optional helper 🔥) */
    loadAll(): void {
        this.load([...AppConstants.LOV_KEYS]);
    }
}


// ─────────────────────────────────────────────────────────────
// HOW THE KEY MAPPING WORKS
// ─────────────────────────────────────────────────────────────
//
// The API stores values using short codes:
//
//   patientId.country        = "PK"
//   step10.operationStatus   = "E11"
//   step10.procedureLocation = "CL2"
//   step10.operationType     = "IC"
//   step6.selectedPreOpFactors = ["CPR"]
//   step4.selectedChromosomal  = ["11P15.5"]
//   step4.selectedSyndromes    = ["HETA"]
//   step13.intraopPharm        = { "Propofol": true, "None": true }
//
// The LOV API returns arrays of items, each with a `code` and `name`:
//
//   response.body.data['country']          → [{ code: "PK",    name: "Pakistan" }, ...]
//   response.body.data['odStatus']         → [{ code: "E11",   name: "Emergency" }, ...]
//   response.body.data['procedureLocation']→ [{ code: "CL2",   name: "Cath Lab 2" }, ...]
//   response.body.data['operationType']    → [{ code: "IC",    name: "Initial Corrective" }, ...]
//   response.body.data['preOpFactor']      → [{ code: "CPR",   name: "Cardiopulmonary Resuscitation" }, ...]
//   response.body.data['chromosomalAbnormality'] → [{ code: "11P15.5", name: "..." }, ...]
//   response.body.data['syndrome']         → [{ code: "HETA",  name: "Heterotaxy Syndrome" }, ...]
//   response.body.data['intraopMed']       → [{ code: "Propofol", name: "Propofol" }, ...]
//
// The mapper calls lovName(store, '<apiKey>', rawCode):
//   lovName(store, 'country',           'PK')    → "Pakistan"
//   lovName(store, 'odStatus',          'E11')   → "Emergency"
//   lovName(store, 'procedureLocation', 'CL2')   → "Cath Lab 2"
//   lovName(store, 'operationType',     'IC')    → "Initial Corrective"
//   lovName(store, 'preOpFactor',       'CPR')   → "Cardiopulmonary Resuscitation"
//   lovName(store, 'vadDischargeStatus','Alive') → "Alive"  (or resolved name)
//
// For Record<string,boolean> fields (intraopPharm, anesAdverseEvents etc.):
//   lovKeysFromRecord(store, 'intraopMed', { "Propofol": true, "None": true })
//   → ["Propofol"]  (None filtered, code resolved to name if LOV loaded)
//
// RULE: the second argument to lovName() is ALWAYS the exact string
// the API returns as the key in response.body.data.
//
// ─────────────────────────────────────────────────────────────
// MAPPER FIELD → LOV TYPE LOOKUP TABLE
// ─────────────────────────────────────────────────────────────
//
// Raw field                               LOV type key
// ──────────────────────────────────────  ─────────────────────
// patientId.country                    →  'country'
// patientId.province                   →  'province'
// patientId.city                       →  'city'
// patientId.gender                     →  'gender'
// patientId.bloodGroup                 →  'bloodGroup'
// patientId.primaryPayor               →  'funding'
// patientId.secondaryPayor             →  'funding'
// step3.selectedAbnormalities[].abnormalityGroup → 'abnormalityGroup'
// step3.selectedAbnormalities[].abnormality      → 'abnormality'
//   (note: .name is already embedded in the object — no LOV needed)
// step4.selectedChromosomal[]          →  'chromosomalAbnormality'
// step4.selectedSyndromes[]            →  'syndrome'
// step5.admittedFrom                   →  (no standard LOV — kept as-is)
// step5.primaryPayor                   →  'funding'
// step6.selectedPreOpFactors[]         →  'preOpFactor'
// step10.operationStatus               →  'odStatus'
// step10.operationType                 →  'operationType'
// step10.procedureLocation             →  'procedureLocation'
// step13.ultraGuide                    →  'ultrasoundGuidance'
// step13.airwaySite                    →  'airwaySite'
// step13.airwaySizeLma                 →  'airwaySizeLma'
// step13.airwaySizeIntub               →  'airwaySizeIntubation'
// step13.pacuTempSite                  →  'pacuTemperatureSite'
// step13.pacuPacemakerSite             →  'pacuPacemakerSite'
// step13.pacuPacemakerType             →  'pacuPacemakerType'
// step13.pacuMechSupport               →  'pacuMechanicalSupport'
// step13.preopSedDrugs  (Record keys)  →  'sedationDrug'
// step13.preopSedRoute  (Record keys)  →  'sedationRoute'
// step13.indTypeInhAgents (Record keys)→  'inhalationAgent'
// step13.indTypeIvAgents  (Record keys)→  'ivInductionAgent'
// step13.indTypeImAgents  (Record keys)→  'imInductionAgent'
// step13.intraopPharm     (Record keys)→  'intraopMed'
// step13.pacuPharm        (Record keys)→  'pacuMed'
// step13.regAnesSite      (Record keys)→  'regionalAnesthesiaSite'
// step13.regAnesDrug      (Record keys)→  'regionalAnesthesiaDrug'
// step13.artLineType      (Record keys)→  'artLineType'
// step13.cutdownType      (Record keys)→  'cutdownType'
// step13.percCentPressLoc (Record keys)→  'centralLineLocation'
// step13.neuroMonitorType (Record keys)→  'neuroMonitoringType'
// step13.intraopTempSite  (Record keys)→  'temperatureSite'
// step13.pacuDisposition  (Record keys)→  'pacuDisposition'
// step13.anesAdverseEvents(Record keys)→  'adverseEvent'
// step14.selectedComplications[]       →  'complication'
// step15.dischargeStatus               →  'vadDischargeStatus'
// step15.dischargeLocation             →  (no standard LOV — kept as-is)
// step15.verificationMethod            →  'verificationMethod'
// followup.patientStatus               →  'vadDischargeStatus'
