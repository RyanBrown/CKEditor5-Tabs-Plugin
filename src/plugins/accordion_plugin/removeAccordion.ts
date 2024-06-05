// import { Command } from "ckeditor5/src/core";
// import { type Writer } from "ckeditor5/src/engine";

// export default class RemoveAccordionCommand extends Command {
//   getAccordionPosition: any;
//   titleElement: any;
//   contentElement: any;
//   buttonAccordionElement: any;
//   selection: any;
//   public override execute(): void {
//     this.editor.model.change((writer) => {
//       this.editor.model.insertContent(this.removeAccordion(writer));
//     });
//   }
//   // this function stop to insertion int0 accordion
//   // public override refresh(): void {
//   //  const model = this.editor.model;
//   //  const selection = model.document.selection;
//   //  const allowedIn = model.schema.findAllowedParent( selection.getFirstPosition()!, 'accordion' );
//   //  this.isEnabled = allowedIn !== null;
//   // }

//   private removeAccordion(writer: Writer) {
//     const selection = this.editor.model.document.selection;
//     this.selection = selection.getFirstPosition();
//     const currentElementForSelection = selection.getFirstPosition()?.parent;
//     const findCurrentAccordion = this.hasParentWithClass(
//       currentElementForSelection,
//       "accordion"
//     );
//     // remove the current accordion
//     if (findCurrentAccordion !== "false") {
//       // reading the element for title and content from accordion
//       this.titleElement = this.getChildElementOfTag(
//         findCurrentAccordion,
//         "accordionTitle"
//       );
//       this.contentElement = this.getChildElementOfTag(
//         findCurrentAccordion,
//         "accordionPanel"
//       );
//       // removing the existing
//       this.editor.model.change((writer) => {
//         writer.remove(findCurrentAccordion);
//       });
//     }

//     const modelFragment = this.generateFragmentData(
//       this.titleElement,
//       this.contentElement
//     );
//     this.editor.model.insertContent(
//       modelFragment,
//       this.editor.model.document.selection.getFirstPosition()
//     );
//     return modelFragment;
//   }

//   hasParentWithClass(element: any, elementName: any) {
//     // console.log("element ", element, " ==> element name ", elementName)
//     if (element !== null) {
//       let parent = element.parent;
//       while (parent) {
//         if (
//           parent !== null &&
//           parent !== undefined &&
//           parent.name === elementName
//         ) {
//           return parent;
//         }
//         parent = parent.parent;
//         // console.log("parent ", parent)
//         this.hasParentWithClass(parent, elementName);
//       }
//       return "false";
//     } else {
//       return "false";
//     }
//   }

//   getChildElementOfTag(element: any, elementName: any) {
//     if (element !== null && element !== undefined) {
//       // console.log(element)
//       let ElementsData = element._children._nodes;
//       if (ElementsData !== undefined && ElementsData.length > 0) {
//         for (let item of ElementsData) {
//           if (item.name === elementName) {
//             return item;
//           }
//         }
//       }
//     }
//   }

//   generateFragmentData(contentTitle: any, contentElement: any) {
//     const titleFragment = this.editor.data.toView(contentTitle);
//     const HtmlTitle = this.editor.data.processor.toData(titleFragment);

//     const ContentFragment = this.editor.data.toView(contentElement);
//     const HtmlContent = this.editor.data.processor.toData(ContentFragment);

//     let accordionHtml;
//     if (this.selection.path[0] === 0) {
//       accordionHtml = "<p>" + HtmlTitle + "</p>" + HtmlContent;
//     } else {
//       accordionHtml = "<br><p>" + HtmlTitle + "</p>" + HtmlContent;
//     }

//     const accordionFragment = this.editor.data.processor.toView(accordionHtml);
//     let modelFragment = this.editor.data.toModel(accordionFragment);
//     return modelFragment;
//   }
// }
