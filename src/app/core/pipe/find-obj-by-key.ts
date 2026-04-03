import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'findObjByKey',
    standalone: true
})
export class FindObjByKeyPipe implements PipeTransform {
    transform(value: any | string, key: string, objects: any[] = [], keyValToReturn: string = ''): any {
        const objFound = objects.find((item: any) => String(item[key]) === String(value));
        if (objFound) {
            if (keyValToReturn) {
                return objFound[keyValToReturn];
            }
            return objFound
        }
        return null;
    }
}
