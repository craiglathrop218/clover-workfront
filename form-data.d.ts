declare module "form-data" {
    class FormData {
        constructor(); // NB! this was missing in original file from typings
        append(key: string, value: any, options?: any): FormData;
        getHeaders(): Object;
        // TODO expand pipe
        pipe(to: any): any;
        submit(params: string|Object, callback: (error: any, response: any) => void): any;
    }
    var foo: typeof FormData;
    export = foo;
}
