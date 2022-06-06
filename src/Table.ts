import { ObjectUtilities } from './ObjectUtilities';
import { Options } from './Options'
import { SheetUtilities } from './SheetUtilities';
import { Timer } from './Timer';

/**
 * This class represents a virtual table on top of a sheet.
 * ---
 * It primarily orchestrates operations, leaving actual sheet interactions and object flattening/unflattening to utility
 * classes. Some orchestration is actually just routing specific functions to general ones, like `addAppend` is really
 * just a specialization of `addAt`. Table also protects its utilities from most invalid inputs, though utilities will
 * have error checking during processing.
 */
class Table {
  private sheet:GoogleAppsScript.Spreadsheet.Sheet;
  private options:Options;
  private oUtils:ObjectUtilities;
  private sUtils:SheetUtilities;

  constructor(sheet:GoogleAppsScript.Spreadsheet.Sheet, options?:Options){
    this.sheet = sheet;
    this.options = options || new Options();
    this.oUtils = new ObjectUtilities(this.options);
    this.sUtils = new SheetUtilities(this.sheet, this.options);

    // Prune empty rows and columns. They mess up the math.
    if (!this.sUtils.hasBody()) return;
    this.sUtils.cleanup(sheet);
  }

  ////////////////////////////////
  /////// WRITE //////////////////
  ////////////////////////////////

  addAppend(objects:object[]){
    this.addAt(objects, -1);
  }

  addPrepend(objects:object[]){
    this.addAt(objects, 0);
  }

  addAt(objects:object[], index:number){
    if (objects.length == 0) return; // Skip empties.

    this.sUtils.prepareHeaders(objects);
    const headers = this.sUtils.headerArray;
    const rowData = this.oUtils.convertToRows(objects, headers);
    this.sUtils.addAt(rowData, index);
  }

  ////////////////////////////////
  /////// READ ///////////////////
  ////////////////////////////////


  getCount(){
    if (!this.sUtils.hasBody()) return 0;
    
    return this.sUtils.getCount();
  }

  getAll(){
    if (!this.sUtils.hasBody()) return [];

    const bodyRange = this.sUtils.bodyArray;
    const headers = this.sUtils.headerArray;
    const allObjects = this.oUtils.convertToObjects(bodyRange, headers);

    return allObjects;
  }

  getFirst(count?:number){
    if (count == undefined) count = 1;
    if (count == 0) return [];

    return this.getSequence(0, count);
  }

  getLast(count?:number){
    if (count == undefined) count = 1;
    if (count == 0) return [];

    const numObjects = this.getCount();
    return this.getSequence(numObjects-count, count);
  }

  getSequence(skip:number, take:number){
    if (!this.sUtils.hasBody()) return [];

    const numRows = this.getCount();
    const headers = this.sUtils.headerArray;

    skip = Math.max(0, skip);
    take = Math.max(0, take);

    if (take == 0) return [];
    if (skip >= numRows) return [];

    take = Math.min(numRows - skip, take); // The lower of the request or num rows remaining.
    const rows = this.sUtils.getSequence(skip, take);
    let objects = this.oUtils.convertToObjects(rows, headers);
    return objects;
  }

  getColumns(headers:string[]){
    if (!this.sUtils.hasBody()) return [];

    return this.sUtils.getColumns(headers);
  }

  getColumnValues(header:string){
    if (!this.sUtils.hasBody()) return [];

    return this.sUtils.getColumnAsArray(header);
  }
  
  getLike(selector:(target:any) => boolean){
    if (!this.sUtils.hasBody()) return [];

    return this.sUtils.getLikeObjects(selector);
  }
  
  /**
   * TODO: `updateLike` assumes every object gets mutated, but that's not necessarily true. And in assuming that it
   * does, that means every range gets overwritten completely even when it's not needed. That can be inefficient.
   * Change this function to understand when an object was changed and just write those objects.
   */ 
  updateLike(selector:(candidate:any) => boolean, mutator:(target:any) => object){
    if (!this.sUtils.hasBody()) return;

    this.sUtils.updateLike(selector, mutator);
  }

  removeLike(selector:(candidate:any) => boolean){
    if (!this.sUtils.hasBody()) return;

    const filteredIndices = this.sUtils.getLikeIndices(selector);
    if (filteredIndices.length == 0) return;
    this.sUtils.removeIndices(filteredIndices);
  }

  clear(){
    this.sheet.clear();
    this.sUtils.clearCache();
  }

  destroy(){
    this.sheet.getParent().deleteSheet(this.sheet);
  }
}

export {Table}