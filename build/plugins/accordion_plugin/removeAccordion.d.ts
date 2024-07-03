import Command from '@ckeditor/ckeditor5-core/src/command';
export default class RemoveAccordionCommand extends Command {
    private existingPopulationStartUce;
    private existingPopulationEndUce;
    private titleElement;
    private contentElement;
    execute(): void;
    removeAccordion(writer: any): void;
    hasParentWithClass(element: any, className: string): any;
    getChildElementOfTag(element: any, tagName: string): any;
    insertAccordionElement(writer: any): any;
    convertElementToModel(writer: any, element: any): any;
    hasParentAccordion(element: any, elementName: string): any;
}
