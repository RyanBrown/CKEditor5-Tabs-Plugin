import {
    Component,
    EventEmitter,
    Input,
    Output,
    OnChanges,
    SimpleChanges,
    OnInit,
    AfterContentInit,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as CustomEditor from '../editor-js/ckeditor'; // Custom CKEditor import
const stylesheet = './../editor-js/ckeditor-styles.css'; // CKEditor stylesheet
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DocumentService } from 'src/app/service/document.service';
import { Observable, ReplaySubject } from 'rxjs';
import { ElementRef, Renderer2, ViewChild } from '@angular/core';
import { ContentSummaryService } from 'src/app/service/content-summary.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { faL, faSlash } from '@fortawesome/free-solid-svg-icons';
import { MessageService } from 'primeng/api';
import { match } from 'assert';

interface Languages {
    key: string;
    value: string;
}

// Global function to handle section tab clicks
(window as any).panelOnClickSectionTab = function (id: any) {
    console.log('panelOnClickSectionTabs', id.id);
    let element = document.getElementById(id.id);
    if (element != null) {
        let trEle = element.parentElement.parentElement;
        console.log(trEle);
        let secTr = trEle.nextElementSibling;
        console.log(secTr);
        let val = secTr.getAttribute('class');
        if (val === 'panel_content_hide') {
            secTr.setAttribute('class', 'panel_content_show');
            if (id.indexOf('pan-title') === -1) {
                element.children[0].setAttribute('class', 'minusIco pmicon');
            } else {
                // additional logic if needed
            }
        } else if (val === 'panel_content_show') {
            secTr.setAttribute('class', 'panel_content_hide');
            if (id.indexOf('pan-title') === -1) {
                element.children[0].setAttribute('class', 'plusIco pmicon');
            } else {
                // additional logic if needed
            }
        }
    }
};

// Interface for uploaded document details
export interface uploadedDocument {
    folderPath?: string;
    documentTitle?: string;
    fileId?: string;
    attachmentMimeType?: string;
    attachmentFileName?: string;
    attachmentFileExtension?: string;
    attachmentFileStream?: any;
    aonExpression?: string;
    documentLanguage?: string;
    lastUpdated?: string;
    updatedBy?: string;
    documentDescription?: string;
    searchTags?: any;
    categories?: string;
    includeInContentLibrary?: boolean;
    upointLink?: boolean;
    topSearchResult?: boolean;
    searchable?: boolean;
    usage?: string;
}

