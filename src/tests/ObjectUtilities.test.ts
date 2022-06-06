import { ObjectUtilities } from '../ObjectUtilities';

/**
 * These are local tests run in Jest so they're extra fast. We can do this because these utilities don't interact with
 * spreadsheets at all.
 */

let trickyTestObj = {
  'string': '/notreally/&bsp;',
  'equation': '=ISNA("12")',
  'naughtyArray': [ , 2, 3, "4"],
  'dates': [ new Date(), new Date("123456")]
};

trickyTestObj.naughtyArray[-2] = "-2";

let fullTestObj = {
  '_id': '599f8067819d8c16890724b2',
  'index': 4,
  'isActive': false,
  'balance': '$3,854.25',
  'picture': 'http://placehold.it/32x32',
  'age': 35,
  'email': 'christihewitt@extremo.com',
  'phone': '+1 (991) 569-2390',
  'address': '551 India Street, Devon, South Carolina, 9906',
  'about': 'In aliqua ut incididunt aute eiusmod aliqua anim reprehenderit sunt dolore aliqua culpa. Dolor aliqua esse eiusmod non occaecat pariatur fugiat. Ipsum mollit non do aliqua mollit cillum ex voluptate deserunt voluptate labore fugiat. Magna eiusmod eu dolore nostrud minim magna commodo cupidatat. Pariatur ea dolore nulla pariatur veniam Lorem qui eiusmod eu.\r\n',
  'registered': '2016-07-12T07:50:40 +07:00',
  'latitude': -54.750559,
  'longitude': -33.84377,
  'tags': [
    'esse',
    'quis',
    'dolor',
    'fugiat',
    'tempor'
  ],
  'friends': [
    {
      'id': 0,
      'name': 'Maryann Patel'
    },
    {
      'id': 1,
      'name': 'Gill Roberson'
    },
    {
      'id': 2,
      'name': 'Lorrie Good',
      'special': true
    }
  ]
};

let util = new ObjectUtilities();

describe('flatten', () => {
  it('should not change an empty object.', () => {
    let object = {};
    expect(util.flatten(object)).toStrictEqual(object);
  });

  it('should flatten an array', () => {
    let array = [0,1,2,3];
    let expected = {"0":0, "1":1, "2":2, "3":3}
    let result = util.flatten(array);
    expect(result).toStrictEqual(expected);
  });

  it('should flatten an object with children', () => {
    let array = {a:[0,1,2,3], child: { a:12, b:14}};
    let expected = {"a.0":0, "a.1":1, "a.2":2, "a.3":3, "child.a":12, "child.b":14};
    let result = util.flatten(array);
    expect(result).toStrictEqual(expected);
  });

  it('should not change already flat objects', () => {
    let target = { temperature: 31 };
    let expected = target;
    let result = util.flatten(target);;
    expect(result).toStrictEqual(expected);
  });

  it('should flatten child arrays', () => {
    let target = { temperature: 31, 'times': ['12:41', '2:25'] };
    let expected = { temperature: 31, 'times.0': '12:41', 'times.1': '2:25' };
    let result = util.flatten(target);
    expect(result).toStrictEqual(expected);
  });

  it('should flatten deeply nested arrays', () => {
    let target = { arr: [1, 2, 0], arr2: { a: 1, b: [1, 2, {a: 1}] }, };
    let expected = { "arr.0": 1, "arr.1": 2, "arr.2": 0, "arr2.a": 1, "arr2.b.0": 1, "arr2.b.1": 2, "arr2.b.2.a": 1,};
    let result = util.flatten(target);
    expect(result).toStrictEqual(expected);
  });

  it('should still work with ugly keys', () => {
    let target = { '=!@#horrible': 31 };
    let expected = target;    
    let result = util.flatten(target);
    expect(result).toStrictEqual(expected);
  });

  it('should flatten an object with a property name with dots', () => {
    let obj = { '3.1':31, 2:'ninety' };
    let expected = { '3/.1':31, 2:'ninety' };
    let result = util.flatten(obj);
    expect(result).toStrictEqual(expected);
  });

  it('should flatten an object with many dot-notation property names.', () => {
    let array = {a:[0,1,2], 'child.of.mine': { a:12, 'woah.oh':'sweet.child.of.mine'}};
    let expected = {"a.0":0, "a.1":1, "a.2":2, "child/.of/.mine.a":12, "child/.of/.mine.woah/.oh":'sweet.child.of.mine'};
    let result = util.flatten(array);
    expect(result).toStrictEqual(expected);
  });

  it('should be faithful with an object with lots of nested dot property names', () => {
    let obj = { '3.1':31, '3.2':[1, 2, {'1...1': 1}], 2:'44.1' };
    let expected = { '3/.1':31, '3/.2.0':1, '3/.2.1':2, '3/.2.2.1/././.1':1, 2:'44.1' };
    let result = util.flatten(obj);
    expect(result).toStrictEqual(expected);
  });  

  it('should handle dates via toString()', () => {
    let target = { 'date': new Date() };
    let expected = { 'date': target.date.toString()};    
    let result = util.flatten(target);
    expect(result).toStrictEqual(expected);
  });

  it('should trim/filter a sparse object', () => {
    let target = {a:1, b:undefined, c:null, d:'', e:{a:1, b:undefined, c:null, d:'', e:0, f:'0'}};
    let expected = {'a':1, 'e.a':1, 'e.e':0, 'e.f':'0'};
    let result = util.flatten(target);
    expect(result).toStrictEqual(expected);
  });
});

