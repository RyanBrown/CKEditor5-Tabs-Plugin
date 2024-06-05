// Helper function to create a new accordion element with default structure
export function insertAccordionElement(writer) {
    const accordion = writer.createElement('accordion');
    const button = writer.createElement('accordionButton');
    const title = writer.createElement('accordionTitle');
    const panel = writer.createElement('accordionPanel');

    // Build the nested structure
    writer.append(button, accordion);
    writer.append(title, accordion);
    writer.append(panel, accordion);

    return accordion;
}

// Helper for placeholder text
export const PLACEHOLDER_TEXTS = {
    TITLE: 'Add accordion content...',
};

// Helper function for toggling accordion
export function toggleAccordionOpenState(writer, accordionElement) {
    const isOpen = accordionElement.getAttribute('isOpen');
    writer.setAttribute('isOpen', !isOpen, accordionElement);
}
