import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AccordionEditing from './accordionediting';
import AccordionUI from './accordionui';

export default class Accordion extends Plugin {
    static get requires() {
        // Specify the required plugins for the Accordion plugin
        return [AccordionEditing, AccordionUI];
    }
}
