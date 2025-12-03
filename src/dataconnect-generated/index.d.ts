import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateCustomerData {
  customer_insert: Customer_Key;
}

export interface Customer_Key {
  id: UUIDString;
  __typename?: 'Customer_Key';
}

export interface ListOrdersForCustomerData {
  orders: ({
    id: UUIDString;
    orderDate: TimestampString;
    totalAmount: number;
    status: string;
  } & Order_Key)[];
}

export interface ListOrdersForCustomerVariables {
  customerId: UUIDString;
}

export interface ListProductsData {
  products: ({
    id: UUIDString;
    name: string;
    price: number;
    description?: string | null;
  } & Product_Key)[];
}

export interface OrderItem_Key {
  id: UUIDString;
  __typename?: 'OrderItem_Key';
}

export interface Order_Key {
  id: UUIDString;
  __typename?: 'Order_Key';
}

export interface Payment_Key {
  id: UUIDString;
  __typename?: 'Payment_Key';
}

export interface Product_Key {
  id: UUIDString;
  __typename?: 'Product_Key';
}

export interface UpdateProductStockData {
  product_update?: Product_Key | null;
}

export interface UpdateProductStockVariables {
  id: UUIDString;
  stockQuantity: number;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateCustomerRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateCustomerData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateCustomerData, undefined>;
  operationName: string;
}
export const createCustomerRef: CreateCustomerRef;

export function createCustomer(): MutationPromise<CreateCustomerData, undefined>;
export function createCustomer(dc: DataConnect): MutationPromise<CreateCustomerData, undefined>;

interface ListProductsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProductsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListProductsData, undefined>;
  operationName: string;
}
export const listProductsRef: ListProductsRef;

export function listProducts(): QueryPromise<ListProductsData, undefined>;
export function listProducts(dc: DataConnect): QueryPromise<ListProductsData, undefined>;

interface UpdateProductStockRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateProductStockVariables): MutationRef<UpdateProductStockData, UpdateProductStockVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateProductStockVariables): MutationRef<UpdateProductStockData, UpdateProductStockVariables>;
  operationName: string;
}
export const updateProductStockRef: UpdateProductStockRef;

export function updateProductStock(vars: UpdateProductStockVariables): MutationPromise<UpdateProductStockData, UpdateProductStockVariables>;
export function updateProductStock(dc: DataConnect, vars: UpdateProductStockVariables): MutationPromise<UpdateProductStockData, UpdateProductStockVariables>;

interface ListOrdersForCustomerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListOrdersForCustomerVariables): QueryRef<ListOrdersForCustomerData, ListOrdersForCustomerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListOrdersForCustomerVariables): QueryRef<ListOrdersForCustomerData, ListOrdersForCustomerVariables>;
  operationName: string;
}
export const listOrdersForCustomerRef: ListOrdersForCustomerRef;

export function listOrdersForCustomer(vars: ListOrdersForCustomerVariables): QueryPromise<ListOrdersForCustomerData, ListOrdersForCustomerVariables>;
export function listOrdersForCustomer(dc: DataConnect, vars: ListOrdersForCustomerVariables): QueryPromise<ListOrdersForCustomerData, ListOrdersForCustomerVariables>;