@Component({
    selector: 'app-editor-page',
    templateUrl: './editor-page.component.html',
    styleUrls: ['./editor-page.component.scss'],
})
export class EditorPageComponent implements OnChanges, OnInit, AfterContentInit {
    @ViewChild('fileInput') fileInput: ElementRef; // Reference to the file input element
    @Input() languageFromParent: any; // Language data from parent component
    @Input() editorData: any; // Editor data input
    @Output() getEditorData = new EventEmitter<any>(); // Output event to emit editor data
    formClientUser: FormGroup; // Form group for client user form
    public Editor = CustomEditor; // Custom CKEditor instance
    @Input() allLanguagesList: any; // List of all languages
    config: any; // CKEditor configuration
    msg: any;
    visible: boolean = false; // Visibility flag for some UI elements
    ref: DynamicDialogRef; // Reference for dynamic dialog
    selectedPopulation: any = ''; // Selected population
    visiblePopulation: boolean = false; // Visibility flag for population dialog
    uploadDocumentForm: FormGroup; // Form group for document upload
    selectedCategory: any = null; // Selected category
    populationsDialog = false; // Population dialog visibility flag
    selectPopulationid;
    linkDialog: boolean = false; // Link dialog visibility flag
    ssoDialog: boolean = false; // SSO dialog visibility flag
    publicDialog: boolean = false; // Public dialog visibility flag
    intranet: boolean = false; // Intranet flag
    documentDialog: boolean = false; // Document dialog visibility flag
    newDocumentFlag: boolean = false; // New document flag
    documentHeader: string = ''; // Document header text
    documentSummaryData: any; // Document summary data
    selectedFileTitle: any; // Selected file title
    organizationName: string = ''; // Organization name
    publicUrl: string = ''; // Public URL
    externalLinkHeader: string = ''; // External link header text
    editorExistingValue: string = ''; // Existing editor value
    newDocumentDialog: boolean = false; // New document dialog visibility flag
    attachmentFileExtension = ''; // Attachment file extension
    attachmentFileName = ''; // Attachment file name
    attachmentMimeType = ''; // Attachment MIME type
    uploadedPath = 'UCEDocuments/Uploaded_Docs'; // Uploaded document path
    uploadedFile;
    attachmentFileStream;
    uploadFileData;
    uploadedFilePath;
    base64Output;
    acceptedFiles: string = '.pdf, .doc, .docx, .xls, .xlsx, .xlsm, .ppt, .pptx'; // Accepted file types
    maxUploadedSize = 5000000; // Maximum upload size
    isShowValidImageSizeError: boolean = false; // Flag for image size error
    isShowImageAvailableError: boolean = false; // Flag for image availability error
    isShowExistingImageError: boolean = false; // Flag for existing image error
    title = ''; // Title text
    titleTextLength: number = 250; // Maximum length for title text
    titleTextPending: number = this.titleTextLength; // Remaining characters for title text
    notvalidForm: boolean; // Form validity flag
    uploadedForm: uploadedDocument; // Uploaded document form data
    defaultPopulation: string = 'No_One'; // Default population
    selectedLanguage: Languages; // Selected language
    lang = []; // Language array
    categoryFlag: boolean = false; // Category flag
    selectedCategories: any[] = []; // Selected categories array
    userEmail = ''; // User email
    populationFilter = { name: 'Population', key: 'population' }; // Population filter
    typeFilter = { name: 'File Type', key: 'fileType' }; // File type filter

    constructor(
        private fb: FormBuilder, // FormBuilder instance for form creation
        public dialogService: DialogService, // Dialog service instance
        private contentService: ContentSummaryService, // Content summary service instance
        private documentService: DocumentService, // Document service instance
        private renderer: Renderer2, // Renderer2 instance for DOM manipulation
        private clipboard: Clipboard, // Clipboard instance for copying text
        public messageService: MessageService // Message service instance for displaying messages
    ) {
        this.currentEnvironment = sessionStorage.getItem('environment'); // Get current environment from session storage

        this.loadImages(); // Load images

        this.lang = [{ languageCode: 'en_US', displayLanguageText: 'English (default)' }]; // Initialize language array

        this.uploadedForm = {}; // Initialize uploaded form
    }

