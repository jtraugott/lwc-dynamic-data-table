
import { LightningElement, track } from 'lwc';
import getAllPayments from '@salesforce/apex/PnglDataController.getAllPayments';


const PaymentColumns = [
    { label: 'Lease Payment Number', fieldName: 'name', type: 'text', hideDefaultActions: true, sortable: true, wrapText: true },
    { label: 'Effective Date', fieldName: 'startDate', type: 'date', editable: true, sortable: true, wrapText: true },
    { label: 'Payment Amount', fieldName: 'payment', type: 'currency', editable: true, hideDefaultActions: true, sortable: true, wrapText: true },
    { label: 'Payment Frequency', fieldName: 'fequency', type: 'text', editable: true, hideDefaultActions: true, sortable: true, wrapText: true },
];

export default class DatatableWithRowActions extends LightningElement {
    globalrowId = 0;
    paymentColumns = PaymentColumns;
    @track data = [];

    connectedCallback() {
        getAllPayments({
            // TODO: insert lease ID dynamically
            leaseId: 'a028G000001KPshQAG'
        }).then((result) => {
            console.log(result);
            let updatedResult = [];
            if (result) {
                result.forEach((obj, index) => {
                    let tempObj = {};
                    PaymentColumns.forEach((col) => {
                        if (col.fieldName) tempObj[col.fieldName] = obj[col.fieldName];
                    });
                    tempObj.rowId = index;
                    tempObj.canEdit = false;
                    tempObj.canDelete = false;

                    updatedResult.push(tempObj);
                    this.globalrowId = index;
                });
                console.log('All Payments: ', updatedResult);
                this.data = updatedResult;
            }
        })
    }

    handleRowSubmit(event) {
        let row = event.currentTarget.name;
        let rowFetch = this.fetchRowInputs(event.currentTarget.name, 'submit');

        let newData = this.data
            .slice(0, row)
            .concat(this.data.slice(row + 1))
            .concat(rowFetch);

        this.data = newData;
    }

    handleInputChange(event) {
        // TODO: use this function for field level validation
    }

    handleRowAdd(event) {
        // This logic can be kept simple because we use the HTML to only show the add button IF...
        // ...the row is the last one in the table AND it is not canEdit === true
        this.globalrowId++;
        let newDataArr = this.data.concat({ name: "", startDate: "", payment: "", frequency: "", rowId: this.globalrowId, canEdit: true, canDelete: true });
        this.data = newDataArr;
    }

    handleRowDelete(event) {
        let selectedRow = parseInt(event.currentTarget.name);

        let tableFetch = this.fetchTableInputs();
        let newData = tableFetch.tableData
            .slice(0, selectedRow)
            .concat(tableFetch.tableData.slice(selectedRow + 1));

        // recalculate rowIds
        newData.forEach((element, index) => (element.rowId = index));

        // Decrement the global row index
        this.globalrowId--;

        this.data = newData;
    }

    fetchTableInputs() {
        let tableData = [];

        // Fetch our table using a specifically named attribute created in the HTML
        let table = this.template.querySelector(`[data-target-id="dynamicTable"]`);

        // Iterate through each of the rows in the table that ALSO have the special attribute we gave it
        table.querySelectorAll(`tr[data-target-id]`).forEach((row) => {
            let tempObj = {};
            tempObj.rowId = parseInt(row.getAttribute('data-target-id'));

            // Iterate through each of the div elements in the row as they contain our field data
            row.querySelectorAll(`div`).forEach((data) => {
                let field = data.getAttribute('data-target-id');
                let inputData = data.querySelector('input');

                // If inputData is not null, it means the field is an input type and we need to grab the value...
                // ...otherwise we use innerText to grab the text value inside of the field
                if (inputData) {
                    tempObj[field] = inputData.value;
                } else {
                    // Turn true/false string values into their boolean counterpart
                    if (data.innerText == "true") tempObj[field] = true;
                    else if (data.innerText == "false") tempObj[field] = false;
                    else tempObj[field] = data.innerText || "";
                }
            });
            tableData.push(tempObj);
        });
        return { tableData: tableData, tableElement: table };
    }

    fetchRowInputs(selectedRow, action) {
        let tableData = [];
        let table = this.template.querySelector(`[data-target-id="dynamicTable"]`);

        table.querySelectorAll(`tr[data-target-id]`).forEach((row) => {
            let tempObj = {};
            let rowAttr = parseInt(row.getAttribute('data-target-id'));

            // Match the row currently selected before proceeding
            if (selectedRow == rowAttr) {
                tempObj.rowId = rowAttr;

                // Iterate through each of the div elements in the row as they contain our field data
                row.querySelectorAll(`div`).forEach((data) => {
                    let field = data.getAttribute('data-target-id');
                    let inputData = data.querySelector('input');

                    // If inputData is not null, it means the field is an input type and we need to grab the value...
                    // ...otherwise we use innerText to grab the text value inside of the field
                    if (inputData) {
                        tempObj[field] = inputData.value;
                    } else {
                        // Turn true/false string values into their boolean counterpart
                        if (data.innerText == "true") tempObj[field] = true;
                        else if (data.innerText == "false") tempObj[field] = false;
                        else tempObj[field] = data.innerText || "";
                    }
                });
                // If we pass an action parameter of submit, we change canEdit to false so that it becomes read only
                if (action === 'submit') tempObj.canEdit = false;
                tableData.push(tempObj);
            }
        });
        return tableData;
    }
}