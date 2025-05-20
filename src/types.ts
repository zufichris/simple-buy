export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  phone?: string;
  isActive: boolean;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  amountInStock: number;
  amountSold: number;
}
