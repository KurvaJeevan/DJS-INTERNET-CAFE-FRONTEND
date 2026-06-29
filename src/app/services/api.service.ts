import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // ── Transactions ──
  getTransactions(params?: any): Observable<any> { return this.http.get(`${this.base}/transactions`, { params }); }
  createTransaction(data: any): Observable<any>  { return this.http.post(`${this.base}/transactions`, data); }
  updateTransaction(id: string, data: any): Observable<any> { return this.http.put(`${this.base}/transactions/${id}`, data); }
  deleteTransaction(id: string): Observable<any> { return this.http.delete(`${this.base}/transactions/${id}`); }
  getTransactionStats(params?: any): Observable<any> { return this.http.get(`${this.base}/transactions/stats/summary`, { params }); }
  getServiceAnalytics(params?: any): Observable<any> { return this.http.get(`${this.base}/transactions/stats/analytics`, { params }); }

  // ── Expenses ──
  getExpenses(params?: any): Observable<any>     { return this.http.get(`${this.base}/expenses`, { params }); }
  createExpense(data: any): Observable<any>      { return this.http.post(`${this.base}/expenses`, data); }
  updateExpense(id: string, data: any): Observable<any> { return this.http.put(`${this.base}/expenses/${id}`, data); }
  deleteExpense(id: string): Observable<any>     { return this.http.delete(`${this.base}/expenses/${id}`); }

  // ── Printers ──
  getPrinters(): Observable<any>                 { return this.http.get(`${this.base}/printers`); }
  createPrinter(data: any): Observable<any>      { return this.http.post(`${this.base}/printers`, data); }
  updatePrinter(id: string, data: any): Observable<any> { return this.http.put(`${this.base}/printers/${id}`, data); }
  deletePrinter(id: string): Observable<any>     { return this.http.delete(`${this.base}/printers/${id}`); }
  getPrinterAnalytics(id: string, params?: any): Observable<any> { return this.http.get(`${this.base}/printers/${id}/analytics`, { params }); }
  getAllPrinterAnalytics(params?: any): Observable<any> { return this.http.get(`${this.base}/printers/analytics/all`, { params }); }

  // ── Bank Accounts ──
  getBankAccounts(): Observable<any>             { return this.http.get(`${this.base}/bank-accounts`); }
  getBankAccount(id: string): Observable<any>    { return this.http.get(`${this.base}/bank-accounts/${id}`); }
  createBankAccount(data: any): Observable<any>  { return this.http.post(`${this.base}/bank-accounts`, data); }
  updateBankAccount(id: string, data: any): Observable<any> { return this.http.put(`${this.base}/bank-accounts/${id}`, data); }
  deleteBankAccount(id: string): Observable<any> { return this.http.delete(`${this.base}/bank-accounts/${id}`); }
  addBankTransaction(accountId: string, data: any): Observable<any> { return this.http.post(`${this.base}/bank-accounts/${accountId}/transactions`, data); }
  deleteBankTransaction(accountId: string, txId: string): Observable<any> { return this.http.delete(`${this.base}/bank-accounts/${accountId}/transactions/${txId}`); }

  // ── PAN OCR Extraction (via backend) ──
  extractPanDocument(base64Data: string, mediaType: string): Observable<any> {
    return this.http.post(`${this.base}/pan-applications/extract`, { base64Data, mediaType });
  }

  // ── PAN Applications ──
  getPanApplications(params?: any): Observable<any> { return this.http.get(`${this.base}/pan-applications`, { params }); }
  createPanApplication(data: any): Observable<any>  { return this.http.post(`${this.base}/pan-applications`, data); }
  updatePanApplication(id: string, data: any): Observable<any> { return this.http.put(`${this.base}/pan-applications/${id}`, data); }
  updatePanStatus(id: string, data: any): Observable<any> { return this.http.patch(`${this.base}/pan-applications/${id}/status`, data); }
  deletePanApplication(id: string): Observable<any> { return this.http.delete(`${this.base}/pan-applications/${id}`); }

  // ── Dashboard ──
  getDashboardSummary(): Observable<any>         { return this.http.get(`${this.base}/dashboard/summary`); }
  getDailyChart(): Observable<any>               { return this.http.get(`${this.base}/dashboard/chart/daily`); }

  // ── Reports ──
  getTransactionReport(params?: any): Observable<any> { return this.http.get(`${this.base}/reports/transactions`, { params }); }
  getExpenseReport(params?: any): Observable<any>     { return this.http.get(`${this.base}/reports/expenses`, { params }); }
  getProfitReport(params?: any): Observable<any>      { return this.http.get(`${this.base}/reports/profit`, { params }); }
  getPrinterReport(params?: any): Observable<any>     { return this.http.get(`${this.base}/reports/printers`, { params }); }
  getPanReport(params?: any): Observable<any>         { return this.http.get(`${this.base}/reports/pan`, { params }); }

  // ── Cash Register ──
  getCashRegister(date?: string): Observable<any> {
    const d = date || new Date().toISOString().split('T')[0];
    return this.http.get(`${this.base}/cash-register/${d}`);
  }
  setCashOpening(data: any): Observable<any>     { return this.http.post(`${this.base}/cash-register`, data); }
  closeCashDay(date: string, data: any): Observable<any> { return this.http.patch(`${this.base}/cash-register/${date}/close`, data); }
  getCashHistory(): Observable<any>              { return this.http.get(`${this.base}/cash-register/history`); }
}
