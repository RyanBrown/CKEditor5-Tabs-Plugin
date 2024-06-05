import { Command } from 'ckeditor5/src/core';
export default class RemoveAccordionCommand extends Command {
    getAccordionPosition: any;
    titleElement: any;
    contentElement: any;
    buttonAccordionElement: any;
    selection: any;
    execute(): void;
    private removeAccordion;
    hasParentWithClass(element: any, elementName: any): any;
    getChildElementOfTag(element: any, elementName: any): any;
    generateFragmentData(contentTitle: any, contentElement: any): import("ckeditor5/src/engine").DocumentFragment;
}
