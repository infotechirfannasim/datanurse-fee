export interface LOV {
    _id: string;
    code: string;
    label: string;
    description: string;
    status: 'active' | 'inactive';
    parents: any[];
    createdAt: string;
}
