export interface AudreySalesRep {
  id: string;
  name: string;
  email: string;
  phone: string;
  territory: string;
  territoryStates: string[];
  pipelineValue: number;
  ytdRevenue: number;
  accountIds: string[];
  activeDeals: number;
  hireDate: string;
}

export const SALES_REPS: AudreySalesRep[] = [
  {
    id: 'R-001',
    name: 'Beth Calloway',
    email: 'beth.calloway@audreyshome.com',
    phone: '(404) 555-0118',
    territory: 'Southeast',
    territoryStates: ['GA', 'FL', 'SC', 'NC'],
    pipelineValue: 186000,
    ytdRevenue: 312400,
    accountIds: ['C-8001', 'C-8002', 'C-8007', 'L-9001', 'L-9003'],
    activeDeals: 3,
    hireDate: '2019-08-12',
  },
  {
    id: 'R-002',
    name: 'Marcus Rivera',
    email: 'marcus.rivera@audreyshome.com',
    phone: '(615) 555-0247',
    territory: 'Mid-South',
    territoryStates: ['TN', 'VA', 'LA'],
    pipelineValue: 124000,
    ytdRevenue: 198600,
    accountIds: ['C-8003', 'C-8004', 'C-8008', 'L-9002', 'L-9005'],
    activeDeals: 2,
    hireDate: '2021-02-08',
  },
  {
    id: 'R-003',
    name: 'Hannah Cho',
    email: 'hannah.cho@audreyshome.com',
    phone: '(303) 555-0392',
    territory: 'Mountain/West',
    territoryStates: ['CO', 'ME', 'OR'],
    pipelineValue: 89000,
    ytdRevenue: 142100,
    accountIds: ['C-8005', 'C-8006', 'L-9004', 'L-9006'],
    activeDeals: 3,
    hireDate: '2022-06-20',
  },
  {
    id: 'R-004',
    name: 'James Whitfield',
    email: 'james.whitfield@audreyshome.com',
    phone: '(212) 555-0461',
    territory: 'Northeast',
    territoryStates: ['NY', 'NJ', 'CT'],
    pipelineValue: 42000,
    ytdRevenue: 38900,
    accountIds: [],
    activeDeals: 0,
    hireDate: '2026-01-15',
  },
];
