// case.model.ts

export class CasePatientDTO {
  _id: string = '';
  mrn: string = '';
  citizenNumber: string = '';
  name: string = '';
  dob: string | null = null;
  gender: string = '';
  fatherName: string = '';
  motherName: string = '';
  birthCountry: string = '';
  birthCity: string = '';
  country: string = '';
  province: string = '';
  city: string = '';
  primaryPayor: string = '';
  secondaryPayor: string = '';
  bloodGroup: string = '';
  phone: string = '';
  createdAt: string | null = null;

  fromData(data: any): void {
    const p = data?.patientId || data?.patient || data || {};
    this._id = p._id ?? '';
    this.mrn = p.mrn ?? data?.patientMrn ?? '';
    this.citizenNumber = p.citizenNumber ?? data?.patientCitizenNo ?? '';
    this.name = `${p.firstName || p.name || ''} ${p.lastName || ''}`.trim();
    this.dob = p.dob ?? null;
    this.gender = p.gender ?? '';
    this.fatherName = p.fatherName ?? '';
    this.motherName = p.motherName ?? '';
    this.birthCountry = p.birthCountry ?? '';
    this.birthCity = p.birthCity ?? '';
    this.country = p.country ?? '';
    this.province = p.province ?? '';
    this.city = p.city ?? '';
    this.primaryPayor = p.primaryPayor ?? '';
    this.secondaryPayor = p.secondaryPayor ?? '';
    this.bloodGroup = p.bloodGroup ?? '';
    this.phone = p.phone ?? '';
    this.createdAt = p.createdAt ?? null;
  }
}

export class CaseDoctorDTO {
  _id: string = '';
  firstName: string = '';
  lastName: string = '';
  email: string = '';

  fromData(data: any): void {
    this._id = data?._id ?? data ?? '';
    this.firstName = data?.firstName ?? '';
    this.lastName = data?.lastName ?? '';
    this.email = data?.email ?? '';
  }
}

export class CaseHospitalDTO {
  _id: string = '';
  code: string = '';
  name: string = '';

  fromData(data: any): void {
    this._id = data?._id ?? data ?? '';
    this.code = data?.code ?? '';
    this.name = data?.name ?? '';
  }
}

export class CaseDiagnosisDTO {
  id: number = 0;
  name: string = '';
  code: string = '';
  displayCode: string = '';
  isPrimary: boolean = false;
  category: string = '';
  subsection: string = '';

  fromData(data: any): void {
    this.id = data?.id ?? 0;
    this.name = data?.name ?? '';
    this.code = data?.code ?? '';
    this.displayCode = data?.displayCode ?? '';
    this.isPrimary = data?.isPrimary ?? false;
    this.category = data?.category ?? '';
    this.subsection = data?.subsection ?? '';
  }
}

export class CaseProcedureDTO {
  id: number = 0;
  name: string = '';
  code: string = '';
  displayCode: string = '';
  isCompatible: boolean = false;

  fromData(data: any): void {
    this.id = data?.id ?? 0;
    this.name = data?.name ?? '';
    this.code = data?.code ?? '';
    this.displayCode = data?.displayCode ?? '';
    this.isCompatible = data?.isCompatible ?? false;
  }
}

// ====================== LIST DTO ======================
export class CaseListDTO {
  _id: string = '';
  localId: string = '';
  caseId: string = '';
  patientMrn: string = '';
  patientCitizenNo: string = '';
  hospitalCode: string = '';
  stage: 'draft' | 'assistant_done' | 'kpo_done' | 'doctor_review_done' | 'final' = 'draft';
  isSoloSubmission: boolean = false;
  lastModifiedAt: string | null = null;
  createdAt: string | null = null;
  updatedAt: string | null = null;

  ownerDoctorId: CaseDoctorDTO = new CaseDoctorDTO();
  hospitalId: CaseHospitalDTO = new CaseHospitalDTO();
  patientId: CasePatientDTO = new CasePatientDTO();