    ngOnInit(): void {
        // Initialize the form for image upload
        this.uploadContentImageForm = this.fb.group({
            existingSelectedImage: new FormControl(''),
            uploadedImageForEditor: new FormControl(''),
            textValueName: ['', [Validators.required, Validators.maxLength(this.imageNameMaxLength)]],
            withforCrop: new FormControl('', Validators.required),
            textWrap: new FormControl('inline', []),
            alignment: new FormControl('', Validators.required),
            alternateTextValue: ['', [Validators.maxLength(this.alternateTextpendingLength)]],
        });
        this.formEditorData = this.editorData; // Set editor data
        this.populationsCopy = this.populations; // Copy populations

        if (sessionStorage.getItem('userMap')) {
            let userMap = JSON.parse(sessionStorage.getItem('userMap'));
            this.userEmail = userMap.email; // Set user email
        }

        // Initialize the form for document upload
        this.uploadDocumentForm = this.fb.group({
            uploaded_file: new FormControl(null, Validators.required),
            documentTitle: new FormControl('', Validators.required),
            documentLanguage: new FormControl('', Validators.required),
            searchTags: new FormControl<string[] | null>(null),
            documentDescription: new FormControl('', Validators.required),
            categories: new FormControl([]),
            includeInContentLibrary: new FormControl(false),
            upointLink: new FormControl(false),
            aonExpression: new FormControl(),
            topSearchResult: new FormControl(false),
        });

        // CKEditor configuration
        this.config = {
            htmlSupport: {
                allow: [
                    {
                        name: 'ah:expr',
                        attributes: true,
                        classes: true,
                        styles: true,
                    },
                    {
                        name: '/.*/',
                        attributes: true,
                        classes: true,
                        styles: true,
                    },
                    {
                        name: 'span',
                        attributes: true,
                        classes: true,
                        styles: true,
                    },
                ],
            },
            contentCss: [stylesheet], // CKEditor stylesheet
            toolbar: {
                items: [
                    'bold',
                    'italic',
                    '|',
                    'removeFormat',
                    '|',
                    'numberedList',
                    'bulletedList',
                    '|',
                    'outdent',
                    'indent',
                    'alignment',
                    '|',
                    'uploadImagePlugin', // Custom Plugin
                    'insertTable',
                    '|',
                    'addPopulationPlugin', // Custom Plugin
                    'removePopulationPlugin', // Custom Plugin
                    '|',
                    'linkPlugin', // Custom Plugin
                    '|',
                    '-',
                    'heading',
                    'strikethrough',
                    'subscript',
                    'superscript',
                    '|',
                    'undo',
                    'redo',
                    '|',
                    'copyPlugin', // Custom Plugin
                    'pastePlugin', // Custom Plugin
                    '|',
                    'accordionPlugin', // Custom Plugin
                    'removeAccordionPlugin', // Custom Plugin
                    'tabsPlugin', // Custom Plugin
                ],
                shouldNotGroupWhenFull: true,
            },
            heading: {
                options: [
                    {
                        model: 'paragraph',
                        title: 'Paragraph',
                        class: 'ck-heading_paragraph',
                    },
                    {
                        model: 'heading1',
                        view: 'h1',
                        title: 'Heading 1',
                        class: 'ck-heading_heading1',
                    },
                    {
                        model: 'heading2',
                        view: 'h2',
                        title: 'Heading 2',
                        class: 'ck-heading_heading2',
                    },
                    {
                        model: 'heading3',
                        view: 'h3',
                        title: 'Heading 3',
                        class: 'ck-heading_heading3',
                    },
                    {
                        model: 'heading4',
                        view: 'h4',
                        title: 'Heading 4',
                        class: 'ck-heading_heading4',
                    },
                    {
                        model: 'heading5',
                        view: 'h5',
                        title: 'Heading 5',
                        class: 'ck-heading_heading5',
                    },
                    {
                        model: 'heading6',
                        view: 'h6',
                        title: 'Heading 6',
                        class: 'ck-heading_heading6',
                    },
                    {
                        model: 'formatted',
                        view: 'pre',
                        title: 'Formatted',
                        class: 'ck-heading_formatted',
                    },
                    {
                        model: 'address',
                        view: 'address',
                        title: 'Address',
                        class: 'ck-heading_address',
                    },
                    {
                        model: 'normalDiv',
                        view: 'div',
                        title: 'Normal (Div)',
                        class: 'ck-heading_normal_div',
                    },
                ],
            },
            table: {
                contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties'],
                defaultProperties: {
                    border: {
                        top: '2px solid hsl(0, 0%, 0%)',
                        right: '2px solid hsl(0, 0%, 0%)',
                        bottom: '2px solid hsl(0, 0%, 0%)',
                        left: '2px solid hsl(0, 0%, 0%)',
                    },
                    alignment: 'left',
                },
            },
            fontColor: {
                colors: [
                    {
                        color: 'hsl(120, 75%, 60%)',
                        label: 'Green',
                    },
                ],
            },
            licenseKey: '',
            placeholder: '',
        };

        this.getAllPredefinedLinks(); // Load all predefined links
        this.getExistingUploadedImages(); // Load existing uploaded images

        // Allowing unsafe content and attributes
        if (this.config !== undefined) {
            this.config.allowedContent = true;
            this.config.renderUnsafeAttributes = ['onclick'];
            this.config.allowedContent = {
                $1: {
                    elements: '*',
                    attributes: '*; onclick',
                    classes: '*',
                    styles: '*',
                },
            };
        }

        // Adding event listeners to check for disable accordion condition
        document.addEventListener('keyup', (e) => {
            this.checkForDisableAccordion();
            this.disableAddPopulationInCaseofMultipleSectionSelect();
        });
        document.addEventListener('mousedown', (event) => {
            this.checkForDisableAccordion();
            this.checkwithMouseEvent();
            this.disableAddPopulationInCaseofMultipleSectionSelect();
        });
        document.addEventListener('mouseenter', (event) => {
            this.checkForDisableAccordion();
            this.checkwithMouseEvent();
            this.disableAddPopulationInCaseofMultipleSectionSelect();
        });
        document.addEventListener('click', (e) => {
            const currentElement = (this.currentCursorPosition = document.elementFromPoint(e.clientX, e.clientY));
            this.checkwithMouseEvent();
            this.checkForDisableAccordion();
            this.disableAddPopulationInCaseofMultipleSectionSelect();
            this.enableRemovePopulationForAccordion();

            const range = (this.currentCursorRange = document.caretRangeFromPoint(e.clientX, e.clientY));

            let removePopulationBtn = document.querySelectorAll('.removepopulaiontoolbar');
            this.getCursorPositionForMultiLine();
            let updateFromMethod = false;
            if (
                this.cursorRangeforMultiPleLine.start.stickiness === 'toNext' &&
                this.cursorRangeforMultiPleLine.start.path[0] !== 0 &&
                this.cursorRangeforMultiPleLine.start.path[0] !== this.cursorRangeforMultiPleLine.end.path[0]
            ) {
                let editorDataSplitArr = this.editorData.split('</p>');
                if (
                    editorDataSplitArr[this.cursorRangeforMultiPleLine.start.path[0] - 1].indexOf('[BEGIN') > -1 &&
                    editorDataSplitArr[this.cursorRangeforMultiPleLine.end.path[0] + 1].indexOf('[END') > -1
                ) {
                    console.log('In BEGIN AND END TAG');
                    this.populationExistFlag = true;
                    this.removeClass(removePopulationBtn, 'ck-disabled');
                    updateFromMethod = true;
                    this.startString = editorDataSplitArr[this.cursorRangeforMultiPleLine.start.path[0] - 1];
                    this.endString = editorDataSplitArr[this.cursorRangeforMultiPleLine.end.path[0] + 1];
                    this.removeMultiple = true;
                } else {
                    this.populationExistFlag = false;
                    this.addClass(removePopulationBtn, 'ck-disabled');
                    this.startString = '';
                    this.endString = '';
                    this.removeMultiple = false;
                }
            }
            if (!updateFromMethod) {
                if (currentElement.tagName === 'LABEL') {
                    if (
                        removePopulationBtn !== undefined &&
                        removePopulationBtn !== null &&
                        !this.isInsideAccordionWithPopulation
                    ) {
                        this.removeClass(removePopulationBtn, 'ck-disabled');
                    }
                } else if (currentElement.tagName === 'SPAN' && currentElement.hasAttribute('populationid')) {
                    if (removePopulationBtn !== undefined && removePopulationBtn !== null) {
                        this.removeClass(removePopulationBtn, 'ck-disabled');
                    }
                } else if (currentElement.tagName === 'STRONG') {
                    this.boldFlagForIntranet = true;
                    console.log('Inside Strong Tag');
                    if (
                        (currentElement.textContent !== null && currentElement.textContent.startsWith('[BEGIN ')) ||
                        currentElement.textContent.startsWith('[END ')
                    ) {
                        if (removePopulationBtn !== undefined && removePopulationBtn !== null) {
                            this.removeClass(removePopulationBtn, 'ck-disabled');
                        }
                    } else if (
                        range.startContainer.parentElement.nextSibling !== null &&
                        range.startContainer.parentElement.nextSibling['innerText'].startsWith('[END ')
                    ) {
                        this.removeClass(removePopulationBtn, 'ck-disabled');
                    } else if (range.endContainer.parentElement.parentElement.outerText !== null) {
                        let indexForSearchPop = range.endContainer.parentElement.parentElement.outerText
                            .toString()
                            .search('\\[BEGIN ');
                        if (indexForSearchPop >= 0) {
                            this.removeClass(removePopulationBtn, 'ck-disabled');
                        }
                    }
                } else if (currentElement.tagName === 'P') {
                    let paragraph = currentElement;
                    if (
                        paragraph &&
                        paragraph.querySelector('label') !== null &&
                        paragraph.querySelector('label').querySelector('span') !== null
                    ) {
                        if (paragraph.querySelector('label').querySelector('span').hasAttribute('populationid')) {
                            this.removeClass(removePopulationBtn, 'ck-disabled');
                        } else {
                            this.addClass(removePopulationBtn, 'ck-disabled');
                        }
                        if (
                            range.startContainer.previousSibling === null ||
                            range.startContainer.nextSibling === null
                        ) {
                            this.addClass(removePopulationBtn, 'ck-disabled');
                        }
                    } else {
                        if (!this.isInsideAccordionWithPopulation) {
                            this.addClass(removePopulationBtn, 'ck-disabled');
                        }
                        this.italicFlagIntranet = false;
                        this.boldFlagForIntranet = false;
                    }
                } else if (currentElement.tagName === 'I') {
                    this.italicFlagIntranet = true;
                    console.log('Inside Itelic Tag');
                    if (range.startContainer.previousSibling !== null || range.startContainer.nextSibling !== null) {
                        this.removeClass(removePopulationBtn, 'ck-disabled');
                    }
                } else if (
                    (currentElement.textContent !== null && currentElement.textContent.startsWith('[BEGIN ')) ||
                    currentElement.textContent.startsWith('[END ')
                ) {
                    if (removePopulationBtn !== undefined && removePopulationBtn !== null) {
                        this.removeClass(removePopulationBtn, 'ck-disabled');
                    }
                } else {
                    if (
                        removePopulationBtn !== undefined &&
                        removePopulationBtn !== null &&
                        !this.isInsideAccordionWithPopulation
                    ) {
                        this.addClass(removePopulationBtn, 'ck-disabled');
                    }
                }
            }
        });
    }

