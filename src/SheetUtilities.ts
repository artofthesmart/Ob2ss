import { ObjectUtilities } from './ObjectUtilities';
import { Options } from "./Options";

/**
 * Manages most sheet operations for a `table`.
 * ---
 * Most sheet operations happen here, so if you're looking to make Ob2ss faster, this is the place to start. Calls to
 * the sheet are the most time-intensive code.
 */
export class SheetUtilities {
  private sheet:GoogleAppsScript.Spreadsheet.Sheet;
  private options:Options;
  private oUtils:ObjectUtilities;

  constructor(sheet:GoogleAppsScript.Spreadsheet.Sheet, options?:Options){
    this.sheet = sheet;
    this.options = options || new Options();
    this.oUtils = new ObjectUtilities(this.options);
  }

  private cache:{[varable:string]:any} = {};  
  cacheGet<Type>(name:string, generator:() => Type):Type{
    if (this.cache[name] == undefined) this.cache[name] = generator();

    return <Type>this.cache[name];
  }

  /**
   * Updates the cache if the variable already exists.
   * @param name The name of the variable to update.
   * @param generator A function to run to update the variable. If it returns a value, the cache is set to that value.
   * if it returns null, then the variable is not set to that value.
   */
  cacheUpdateRun<Type>(name:string, generator: () => Type){
    if (this.cache[name] != undefined) generator();
  }

  cacheUpdateSet<Type>(name:string, generator: () => Type){
    if (this.cache[name] != undefined) {
      this.cache[name] = generator();
    }
  }

  /////////////////////////////////////////
  // GETTERS   ////////////////////////////
  /////////////////////////////////////////
  get dataRange(){
    return this.cacheGet('dataRange', () => {
      return this.sheet.getDataRange();
    });
  }

  get headerRange(){
    return this.cacheGet('headerRange', () => {
      const headerRow = this.numHeaderRows - this.options.headerOffset; // 1 based.
      const numCols = this.numColumns;
      return this.sheet.getRange(headerRow, 1, 1, numCols);
    });
  }

  get bodyRange(){
    return this.cacheGet('bodyRange', () => {
      const sheet = this.sheet;
      const firstRow = this.numHeaderRows + 1; // 1 based.
      const numRows = this.numBodyRows;
      const numCols = this.numColumns;

      /**
       * New, blank sheets (24 x 1000 cells) appear to have a body but have 0 data rows.
       * Return a 1 cell range in these cases so the pruner can do it's job.
       */
      return numRows == 0 ? sheet.getRange(1, 1, 1, 1) : sheet.getRange(firstRow, 1, numRows, numCols);
    });
  }

  get headerArray(){
    return this.cacheGet('headerArray', () => {
      return this.headerRange.getValues()[0];
    });
  }

  get bodyArray(){
    return this.cacheGet('bodyArray', () => {
      return this.bodyRange.getValues();
    });
  }

  get numHeaderRows(){
    return this.cacheGet('numHeaderRows', () => {
      return this.sheet.getFrozenRows() || 1;
    });
  }

  get numBodyRows(){
    return this.cacheGet('numBodyRows', () => {
      return this.maxRows - this.numHeaderRows; //1-based.
    });
  }

  get numColumns(){
    return this.cacheGet('numColumns', () => {
      return this.sheet.getMaxColumns();
    });
  }

  get maxRows(){
    return this.cacheGet('maxRows', () => {
      return this.dataRange.getNumRows();
    });
  }

  /////////////////////////////////////////
  // WRITERS   ////////////////////////////
  /////////////////////////////////////////
  
  addAt(rows:any[][], index:number){
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
      this.cacheUpdateRun('bodyArray', () => this.cache['bodyArray'].unshift(rows));
      targetRange = this.sheet.getRange(firstBodyRow, 1, numAdds, numCols);
    } 
    else if (index < 0) { // Append.
      sheet.insertRowsAfter(numRows, numAdds);
      this.cacheUpdateSet('bodyArray', () => this.cache['bodyArray'].concat(rows));
      targetRange = this.sheet.getRange(numRows + 1, 1, numAdds, numCols);
    }
    else if (index == 0) { // Prepend.
      sheet.insertRowsBefore(firstBodyRow, numAdds);
      this.cacheUpdateRun('bodyArray', () => this.cache['bodyArray'].unshift(rows));
      targetRange = this.sheet.getRange(firstBodyRow, 1, numAdds, numCols);
    } 
    else if (index > numRows - lastHeaderRow) { // Overflow.
      this.addAt(rows, -1);
    }
    else if (index > 0) { // Valid index.
      const realIndex = index + lastHeaderRow;
      sheet.insertRowsBefore(realIndex, numAdds);
      this.cacheUpdateRun('bodyArray', () => this.cache['bodyArray'].splice(index-1, 0, rows));
      targetRange = this.sheet.getRange(realIndex, 1, numAdds, numCols);
    }

    if (!targetRange) throw 'Could not getBodyRange(), even after adding rows in addAt().';
    targetRange.setValues(rows);

