export default class RemovePopulationAccordion extends Plugin {
    static get requires(): (typeof RemovePopulationAccordionCommand)[];
    init(): void;
}
import { Plugin } from 'ckeditor5/src/core';
declare class RemovePopulationAccordionCommand extends Command {
    execute(): void;
    removePopulationFormAccordion(writer: any): void;
    /**
     * Checks if an element has a parent with a specific class name.
     * @param {any} element - The element to check.
     * @param {string} className - The class name to search for.
     * @returns {any} - The parent element with the specified class name, or 'false' if not found.
     */
    hasParentWithClass(element: any, className: string): any;
    /**
     * Retrieves a child element of a specific tag name from the given element.
     * @param {any} element - The element to search within.
     * @param {string} tagName - The tag name of the child element to find.
     * @returns {any} - The child element with the specified tag name.
     */
    getChildElementOfTag(element: any, tagName: string): any;
    /**
     * Inserts a new accordion element with given title and content elements.
     * @param {Writer} writer - The writer instance.
     * @param {any} titleElement - The title element.
     * @param {any} contentElement - The content element.
     * @returns {any} - The newly created accordion element.
     */
    insertAccordionElement(writer: Writer): any;
    /**
     * Converts an element to a model element.
     * @param {Writer} writer - The writer instance.
     * @param {any} element - The element to convert.
     * @returns {any} - The converted model element.
     */
    convertElementToModel(writer: Writer, element: any): any;
    /**
     * Checks if an element has a parent accordion.
     * @param {any} element - The element to check.
     * @param {string} elementName - The name of the accordion element.
     * @returns {any} - The parent accordion element, or false if not found.
     */
    hasParentAccordion(element: any, elementName: string): any;
}
import { Command } from 'ckeditor5/src/core';
export {};