    startString = '';
    endString = '';
    removeMultiple = false;

    // Load all predefined links
    getAllPredefinedLinks() {
        this.contentService.getPredefinedLinksForPages().subscribe({
            next: (value) => {
                this.allPredefinedData = value;
                console.log('allPredefinedData', this.allPredefinedData);
                this.isloadedPredefinedPages = true;
                this.allPredefinedLinks = value?.predefinedLinksDetails;
                this.updatePredefinedLinkOrder();
            },
            error: (error) => {
                this.isloadedPredefinedPages = true;
            },
        });
    }

    // Close SSO dialog
    popupCloseStatus(closeStatus) {
        if (closeStatus) {
            this.ssoDialog = false;
        }
    }

    // Select predefined link list value
    selectpredefinedLinkListValue(selected) {
        if (Object.keys(selected).length > 0) {
            this.selectedPageValue = selected;
            let parentElement = null;
            if (this.editorEvent.model !== undefined) {
                parentElement = this.editorEvent.model.document.selection.getFirstPosition().parent;
                const textToChange = this.editorEvent.model.change((writer) => {
                    this.editorEvent.model.schema.extend('paragraph', {
                        allowAttributes: 'id',
                    });
                    const link = writer.createText(this.selectedText, {
                        linkHref: selected.predefinedLinkName + '~' + this.linkEditorId, // need to change destination
                    });
                    let linkUrl = selected.predefinedLinkName + '~' + this.linkEditorId;
                    const newLink = `<a href="${linkUrl}">${this.selectedText}</a>`;
                    writer.setAttribute('id', this.linkEditorId, parentElement);
                    if (this.removeFlagBydblClick) {
                        let range = this.getLinkRange();
                        /* check if link inside in tab */
                        if (
                            this.hasParentNameForPredefinedPage(parentElement, 'tabNestedContent') ||
                            parentElement.parent.name == 'tableCell'
                        ) {
                        } else {
                            writer.remove(writer.createRange(this.cursorRange.start, this.cursorRange.end));
                        }
                    }
                    const htmlDP = this.editorEvent.data.processor;
                    const viewFragment = htmlDP.toView(newLink);
                    const modelFragment = this.editorEvent.data.toModel(viewFragment);
                    this.editorEvent.model.insertContent(modelFragment);
                });
                if (!this.removeFlagBydblClick) {
                    this.editorEvent.model.change((writer) => {
                        writer.remove(writer.createRange(this.cursorRange.start, this.cursorRange.end));
                    });
                    this.removeBlankParagraph(selected.predefinedLinkName + '~' + this.linkEditorId);
                }
            }
            this.isPreLink = false;
            this.ssoDialog = false;
            this.linkDialog = false;
            this.linkEditorId = '';
            this.selectedPredefinedDestination = '';
            this.selectedText = '';
            this.removeFlagBydblClick = false;
            this.isMultilineSelection = false;
            window.getSelection().empty();
        } else {
            this.ssoDialog = true;
        }
    }

