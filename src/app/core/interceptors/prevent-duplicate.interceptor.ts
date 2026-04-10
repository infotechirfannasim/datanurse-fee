import {HttpInterceptorFn} from "@angular/common/http";
import {EMPTY, finalize} from "rxjs";

const pending = new Set<string>();

export const preventDuplicateInterceptor: HttpInterceptorFn = (req, next) => {

    const key = req.method + req.url + JSON.stringify(req.body);

    if (pending.has(key)) {
        return EMPTY; // block duplicate request
    }

    pending.add(key);

    return next(req).pipe(
        finalize(() => pending.delete(key))
    );
};
