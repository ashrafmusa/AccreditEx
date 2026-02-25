import { getDocs } from 'firebase/firestore';
import { CertificateData } from '../types';
import { getTenantQuery } from '@/utils/tenantQuery';

export const getCertificates = async (): Promise<CertificateData[]> => {
    const certificateSnapshot = await getDocs(getTenantQuery('certificates'));
    return certificateSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CertificateData));
};
