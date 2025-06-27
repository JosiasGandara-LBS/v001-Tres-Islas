export interface Employee {
    id: string;
    name: string;
    email: string;
    role: Role;
    password?: string; // Optional for updates
}

export enum Role {
    ADMIN = 'ADMIN',
    TI = 'TI',
    CAJA = 'CAJA',
    MESERO = 'MESERO',
}

    