const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'newfolder2',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createCustomerRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCustomer');
}
createCustomerRef.operationName = 'CreateCustomer';
exports.createCustomerRef = createCustomerRef;

exports.createCustomer = function createCustomer(dc) {
  return executeMutation(createCustomerRef(dc));
};

const listProductsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProducts');
}
listProductsRef.operationName = 'ListProducts';
exports.listProductsRef = listProductsRef;

exports.listProducts = function listProducts(dc) {
  return executeQuery(listProductsRef(dc));
};

const updateProductStockRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateProductStock', inputVars);
}
updateProductStockRef.operationName = 'UpdateProductStock';
exports.updateProductStockRef = updateProductStockRef;

exports.updateProductStock = function updateProductStock(dcOrVars, vars) {
  return executeMutation(updateProductStockRef(dcOrVars, vars));
};

const listOrdersForCustomerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListOrdersForCustomer', inputVars);
}
listOrdersForCustomerRef.operationName = 'ListOrdersForCustomer';
exports.listOrdersForCustomerRef = listOrdersForCustomerRef;

exports.listOrdersForCustomer = function listOrdersForCustomer(dcOrVars, vars) {
  return executeQuery(listOrdersForCustomerRef(dcOrVars, vars));
};