    // Update predefined link order
    updatePredefinedLinkOrder() {
        let returnData = this.contentService.updatePredefinedLinkOrder(
            JSON.parse(JSON.stringify(this.allPredefinedData)),
            this.selectedPredefinedLink
        );
        this.allPredefinedLinks = returnData?.allPredefinedLinks;
        this.selectedPredefinedList = returnData?.selectedPageValue;
    }

    // Open SSO dialog
    openSSODialog(isMobile: boolean, source: string) {
        if (source === 'html') {
            this.selectedPredefinedLink = '';
        }
        console.log('in show SSO dialog');
        this.updatePredefinedLinkOrder();
        this.ssoDialog = true;
        this.isPreLink = true;
        this.linkDialog = false;
        this.titleOfOpenLink = 'Predefined Link';
        this.linkEditorId = 'predefined_editor_id';

        this.mobileLinkTypeFlag = isMobile;
    }

    // Search predefined page
    searchPredefinedPage(data: any) {
        if (data !== undefined && data !== null) {
            this.allPredefinedLinks = data;
        }
    }

    // Get message body from CKEditor
    getMessageBody(ck_event: any): void {
        this.editorEvent = ck_event.editor;
        this.checkEvent = ck_event.event;
        this.getEditorData.emit(this.formEditorData);
    }