describe('isKeyPartOfArray', () => {
  it('should be accurate for a trivial example', () => {
    let key = 'parent.0';
    let keys = ['parent.0', 'parent.1', 'parent.2'];
    let result = util.isKeyPartOfArray(key, keys);
    expect(result).toBeTruthy();
  });

  it('should be accurate for a multi-part example', () => {
    let key = 'parent.0';
    let keys = ['parent.0', 'parent.1', 'parent.2', 'parent.child.value', 'parent.child.value2',];
    let result = util.isKeyPartOfArray(key, keys);
    expect(result).toBeTruthy();
  });

  it('should be accurate for a mid level non-array', () => {
    let key = 'parent.child.0';
    let keys = ['parent.0', 'parent.1', 'parent.2', 'parent.child.value', 'parent.child.value2, parent.child.0',];
    let result = util.isKeyPartOfArray(key, keys);
    expect(result).toBeFalsy();
  });

  it('should identify a top level array', () => {
    let key = 'parent.0';
    let keys = ['parent.0', 'parent.1', 'parent.2', 'parent.child.value', 'parent.child.value2, parent.child.0', 'parent.0.value', 'parent.0.value2'];
    let result = util.isKeyPartOfArray(key, keys);
    expect(result).toBeTruthy();
  });

  it('should identify a mid level array', () => {
    let key = 'parent.child.0';
    let keys = ['parent.0', 'parent.1', 'parent.child.0', 'parent.child.1'];
    let result = util.isKeyPartOfArray(key, keys);
    expect(result).toBeTruthy();
  });
});

describe('unflatten', () => {
  it('should be faithful with nested arrays', () => {
    let target = { temperature: 31 };
    let expected = target;
    let result = util.unflatten(target);
    expect(result).toStrictEqual(expected);
  });

  it('should not change flat objects', () => {
    let target = { temperature: 31 };
    let expected = target;
    let result = util.unflatten(target);
    expect(result).toStrictEqual(expected);
  });

  it('should faithfully handle arrayed children', () => {
    let target = { temperature: 31, 'times.0': '12:41', 'times.1': '2:25' };
    let expected = { temperature: 31, 'times': ['12:41', '2:25']};
    let result = util.unflatten(target);
    expect(result).toStrictEqual(expected);
  });

  it('should faithfully handle complex nested objects', () => {
    let target = {
      "obj.a": 1, 
      "obj.b": 2, 
      "obj.c": 0, 
      "obj2.a": 1, 
      "obj2.b.0": 1,
      "obj2.b.1": 2, 
      "obj2.b.2.a": 1
    };
    let expected = {
      obj: { a:1, b:2, c:0 }, 
      obj2: { a: 1, b: [1, 2, {
        a: 1
      }]}
    };
    let result = util.unflatten(target);
    expect(result).toStrictEqual(expected);
  });

  it('should faithfully handle complex nested arrays with same names', () => {
    let target = {
      "arr.0": 1, 
      "arr.1": 2, 
      "arr.2": 3,
      
      "obj.a": 1,
      "obj.b": 2,
      "obj.c": 3,

      "p.c.v1": 1, 
      "p.c.v2": 2,
      "p.c.arr.0": 1,
      "p.c.arr.1": 2,
      "p.c.arr.2": 3
    };
    let expected = {
      arr: [1, 2, 3], 
      obj: {a:1, b:2, c:3},
      p: {
        c: { 
          v1: 1,
          v2: 2,
          arr: [1,2,3]
        }
      }
    }
    let result = util.unflatten(target);
    expect(result).toStrictEqual(expected);
  });
  
  
});

describe('objectToRow', () => {
  it('should translate a trivial object', () => {
    let obj = { temperature: 31 };
    let expected = [31];
    let result = util.objectToRow(obj, ['temperature']);
    expect(result).toStrictEqual(expected);
  });

  it('should translate an object with 2 properties', () => {
    let obj = { temperature:31, time:'12:31' };
    let expected = [31, '12:31'];
    let result = util.objectToRow(obj, ['temperature', 'time']);
    expect(result).toStrictEqual(expected);
  });

  it('should translate an object with 2 numerical properties', () => {
    let obj = { '3.1':31, 2:'ninety' };
    let expected = [31, 'ninety'];
    let result = util.objectToRow(obj, ['3/.1', '2']);
    expect(result).toStrictEqual(expected);
  });

  it('should translate an object with values that look like numbers but are really strings', () => {
    let obj = { a: '001', b: '14.59', c: 'null' };
    let expected = ['001', '14.59', 'null'];
    let result = util.objectToRow(obj, ['a', 'b', 'c']);
    expect(result).toStrictEqual(expected);
  });

  it('should translate an object with dot-notation headers.', () => {
    let value = {a:[0,1,2], 'child.of.mine': { a:12, 'woah.oh':'sweet.child.of.mine'}};
    let expected = [0,1,2,12,'sweet.child.of.mine'];
    let result = util.objectToRow(value, ['a.0', 'a.1', 'a.2', 'child/.of/.mine.a', 'child/.of/.mine.woah/.oh']);
    expect(result).toStrictEqual(expected);
  });
});