    this.cacheUpdateSet('dataRange', () => this.dataRange.offset(0,0,this.maxRows+numAdds, this.numColumns));
    this.cacheUpdateSet('bodyRange', () => this.bodyRange.offset(0,0,this.numBodyRows+numAdds, this.numColumns));
    this.cacheUpdateSet('maxRows', () => this.maxRows + numAdds);
    this.cacheUpdateSet('numBodyRows', () => this.numBodyRows + numAdds);
  }

  getCount(){
    const value = this.numBodyRows;
    return value;
  }

  getSequence(skip:number, take:number){
    const bodyRange = this.bodyRange;
    const numRows = this.numBodyRows;

    take = Math.min(numRows - skip, take); // Return the lower of the request or num rows remaining.

    const values = bodyRange.offset(skip, 0, take).getValues();
    return values;
  }

  getColumns(headers:string[]){
    // TODO: This uses more memory than necessary, but executes MUCH faster. 
    const allData = this.bodyArray;
    const allHeaders = this.headerArray;
    const headerIndices = headers.map((header) => allHeaders.indexOf(header));

    // For every row and then for every header index identified, return an array of the row's values at that index.
    const values = allData.map((row:any[]) => {
      return headerIndices.map((index) => row[index]);
    });

    return values;
  }

  getLikeObjects(selector:(candidate:any) => boolean){
    const bodyData = this.bodyArray;
    const headers = this.headerArray;

    const allObjects = this.oUtils.convertToObjects(bodyData, headers);

    let filteredObjects = allObjects.filter((obj) => selector(obj));

    return filteredObjects;
  }
  
  getLikeIndices(selector:(candidate:object) => boolean){
    const bodyData = this.bodyArray;
    const headers = this.headerArray;
    const oUtils = this.oUtils;

    const allObjects = oUtils.convertToObjects(bodyData, headers);

    let filteredIndices = allObjects.map((obj:object, index:number) => {
      if (selector(obj)) return index + 1; // 1-based
      else return -1;
    }).filter((index:number) => index != -1);

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

    // Either way this value is now wrong.
    // TODO: Update the array cache rather than invalidating.
    this.cacheUpdateSet('bodyArray', () => null);
  }
  
  removeIndices(indices:number[]){
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
      this.cacheUpdateRun('bodyArray', () => this.cache['bodyArray'].splice(batch[0], length));
    }

    // Already did bodyArray
    this.cacheUpdateSet('maxRows', () => this.maxRows - indices.length);
    this.cacheUpdateSet('numBodyRows', () => this.numBodyRows - indices.length);
    this.cacheUpdateSet('dataRange', () => this.dataRange.offset(0, 0, this.maxRows, this.numColumns));
    this.cacheUpdateSet('bodyRange', () => {
      if (this.hasBody()) return this.bodyRange.offset(0, 0, this.numBodyRows, this.numColumns);
      else return undefined; // Never set a zero-height range.
    });
  }

  ////////////////////////////////
  /////// UTILITIES //////////////
  ////////////////////////////////

  hasBody(){
    let bodyRows = this.numBodyRows;
    let result = this.numBodyRows != 0;

    return result;
  }

  /**
   * Gets the data range of an entire column.
   * @param header The header name of the column.
   * @returns A cell range reference to the column.
   */
  getColumnRange(header:string){
    const sheet = this.sheet;
    const rowIndex = this.numHeaderRows + 1;
    const numRows = this.numBodyRows;
    const columnIndex = this.headerArray.indexOf(header) + 1;

    if (columnIndex == -1) throw `Column "${header}" not found.`;

    const range = sheet.getRange(rowIndex, columnIndex, numRows, 1);

    return range;
  }

  // Returns the column as a single array with each index representing the body row.
  getColumnAsArray(header:string){
    const values = this.getColumnRange(header).getValues().map((row) => row[0]);

    return values;
  }
  
  prepareHeaders(objects:object[]){
    // Necessary properties
    const newHeaders = this.oUtils.getAllHeaders(objects);
    const oldHeaders = this.headerArray;
    const expectedHeaders = this.oUtils.appendMerge(oldHeaders, newHeaders);

    // If the expected headers aren't there, extend headers.
    if (!expectedHeaders.every((header) => oldHeaders.includes(header))){
      this.extendHeaders(expectedHeaders);
    }      
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
    const sheet = this.sheet;
    const newLength = newHeaders.length;
    const oldHeaders = this.headerArray;
    const oldLength = oldHeaders.length;
    const columnsToAdd = newLength - oldLength;

    // TODO: Consider allowing column reduction.
    if (newLength < oldLength) throw 'Cannot reduce columns yet.';

    // Add columns & update range cache.
    if (columnsToAdd > 0) {
      sheet.insertColumnsAfter(oldLength, columnsToAdd);
      this.cacheUpdateSet('headerRange', () => this.headerRange.offset(0, 0, 1, newLength));
    }
    
    this.headerRange.setValues([newHeaders]); // 2d array
    
    this.cacheUpdateSet('dataRange', () => this.dataRange.offset(0, 0, this.maxRows, newLength))
    this.cacheUpdateSet('bodyRange', () => this.bodyRange.offset(0, 0, this.numBodyRows, newLength))
    this.cacheUpdateSet('bodyArray', () => {
      let blankAppendage = new Array(newLength - oldLength);
      this.bodyArray.map((row) => row.concat(blankAppendage))
    });
    this.cacheUpdateSet('headerArray', () => newHeaders);
    this.cacheUpdateSet('numColumns', () => newLength);
  }

  indicesToRanges(indices:number[]){
    const bodyRange = this.bodyRange;
    const numCols = this.numColumns;

    const indexGroups = this.oUtils.bundleIndices(indices);   

    const ranges = indexGroups.map((indexGroup) => {
      // First element in indexGroup is starting row.
      const newRange = bodyRange.offset(indexGroup[0] - 1, 0, indexGroup.length, numCols);
      return newRange;
    });
    
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