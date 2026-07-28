export interface User {
  id?: string | number;
  name: string;
  email: string;
  password?: string;
  role: string;
}

export interface Client {
  id: string | number;
  name: string;
  business: string;
  phone: string;
  instagram: string;
  reels: number;
  ppr: number;
  image: string;
}

export interface Lead {
  id: string | number;
  createdDate: string;
  category: string;
  companyName: string;
  contactPerson: string;
  phoneNumber: string;
  notes: string;
  contacted: "Yes" | "No" | string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Blog {
  id?: string | number;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags?: string[];
  featuredImage: string;
  publishedDate: string;
  updatedDate?: string;
  status: "Draft" | "Published" | string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogImage?: string;
  faq?: FAQ[];
}

export type DashboardPage =
  | "dashboard"
  | "clients"
  | "analytics"
  | "users"
  | "sales"
  | "blogs"
  | "create-blog"
  | "blog-categories";
