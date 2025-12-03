import { CreateCustomerData, ListProductsData, UpdateProductStockData, UpdateProductStockVariables, ListOrdersForCustomerData, ListOrdersForCustomerVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateCustomer(options?: useDataConnectMutationOptions<CreateCustomerData, FirebaseError, void>): UseDataConnectMutationResult<CreateCustomerData, undefined>;
export function useCreateCustomer(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCustomerData, FirebaseError, void>): UseDataConnectMutationResult<CreateCustomerData, undefined>;

export function useListProducts(options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, undefined>;
export function useListProducts(dc: DataConnect, options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, undefined>;

export function useUpdateProductStock(options?: useDataConnectMutationOptions<UpdateProductStockData, FirebaseError, UpdateProductStockVariables>): UseDataConnectMutationResult<UpdateProductStockData, UpdateProductStockVariables>;
export function useUpdateProductStock(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateProductStockData, FirebaseError, UpdateProductStockVariables>): UseDataConnectMutationResult<UpdateProductStockData, UpdateProductStockVariables>;

export function useListOrdersForCustomer(vars: ListOrdersForCustomerVariables, options?: useDataConnectQueryOptions<ListOrdersForCustomerData>): UseDataConnectQueryResult<ListOrdersForCustomerData, ListOrdersForCustomerVariables>;
export function useListOrdersForCustomer(dc: DataConnect, vars: ListOrdersForCustomerVariables, options?: useDataConnectQueryOptions<ListOrdersForCustomerData>): UseDataConnectQueryResult<ListOrdersForCustomerData, ListOrdersForCustomerVariables>;
