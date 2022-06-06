import {Options} from './Options';

/**
 * Functions that flatten/unflatten objects.
 * ---
 * Objects must be flattened into rows in order to write to a spreadsheet, and must be unflattened in order to return
 * them back as objects.
 * 
 * **LIMITATIONS**
 * 1. Only strings, numbers, booleans, and arrays of those types may be written and read. Yes really.
 */
class ObjectUtilities {
  options:Options;

  constructor(options?:Options){
    this.options = options || new Options();
  }

  convertToRows(objects:object[], headers:string[]){
    return objects.map((obj) => this.objectToRow(obj, headers));
  }

  convertToObjects(rows:any[][], headers:string[]):any[]{
    return rows.map((row) => this.rowToObject(row, headers));
  }

  // TODO: Not especially efficient. Getting headers should be seperate from flattening.
  getAllHeaders(objects:object[]){
    const flattenedObjects = objects.map((obj) => this.flatten(obj));
    const allKeys = flattenedObjects.map((flatObj) => Object.keys(flatObj)).flatMap((keys) => keys);
    const uniqueKeys = [...new Set(allKeys)].sort();
    return uniqueKeys;
  }

  /**
   * Takes two lists of headers (one from the sheet and one from new objects to be written) and combines them by
   * de-duping and appending remaining new headers to the end of the list.
   * @param existingHeaders The existing set of headers from the sheet.
   * @param newHeaders New headers you want to accommodate.
   * @returns `existingHeaders` but with unique, new values from `newHeaders` at the end.
   */
  appendMerge(existingHeaders:string[], newHeaders:string[]){
    // If the only item is a blank, we're writing headers for the first time. Don't keep that around.
    if (existingHeaders.length == 1 && existingHeaders[0] == '')
      existingHeaders = [];

    const newValues = newHeaders.filter(header => !existingHeaders.includes(header));
    return existingHeaders.concat(newValues);
  }

  ////////

  objectToRow(obj:object, headers:string[]){
    let result:string[] = [];
    let flatObject = this.flatten(obj);

    for (let i = 0; i < headers.length; i++){
      let header = headers[i];
      let value = flatObject[header];

      if (value == null || value == undefined)
        result.push('');
      else
        result.push(value);
    }
    
    return result;
  }

  rowToObject(row:any[], headers:string[]):object{
    if (row.length != headers.length)
      throw 'Header and row data length mismatch during rowToObject().';

    const namedFields = row.map((field, index) => {
      let header = headers[index];
      if (field !== '') return {header, field}; // Blanks never come back.
      else return null;
    });

    const flatObject:{[key:string]:any} = {};
    namedFields.forEach((tuple) => {
      if (tuple){
        flatObject[tuple.header] = tuple.field;
      }
    });

    return this.unflatten(flatObject);
  }

  flatten(target:any){
    let accumulator:{[key:string]:any} = {};

    this.innerFlatten(accumulator, target, '', '');

    return accumulator;
  }

  innerFlatten(accumulator:{[key:string]:any}, target:any, ancestry:string, name:string){
    const type = typeof target;

    switch (type) {
      // Drop these outright.  TODO: Or don't. 
      case 'undefined':
      case 'function':
      case 'symbol':
        return null;

      // Special processing
      case 'object':
        this.flattenObject(accumulator, target, ancestry, name);
        break;

      // Write to accumulator: bigint, bool, number, or string.
      case 'bigint':
      case 'boolean':
      case 'number':
      case 'string':
        if (target === '') return;
        name = name.replace(/\./g, '/.');
        const key = (ancestry && name) ? ancestry + '.' + name : name;
        accumulator[key] = target;
      
      default:        
        break;
    }
  }
  
  flattenObject(accumulator:{[key:string]:any}, target:any, ancestry:string, name:string){
    const isArray = Array.isArray(target);
    name = name.replace(/\./g, '/.');
    const key = (ancestry && name) ? ancestry + '.' + name : name;

    // Null: NO NULLs.
    if (target == null) return;

    // Dates: Dates get reduced to UTC timestamps.
    if (Object.prototype.toString.call(target) == '[object Date]'){
      accumulator[key] = target.toString();
    }

    // Arrays and other objects
    let iterable = isArray ? target : Object.keys(target);
    if (isArray){
      for (var i = 0; i < target.length; i++){
        this.innerFlatten(accumulator, target[i], key, i.toString());
      }
        
    } else {
      for (var localProperty in target) {
        this.innerFlatten(accumulator, target[localProperty], key, localProperty);
      }
    }
  }

  isKeyPartOfArray(key:string, allKeys:string[]){
    let keyParts = key.split('.');
    // Not a number? It's an object.
    if (isNaN(parseInt(keyParts[keyParts.length-1]))) return false;

    // Confirm that all equal depth keys are numbers, else this is an object.
    const siblingKeys = allKeys.filter((candidate) => {
      // All values except the last- in order- should match. That's siblings.
      return JSON.stringify(candidate.split('.').slice(0, -1)) == JSON.stringify(key.split('.').slice(0, -1));
    });

    return siblingKeys.every((key) => {
      let siblingValue = key.split('.').pop() || '';
      return !isNaN(parseInt(siblingValue));
    });
  }

  unflatten(flatObj:{[key:string]:any}):object{
    const keys = Object.keys(flatObj);
    let result:{[key:string]:any} = {};

    keys.forEach((key) => {
      let parent = result;
      let child = '';
      let keyParts = key.split('.');

      for (let i = 0; i < keyParts.length; i++){
        let currentKey = keyParts.slice(0, i + 1).join('.'); // Key to this point.
        let isArray = this.isKeyPartOfArray(currentKey, keys);
        if (!parent[child]) parent[child] = isArray ? [] : {};
        parent = parent[child];
        child = keyParts[i];
      }

      if (flatObj[key] !== '') {
        parent[child] = flatObj[key];
      } else {
        delete parent[child];
      }
    });

    return result[''];
  }

  bundleIndices(indices:number[]){
    indices = indices.sort((a,b) => a - b); // I shouldn't have to do this.
    return indices.reduce((accumulator:number[][], i) => {
      const lastSubArray = accumulator[accumulator.length - 1];
      
      if(!lastSubArray || lastSubArray[lastSubArray.length - 1] !== i - 1) {
        let newArray:number[] = [];
        accumulator.push(newArray);
      } 
      
      accumulator[accumulator.length - 1].push(i);
      
      return accumulator;
    }, []);
  }
}

export {ObjectUtilities}