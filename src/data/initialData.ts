import { ProfileInfo, ClientData, DocumentData, ExpenseItem, DirectRevenueItem } from '../types';
import cameraBannerImg from '../assets/images/regenerated_image_1786447227352.jpg';

export const initialProfile: ProfileInfo = {
  filmmakerName: 'TAHA HAFSI',
  title: 'EXPERT AUDIOVISUEL',
  address: '23 Bd Akid Allam, Casablanca',
  phone: '+212698519895',
  email: 'contact.hafsitaha@gmail.com',
  websiteUrl: 'https://tahahafsi.vercel.app/',
  ice: '003142194000066',
  ifNumber: '52640537',
  taxePro: '32758577',
  inscriptionNo: 'AE-240823-083244',
  cnssNo: '174204646',
  rib: '230 780 3612259211026800 41',
  bankName: 'Attijariwafa Bank',
  bannerImage: cameraBannerImg,
  paymentTerms: '30% en avance, 70% à la livraison',
};

// Clean state: No virtual clients, documents, expenses, or direct revenues
export const initialClients: ClientData[] = [];
export const initialDocuments: DocumentData[] = [];
export const initialExpenses: ExpenseItem[] = [];
export const initialDirectRevenues: DirectRevenueItem[] = [];
