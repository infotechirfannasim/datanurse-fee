export const lovCode = 'code';
export const lovLabel = 'label';

export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
};

export const PATIENT_STATUS = {
  DECEASED: 'Deceased',
  ALIVE: 'Alive',
  UNKNOWN: 'Unknown',
};

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

  public static additionalLOVFields = [lovCode, lovLabel];

  public static LOV = {
    accountOperationalType: new LovGenerator({
      key: 'accountOperationalType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    activeMembership: new LovGenerator({
      key: 'activeMembership',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    addressType: new LovGenerator({
      key: 'addressType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    appropriateRelation: new LovGenerator({
      key: 'appropriateRelation',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    bioAccountType: new LovGenerator({
      key: 'bioAccountType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    bioFingerIndex: new LovGenerator({
      key: 'bioFingerIndex',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    bioPurpose: new LovGenerator({
      key: 'bioPurpose',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    bool: new LovGenerator({
      key: 'bool',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    branchCode: new LovGenerator({
      key: 'branchCode',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    branchType: new LovGenerator({
      key: 'branchType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    bucketLocation: new LovGenerator({
      key: 'bucketLocation',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    bulkType: new LovGenerator({
      key: 'bulkType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    buyerSupplier: new LovGenerator({
      key: 'buyerSupplier',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    bvsStatus: new LovGenerator({
      key: 'bvsStatus',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    chequeBookLeave: new LovGenerator({
      key: 'chequeBookLeave',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    client: new LovGenerator({
      key: 'client',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    product: new LovGenerator({
      key: 'product',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    consumerProduct: new LovGenerator({
      key: 'consumerProduct',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    controllingPersonType: new LovGenerator({
      key: 'controllingPersonType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    country: new LovGenerator({
      key: 'country',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    countryDialingCode: new LovGenerator({
      key: 'countryDialingCode',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    crsCapacity: new LovGenerator({
      key: 'crsCapacity',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    crsClassification: new LovGenerator({
      key: 'crsClassification',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    customerPepOrFamilyPep: new LovGenerator({
      key: 'customerPepOrFamilyPep',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    customerStatus: new LovGenerator({
      key: 'customerStatus',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    customerSector: new LovGenerator({
      key: 'customerSector',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    customerSubSector: new LovGenerator({
      key: 'customerSubSector',
      fields: [...this.additionalLOVFields, 'status'],
      childMeta: [
        {
          parentLovKey: 'customerSector',
          label: 'Customer Sector',
          formKey: 'customerSectorCode',
        },
      ],
    }),
    customerSegment: new LovGenerator({
      key: 'customerSegment',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    customerType: new LovGenerator({
      key: 'customerType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    ecustomerType: new LovGenerator({
      key: 'ecustomerType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    customerAccountType: new LovGenerator({
      key: 'customerAccountType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    depositType: new LovGenerator({
      key: 'depositType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    documentType: new LovGenerator({
      key: 'documentType',
      fields: [...this.additionalLOVFields, 'status'],
      childMeta: [
        {
          parentLovKey: 'customerSector',
          label: 'Customer Sector',
          formKey: 'customerSectorCode',
          multiSelect: true,
        },
      ],
    }),
    ebChannel: new LovGenerator({
      key: 'ebChannel',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    ebImportPort: new LovGenerator({
      key: 'ebImportPort',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    ebPkMbCity: new LovGenerator({
      key: 'ebPkMbCity',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    ebPortsOfDischarge: new LovGenerator({
      key: 'ebPortsOfDischarge',
      fields: [...this.additionalLOVFields, 'status'],
      childMeta: [
        {
          parentLovKey: 'country',
          label: 'Country',
          formKey: 'countryCode',
        },
      ],
    }),
    ebRole: new LovGenerator({
      key: 'ebRole',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    eStatementFrequency: new LovGenerator({
      key: 'eStatementFrequency',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    expVolTrade: new LovGenerator({
      key: 'expVolTrade',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    expModeOfTransaction: new LovGenerator({
      key: 'expModeOfTransaction',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    factaRoleType: new LovGenerator({
      key: 'factaRoleType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    fiClassification: new LovGenerator({
      key: 'fiClassification',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    fsRelation: new LovGenerator({
      key: 'fsRelation',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    gender: new LovGenerator({
      key: 'gender',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    hsCode: new LovGenerator({
      key: 'hsCode',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    importExport: new LovGenerator({
      key: 'importExport',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    industry: new LovGenerator({
      key: 'industry',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    language: new LovGenerator({
      key: 'language',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    legalStructure: new LovGenerator({
      key: 'legalStructure',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    lockerType: new LovGenerator({
      key: 'lockerType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    maritalStatus: new LovGenerator({
      key: 'maritalStatus',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    markDiscrepancy: new LovGenerator({
      key: 'markDiscrepancy',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    mobileOperator: new LovGenerator({
      key: 'mobileOperator',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    modeDelivery: new LovGenerator({
      key: 'modeDelivery',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    business: new LovGenerator({
      key: 'business',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    natureOfBusiness: new LovGenerator({
      key: 'natureOfBusiness',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    natureOfBusinessInd: new LovGenerator({
      key: 'natureOfBusinessInd',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    natureOfBusinessTrade: new LovGenerator({
      key: 'natureOfBusinessTrade',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    natureOfDisability: new LovGenerator({
      key: 'natureOfDisability',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    nffeClassification: new LovGenerator({
      key: 'nffeClassification',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    noDepInMnth: new LovGenerator({
      key: 'noDepInMnth',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    noWdwInMnth: new LovGenerator({
      key: 'noWdwInMnth',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    occupation: new LovGenerator({
      key: 'occupation',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    operationalInstruction: new LovGenerator({
      key: 'operationalInstruction',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    organizationCode: new LovGenerator({
      key: 'organizationCode',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    pepSourceOfFundsIncome: new LovGenerator({
      key: 'pepSourceOfFundsIncome',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    pepSourceOfWealth: new LovGenerator({
      key: 'pepSourceOfWealth',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    pepMainCategory: new LovGenerator({
      key: 'pepMainCategory',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    pepSubCategory: new LovGenerator({
      key: 'pepSubCategory',
      fields: [...this.additionalLOVFields, 'status'],
      childMeta: [
        {
          parentLovKey: 'pepMainCategory',
          label: 'PEP Main Category',
          formKey: 'pepMainCatCode',
        },
      ],
    }),
    daoCapacityCode: new LovGenerator({
      key: 'daoCapacityCode',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    priority: new LovGenerator({
      key: 'priority',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    purposeAccount: new LovGenerator({
      key: 'purposeAccount',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    purposeOfCif: new LovGenerator({
      key: 'purposeOfCif',
      fields: [...this.additionalLOVFields, 'status'],
      childMeta: [
        {
          parentLovKey: 'customerSector',
          label: 'Customer Sector',
          formKey: 'customerSectorCode',
          multiSelect: true,
        },
      ],
    }),
    reasonManualVerisys: new LovGenerator({
      key: 'reasonManualVerisys',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    reasonOfPerfEdd: new LovGenerator({
      key: 'reasonOfPerfEdd',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    reasonTin: new LovGenerator({
      key: 'reasonTin',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    riskClass: new LovGenerator({
      key: 'riskClass',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    sbpCode: new LovGenerator({
      key: 'sbpCode',
      fields: [...this.additionalLOVFields, 'isic', 'status'],
      childMeta: [
        {
          parentLovKey: 'customerSector',
          label: 'Customer Sector',
          formKey: 'customerSectorCode',
          multiSelect: true,
        },
      ],
    }),
    sbpFine: new LovGenerator({
      key: 'sbpFine',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    smeCode: new LovGenerator({
      key: 'smeCode',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    sourceOfIncome: new LovGenerator({
      key: 'sourceOfIncome',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    sourceOfIncomeEcif: new LovGenerator({
      key: 'sourceOfIncomeEcif',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    registrationAuthority: new LovGenerator({
      key: 'registrationAuthority',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    relationshipWithHbl: new LovGenerator({
      key: 'relationshipWithHbl',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    spRelationship: new LovGenerator({
      key: 'spRelationship',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    sourceWealth: new LovGenerator({
      key: 'sourceWealth',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    statusOfOwnership: new LovGenerator({
      key: 'statusOfOwnership',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    subPart: new LovGenerator({
      key: 'subPart',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    subsidiaryType: new LovGenerator({
      key: 'subsidiaryType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    sundryAnalysis: new LovGenerator({
      key: 'sundryAnalysis',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    target: new LovGenerator({
      key: 'target',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    title: new LovGenerator({
      key: 'title',
      fields: [...this.additionalLOVFields, 'status'],
      childMeta: [
        {
          parentLovKey: 'gender',
          label: 'Gender',
          formKey: 'genderCode',
          multiSelect: true,
        },
      ],
    }),
    tradeCycle: new LovGenerator({
      key: 'tradeCycle',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    tradeOverdue: new LovGenerator({
      key: 'tradeOverdue',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    tradeRelationship: new LovGenerator({
      key: 'tradeRelationship',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    typeOfAddress: new LovGenerator({
      key: 'typeOfAddress',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    usEntity: new LovGenerator({
      key: 'usEntity',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    waiver: new LovGenerator({
      key: 'waiver',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    hub: new LovGenerator({
      key: 'hub',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    bpsScale: new LovGenerator({
      key: 'bpsScale',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    legalIdType: new LovGenerator({
      key: 'legalIdType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    debitCardType: new LovGenerator({
      key: 'debitCardType',
      fields: [...this.additionalLOVFields, 'status'],
      childMeta: [
        {
          parentLovKey: 'accountType',
          label: 'Account Type',
          formKey: 'acctType',
        },
      ],
    }),
    city: new LovGenerator({
      key: 'city',
      fields: [...this.additionalLOVFields, 'status'],
      childMeta: [
        {
          parentLovKey: 'country',
          label: 'Country',
          formKey: 'countryCode',
        },
      ],
    }),
    companyType: new LovGenerator({
      key: 'companyType',
      fields: [...this.additionalLOVFields, 'ffldnam', 'status'],
    }),
    crsClientType: new LovGenerator({
      key: 'crsClientType',
      fields: [...this.additionalLOVFields, 'crsCode', 'status'],
    }),
    currency: new LovGenerator({
      key: 'currency',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    ebSanctionCountry: new LovGenerator({
      key: 'ebSanctionCountry',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    fatcaCustomerType: new LovGenerator({
      key: 'fatcaCustomerType',
      fields: [...this.additionalLOVFields, 'customerType', 'status'],
    }),
    postingRestrict: new LovGenerator({
      key: 'postingRestrict',
      fields: [...this.additionalLOVFields, 'restrictionType', 'status'],
    }),
    province: new LovGenerator({
      key: 'province',
      fields: [...this.additionalLOVFields, 'status'],
      childMeta: [
        {
          parentLovKey: 'country',
          label: 'Country',
          formKey: 'countryCode',
        },
      ],
    }),
    rmCode: new LovGenerator({
      key: 'rmCode',
      fields: [...this.additionalLOVFields, 'rmBusinessSegment', 'status'],
    }),
    branchRegion: new LovGenerator({
      key: 'branchRegion',
      fields: [...this.additionalLOVFields, 'regionCode', 'regionDescription', 'status'],
      childMeta: [
        {
          parentLovKey: 'branchCode',
          label: 'Branch',
          formKey: 'branchCode',
        },
      ],
    }),
    cardType: new LovGenerator({
      key: 'cardType',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    countryCanadaCode: new LovGenerator({
      key: 'countryCanadaCode',
      fields: [...this.additionalLOVFields, 'countryDialingCode', 'countryCode', 'status'],
    }),
    relation: new LovGenerator({
      key: 'relation',
      fields: [...this.additionalLOVFields, 'reverseRelation', 'revRelDesc', 'status'],
    }),
    accountType: new LovGenerator({
      key: 'accountType',
      fields: [...this.additionalLOVFields, 'conventionalIslamic', 'status'],
      childMeta: [
        {
          parentLovKey: 'customerSector',
          label: 'Customer Sector',
          formKey: 'customerSectorCode',
        },
      ],
    }),
    businessArea: new LovGenerator({
      key: 'businessArea',
      fields: [...this.additionalLOVFields, 'status'],
      childMeta: [
        {
          parentLovKey: 'branchCode',
          label: 'Branch',
          formKey: 'branchCode',
        },
        {
          parentLovKey: 'province',
          label: 'Province',
          formKey: 'provinceCode',
        },
      ],
    }),
    bulkAccountType: new LovGenerator({
      key: 'bulkAccountType',
      fields: [...this.additionalLOVFields, 'conventionalIslamic', 'acctTypeDesc', 'status'],
      childMeta: [
        {
          parentLovKey: 'customerSector',
          label: 'Customer Sector',
          formKey: 'customerSector',
        },
        {
          parentLovKey: 'currency',
          label: 'Currency',
          formKey: 'acctCcy',
        },
        {
          parentLovKey: 'accountType',
          label: 'Account Type',
          formKey: 'acctType',
        },
        {
          parentLovKey: 'bulkType',
          label: 'Bulk Type',
          formKey: 'bulkType',
        },
      ],
    }),
    company: new LovGenerator({
      key: 'company',
      fields: [...this.additionalLOVFields, 'nameAddress', 'mnemonic', 'languageCode', 'status'],
    }),
    reasonCategoryCustomerPep: new LovGenerator({
      key: 'reasonCategoryCustomerPep',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    daoDebitCardNotSelectReason: new LovGenerator({
      key: 'daoDebitCardNotSelectReason',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    daoPaypakNotSelectReason: new LovGenerator({
      key: 'daoPaypakNotSelectReason',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    financialSupportBusinessIndustry: new LovGenerator({
      key: 'financialSupportBusinessIndustry',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    preferredCommunicationMode: new LovGenerator({
      key: 'preferredCommunicationMode',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    preferredMailingAddress: new LovGenerator({
      key: 'preferredMailingAddress',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    pricingRelatedIssue: new LovGenerator({
      key: 'pricingRelatedIssue',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    sourceInitialDeposit: new LovGenerator({
      key: 'sourceInitialDeposit',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    sourceIncomeIndustryMainCategory: new LovGenerator({
      key: 'sourceIncomeIndustryMainCategory',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    sourceIncomeIndustrySubCategory: new LovGenerator({
      key: 'sourceIncomeIndustrySubCategory',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    tinNotProvidedReason: new LovGenerator({
      key: 'tinNotProvidedReason',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    typeEconomicActivity: new LovGenerator({
      key: 'typeEconomicActivity',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    visuallyImpaired: new LovGenerator({
      key: 'visuallyImpaired',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    zakatExemptionResn: new LovGenerator({
      key: 'zakatExemptionResn',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    civilServantCategory: new LovGenerator({
      key: 'civilServantCategory',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    debitCardNotSelectReason: new LovGenerator({
      key: 'debitCardNotSelectReason',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    debitPaypakNotSelectReason: new LovGenerator({
      key: 'debitPaypakNotSelectReason',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    eSector: new LovGenerator({
      key: 'eSector',
      fields: [...this.additionalLOVFields, 'status', 'isFa'],
    }),
    eScanningDocuments: new LovGenerator({
      key: 'eScanningDocuments',
      fields: [...this.additionalLOVFields, 'status'],
    }),
    eSubSector: new LovGenerator({
      key: 'eSubSector',
      fields: [...this.additionalLOVFields, 'status'],
      childMeta: [
        {
          parentLovKey: 'eSector',
          label: 'E Sector',
          formKey: 'esecCode',
        },
      ],
    }),
    eLegalIdType: new LovGenerator({
      key: 'eLegalIdType',
      fields: [...this.additionalLOVFields, 'status'],
      childMeta: [
        {
          parentLovKey: 'eSector',
          label: 'E Sector',
          formKey: 'esecCode',
        },
      ],
    }),
  };

  public static getLOVFields(type: keyof typeof AppConstants.LOV): string[] {
    return AppConstants.LOV[type]?.fields || [];
  }

  public static LOVS = {};
}
