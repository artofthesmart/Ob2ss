import { Options } from "./Options";
import { Table } from "./Table";

/**
 * Backend class captures and routes incoming requests from `api.ts`.
 * ---
 * In particular, it's responsible for managing default sheets and tables.
 */
export class Backend {
  private spreadsheet?:GoogleAppsScript.Spreadsheet.Spreadsheet;
  private options:Options;

  constructor(options?:Options){
    this.options = options || new Options();
  }

  // Need getters for tables and the usual pattern was messing up during compilation (i.e. ignoring the private var and
  // creating a getter loop).
  private _tables?:{[name:string]: Table};
  private get tables():{[name:string]: Table} {
    // Make sure we've loaded a spreadsheet.
    if (!this._tables){
      const defaultSpreadsheet = this.getDefaultSpreadsheet();
      this.open(defaultSpreadsheet);
    }
    
    // Quiets the compiler.
    if (!this._tables) throw 'Could not initialize tables in get tables().';
    return this._tables;
  }

  /**
   * Gets a default spreadsheet if one is not provided during construction. Good for rapid development and low-overhead testing.
   * 
   * If this script is *bound* to a spreadsheet that will be returned first. Otherwise if a spreadsheet was created for
   * this script previously, that will be returned. Otherwise a new sheet will be created for this script.
   */
   private getDefaultSpreadsheet():GoogleAppsScript.Spreadsheet.Spreadsheet {
    const boundSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const scriptId = ScriptApp.getScriptId();
    const scriptName = DriveApp.getFileById(scriptId).getName();
    const defaultFileName = "Ob2ss data: " + scriptName;
    const existingFiles = DriveApp.getFilesByName(defaultFileName);
    
    // Return the bound Spreadsheet if it's available.
    if (boundSpreadsheet) return boundSpreadsheet;
    
    // Return an existing "default" sheet if possible.
    if (existingFiles.hasNext()) {
      return SpreadsheetApp.open(existingFiles.next());
    }
    
    // Create a new "default" sheet and use that.
    return SpreadsheetApp.create(defaultFileName, 1, 1);
  }
   
  /**
   * The default sheet name to write to if a global call is made directly to a function like `addAt`. If a sheet with
   * this name doesn't exist, one will be created.
   */
  private defaultTableName:string = "default";
  get default():Table{
    return this.getTableByName(this.defaultTableName);
  }

  // Set the default table name in case user calls methods without using `open` first.
  doSetDefaultTable(tableName:string){
    this.defaultTableName = tableName;
  }

  /**
   * Fetches an Ob2ss table where you can write and read objects.
   * ---
   * This is optional and returns a table you can call functions against like `addAppend()` or `deleteLike()`. If you
   * call those functions directly against Ob2ss, they'll run on the default table. You can set the default table with
   * `doSetDefaultTable()` to simplify your code. If you do not use `getTableByName()` and do not use
   * `doSetDefaultTable()` then Ob2ss will operate on a table called `default`.
   * 
   * _Example:_
   * ```
   * Ob2ss.getTableByName('cars').addAppend(obj);
   * ```
   * 
   * is the same as
   * 
   * ```
   * Ob2ss.doSetDefaultTable('cars');
   * Ob2ss.addAppend(obj);
   * ```
   */
  getTableByName(name:string){
    const tables = this.tables;
    if (!tables[name]){
      const newSheet = this.createSheet(name);
      const newTable = new Table(newSheet, this.options);
      this.tables[name] = newTable;
    }
    return tables[name];
  }

  /**
   * Creates a new Google sheet suitable for Ob2ss.
   * ---
   * The new sheet has only one cell (one column, one row).
   * @param {string} name The name of the table (sheet) to create.
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} A new Google sheet.
   */
  createSheet(name:string){
    // No real need to null check this.spreadsheet. It cannot be null at this point, but the compiler complains.
    if (!this.spreadsheet) throw `Ob2ss target spreadsheet not found during createSheet()`;
    const newSheet = this.spreadsheet.insertSheet(name);
    const numRows = newSheet.getMaxRows();
    const numCols = newSheet.getMaxColumns();

    // New sheets should have just one cell.
    newSheet.deleteRows(1, numRows - 1);
    newSheet.deleteColumns(1, numCols - 1);

    return newSheet;
  }

  /**
   * Open the provided spreadsheet as a collection of object tables.
   */
  open(spreadsheet:GoogleAppsScript.Spreadsheet.Spreadsheet){
    this.spreadsheet = spreadsheet;
    const sheets = spreadsheet.getSheets();
    const tables = Object.assign({}, ...sheets.map((sheet) => ({
      [sheet.getName()]: new Table(sheet, new Options())
    }))); // Wrap all sheets into tables and key them by name. 
    this._tables = tables;
  }

  // Clears the requested sheet.
  doClear(tableName:string){
    this.getTableByName(tableName).clear();
  }

  // Deletes the requested sheet.
  doDestroy(tableName:string){
    this.getTableByName(tableName).destroy();
    delete this.tables[tableName];
  }
}