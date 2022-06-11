import { Options } from "../Options";
import { Table } from "../Table";

function testTable(QUnit:QUnit){
  let spreadsheetId:string;
  let spreadsheet:GoogleAppsScript.Spreadsheet.Spreadsheet;

  // SPECIFIC TESTS
  spreadsheetId = '1SQdNXQetSFytNzRtwXV38orFAODaqpMe2XeY6kBS83g';
  spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  // GENERAL TESTING FOR A VARIETY OF SHEET CONFIGURATIONS.
  spreadsheet.getSheets().forEach(sheet => {
    if (sheet.getName().includes('header')) return;
    var options = new Options();
    QUnit.module(`Table: End-to-end testing of [${sheet.getName()}].`, {
      before: () => { 
        sheet = sheet.copyTo(spreadsheet);
        if (sheet.getName().includes('header_offset')) options.headerOffset = 1;
        else options.headerOffset = 0;
      },
      after: () => { new Table(sheet).destroy(); }
    });

    let v1 = { id:21, first_name:'Friendly', last_name:'User', email:'fuser@arizona.edu', gender:'Female', ip_address:'208.121.247.122' };
    let v2 = { id:22, first_name:'Friendly2', last_name:'User2', email:'fuser2@arizona.edu', gender:'Male', ip_address:'208.121.247.132' };
    let v3 = { id:23, first_name:'Friendly3', last_name:'User3', email:'fuser3@arizona.edu', gender:'Male', ip_address:'208.121.247.135' };

    QUnit.test(`End to End testing.`, (assert) => {
      let table = new Table(sheet, options);
      assert.equal(table.getCount(), 20, 'Returns correct initial count.');
      assert.equal(table.getColumnAsArray('email').length, 20, 'Returns correct column length.');

      assert.equal(table.getFirst()[0].email, 'cfoan0@arizona.edu', 'Returns correct first item.');
      assert.equal(table.getLast()[0].email, 'mkumaarj@nhs.uk', 'Returns correct first item.');
      assert.equal(table.getLike(target => target.id == 1)[0].email, 'cfoan0@arizona.edu', 'Returns correct filtered item.');

      let columnsResult = table.getColumns(['id', 'first_name', 'gender']);
      assert.equal(columnsResult.length, 20, 'Fetched correct number of rows.');
      assert.equal(columnsResult[0].length, 3, 'Fetched correct number of columns.');
      assert.equal(columnsResult[4][0], 5, 'Random checking of returned values worked.');
      assert.equal(columnsResult[5][1], 'Ulberto', 'Random checking of returned values worked.');
      assert.equal(columnsResult[6][2], 'Female', 'Random checking of returned values worked.');

      let itemsResult = table.getFirst(2);
      assert.equal(itemsResult[0].id, 1, 'First objects ID is correct.');
      assert.equal(itemsResult[1].first_name, 'Fabien', '2nd object first_name is correct.');
  
      itemsResult = table.getLast();
      assert.equal(itemsResult[0].id, 20, 'Last objects ID is correct.');
  
      itemsResult = table.getLast(2);
      assert.equal(itemsResult[0].last_name, 'Collcott', '2nd object first_name is correct.');
      assert.equal(itemsResult[1].id, 20, 'First objects ID is correct.');
  
      itemsResult = table.getSequence(2,2);
      assert.equal(itemsResult[0].id, 3, '2nd object first_name is correct.');
      assert.equal(itemsResult[1].id, 4, 'First objects ID is correct.');
  
      itemsResult = table.getSequence(8,1);
      assert.equal(itemsResult[0].first_name, 'Frances', '2nd object first_name is correct.');

      table.addAppend([v1]);
      table.addPrepend([v2]);
      table.addAt([v3], 5);
      assert.equal(table.getFirst()[0].id, 22, 'Correctly prepended an item.');
      assert.equal(table.getLast()[0].id, 21, 'Correctly prepended an item.');
      assert.equal(table.getSequence(4, 3)[0].id, 23, 'Correctly prepended an item.');
    
      table.addAt([v1,v2,v3], 12);
      assert.equal(table.getCount(), 26, 'Added multiple objects at once.');

      table.removeLike(target => target.id > 20);
      assert.equal(table.getCount(), 20, 'Removed the correct number of entries.');
    });
    /*
    QUnit.test(`Get counts.`, (assert) => {
      let table = new Table(sheet, options);
      assert.equal(table.getCount(), 20, 'Returns correct initial count.');
      assert.equal(table.getColumnValues('email').length, 20, 'Returns correct column length.');
    });
    
    QUnit.test(`Basic gets.`, (assert) => {
      let table = new Table(sheet, options);
      assert.equal(table.getFirst()[0].email, 'cfoan0@arizona.edu', 'Returns correct first item.');
      assert.equal(table.getLast()[0].email, 'mkumaarj@nhs.uk', 'Returns correct first item.');
      assert.equal(table.getLike(target => target.id == 1)[0].email, 'cfoan0@arizona.edu', 'Returns correct filtered item.');
    });
    
    QUnit.test(`More gets.`, (assert) => {
      let table = new Table(sheet, options);
      let result = table.getColumns(['id', 'first_name', 'gender']);
      assert.equal(result.length, 20, 'Fetched correct number of rows.');
      assert.equal(result[0].length, 3, 'Fetched correct number of columns.');
      assert.equal(result[4][0], 5, 'Random checking of returned values worked.');
      assert.equal(result[5][1], 'Ulberto', 'Random checking of returned values worked.');
      assert.equal(result[6][2], 'Female', 'Random checking of returned values worked.');
    });

    QUnit.test(`Multi item gets.`, (assert) => {
      let table = new Table(sheet, options);
      let result = table.getFirst(2);
      assert.equal(result[0].id, 1, 'First objects ID is correct.');
      assert.equal(result[1].first_name, 'Fabien', '2nd object first_name is correct.');
  
      result = table.getLast();
      assert.equal(result[0].id, 20, 'Last objects ID is correct.');
  
      result = table.getLast(2);
      assert.equal(result[0].last_name, 'Collcott', '2nd object first_name is correct.');
      assert.equal(result[1].id, 20, 'First objects ID is correct.');
  
      result = table.getSequence(2,2);
      assert.equal(result[0].id, 3, '2nd object first_name is correct.');
      assert.equal(result[1].id, 4, 'First objects ID is correct.');
  
      result = table.getSequence(8,1);
      assert.equal(result[0].first_name, 'Frances', '2nd object first_name is correct.');
    });
    
    QUnit.test(`Basic adds.`, (assert) => {
      let table = new Table(sheet, options);
      table.addAppend([v1]);
      table.addPrepend([v2]);
      table.addAt([v3], 5);
      assert.equal(table.getFirst()[0].id, 22, 'Correctly prepended an item.');
      assert.equal(table.getLast()[0].id, 21, 'Correctly prepended an item.');
      assert.equal(table.getSequence(4, 3)[0].id, 23, 'Correctly prepended an item.');
    });
    
    QUnit.test(`Bulk adds.`, (assert) => {
      let table = new Table(sheet, options);
      table.addAt([v1,v2,v3], 12);
      assert.equal(table.getCount(), 26, 'Added multiple objects at once.');
    });

    QUnit.test(`Removals.`, (assert) => {
      let table = new Table(sheet, options);
      table.removeLike(target => target.id > 20);
      assert.equal(table.getCount(), 20, 'Removed the correct number of entries.');
    });*/
  });
}