    // Get content focus message body from CKEditor
    getContentFocusMessageBody(ck_event: any): void {
        console.log('focus ', ck_event);
        this.checkEventOnFocus = ck_event.editor;
    }

    // Retrieve message body
    retrieveMessageBody(): void {}

    // Cancel dynamic dialog
    cancel() {
        this.ref.close();
    }

    // Continue with dynamic dialog
    continue(): void {
        this.ref.close(this.selectedCategory);
        const population = sessionStorage.getItem('population_selectedCategory');
        this.formClientUser.controls['messageBody'].setValue('this.selectedPopulation');
    }

    // Select all populations
    selectAll(): void {
        if (this.selectedAllPopulation) {
            this.selectedAllPopulation = false;
            this.selectPopulationFilter = [];
        } else {
            this.selectedAllPopulation = true;
            this.baseCategories.forEach((obj) => {
                this.selectPopulationFilter.push(obj);
            });
        }
    }

    // Filter populations by type
    populationType() {
        console.log('in population type ', this.selectPopulationFilter);
    }

    // Apply population filter
    applyFilter() {
        let resultData = [];

        if (this.selectPopulationFilter.length > 0) {
            this.populationsCopy.forEach((pop) => {
                this.selectPopulationFilter.forEach((filter) => {
                    if (pop.populationType === filter.populationType) {
                        resultData.push(pop);
                    }
                });
            });
        }
        this.populations = resultData;
    }