  patientSnapshot: any = {firstName: '', lastName: '', dob: null, gender: '', citizenNumber: ''};
  step7Diagnosis: any = {selectedDiagnoses: []};
  step8Procedures: any = {selectedProcedures: []};
  followups: any [] = []

  fromData(data: any): void {
    this._id = data?._id ?? '';
    this.localId = data?.localId ?? '';
    this.caseId = data?.caseId ?? '';
    this.patientMrn = data?.patientMrn ?? '';
    this.patientCitizenNo = data?.patientCitizenNo ?? '';
    this.hospitalCode = data?.hospitalCode ?? '';
    this.stage = data?.stage ?? 'draft';
    this.isSoloSubmission = !!data?.isSoloSubmission;
    this.lastModifiedAt = data?.lastModifiedAt ?? null;
    this.createdAt = data?.createdAt ?? null;
    this.updatedAt = data?.updatedAt ?? null;

    this.ownerDoctorId.fromData(data?.ownerDoctorId);
    this.hospitalId.fromData(data?.hospitalId);
    this.patientId.fromData(data);

    this.patientSnapshot = data?.patientSnapshot ?? {
      firstName: '',
      lastName: '',
      dob: null,
      gender: '',
      citizenNumber: ''
    };

    this.step7Diagnosis = data?.step7Diagnosis ?? {selectedDiagnoses: []};
    this.step8Procedures = data?.step8Procedures ?? {selectedProcedures: []};
  }

  static fromArray(items: any[]): CaseListDTO[] {
    return (items ?? []).map(item => {
      const dto = new CaseListDTO();
      dto.fromData(item);
      return dto;
    });
  }
}

// ====================== DETAIL DTO ======================
export class CaseDetailDTO extends CaseListDTO {
  createdByUserId: CaseDoctorDTO = new CaseDoctorDTO();
  patientLocalId: string = '';

  step3Abnormalities: any = {};
  step4ChromosomalSyndromes: any = {};
  step5HospitalAdmission: any = {};
  step6PreOpMeds: any = {};
  step9ProcedureSpecificFactors: any = {};
  step10OperativeData: any = {};
  step11BloodProducts: any = {};
  step12ProcedureDetails: any = {};
  step13Anesthesia: any = {};
  step14Complications: any = {};
  step15Discharge: any = {};


  override fromData(data: any): void {
    super.fromData(data);

    this.patientLocalId = data?.patientLocalId ?? '';
    this.createdByUserId.fromData(data?.createdByUserId);

    this.step3Abnormalities = data?.step3Abnormalities ?? {};
    this.step4ChromosomalSyndromes = data?.step4ChromosomalSyndromes ?? {};
    this.step5HospitalAdmission = data?.step5HospitalAdmission ?? {};
    this.step6PreOpMeds = data?.step6PreOpMeds ?? {};
    this.step9ProcedureSpecificFactors = data?.step9ProcedureSpecificFactors ?? {};
    this.step10OperativeData = data?.step10OperativeData ?? {};
    this.step11BloodProducts = data?.step11BloodProducts ?? {};
    this.step12ProcedureDetails = data?.step12ProcedureDetails ?? {};
    this.step13Anesthesia = data?.step13Anesthesia ?? {};
    this.step14Complications = data?.step14Complications ?? {};
    this.step15Discharge = data?.step15Discharge ?? {};
    this.followups = data.followups ?? []
  }

  static fromDetail(data: any): CaseDetailDTO {
    const dto = new CaseDetailDTO();
    dto.fromData(data);
    return dto;
  }
}

// ====================== PATIENT DTO ======================
export class PatientDTO extends CasePatientDTO {
  doctor: any | null = null;
  cases: CaseDetailDTO[] = [];
  casesCount: number = 0;

  override fromData(data: any): void {
    super.fromData(data);

    this.doctor = data?.doctor ?? null;
    this.casesCount = Array.isArray(data?.cases) ? data.cases.length : 0;

    this.cases = Array.isArray(data?.cases)
        ? data.cases.map((c: any) => {
          const caseDto = new CaseDetailDTO();
          caseDto.fromData(c);
          return caseDto;
        })
        : [];
  }
}
