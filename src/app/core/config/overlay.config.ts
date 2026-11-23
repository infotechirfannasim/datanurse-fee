import {OverlayListenerOptions, OverlayOptions} from 'primeng/api';
import {DomHandler} from 'primeng/dom';

/**
 * Dropdown lists (p-select, p-multiSelect, …) app-wide:
 *  - attached to <body>, so a modal's scroll area or footer never cuts them off
 *  - drawn above our modals (.modal-overlay 1000, .confirm-overlay 1300), below toasts (2000)
 *  - when a modal or the page scrolls, the open list moves with its field instead of closing;
 *    it closes only when its field scrolls out of view
 */
export const OVERLAY_Z_INDEX = {modal: 1400, overlay: 1500, menu: 1500, tooltip: 1600};

const OPEN_FIELD = '.p-select-open, .p-multiselect-open, .p-treeselect-open, .p-cascadeselect-open, .p-autocomplete-open';

export const OVERLAY_OPTIONS: OverlayOptions = {
    listener: (event: Event, options?: OverlayListenerOptions) => {
        if (options?.type !== 'scroll') return options?.valid;
        const overlay = Array.from(document.querySelectorAll<HTMLElement>('body > .p-overlay')).pop();
        const field = document.querySelector<HTMLElement>(OPEN_FIELD);
        if (!overlay || !field) return options.valid;

        // close when the field itself has scrolled out of the visible area
        const scroller = event.target instanceof Element ? event.target : null;
        const box = scroller ? scroller.getBoundingClientRect() : {top: 0, bottom: window.innerHeight};
        const f = field.getBoundingClientRect();
        if (f.bottom < box.top || f.top > box.bottom) return true;

        DomHandler.absolutePosition(overlay, field);   // follow the field
        return false;                                   // keep the list open
    },
};
