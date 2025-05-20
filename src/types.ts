export interface User {
  name: string;
  email: string;
  password: string;
  phone?: string;
  isActive: boolean;
}

export interface Product {
  title: string;
  description: string;
  price: string;
  category: string;
  image: string;
  amountInstock: number;
  amountSold: number;
}