    // Cancel population filter
    cancelFilter() {
        this.selectPopulationFilter = [];
        this.populations = this.populationsCopy;
    }

    // Remove population
    removePopulation() {
        if (this.removeMultiple) {
            this.removePopulation1();
            return;
        }
        if (this.enableRemoveAccordionPopulation || this.isInsideAccordionWithPopulation) {
            sessionStorage.setItem('removeAccordionPopulation', 'true');
            sessionStorage.setItem('wrapperAccordionId', this.wrapperAccordionId);
            this.editorEvent.execute('removePopulationAccordion');
            return false;
        }
        let myString = this.removePopText;
        let checkForBold;
        if (myString !== undefined && myString !== null && myString.length !== 0) {
            myString = myString.replace(/^(&nbsp;)+/, '');
            myString = myString.replace(/(&nbsp;)+$/, '');
            checkForBold = myString.search('<strong>');
        }

        this.formEditorData = this.formEditorData.toString().replace(this.removePop, myString);
        this.removePop = '';
        this.removePopText = '';
    }

    // Remove population for multiple selection
    removePopulation1() {
        console.log('removePopulation text', this.removePopText);
        console.log('removePopulation', this.removePop);
        this.cursorPosition = this.getCursorPosition();
        console.log('cursorPosition', this.cursorPosition);
        console.log('range ', this.cursorRange.start, this.cursorRange.end);
        const model = this.editorEvent.model;
        const doc = model.document;
        let index = this.cursorRange.start.path[0];
        this.formEditorData = this.formEditorData.toString().replace('</p>' + this.startString, '');
        this.formEditorData = this.formEditorData.toString().replace(this.endString + '</p>', '');
        this.removePop = '';
        this.removePopText = '';
    }

    // Check if selection is within an anchor tag
    isSelectionInAnchor() {
        let selection = window.getSelection();

        if (selection && selection.toString().trim() !== '') {
            let range = selection.getRangeAt(0);
            console.log('range .', range, ' selction ==>  ', selection);
            if (range.commonAncestorContainer.nodeName === 'A') {
                console.log('Selected text is within an anchor tag.');
                return true;
            } else {
                console.log('Selected text is not within an anchor tag.');
                return false;
            }
        } else {
            console.log('No text is selected.');
            return false;
        }
    }

    // Show link dialog
    showLinkDialog() {
        this.publicUrlError = false;
        const selObj = window.getSelection();
        const selection = this.editorEvent.model.document.selection;
        const content = this.editorEvent.model.getSelectedContent(selection);
        console.log(selObj.toString(), content, 'child count', content.childCount);
        this.selectedText = this.getSelectedTextHTMLForLink();
        if (this.selectedText.includes('href')) {
            this.linkDialog = false;
            this.isLinked = true;
            this.editorEvent.model.insertContent(this.editorEvent.model.getSelectedContent(selection));
            window.getSelection().empty();
            return;
        }
        if (selObj.toString() === '') {
            this.showAlertDialog = true;
            return;
        } else {
            console.log('select ', this.selectedText);

            if (this.selectedText.startsWith('<p>')) {
                let temp = this.selectedText;
                temp = temp.replace(/<[^>]+>/g, '');
                temp = temp.replace(/&nbsp;/g, '');
                if (temp === '') {
                    this.showAlertDialog = true;
                    return;
                }
            }
            if (this.selectedText.startsWith('<ul>')) {
                this.showAlertDialog = true;
                return;
            }
        }
        this.titleOfOpenLink = 'Insert Link';
        this.linkDialog = true;
        this.isLinked = false;
        this.linkEditorId = 'link_editor_id';
        this.ssoDialog = false;
        this.isPreLink = false;
    }

    // Open accordion dialog
    openAccordionDialog() {
        this.accordionDialog = true;
    }

    // Get existing uploaded images
    getExistingUploadedImages() {
        this.documentService.getAllUploadedImages().subscribe({
            next: (data: any) => {
                this.existingImagesList = data;
            },
            error: (error: any) => {
                console.error('Error fetching existing uploaded images:', error);
            },
        });
    }

