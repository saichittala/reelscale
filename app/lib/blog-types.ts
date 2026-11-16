export interface BlogFAQ {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  featuredImage: string;
  publishedDate: string;
  updatedDate: string;
  status: "Draft" | "Published";
  content: string;
  author: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogImage: string;
  faq: BlogFAQ[];
}
