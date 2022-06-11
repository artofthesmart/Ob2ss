/**
 * A simple timer to help with benchmarking.
 */
export class Timer {
  private method:string;
  private start:Date;
  private logFunction:(method:string, time:number)=>void;

  constructor(method:string, logFunction?:(method:string, time:number) => void){
    this.method = method;
    this.start = new Date();
    this.logFunction = logFunction || this.defaultLogFunction;
  };

  defaultLogFunction(method:string, time:number){
    Logger.log(`Timer: ${method} finished in ${time}ms`)
  }

  stop(){
    const end = new Date();
    const time = end.getTime() - this.start.getTime();
    this.logFunction(this.method, time);
    return time;
  }
}