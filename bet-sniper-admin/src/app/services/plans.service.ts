import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Plan {
  _id?: string;
  name: string;
  displayName: string;
  durationDays: number;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
  isTrialPlan: boolean;
  maxSignalsPerDay: number;
  commissionLevels: number;
  sortOrder: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlanDto {
  name: string;
  displayName: string;
  durationDays: number;
  price: number;
  currency?: string;
  features?: string[];
  isActive?: boolean;
  isTrialPlan?: boolean;
  maxSignalsPerDay?: number;
  commissionLevels?: number;
  sortOrder?: number;
}

export interface AssignPlanDto {
  userId: string;
  planId: string;
}

export interface ForcePlanActionDto {
  userId: string;
  action: 'activate' | 'expire';
}

@Injectable({
  providedIn: 'root'
})
export class PlansService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  findAll(includeInactive = false): Observable<Plan[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    return this.http.get<Plan[]>(`${this.apiUrl}/plans${params}`);
  }

  findOne(id: string): Observable<Plan> {
    return this.http.get<Plan>(`${this.apiUrl}/plans/${id}`);
  }

  create(data: CreatePlanDto): Observable<Plan> {
    return this.http.post<Plan>(`${this.apiUrl}/plans`, data);
  }

  update(id: string, data: Partial<CreatePlanDto>): Observable<Plan> {
    return this.http.put<Plan>(`${this.apiUrl}/plans/${id}`, data);
  }

  delete(id: string): Observable<Plan> {
    return this.http.delete<Plan>(`${this.apiUrl}/plans/${id}`);
  }

  assignPlan(data: AssignPlanDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/plans/assign`, data);
  }

  forcePlanAction(data: ForcePlanActionDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/plans/force-action`, data);
  }
}
