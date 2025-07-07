import React, { useCallback, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
// REMOVED: PrimeReact imports - Bundle size optimization (~200KB)
import { Button } from 'twenty-ui/input';
// import { Dialog } from 'primereact/dialog';
// import { InputText } from 'primereact/inputtext';
// import { Dropdown } from 'primereact/dropdown';
// import { classNames } from 'primereact/utils';
// REMOVED: import { Paginator, PaginatorPageState } from 'primereact/paginator';
import { trackHVACUserAction, useHVACErrorReporting } from '../index';
import { Customer, customerAPIService } from '../services/CustomerAPIService';
import { hvacDashboardErrorState, hvacDashboardLoadingState } from '../states';

interface HvacCustomerListProps {
  onCustomerSelect?: (customer: Customer) => void;
}

export const HvacCustomerList: React.FC<HvacCustomerListProps> = ({ onCustomerSelect }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [first, setFirst] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const [loading, setLoading] = useRecoilState(hvacDashboardLoadingState);
  const [, setError] = useRecoilState(hvacDashboardErrorState);
  const { reportError } = useHVACErrorReporting();

  const [customerDialog, setCustomerDialog] = useState<boolean>(false);
  const [deleteCustomerDialog, setDeleteCustomerDialog] = useState<boolean>(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const fetchCustomers = useCallback(async (currentPage: number, currentRows: number) => {
    setLoading(true);
    setError(null);
    try {
      trackHVACUserAction('fetch_hvac_customers_list', 'API_REQUEST', { page: currentPage, limit: currentRows });
      const response = await customerAPIService.getCustomers(currentPage, currentRows);
      setCustomers(response.customers);
      setTotalRecords(response.total);
      setLoading(false);
      trackHVACUserAction('fetch_hvac_customers_list_success', 'API_SUCCESS', { count: response.customers.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching customers';
      setError(errorMessage);
      reportError(err as Error, 'API_ERROR', { operation: 'fetch_hvac_customers_list' });
      setLoading(false);
      trackHVACUserAction('fetch_hvac_customers_list_error', 'API_ERROR', { error: errorMessage });
    }
  }, [setLoading, setError, reportError]);

  useEffect(() => {
    fetchCustomers(page, rows);
  }, [fetchCustomers, page, rows]);

  const onPageChange = (event: PaginatorPageState) => {
    setFirst(event.first);
    setRows(event.rows);
    setPage(event.page + 1); // Paginator is 0-indexed, API is 1-indexed
  };

  const openNew = () => {
    setCustomer(null);
    setSubmitted(false);
    setCustomerDialog(true);
  };

  const hideDialog = () => {
    setCustomerDialog(false);
    setSubmitted(false);
  };

  const hideDeleteCustomerDialog = () => {
    setDeleteCustomerDialog(false);
  };

  const saveCustomer = async () => {
    setSubmitted(true);
    if (customer && customer.name && customer.email) { // Basic validation
      setLoading(true);
      try {
        if (customer.id) {
          // Update existing customer
          trackHVACUserAction('update_hvac_customer', 'API_REQUEST', { customerId: customer.id });
          await customerAPIService.updateCustomer(customer.id, customer);
          trackHVACUserAction('update_hvac_customer_success', 'API_SUCCESS', { customerId: customer.id });
        } else {
          // Create new customer
          trackHVACUserAction('create_hvac_customer', 'API_REQUEST');
          await customerAPIService.createCustomer(customer);
          trackHVACUserAction('create_hvac_customer_success', 'API_SUCCESS');
        }
        setCustomerDialog(false);
        setCustomer(null);
        fetchCustomers(page, rows); // Refresh list
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error saving customer';
        setError(errorMessage);
        reportError(err as Error, 'API_ERROR', { operation: 'save_hvac_customer' });
      } finally {
        setLoading(false);
      }
    }
  };

  const editCustomer = (customer: Customer) => {
    setCustomer({ ...customer });
    setCustomerDialog(true);
  };

  const confirmDeleteCustomer = (customer: Customer) => {
    setCustomer(customer);
    setDeleteCustomerDialog(true);
  };

  const deleteCustomer = async () => {
    if (customer && customer.id) {
      setLoading(true);
      try {
        trackHVACUserAction('delete_hvac_customer', 'API_REQUEST', { customerId: customer.id });
        await customerAPIService.deleteCustomer(customer.id);
        trackHVACUserAction('delete_hvac_customer_success', 'API_SUCCESS', { customerId: customer.id });
        setDeleteCustomerDialog(false);
        setCustomer(null);
        fetchCustomers(page, rows); // Refresh list
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error deleting customer';
        setError(errorMessage);
        reportError(err as Error, 'API_ERROR', { operation: 'delete_hvac_customer' });
      } finally {
        setLoading(false);
      }
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, name: keyof Customer) => {
    const val = e.target.value;
    setCustomer((prevCustomer) => ({
      ...(prevCustomer as Customer),
      [name]: val,
    }));
  };

  const onDropdownChange = (e: { value: any }, name: keyof Customer) => {
    setCustomer((prevCustomer) => ({
      ...(prevCustomer as Customer),
      [name]: e.value,
    }));
  };

  const actionBodyTemplate = (rowData: Customer) => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button icon="pi pi-pencil" rounded severity="success" onClick={() => editCustomer(rowData)} />
        <Button icon="pi pi-trash" rounded severity="warning" onClick={() => confirmDeleteCustomer(rowData)} />
        {onCustomerSelect && (
          <Button icon="pi pi-check" rounded severity="info" onClick={() => onCustomerSelect(rowData)} />
        )}
      </div>
    );
  };

  const customerDialogFooter = (
    <>
      <Button label="Cancel" icon="pi pi-times" text onClick={hideDialog} />
      <Button label="Save" icon="pi pi-check" onClick={saveCustomer} />
    </>
  );

  const deleteCustomerDialogFooter = (
    <>
      <Button label="No" icon="pi pi-times" text onClick={hideDeleteCustomerDialog} />
      <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteCustomer} />
    </>
  );

  const customerStatusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Prospect', value: 'prospect' },
    { label: 'VIP', value: 'vip' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Archived', value: 'archived' },
  ];

  const customerTypeOptions = [
    { label: 'Individual', value: 'individual' },
    { label: 'Company', value: 'company' },
    { label: 'Government', value: 'government' },
    { label: 'Non-Profit', value: 'non_profit' },
  ];

  return (
    <div className="hvac-customer-list">
      <div className="flex justify-content-end mb-3">
        <Button label="New Customer" icon="pi pi-plus" onClick={openNew} />
      </div>

      <DataTable
        value={customers}
        loading={loading}
        paginator={false} // Using custom paginator below
        rows={rows}
        first={first}
        totalRecords={totalRecords}
        lazy
        onValueChange={(e) => setCustomers(e.value)}
        dataKey="id"
        emptyMessage="No customers found."
      >
        <Column field="name" header="Name" sortable></Column>
        <Column field="email" header="Email"></Column>
        <Column field="phone" header="Phone"></Column>
        <Column field="status" header="Status"></Column>
        <Column field="type" header="Type"></Column>
        <Column body={actionBodyTemplate} headerStyle={{ width: '10rem' }}></Column>
      </DataTable>

      <Paginator
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
        rowsPerPageOptions={[10, 20, 50]}
      />

      <Dialog
        visible={customerDialog}
        style={{ width: '450px' }}
        header="Customer Details"
        modal
        className="p-fluid"
        footer={customerDialogFooter}
        onHide={hideDialog}
      >
        <div className="field">
          <label htmlFor="name">Name</label>
          <InputText
            id="name"
            value={customer?.name || ''}
            onChange={(e) => onInputChange(e, 'name')}
            required
            autoFocus
            className={classNames({ 'p-invalid': submitted && !customer?.name })}
          />
          {submitted && !customer?.name && <small className="p-error">Name is required.</small>}
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <InputText
            id="email"
            value={customer?.email || ''}
            onChange={(e) => onInputChange(e, 'email')}
            required
            className={classNames({ 'p-invalid': submitted && !customer?.email })}
          />
          {submitted && !customer?.email && <small className="p-error">Email is required.</small>}
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <InputText
            id="phone"
            value={customer?.phone || ''}
            onChange={(e) => onInputChange(e, 'phone')}
          />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <Dropdown
            id="status"
            value={customer?.status || ''}
            options={customerStatusOptions}
            onChange={(e) => onDropdownChange(e, 'status')}
            placeholder="Select a Status"
          />
        </div>
        <div className="field">
          <label htmlFor="customerType">Type</label>
          <Dropdown
            id="customerType"
            value={customer?.customerType || ''}
            options={customerTypeOptions}
            onChange={(e) => onDropdownChange(e, 'customerType')}
            placeholder="Select a Type"
          />
        </div>
      </Dialog>

      <Dialog
        visible={deleteCustomerDialog}
        style={{ width: '450px' }}
        header="Confirm"
        modal
        footer={deleteCustomerDialogFooter}
        onHide={hideDeleteCustomerDialog}
      >
        <div className="flex align-items-center justify-content-center">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
          {customer && (
            <span>
              Are you sure you want to delete <b>{customer.name}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
};