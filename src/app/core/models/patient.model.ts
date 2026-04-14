import {CaseDetailDTO, CasePatientDTO} from "./case.model";

export class PatientDTO extends CasePatientDTO {
    doctor: any | null = null;
    cases: CaseDetailDTO[] = [];
    casesCount: number = 0;

    override fromData(data: any): void {
        super.fromData(data);
        this.doctor = data?.doctor ?? null;

        if (data?.cases && Array.isArray(data.cases)) {
            this.cases = data.cases.map((caseData: any) => {
                const caseDTO = new CaseDetailDTO();
                caseDTO.fromData(caseData);
                return caseDTO;
            });
        } else {
            this.cases = [];
        }
    }


    getAge(): string {
        if (!this.dob) return '—';
        const birthDate = new Date(this.dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
    }

    getLocation(): string {
        const parts = [this.city, this.province, this.country].filter(p => p);
        return parts.join(', ') || '—';
    }
}

