export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRestaurantRequest {
  restaurantName: string;
  ownerName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
}

export interface RestaurantMembershipInfo {
  id: string;
  role: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    restaurants: {
      id: string;
      name: string;
      slug: string;
      branches: { id: string; name: string; code: string }[];
    }[];
  };
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: AuthUser;
    memberships?: RestaurantMembershipInfo[];
  };
}

export interface RegisterRestaurantResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: AuthUser;
    tenant: { id: string; name: string; slug: string };
    restaurant: { id: string; name: string; slug: string };
    branch: { id: string; name: string; code: string };
  };
}
