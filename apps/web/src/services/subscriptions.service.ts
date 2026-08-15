import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api';

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  trialDays: number;
  description: string | null;
  features: string[];
  limits: Record<string, number>;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Subscription {
  id: string;
  restaurantId: string;
  planId: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
  billingCycle: 'MONTHLY' | 'YEARLY';
  trialStart: string | null;
  trialEnd: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  createdAt: string;
  plan: Plan;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface UsageMeter {
  current: number;
  limit: number;
}

export interface UsageStats {
  planName: string;
  status: string;
  billingCycle: string;
  nextBillingDate: string | null;
  usage: {
    tables: UsageMeter;
    staff: UsageMeter;
    branches: UsageMeter;
    menus: UsageMeter;
  };
}

export async function getSubscriptions() {
  return apiClient.get<ApiResponse<Subscription[]>>('/subscriptions');
}

export async function getMySubscription() {
  return apiClient.get<ApiResponse<Subscription>>('/subscriptions/my-subscription');
}

export async function getSubscriptionUsage() {
  return apiClient.get<ApiResponse<UsageStats>>('/subscriptions/usage');
}

export async function getPlans() {
  return apiClient.get<ApiResponse<Plan[]>>('/plans');
}

export async function assignPlan(restaurantId: string, planId: string) {
  return apiClient.post<ApiResponse<Subscription>>('/subscriptions/assign', { restaurantId, planId });
}

export async function extendTrial(subscriptionId: string, extensionDays: number) {
  return apiClient.post<ApiResponse<Subscription>>(`/subscriptions/${subscriptionId}/extend-trial`, { extensionDays });
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED',
) {
  return apiClient.post<ApiResponse<Subscription>>(`/subscriptions/${subscriptionId}/status`, { status });
}

export async function upgradeSubscription(planId: string) {
  return apiClient.post<ApiResponse<Subscription>>('/subscriptions/upgrade', { planId });
}
