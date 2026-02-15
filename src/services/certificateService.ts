import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { CertificateData } from '../types';

const certificatesCollection = collection(db, 'certificates');

export const getCertificates = async (): Promise<CertificateData[]> => {
    const certificateSnapshot = await getDocs(certificatesCollection);
    return certificateSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CertificateData));
};