describe('rowToObject', () => {
  it('should throw on mismatch', () => {
    let expected = undefined;
    let row:any[] = [];
    let headers = ['temperature'];
    expect(() => { util.rowToObject(row, headers); }).toThrow();
  });

  it('should translate a trivial row', () => {
    let expected = { temperature: 31 };
    let row = [31];
    let headers = ['temperature'];
    let result = util.rowToObject(row, headers);
    expect(result).toStrictEqual(expected);
  });

  it('should translate an row with 2 headers', () => {
    let expected = { temperature: 31, time:'12:31' };
    let row = [31, '12:31'];
    let headers = ['temperature', 'time']
    let result = util.rowToObject(row, headers);
    expect(result).toStrictEqual(expected);
  });

  it('should translate an row with dot-notation numerical headers', () => {
    let expected = { '3.1': 31, 2: 'ninety' };
    let row = [31, 'ninety'];
    let headers = ['3.1', '2']
    let result = util.rowToObject(row, headers);
    //expect(result).toStrictEqual(expected);
  });
  
  it('should throw an error on length mismatches', () => {
    let row = ['1', '2', '3'];
    let headers = ['a', 'b'];
    expect(() => { util.rowToObject(row, headers); }).toThrow();
  });

  it('should translate an object with values that look like numbers but are really strings', () => {
    let expected = { a: '001', b: '14.59', c: 'null' };
    let row = ['001', '14.59', 'null'];
    let headers = ['a', 'b', 'c'];
    let result = util.rowToObject(row, headers);
    expect(result).toStrictEqual(expected);
  });
});

describe('getAllHeaders', () => {
  it('should work for empty object', () => {
    let object = {};
    let result = util.getAllHeaders([object]);
    expect(result).toStrictEqual([]);
  });

  it('should work for flat objects', () => {
    let object = {a:12, b:14};
    let result = util.getAllHeaders([object]);
    expect(result).toStrictEqual(['a', 'b']);
  });

  it('should return all nested headers', () => {
    let object = {a:{c:12}, b:{c:14, d:10}};
    let result = util.getAllHeaders([object]);
    expect(result).toStrictEqual(['a.c', 'b.c', 'b.d']);
  });

  it('should work for multiple objects', () => {
    let objects = [{a:12}, {a:14, b:10}, {c:1}];
    let result = util.getAllHeaders(objects);
    expect(result).toStrictEqual(['a', 'b', 'c']);
  });

  it('should alphabetically order headers', () => {
    let objects = [{c:12}, {c:14, b:10}, {a:1}];
    let result = util.getAllHeaders(objects);
    expect(result).toStrictEqual(['a', 'b', 'c']);
  });
});

describe('bundleIndices', () => {
  it('should work for empty object', () => {
    let empty:number[] = [];
    let result = util.bundleIndices(empty);
    expect(result.length).toEqual(0);
  });

  it('should work for simple list', () => {
    let numbers = [1,2,3];
    let result = util.bundleIndices(numbers);
    expect(result).toStrictEqual([[1,2,3]]);
  });

  it('should work for another simple list', () => {
    let numbers = [1,2,3, 10,11];
    let result = util.bundleIndices(numbers);
    expect(result).toStrictEqual([[1,2,3], [10,11]]);
  });

  it('should work for complex list', () => {
    let numbers = [1,2,3, 7,8,9];
    let result = util.bundleIndices(numbers);
    expect(result).toStrictEqual([[1,2,3], [7,8,9]]);
  });

  it('should work for problematic list', () => {
    let numbers = [1,2,3, 0, 7,8,9];
    let result = util.bundleIndices(numbers);
    expect(result).toStrictEqual([[0,1,2,3], [7,8,9]]);
  });
});

describe('appendMerge', () => {
  it('should work for empty arrays', () => {
    let empty:string[] = [];
    let result = util.appendMerge(empty, empty);
    expect(result.length).toEqual(0);
  });

  it('should work for basic arrays', () => {
    let start:string[] = ['existing'];
    let add:string[] = ['new', 'existing'];
    let result = util.appendMerge(start, add);
    expect(result).toEqual(['existing', 'new']);
  });

  it('should work for complex arrays', () => {
    let start:string[] = ['e5', 'e2', 'e3'];
    let add:string[] = ['n1', 'e5', 'n2', 'e2'].sort();
    let result = util.appendMerge(start, add);
    expect(result).toEqual(['e5', 'e2', 'e3', 'n1', 'n2']);
  });
});