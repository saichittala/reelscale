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
  billingModel?: string;
  plan?: string;
  baseRate?: number;
  bargain?: number;
  revenue?: number;
  date?: string;
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

export interface DocumentLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface BusinessDocument {
  id: string;
  number: string;
  type: "Invoice" | "Quotation";
  status: "Draft" | "Generated" | "Sent" | "Paid" | "Expired" | "Cancelled";
  clientId: string | number;
  clientName: string;
  companyName: string;
  clientEmail: string;
  clientPhone: string;
  billingAddress: string;
  gstin?: string;
  projectName: string;
  service: string;
  issueDate: string;
  dueDate: string;
  validityDate?: string;
  lineItems: DocumentLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  expenses: number;
  total: number;
  paymentDetails: {
    accountName: string;
    bank: string;
    accountNumber: string;
    ifsc: string;
    upiId: string;
    terms: string;
  };
  terms: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientContract {
  id: string;
  contractNumber: string;
  clientId: string | number;
  clientName: string;
  contractType: string;
  startDate: string;
  endDate: string;
  status: "Draft" | "Active" | "Expired" | "Cancelled";
  amount: number;
  notes?: string;
  createdAt: string;
}

export type DashboardPage =
  | "dashboard"
  | "clients"
  | "analytics"
  | "users"
  | "sales"
  | "blogs"
  | "create-blog"
  | "blog-categories"
  | "resources";

