import { SheetUtilities } from "../SheetUtilities";

/**
 * A set of independent tests of Sheet Utilities.
 * ---
 * These test core functions, not secondary ones. e.g. We test `getBodyRange` but not `getBodyAsArray` because
 * `getBodyAsArray` has no meaningful logic in it besides fetching the values in the range.
 */
function testSheetUtilities(QUnit:QUnit) {
  let spreadsheetId:string;
  let spreadsheet:GoogleAppsScript.Spreadsheet.Spreadsheet;

  // TEST RANGEFINDING
  QUnit.module("Sheet Utilities: bodyRange");
  spreadsheetId = '1SQdNXQetSFytNzRtwXV38orFAODaqpMe2XeY6kBS83g';
  spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  
  QUnit.test("Returns the correct bodyRange with no frozen rows.", (assert) => {
    let sheet = spreadsheet.getSheetByName('default'); if (!sheet) return;

    let sUtils = new SheetUtilities(sheet);
    let bodyRange = sUtils.bodyRange;
    let result = bodyRange.getA1Notation();
    let expected = 'A2:F21';
    
    assert.equal(result, expected, 'Body range returns expected A1-notated range with no frozen rows.');

    sheet = spreadsheet.getSheetByName('default'); if (!sheet) return;

    sUtils = new SheetUtilities(sheet);
    bodyRange = sUtils.bodyRange;
    result = bodyRange.getA1Notation();
    expected = 'A2:F21';
    assert.equal(result, expected, 'Body range returns expected A1-notated range with 1 frozen rows.');

    sheet = spreadsheet.getSheetByName('default'); if (!sheet) return;

    sUtils = new SheetUtilities(sheet);
    bodyRange = sUtils.bodyRange;
    result = bodyRange.getA1Notation();
    expected = 'A2:F21';
    assert.equal(result, expected, 'Body range returns expected A1-notated range with several frozen rows.');
  });

  QUnit.module("Sheet Utilities: getColumnRange()");
  QUnit.test("Returns the correct columnRange.", (assert) => {
    const sheet = spreadsheet.getSheetByName('default');
    if (!sheet) return;

    const sUtils = new SheetUtilities(sheet);
    let columnRange = sUtils.getColumnRange('email');
    let result = columnRange.getA1Notation();
    let expected = 'D2:D21';
    assert.equal(result, expected, 'Column range returns expected A1-notated range.');
  });

  QUnit.module("Sheet Utilities: headerRange");
  //spreadsheetId = '1SQdNXQetSFytNzRtwXV38orFAODaqpMe2XeY6kBS83g';
  //spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  QUnit.test("Returns the correct header range.", (assert) => {
    let sheet = spreadsheet.getSheetByName('default'); if (!sheet) return;
    let sUtils = new SheetUtilities(sheet);
    let headerRange = sUtils.headerRange;
    let result = headerRange.getA1Notation();
    let expected = 'A1:F1';
    assert.equal(result, expected, 'Header range returns expected A1-notated range.');

    sheet = spreadsheet.getSheetByName('single_frozen');if (!sheet) return;
    sUtils = new SheetUtilities(sheet);
    headerRange = sUtils.headerRange;
    result = headerRange.getA1Notation();
    expected = 'A1:F1';
    assert.equal(result, expected, 'Header range returns expected A1-notated range given a frozen row.');

    sheet = spreadsheet.getSheetByName('multi_frozen');if (!sheet) return;
    sUtils = new SheetUtilities(sheet);
    headerRange = sUtils.headerRange;
    result = headerRange.getA1Notation();
    expected = 'A3:F3';
    assert.equal(result, expected, 'Header range returns expected A1-notated range given multiple frozen rows.');
  });

  QUnit.module("Sheet Utilities: getCount()");
  //spreadsheetId = '1SQdNXQetSFytNzRtwXV38orFAODaqpMe2XeY6kBS83g';
  //spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  QUnit.test("Returns the correct count.", (assert) => {
    const sheet = spreadsheet.getSheetByName('default'); if (!sheet) return;
    const sUtils = new SheetUtilities(sheet);
    const result = sUtils.getCount();
    const expected = 20;
    assert.equal(result, expected, 'Returns correct count.');
  });

  QUnit.module("Sheet Utilities: getLikeIndices() & getLikeObjects()");
  QUnit.test("Returns the correct indices.", (assert) => {
    const sheet = spreadsheet.getSheetByName('default'); if (!sheet) return;
    const sUtils = new SheetUtilities(sheet);
    let result = sUtils.getLikeIndices((obj:any) => obj.id < 5);
    assert.equal(result.length, 4, 'Returns correct count.');
    assert.equal(result[0], 1, 'Returns correct index start.');
    assert.equal(result[3], 4, 'Returns correct index end.');
  });

  QUnit.module("Sheet Utilities: indicesToRanges()");

  QUnit.test("Returns correct ranges.", (assert) => {
    const sheet = spreadsheet.getSheetByName('default'); if (!sheet) return;
    const sUtils = new SheetUtilities(sheet);
    let result = sUtils.indicesToRanges([1,2,3, 10,11]);
    assert.equal(result.length, 2, 'Returns correct number of ranges.');

    result = sUtils.indicesToRanges([1,2, 4,5, 7,8,9]);
    assert.equal(result.length, 3, 'Returns correct number of ranges.');
    assert.equal(result[0].getA1Notation(), 'A2:F3', 'Returns correct A1 range.');
    assert.equal(result[1].getA1Notation(), 'A5:F6', 'Returns correct A1 range.');
    assert.equal(result[2].getA1Notation(), 'A8:F10', 'Returns correct A1 range.');
  });

  QUnit.module("Sheet Utilities: getSequence()");
  //spreadsheetId = '1SQdNXQetSFytNzRtwXV38orFAODaqpMe2XeY6kBS83g';
  //spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  QUnit.test("Returns correct rows.", (assert) => {
    const sheet = spreadsheet.getSheetByName('default'); if (!sheet) return;
    const sUtils = new SheetUtilities(sheet);
    let result = sUtils.getSequence(3,2);
    assert.equal(result.length, 2, 'Returns correct number of rows.');
    assert.equal(result[0][0], 4, 'Returns the correct rows of the sheet.');
  });

  // TEST ADDING & REMOVING

  QUnit.module("Sheet Utilities: addAt(), removeIndices()");
  QUnit.test("Adds candidate rows properly.", (assert) => {
    const sheet = spreadsheet.getSheetByName('default')?.copyTo(spreadsheet); if (!sheet) return;
    const sUtils = new SheetUtilities(sheet);
    const row = [21, 'Tester', 'Martinson', 'testvalue@gmail.com', 'Male', '10.123.42.111'];

    sUtils.addAt([row], 10);

    let count = sUtils.getCount();
    assert.equal(count, 21, 'Returns correct number of records.');

    sUtils.removeIndices([10]);

    count = sUtils.getCount();
    assert.equal(count, 20, 'Returns correct number of records.');

    const rows = [
      [21, 'Tester', 'Martinson', 'testvalue@gmail.com', 'Male', '10.123.42.111'],
      [22, 'Tester2', 'Martinson2', 'testvalue@gmail.com', 'Male', '10.123.42.111'],
      [23, 'Tester3', 'Martinson3', 'testvalue@gmail.com', 'Male', '10.123.42.111'],
      [24, 'Tester3', 'Martinson3', 'testvalue@gmail.com', 'Male', '10.123.42.111'],
    ];

    sUtils.addAt(rows, 10);

    count = sUtils.getCount();
    assert.equal(count, 24, 'Returns correct number of records.');

    sUtils.removeIndices([10, 11, 12, 13]);

    count = sUtils.getCount();
    assert.equal(count, 20, 'Returns correct number of records.');
    spreadsheet.deleteSheet(sheet);
  });

  QUnit.module("Sheet Utilities: extendHeaders()");
  QUnit.test("Takes no action for null requests.", (assert) => {
    const sheet = spreadsheet.getSheetByName('single_frozen'); if (!sheet) return;
    const sUtils = new SheetUtilities(sheet);

    let newHeaders = ['id', 'first_name', 'last_name', 'email', 'gender', 'ip_address'];
    sUtils.extendHeaders(newHeaders);
    let result = sUtils.headerArray;

    assert.deepEqual(result, newHeaders, 'Headers do not change for identical header writing.');
  });

  QUnit.test("Properly extends headers.", (assert) => {
    const sheet = spreadsheet.getSheetByName('single_frozen'); if (!sheet) return;
    const sUtils = new SheetUtilities(sheet);
    
    let newHeaders = ['id', 'first_name', 'last_name', 'email', 'gender', 'ip_address'];
    let result = sUtils.headerArray;
    assert.deepEqual(result, newHeaders, 'Ensure headers are in the correct starting state.');

    newHeaders = ['id', 'first_name', 'last_name', 'email', 'gender', 'ip_address', 'pet'];
    sUtils.extendHeaders(newHeaders);
    result = sUtils.headerArray;
    assert.deepEqual(result, newHeaders, 'Headers work for adding 1 column.');

    newHeaders = ['id', 'first_name', 'last_name', 'email', 'gender', 'ip_address', 'pet', 'address', 'phone_number', 'work_address'];
    sUtils.extendHeaders(newHeaders);
    result = sUtils.headerArray;
    assert.deepEqual(result, newHeaders, 'Headers work for adding several columns.');
    
    sheet.deleteColumns(7,4);
  });

  QUnit.module("Sheet Utilities: getBodyAsArray()");
}