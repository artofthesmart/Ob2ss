import { ObjectUtilities } from './ObjectUtilities';
import { Options } from "./Options";
import { Table } from './Table';
import { Timer } from './Timer';

/**
 * Manages most sheet operations for a `table`.
 * ---
 * Most sheet operations happen here, so if you're looking to make Ob2ss faster, this is the place to start. Calls to
 * the sheet are the most time-intensive code.
 */
class SheetUtilities {
  private sheet:GoogleAppsScript.Spreadsheet.Sheet;
  private options:Options;
  private oUtils:ObjectUtilities;

  // Calls to SpreadsheetApp are crazy costly, so this is a caching area.
  private _dataRange?:GoogleAppsScript.Spreadsheet.Range;
  private _headerRange?:GoogleAppsScript.Spreadsheet.Range;
  private _bodyRange?:GoogleAppsScript.Spreadsheet.Range;

  private _headerArray?:string[];
  private _bodyArray?:any[][];
  private _numHeaderRows?:number;
  private _numBodyRows?:number;
  private _numColumns?:number;
  private _maxRows?:number;

  constructor(sheet:GoogleAppsScript.Spreadsheet.Sheet, options?:Options){
    this.sheet = sheet;
    this.options = options || new Options();
    this.oUtils = new ObjectUtilities(this.options);
  }
  
  /**
   * Clears the cache, usually after an add or remove operation.
   * ---
   * TODO: We don't need to invalidate everything every time, but we do anyway.
   */
  clearCache(){
     this._dataRange = undefined;
     this._headerRange = undefined;
     this._bodyRange = undefined;

     this._headerArray = undefined;
     this._bodyArray = undefined;
     this._numHeaderRows = undefined;
     this._numBodyRows = undefined;
     this._numColumns = undefined;
     this._maxRows = undefined;
  }

  get dataRange(){
    let t = new Timer('getDataRange()');
    if (this._dataRange == undefined){
      this._dataRange = this.sheet.getDataRange();
    }
    t.stop();

    if (this._dataRange == undefined) throw '_dataRange not defined';
    return this._dataRange;
  }

  get headerRange(){
    let t = new Timer('getHeaderRange()');
    if (this._headerRange == undefined){
      const headerRow = this.numHeaderRows - this.options.headerOffset; // 1 based.
      const numCols = this.numColumns;
      this._headerRange = this.sheet.getRange(headerRow, 1, 1, numCols);
    }
    t.stop();

    if (this._headerRange == undefined) throw '_headerRange not defined';
    return this._headerRange;
  }

  get bodyRange(){
    let t = new Timer('getBodyRange()');
    if (this._bodyRange == undefined){
      const sheet = this.sheet;
      const firstRow = this.numHeaderRows + 1; // 1 based.
      const numRows = this.numBodyRows;
      const numCols = this.numColumns;

      /**
       * New, blank sheets (24 x 1000 cells) appear to have a body but have 0 data rows.
       * Return a 1 cell range in these cases so the pruner can do it's job.
       * TODO: Harmonize with callers of hasBody() and the pruner so we get a predictable state earlier.
       */
      this._bodyRange = numRows == 0 ? sheet.getRange(1, 1, 1, 1) : sheet.getRange(firstRow, 1, numRows, numCols);
    }
    
    t.stop();
    if (this._bodyRange == undefined) throw '_bodyRange not defined';
    return this._bodyRange;
  }

  get headerArray(){
    let t = new Timer('getHeadersAsArray()');
    if (this._headerArray == undefined){
      this._headerArray = this.headerRange.getValues()[0];
    }
    t.stop();
    if (this._headerArray == undefined) throw '_headerArray not defined';
    return this._headerArray
  }

  get bodyArray(){
    let t = new Timer('getBodyAsArray()');
    if (this._bodyArray == undefined){
      this._bodyArray = this.bodyRange.getValues();
    }
    t.stop();
    if (this._bodyArray == undefined) throw '_bodyArray not defined';
    return this._bodyArray
  }

  get numHeaderRows(){
    if (this._numHeaderRows == undefined) {
      this._numHeaderRows = this.sheet.getFrozenRows() || 1;
    }
    if (this._numHeaderRows == undefined) throw '_numHeaderRows not defined';
    return this._numHeaderRows
  }

  get numBodyRows(){
    let t = new Timer('getNumBodyRows()');
    if (this._numBodyRows == undefined){
      this._numBodyRows = this.maxRows - this.numHeaderRows; //1-based.
    }
    t.stop();
    if (this._numBodyRows == undefined) throw '_numBodyRows not defined';
    return this._numBodyRows
  }

  get numColumns(){
    if (this._numColumns == undefined){
      this._numColumns = this.dataRange.getNumColumns();
    }
    if (this._numColumns == undefined) throw '_numColumns not defined';
    return this._numColumns;
  }

  get maxRows(){
    let t = new Timer('getMaxRows()');
    if (this._maxRows == undefined){
      this._maxRows = this.dataRange.getNumRows();
    }
    t.stop();
    if (this._maxRows == undefined) throw '_maxRows not defined';
    return this._maxRows;
  }

