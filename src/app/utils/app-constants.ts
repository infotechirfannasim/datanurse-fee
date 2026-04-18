export const lovCode = 'code';
export const lovLabel = 'label';

export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  DOCTOR: 'doctor',
  ASSISTANT_DOCTOR: 'assignmentdoctor',
  KPO: 'kpo',
};

export const PATIENT_STATUS = {
  DECEASED: 'Deceased',
  ALIVE: 'Alive',
  UNKNOWN: 'Unknown',
};

export const CASE_STAUSES = {
  DRAFT: {value: 'draft', label: 'Draft'},
  OPT_DATA_SUBMITTED: {value: 'opt_data_submitted', label: 'OPT Data Submitted'},
  POST_OPT_SUBMITTED: {value: 'post_opt_submitted', label: 'POST Opt Submitted'},
  REVIEWED: {value: 'reviewed', label: 'Reviewed'}
}

interface ChildMeta {
  parentLovKey: string;
  optionValue?: string;
  optionLabel?: string;
  label: string;
  formKey: string;
  multiSelect?: boolean;
  selectedValue?: any;
}

interface LovObjInterface {
  key: string;
  fields: string[];
  childMeta?: ChildMeta[];
}

class LovGenerator {
  key: string;
  fields: string[];
  childMeta: ChildMeta[];

  constructor(options: LovObjInterface) {
    this.key = options.key || '';
    this.fields = options.fields || [];
    this.childMeta =
      options.childMeta?.map((meta: ChildMeta) => ({
        ...meta,
        optionValue: lovCode,
        optionLabel: lovLabel,
      })) || [];
  }
}

export class AppConstants {
  // Application auth constants
  public static AUTH_ACCESS_TOKEN = 'token';
  public static AUTH_REFRESH_TOKEN = 'refreshToken';
  public static USER_INFO = 'userInfo';
  public static USER_ID = 'userId';
  public static PERMISSIONS = 'permissions';

  public static LOV_GROUPS = {
    country: 'country',
    gender: 'gender',
    bloodGroup: 'bloodGroup',
    language: 'language',
    maritalStatus: 'maritalStatus',
    religion: 'religion',
    deliveryMethod: 'deliveryMethod',
    status: 'status',
    priority: 'priority',
    department: 'department',
    diagnosisGroup: 'diagnosisGroup',
    procedureGroup: 'procedureGroup',
    abnormalityGroup: 'abnormalityGroup',
    complicationGroup: 'complicationGroup',
    chromosomalAbnormality: 'chromosomalAbnormality',
    syndrome: 'syndrome',
    symptom: 'symptom',
    investigation: 'investigation',
    medication: 'medication',
    preOpFactor: 'preOpFactor',
    verificationMethod: 'verificationMethod',
    chssEligibility: 'chssEligibility',
    vadDischargeStatus: 'vadDischargeStatus',

    // Anesthesia
    anesthesiaMed: 'anesthesiaMed',
    sedationDrug: 'sedationDrug',
    sedationRoute: 'sedationRoute',
    inhalationAgent: 'inhalationAgent',
    ivInductionAgent: 'ivInductionAgent',
    imInductionAgent: 'imInductionAgent',
    intraopMed: 'intraopMed',
    pacuMed: 'pacuMed',
    regionalAnesthesiaSite: 'regionalAnesthesiaSite',
    regionalAnesthesiaDrug: 'regionalAnesthesiaDrug',

    // Monitoring
    artLineType: 'artLineType',
    cutdownType: 'cutdownType',
    centralLineLocation: 'centralLineLocation',
    neuroMonitoringType: 'neuroMonitoringType',
    temperatureSite: 'temperatureSite',
    ultrasoundGuidance: 'ultrasoundGuidance',

    // Airway
    airwayType: 'airwayType',
    airwaySite: 'airwaySite',
    airwaySizeLma: 'airwaySizeLma',
    airwaySizeIntubation: 'airwaySizeIntubation',
    endobronchialIsolationMethod: 'endobronchialIsolationMethod',

    // PACU
    pacuTemperatureSite: 'pacuTemperatureSite',
    pacuPacemakerSite: 'pacuPacemakerSite',
    pacuPacemakerType: 'pacuPacemakerType',
    pacuDisposition: 'pacuDisposition',
    pacuMechanicalSupport: 'pacuMechanicalSupport',
    adverseEvent: 'adverseEvent',

    // Child Types / Others
    province: 'province',
    district: 'district',
    jobTitle: 'jobTitle',
    diagnosisSub: 'diagnosisSub',
    abnormality: 'abnormality',
    complication: 'complication',
    city: 'city',
    diagnosis: 'diagnosis',
    procedure: 'procedure',
    funding: 'funding',
    reOperationStatus: 'reOperationStatus',
    odStatus: 'odStatus',
    procedureLocation: 'procedureLocation',
    operationType: 'operationType',
    hospitals: 'hospitals',
    vadOption: 'vadOption',
    vadIndication: 'vadIndication',
    vadExplantReason: 'vadExplantReason',
    vadImplantType: 'vadImplantType',
    vadComplication: 'vadComplication',
    vadDeviceProduct: 'vadDeviceProduct',
    imaOption: 'imaOption',
    valveExplantType: 'valveExplantType',
    valveLocation: 'valveLocation',
    valveImplantType: 'valveImplantType',
    valveMaterial: 'valveMaterial',
    yesNo: 'yesNo',
    specialty: 'specialty',
    bloodProduct: 'bloodProduct',
    antifibrinolyticIntraOp: 'antifibrinolyticIntraOp',
    procoagulantIntraOp: 'procoagulantIntraOp',
    pocCoagulationTest: 'pocCoagulationTest',
  };

  public static LOV_KEYS = Object.keys(AppConstants.LOV_GROUPS);
}
