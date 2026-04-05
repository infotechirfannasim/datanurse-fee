export interface LOV {
    _id: string;
    code: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
    parents: any[];
    createdAt: string;
}