  ////////////////////////////////////////////////////////////
  
  addAt(rows:any[][], index:number){
    let t = new Timer('addAt()');
    const sheet = this.sheet;
    const numAdds = rows.length;
    const lastHeaderRow = this.numHeaderRows;
    const firstBodyRow = this.numHeaderRows + 1;    
    const numRows = this.maxRows;
    const numCols = this.numColumns;
    let targetRange:GoogleAppsScript.Spreadsheet.Range | undefined;

    /**
     * All negative index values are "append". Index of 0 is prepend.
     * All positive integers are fair game, but overflows call `addAt` again
     * as appends. Special care is taken because `bodyRange` may be undefined
     * for sheets with a header and no body rows yet.
     */
    if (!this.hasBody()) { // No body.
      sheet.insertRowsAfter(lastHeaderRow, numAdds);
      targetRange = this.sheet.getRange(firstBodyRow, 1, numAdds, numCols);
    } 
    else if (index < 0) { // Append.
      sheet.insertRowsAfter(numRows, numAdds);
      targetRange = this.sheet.getRange(numRows + 1, 1, numAdds, numCols);
    }
    else if (index == 0) { // Prepend.
      sheet.insertRowsBefore(firstBodyRow, numAdds);
      targetRange = this.sheet.getRange(firstBodyRow, 1, numAdds, numCols);
    } 
    else if (index > numRows - lastHeaderRow) { // Overflow.
      this.addAt(rows, -1);
    }
    else if (index > 0) { // Valid index.
      const realIndex = index + lastHeaderRow;
      sheet.insertRowsBefore(realIndex, numAdds);
      targetRange = this.sheet.getRange(realIndex, 1, numAdds, numCols);
    }

    if (!targetRange) throw 'Could not getBodyRange(), even after adding rows in addAt().';
    targetRange.setValues(rows);

    this.clearCache();
    t.stop();
  }

  getCount(){
    let t = new Timer('getCount()');
    const value = this.numBodyRows;
    t.stop();
    return value;
  }

  getSequence(skip:number, take:number){
    let t = new Timer('getSequence()');
    const bodyRange = this.bodyRange;
    const numRows = this.numBodyRows;

    take = Math.min(numRows - skip, take); // Return the lower of the request or num rows remaining.

    const values = bodyRange.offset(skip, 0, take).getValues();
    t.stop();
    return values;
  }

  getColumns(headers:string[]){
    let t = new Timer('getColumns()');
    // TODO: This uses more memory than necessary, but executes MUCH faster. 
    const allData = this.bodyArray;
    const allHeaders = this.headerArray;
    const headerIndices = headers.map((header) => allHeaders.indexOf(header));

    // For every row and then for every header index identified, return an array of the row's values at that index.
    const values = allData.map((row:any[]) => {
      return headerIndices.map((index) => row[index]);
    });
    t.stop();
    return values;
  }

  getLikeObjects(selector:(candidate:any) => boolean){
    let t = new Timer('getLikeObjects()');
    const bodyData = this.bodyArray;
    const headers = this.headerArray;

    const allObjects = this.oUtils.convertToObjects(bodyData, headers);

    let filteredObjects = allObjects.filter((obj) => selector(obj));
    t.stop();

    return filteredObjects;
  }
  
  getLikeIndices(selector:(candidate:object) => boolean){
    let t = new Timer('getLikeIndices()');
    const bodyData = this.bodyArray;
    const headers = this.headerArray;
    const oUtils = this.oUtils;

    const allObjects = oUtils.convertToObjects(bodyData, headers);

    let filteredIndices = allObjects.map((obj:object, index:number) => {
      if (selector(obj)) return index + 1; // 1-based
      else return -1;
    }).filter((index:number) => index != -1);

    t.stop();
    return filteredIndices;
  }

  ////////////////////////////////
  /////// UPDATES ////////////////
  ////////////////////////////////

  updateLike(selector:(candidate:any) => boolean, mutator:(target:any) => object){
    const filteredIndices = this.getLikeIndices(selector);
    const filteredRanges = this.indicesToRanges(filteredIndices);
    let headers = this.headerArray;

    // We work in phases rather than in series to minimize sheet calls.
    // Get range/mutated object tuples.
    const mutatedObjectGroups = filteredRanges.map((range) => {
      const rows = range.getValues();
      const originalObjects = this.oUtils.convertToObjects(rows, headers);

      const mutatedObjects = originalObjects.map((obj) => {
        return mutator(obj); 
      });     
      
      return {range, mutatedObjects};
    });

    // Prepare headers for writing.
    const allMutatedObjects = mutatedObjectGroups.map(tuple => tuple.mutatedObjects).reduce((accumulator, value) => accumulator.concat(value));

    this.prepareHeaders(allMutatedObjects);    
    headers = this.headerArray; // Refresh

    // Overwrite all objects at each range.
    mutatedObjectGroups.forEach((tuple) => {
      const rowValues = this.oUtils.convertToRows(tuple.mutatedObjects, headers);
      const targetRange = tuple.range.offset(0, 0, rowValues.length, headers.length);
      targetRange.setValues(rowValues);
    });

    this.clearCache();
  }
  
