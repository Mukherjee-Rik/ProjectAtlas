import { publicApiClient } from './public-api-client';
import type {
  PublicCustomerMenu,
  PublicCustomerMenuItemDetail,
} from '@/types/menu';

export interface PublicTableResolution {
  table: {
    id: string;
    name: string;
    code: string;
    capacity: number;
  };
  diningArea: {
    name: string;
  };
  branch: {
    name: string;
  };
  restaurant: {
    name: string;
  };
}

export interface PublicCustomerSessionResponse extends PublicTableResolution {
  sessionToken: string;
  status: 'ACTIVE' | 'ENDED' | 'EXPIRED';
  startedAt: string;
}

export async function resolvePublicTableToken(token: string) {
  return publicApiClient.get<{ success: boolean; data: PublicTableResolution }>(
    `/public/tables/${token}`,
  );
}

export async function createPublicCustomerSession(token: string) {
  return publicApiClient.post<{ success: boolean; data: PublicCustomerSessionResponse }>(
    `/public/tables/${token}/session`,
  );
}

export async function endPublicCustomerSession(token: string) {
  return publicApiClient.post<{ success: boolean; message: string }>(
    `/public/tables/${token}/session/end`,
  );
}

export async function getPublicCustomerMenu(token: string) {
  return publicApiClient.get<{ success: boolean; data: PublicCustomerMenu }>(
    `/public/tables/${token}/menu`,
  );
}

export async function getPublicCustomerMenuItem(token: string, itemId: string) {
  return publicApiClient.get<{ success: boolean; data: PublicCustomerMenuItemDetail }>(
    `/public/tables/${token}/menu-items/${itemId}`,
  );
}