    // Select image from existing images
    selectExistingImage(image: any) {
        this.uploadContentImageForm.patchValue({
            existingSelectedImage: image,
        });
    }

    // Show population dialog
    showPopulationDialog() {
        this.populationsDialog = true;
    }

    // Show public link dialog
    showPublicDialog() {
        this.publicDialog = true;
    }

    // Upload document
    uploadDocument() {
        if (this.uploadDocumentForm.valid) {
            const formData = new FormData();
            formData.append('uploaded_file', this.uploadDocumentForm.value.uploaded_file);
            formData.append('documentTitle', this.uploadDocumentForm.value.documentTitle);
            formData.append('documentLanguage', this.uploadDocumentForm.value.documentLanguage);
            formData.append('searchTags', JSON.stringify(this.uploadDocumentForm.value.searchTags));
            formData.append('documentDescription', this.uploadDocumentForm.value.documentDescription);
            formData.append('categories', JSON.stringify(this.uploadDocumentForm.value.categories));
            formData.append(
                'includeInContentLibrary',
                JSON.stringify(this.uploadDocumentForm.value.includeInContentLibrary)
            );
            formData.append('upointLink', JSON.stringify(this.uploadDocumentForm.value.upointLink));
            formData.append('aonExpression', this.uploadDocumentForm.value.aonExpression);
            formData.append('topSearchResult', JSON.stringify(this.uploadDocumentForm.value.topSearchResult));

            this.documentService.uploadDocument(formData).subscribe({
                next: (response) => {
                    console.log('Document uploaded successfully:', response);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Document uploaded successfully',
                    });
                },
                error: (error) => {
                    console.error('Error uploading document:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error uploading document',
                    });
                },
            });
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill all required fields',
            });
        }
    }

    // Load images for the editor
    loadImages() {
        this.imagesList = [
            { id: 1, src: 'assets/img1.jpg', name: 'Image 1' },
            { id: 2, src: 'assets/img2.jpg', name: 'Image 2' },
            { id: 3, src: 'assets/img3.jpg', name: 'Image 3' },
        ];
    }

    // Add class to an element
    addClass(element, className) {
        if (element && element.length > 0) {
            element.forEach((el) => {
                this.renderer.addClass(el, className);
            });
        }
    }

    // Remove class from an element
    removeClass(element, className) {
        if (element && element.length > 0) {
            element.forEach((el) => {
                this.renderer.removeClass(el, className);
            });
        }
    }

    // Placeholder function to check for disable accordion condition
    checkForDisableAccordion() {
        // Add your logic here to check for disable accordion condition
    }

    // Placeholder function to disable add population in case of multiple section select
    disableAddPopulationInCaseofMultipleSectionSelect() {
        // Add your logic here to disable add population in case of multiple section select
    }

    // Placeholder function to enable remove population for accordion
    enableRemovePopulationForAccordion() {
        // Add your logic here to enable remove population for accordion
    }

    // Placeholder function to check with mouse event
    checkwithMouseEvent() {
        // Add your logic here to check with mouse event
    }

    // Get cursor position for multiple lines
    getCursorPositionForMultiLine() {
        // Add your logic here to get cursor position for multiple lines
    }

    // Placeholder function to remove blank paragraph
    removeBlankParagraph(link) {
        // Add your logic here to remove blank paragraph
    }

    // Get selected text HTML for link
    getSelectedTextHTMLForLink() {
        const selObj = window.getSelection();
        let html = '';
        if (selObj && selObj.rangeCount > 0) {
            const container = document.createElement('div');
            for (let i = 0, len = selObj.rangeCount; i < len; ++i) {
                container.appendChild(selObj.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }
        return html;
    }

    // Placeholder function to get link range
    getLinkRange() {
        // Add your logic here to get link range
    }

    // Placeholder function to get cursor position
    getCursorPosition() {
        // Add your logic here to get cursor position
    }
}
