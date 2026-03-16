export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'blocked';
  lastLogin: string;
  joinDate: string;
}

export interface Stock {
  id: string;
  name: string;
  symbol: string;
  code: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

export interface Log {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  user?: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  icon: string;
  date: string;
  type: string;
  status: string;
}

export interface Trade {
  id: string;
  no: number;
  title: string;
  author: string;
  stockName: string;
  stockCode: string;
  market: '코스피' | '코스닥' | '나스닥';
  tradeType: '매수' | '매도';
  price: number;
  quantity: number;
  totalAmount: number;
  status: '체결' | '대기' | '취소';
  date: string;
  applyDate: string;
  confirmDate: string | null;
  views: number;
  comments: number;
}