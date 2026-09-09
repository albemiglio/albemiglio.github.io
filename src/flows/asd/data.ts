export type Member = { id: string; name: string; year: number; fee: number };

export const members: Member[] = [
  { id: 'm1', name: 'Luca Ferri', year: 1979, fee: 150 },
  { id: 'm2', name: 'Sara Bianchi', year: 1994, fee: 120 },
  { id: 'm3', name: 'Marco Villa', year: 2010, fee: 90 },
  { id: 'm4', name: 'Giulia Conte', year: 2012, fee: 90 },
  { id: 'm5', name: 'Elena Rossi', year: 1988, fee: 150 },
];

export const parentName = 'Luca Ferri';
export const newMember = { name: 'Marta Ferri', birth: '2014-03-09' };
export const fee = 150;