  removeIndices(indices:number[]){
    let t = new Timer('removeIndices()');

    const bundledIndices = this.oUtils.bundleIndices(indices);
    const firstBodyRow = this.numHeaderRows + 1;

    // Delete batches of rows. Must be bottom to top to ensure indices don't shift
    // out from under the process. Highest to lowest.
    const orderedBundles = bundledIndices.sort((a,b) => a[0] - b[0]).reverse();
    for (let i = 0; i < orderedBundles.length; i++){
      const batch = orderedBundles[i];
      const length = batch.length;
      const row = batch[0] + firstBodyRow - 1; // The last batch element is the highest integer- our target row.

      this.sheet.deleteRows(row, length);
    }

    t.stop();
    this.clearCache();
  }

  ////////////////////////////////
  /////// UTILITIES //////////////
  ////////////////////////////////

  hasBody(){
    let t = new Timer('hasBody()');
    let result = this.numBodyRows != 0;
    t.stop();
    return result;
  }

  /**
   * Gets the data range of an entire column.
   * @param header The header name of the column.
   * @returns A cell range reference to the column.
   */
  getColumnRange(header:string){
    let t = new Timer('getColumnRange()');
    const sheet = this.sheet;
    const rowIndex = this.numHeaderRows + 1;
    const numRows = this.numBodyRows;
    const columnIndex = this.headerArray.indexOf(header) + 1;

    if (columnIndex == -1) throw `Column "${header}" not found.`;

    const range = sheet.getRange(rowIndex, columnIndex, numRows, 1);
    t.stop();
    return range;
  }

  // Returns the column as a single array with each index representing the body row.
  getColumnAsArray(header:string){
    let t = new Timer('getColumnAsArray()');
    const values = this.getColumnRange(header).getValues().map((row) => row[0]);
    t.stop();
    return values;
  }
  
  prepareHeaders(objects:object[]){
    let t = new Timer('prepareHeaders()');

    // Necessary properties
    const newHeaders = this.oUtils.getAllHeaders(objects);
    const oldHeaders = this.headerArray;
    const expectedHeaders = this.oUtils.appendMerge(oldHeaders, newHeaders);

    // If the expected headers aren't there, extend headers.
    if (!expectedHeaders.every((header) => oldHeaders.includes(header))){
      this.extendHeaders(expectedHeaders);
      this.clearCache();
    }      
    
    t.stop();
  }

  /**
   * Inserts columns to accommodate new fields.
   * ---
   * When objects are being written, sometimes they'll have new or different fields. Headers are always alphabetical to
   * elegantly portray arrays. So sometimes new fields must be added/inserted and that means inserting new columns and
   * shifting data over. 
   * 
   * Columns can only be extended, never reduced. It would be costly to always check for the "last survivor" of a field.
   * TODOs: Consider removing blank columns. Consider clustering (e.g. adding a new array element always happens at the
   * end of the headers, isolating like data).
   * @param newHeaders The new, combined set of new and old headers you want to replace the existing headers with. Must
   * have new headers at the end of the array of old headers.
   */
  extendHeaders(newHeaders:string[]){
    let t = new Timer('extendHeaders()');

    const sheet = this.sheet;
    const newLength = newHeaders.length;
    const oldHeaders = this.headerArray;
    const oldLength = oldHeaders.length;

    let headerRange = this.headerRange;

    // TODO: Consider allowing field reduction.
    if (newLength < oldLength) throw 'Cannot reduce columns yet.';
    if (newHeaders.every((header) => oldHeaders.includes(header))) return;

    // Insert new columns to support the combined length and update the range.
    sheet.insertColumnsAfter(oldLength, newLength - oldLength);
    headerRange = headerRange.offset(0, 0, 1, newLength); // Faster.
    
    headerRange.setValues([newHeaders]); // 2d array
    this.clearCache();
    t.stop();
  }

  indicesToRanges(indices:number[]){
    let t = new Timer('indicesToRanges()');

    const bodyRange = this.bodyRange;
    const numCols = this.numColumns;

    const indexGroups = this.oUtils.bundleIndices(indices);   

    const ranges = indexGroups.map((indexGroup) => {
      // First element in indexGroup is starting row.
      const newRange = bodyRange.offset(indexGroup[0] - 1, 0, indexGroup.length, numCols);
      return newRange;
    });
    
    t.stop();
    return ranges;
  }

  cleanup(sheet:GoogleAppsScript.Spreadsheet.Sheet){
    const dataRange = this.bodyRange;

    const maxCols = sheet.getMaxColumns();
    const maxRows = sheet.getMaxRows();    
    const numCols = dataRange.getLastColumn();
    const numRows = dataRange.getLastRow();
    if (maxRows > numRows) sheet.deleteRows(numRows + 1, maxRows - numRows);
    if (maxCols > numCols) sheet.deleteColumns(numCols + 1, maxCols - numCols);
  }
}

export {SheetUtilities}