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
import * as CustomEditor from '../editor-js/ckeditor';
const stylesheet = './../editor-js/ckeditor-styles.css';
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
            }
        } else if (val === 'panel_content_show') {
            secTr.setAttribute('class', 'panel_content_hide');
            if (id.indexOf('pan-title') === -1) {
                element.children[0].setAttribute('class', 'plusIco pmicon');
            } else {
            }
        }
    }
};

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
    @ViewChild('fileInput') fileInput: ElementRef;
    @Input() languageFromParent: any;
    @Input() editorData: any;
    @Output() getEditorData = new EventEmitter<any>();
    formClientUser: FormGroup;
    public Editor = CustomEditor;
    @Input() allLanguagesList: any;
    config: any;
    msg: any;
    visible: boolean = false;
    ref: DynamicDialogRef;
    selectedPopulation: any = '';
    visiblePopulation: boolean = false;
    uploadDocumentForm: FormGroup;
    selectedCategory: any = null;
    populationsDialog = false;
    selectPopulationid;
    linkDialog: boolean = false;
    ssoDialog: boolean = false;
    publicDialog: boolean = false;
    intranet: boolean = false;
    documentDialog: boolean = false;
    newDocumentFlag: boolean = false;
    documentHeader: string = '';
    documentSummaryData: any;
    selectedFileTitle: any;
    organizationName: string = '';
    publicUrl: string = '';
    externalLinkHeader: string = '';
    editorExistingValue: string = '';
    newDocumentDialog: boolean = false;
    attachmentFileExtension = '';
    attachmentFileName = '';
    attachmentMimeType = '';
    uploadedPath = 'UCEDocuments/Uploaded_Docs';
    uploadedFile;
    attachmentFileStream;
    uploadFileData;
    uploadedFilePath;
    base64Output;
    acceptedFiles: string = '.pdf, .doc, .docx, .xls, .xlsx, .xlsm, .ppt, .pptx';
    maxUploadedSize = 5000000;
    isShowValidImageSizeError: boolean = false;
    isShowImageAvailableError: boolean = false;
    isShowExistingImageError: boolean = false;
    title = '';
    titleTextLength: number = 250;
    titleTextPending: number = this.titleTextLength;
    notvalidForm: boolean;
    uploadedForm: uploadedDocument;
    defaultPopulation: string = 'No_One';
    selectedLanguage: Languages;
    lang = [];
    categoryFlag: boolean = false;
    selectedCategories: any[] = [];
    userEmail = '';
    populationFilter = { name: 'Population', key: 'population' };
    typeFilter = { name: 'File Type', key: 'fileType' };
    locateFilter = { name: 'Language', key: 'locale' };
    lastUpdatedFilter = { name: 'Last Updated', key: 'lastUpdated' };
    updatedByFilter = { name: 'Updated By', key: 'updatedBy' };
    dataForFilter = [];
    selectedText: string = '';
    categories: any[] = [];
    selectPopulationFilter = [];
    selectedAllPopulation: boolean = false;
    cat_map = new Map();
    publicUrlError: boolean = false;
    showOverlay: boolean = false;
    imageHeader: string = '';
    newImageDialog: boolean = true;
    existingImageDialog: boolean = true;
    imageNameMaxLength = 40;
    imageNamePendingLength = this.imageNameMaxLength;
    note = '(' + this.imageNamePendingLength + ' characters remaining)';
    alignment = ['Left', 'Right'];
    images: any = [];
    imagesCopy: any[] = [];
    searchTerm: string = '';
    filteredFiles: any[] = [];
    allFiles: any[] = [];
    isVisibleImage: Boolean = true;
    selectedImageUrl: string = '';
    textValueName: string = '';
    alternateTextValue: string = '';
    alternateTextpendingLength = 200;
    note1 = '(' + this.alternateTextpendingLength + ' characters remaining)';
    editorForm: FormGroup;
    populationsCopy = [];
    formEditorData: any = '';
    previewImage: string = '';
    selectedImagePreview: string | ArrayBuffer | null;
    imageStaticUrl: string = 'https://upoint-dv.alight.com/NG15/content-pages-wc/assets/images/';
    allPredefinedLinks: any = [];
    selectedPredefinedList: any;
    allPredefinedData: any = {};
    domainFilter = { name: 'Domain', key: 'domain' };
    pageTypeFilter = { name: 'Page', key: 'page' };
    baseClientFilter = { name: 'BaseClient', key: 'baseclient' };
    isPreLink: boolean = false;
    existinguploadedImages: any = [];
    defaultexistinguploadedImages = [];
    showImageUploadDialog = false;
    selectedExistingImage: any;
    selectedImageIndex: string = '';
    existingImagesLoader = true;
    editorEvent;
    cursorPosition: any;
    cursorRange: any;
    cursorRangeforMultiPleLine: any;
    linkEditorId: string = '';
    titleOfOpenLink: string = '';
    nodeValuefromDobleClick = '';
    selectedPredefinedDestination = '';
    checkEvent;
    checkEventOnFocus;
    removeFlagBydblClick: boolean = false;
    nodesList = [];
    selectedImageData = '';
    replaceImage = false;
    isloadedPredefinedPages = false;
    isLinked: boolean = false;
    isMultilineSelection: boolean = false;
    languagesList = [];
    selectedTextInImage: string = '';
    documentsLanguages = {
        languageCode: 'en_US',
        displayLanguageText: 'English (default)',
    };
    selectedPageValue = {};
    mobileLinkTypeFlag: boolean = false;
    enableAccordionPopulation: boolean = false;
    enableRemoveAccordionPopulation: boolean = false;
    populationExistOnAccordionFlag: boolean = false;
    selectedDataBeforeApplyPopulation: string = '';

    populations = [
        {
            populationId: '1',
            populationName: 'All_Authenticated_Users',
            linkName: 'Includes all authenticated users',
            populationType: 'B',
        },
        {
            populationId: '2',
            populationName: 'IS_YSA_FSA_STR_PRM_TILE_ELIG',
            linkName: 'IS_YSA_FSA_STR_PRM_TILE_ELIG',
            populationType: 'C',
        },
    ];
    baseCategories: any[] = [
        {
            key: '1',
            name: 'Select All',
            populationType: 'A',
        },
        {
            key: '2',
            name: 'Base Populations',
            populationType: 'B',
        },
        {
            key: '3',
            name: 'Client-defined Populations',
            populationType: 'C',
        },
    ];
    uploadContentImageForm: FormGroup;
    acceptedImagesType: string = '.png, .jpg, .jpeg, .gif';
    maxUploadedImageSize = 250000;
    attachmentImageExtension = '';
    attachmentImageFileName = '';
    attachmentImageMimeType = '';
    imageFileStreamData: any;
    showClearImageSearch = false;
    onBeforeHide: EventEmitter<any>;
    onAfterHide: EventEmitter<any>;
    showAlertDialog: boolean = false;
    saveDocError: boolean = false;
    docErrorMessage: any;
    indexselectedText: number = 0;
    editorInstacnce;
    uploadButtonDisabled = false;
    isEnabled: boolean = false;
    documentLang = [];
    startUploading = false;
    receivedLang = false;
    removePop;
    removePopText;
    copyText: any = '';
    attrMap = {};
    selectedHTML = '';
    showdblclick: Boolean = false;
    documentSummaryDataLoader = true;
    currentEle: boolean = false;
    boldFlag: boolean = false;
    italicFlag: boolean = false;
    multilineContent: string = '';
    anchorFlag;
    populationExistFlag: boolean = false;
    currentCursorPosition: any;
    currentCursorRange: any;
    currentEnvironment = '';
    selectedPredefinedLink = '';
    wrapperAccordionId: any;

    boldFlagForIntranet: boolean = false;
    italicFlagIntranet: boolean = false;
    isInsideAccordionWithPopulation: boolean = false;
    replacePopulation = '';

    get remainingCharacters(): number {
        let currentLength = 0;
        if (this.uploadContentImageForm.get('textValueName').value !== null) {
            currentLength = this.uploadContentImageForm.get('textValueName').value.length;
        }
        return this.imageNameMaxLength - currentLength;
    }

    get remainingText(): number {
        let currentLength = 0;
        if (this.uploadContentImageForm.get('alternateTextValue').value !== null) {
            currentLength = this.uploadContentImageForm.get('alternateTextValue').value.length;
        }
        return this.alternateTextpendingLength - currentLength;
    }

    constructor(
        private fb: FormBuilder,
        public dialogService: DialogService,
        private contentService: ContentSummaryService,
        private documentService: DocumentService,
        private renderer: Renderer2,
        private clipboard: Clipboard,
        public messageService: MessageService
    ) {
        this.currentEnvironment = sessionStorage.getItem('environment');

        this.loadImages();

        this.lang = [{ languageCode: 'en_US', displayLanguageText: 'English (default)' }];

        this.uploadedForm = {};
    }

    ngOnInit(): void {
        this.uploadContentImageForm = this.fb.group({
            existingSelectedImage: new FormControl(''),
            uploadedImageForEditor: new FormControl(''),
            textValueName: ['', [Validators.required, Validators.maxLength(this.imageNameMaxLength)]],
            withforCrop: new FormControl('', Validators.required),
            textWrap: new FormControl('inline', []),
            alignment: new FormControl('', Validators.required),
            alternateTextValue: ['', [Validators.maxLength(this.alternateTextpendingLength)]],
        });
        this.formEditorData = this.editorData;
        this.populationsCopy = this.populations;

        if (sessionStorage.getItem('userMap')) {
            let userMap = JSON.parse(sessionStorage.getItem('userMap'));
            this.userEmail = userMap.email;
        }
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
            contentCss: [stylesheet],
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

        this.getAllPredefinedLinks();
        this.getExistingUploadedImages();

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

    popupCloseStatus(closeStatus) {
        if (closeStatus) {
            this.ssoDialog = false;
        }
    }

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
    updatePredefinedLinkOrder() {
        let returnData = this.contentService.updatePredefinedLinkOrder(
            JSON.parse(JSON.stringify(this.allPredefinedData)),
            this.selectedPredefinedLink
        );
        this.allPredefinedLinks = returnData?.allPredefinedLinks;
        this.selectedPredefinedList = returnData?.selectedPageValue;
    }

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

    searchPredefinedPage(data: any) {
        if (data !== undefined && data !== null) {
            this.allPredefinedLinks = data;
        }
    }

    getMessageBody(ck_event: any): void {
        this.editorEvent = ck_event.editor;
        this.checkEvent = ck_event.event;
        this.getEditorData.emit(this.formEditorData);
    }

    getContentFocusMessageBody(ck_event: any): void {
        console.log('focus ', ck_event);
        this.checkEventOnFocus = ck_event.editor;
    }

    retrieveMessageBody(): void {}

    cancel() {
        this.ref.close();
    }

    /** Changes shared by shaileen  */

    continue(): void {
        this.ref.close(this.selectedCategory);
        const population = sessionStorage.getItem('population_selectedCategory');
        this.formClientUser.controls['messageBody'].setValue('this.selectedPopulation');
    }
    /** Filter population  */

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

    populationType() {
        console.log('in population type ', this.selectPopulationFilter);
    }

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

    cancelFilter() {
        this.selectPopulationFilter = [];
        this.populations = this.populationsCopy;
    }

    /*   showPopulationDialog() {
      this.populationsDialog = true;
      if (sessionStorage.getItem("alightColleagueSessionToken")) {
        this.documentService.getAllPopulations().subscribe(
          data => {
            console.log("population data ", data);
            if (data.populationDetails.length > 0) {
              this.populations = data.populationDetails;
              this.populationsCopy = data.populationDetails;
            }
          }
        );
      }
  
    } */
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

            if (this.selectedText.startsWith('<i>') && this.selectedText.endsWith('</i>')) {
                console.log('---------------------------- In side the Itelic Condition --------');
                this.italicFlagIntranet = true;
            } else if (this.selectedText.startsWith('<strong>') && this.selectedText.endsWith('</strong>')) {
                console.log('---------------------------- In side the Bold Condition --------');
                this.boldFlagForIntranet = true;
            }

            this.cursorPosition = this.getCursorPosition();
            console.log(this.cursorRange, 'shoeLink');
            if (this.cursorRange.start.path[0] !== this.cursorRange.end.path[0]) {
                this.isMultilineSelection = true;
                this.multilineContent = selObj.toString();
            }
        }
        console.log(selObj.focusNode.parentElement.id);
        console.log('selects object ', selObj);
        if (selObj.toString() === '') {
            this.showAlertDialog = true;
            return;
        } else {
            console.log('select ', this.selectedText);
            this.cursorPosition = this.getCursorPosition();
            this.editorEvent.model.change((writer) => {
                const htmlDP = this.editorEvent.data.processor;
                const viewFragment = htmlDP.toView(this.selectedText);
                const modelFragment = this.editorEvent.data.toModel(viewFragment);
                this.editorEvent.model.insertContent(modelFragment, this.editorEvent.model.document.selection);
            });
        }
        this.linkDialog = true;
    }

    cancelLinkDialog() {
        window.getSelection().empty();
    }

    private getCursorPosition() {
        if (this.editorEvent !== undefined && this.editorEvent.model !== undefined) {
            const selection = this.editorEvent.model.document.selection;
            this.cursorRange = selection.getFirstRange();
            const cursorPosition = this.cursorRange ? this.cursorRange.start.offset : null;
            return cursorPosition;
        }
    }

    openLinks() {
        let parentElement = null;
        let parentId = null;
        this.selectedPredefinedLink = '';
        if (this.editorEvent.model !== undefined) {
            parentElement = this.editorEvent.model.document.selection.getFirstPosition().parent;
            let idMap = new Map();
            if (parentElement.getAttributes()) {
                idMap = parentElement.getAttributes();
            }
            for (let item of idMap) {
                console.log(item[1]);
                parentId = item[1];
            }
        }
        this.publicUrl = '';
        this.organizationName = '';
        parentId = this.nodeValuefromDobleClick.split('~')[1];
        console.log('parent id in open links ', parentId);
        if (parentId === 'public_editor_id') {
            if (this.selectedText.includes('(') && this.selectedText.includes(')')) {
                let splitData = this.selectedText.split('(');
                this.publicUrl = this.nodeValuefromDobleClick.split('~')[0];
                this.organizationName = splitData[1].split(')')[0];
            } else {
                this.publicUrl = this.nodeValuefromDobleClick.split('~')[0];
            }
            this.openExternalLinkDialog('public');
        } else if (parentId === 'intranet_editor_id') {
            if (this.selectedText.match('\\(')) {
                let splitData = this.selectedText.split('(');
                this.publicUrl = this.nodeValuefromDobleClick.split('~')[0];
                this.organizationName = splitData[1].split(')')[0];
            } else {
                this.publicUrl = this.nodeValuefromDobleClick.split('~')[0];
            }
            this.openExternalLinkDialog('intranet');
        } else if (parentId === 'existing_document_editor_id') {
            this.selectedFileTitle = this.nodeValuefromDobleClick.split('~')[0];
            let searchVal = 'quote';
            let quoteCheck = this.selectedFileTitle.search(searchVal);
            if (quoteCheck >= 0) {
                this.selectedFileTitle =
                    this.selectedFileTitle.slice(0, quoteCheck) +
                    '"' +
                    this.selectedFileTitle.slice(quoteCheck + searchVal.length, this.selectedFileTitle.length);
            }
            this.openDialogForDocument('Document');
        } else if (this.nodeValuefromDobleClick.indexOf('source=chooseExist') > 0) {
            this.selectedFileTitle = this.nodeValuefromDobleClick.split('source=chooseExist&fileTitle=')[1];
            let searchVal = 'quote';
            let quoteCheck = this.selectedFileTitle.search(searchVal);
            if (quoteCheck >= 0) {
                this.selectedFileTitle =
                    this.selectedFileTitle.slice(0, quoteCheck) +
                    '"' +
                    this.selectedFileTitle.slice(quoteCheck + searchVal.length, this.selectedFileTitle.length);
            }
            this.openDialogForDocument('Document');
        } else if (parentId === 'new_document_editor_id') {
            this.selectedFileTitle = this.nodeValuefromDobleClick.split('~')[0];
            this.showdblclick = true;
        } else if (parentId === 'predefined_editor_id') {
            this.selectedPredefinedLink = this.nodeValuefromDobleClick.split('~')[0];
            this.openSSODialog(true, 'dblClick');
        } else if (parentId === 'population_editor_id') {
            let splData1 = this.getDefaultPopulationAndText(this.selectedText);
            if (splData1.selectedData.length > 0) {
                this.selectedText = splData1.selectedData;
            }
            this.defaultPopulation = splData1.population;
            this.populationMethod();
        }
    }

    private getDefaultPopulationAndText(data) {
        let splData1 = {
            selectedData: '',
            population: '',
        };

        let splData = data.split(']');
        splData1.selectedData = splData[1].toString().split('[')[0];
        splData1.population = data.split(' ')[1].split(']')[0];
        return splData1;
    }

    openLInkByDoubleClick(event) {
        console.log('in openLInkByDoubleClick() ');
        console.log(event, ' event openLInkByDoubleClick ');
        console.log(event.target.innerText, ' event openLInkByDoubleClick ');
        if (event.target.innerText !== null) {
            let flag = event.target.innerText;
            if (flag?.includes('[BEGIN ') && flag?.includes('[END ')) {
                this.populationExistFlag = true;
                this.removeMultiple = false;
            } else {
                this.populationExistFlag = false;
                this.removeMultiple = false;
            }
        }
        if (event && event.target.localName === 'a') {
            this.selectedText = event.target.innerText;
            if (event.target.attributes[0].nodeValue !== undefined) {
                console.log(event.target.attributes[0].nodeValue, ' event openLInkByDoubleClick nodeValue');
                this.nodeValuefromDobleClick = event.target.attributes[0].nodeValue;
                document.getElementById('openExternalLinks_Editor').click();
                this.removeFlagBydblClick = true;
            }
        } else if (event && event.target.localName === 'strong' && event.target.parentElement.localName === 'a') {
            this.selectedText = event.target.innerText;
            this.nodeValuefromDobleClick = event.target.innerText;
            this.getAnchorTagValue();
        } else if (event && event.target.localName === 'i') {
            this.selectedText = event.target.innerText;
            this.nodeValuefromDobleClick = event.target.innerText;
            this.getAnchorTagValue();
        }
        if (event && event.target.localName === 'img') {
            this.selectedImageData = event.target.alt;
            this.cursorPosition = this.getCursorPosition();
            if (this.selectedImageData.length > 0) {
                const selectedImageURl = event.target.currentSrc;
                this.selectedImageIndex = selectedImageURl;
                this.selectedImageUrl = selectedImageURl;
                let imgData = this.selectedImageData.split(',');
                this.openDialogForImage(1);
                this.uploadContentImageForm.controls['existingSelectedImage'].setValue(selectedImageURl);
                this.uploadContentImageForm.controls['textWrap'].setValue(imgData[1]);
                this.uploadContentImageForm.controls['alignment'].setValue(this.capitilizeString(imgData[2]));
                this.uploadContentImageForm.controls['withforCrop'].setValue(imgData[3]);
                this.uploadContentImageForm.controls['alternateTextValue'].setValue(imgData[0]);

                this.uploadContentImageForm.controls['existingSelectedImage'].markAsTouched();
                this.uploadContentImageForm.controls['withforCrop'].markAsTouched();
                this.uploadContentImageForm.controls['textWrap'].markAsTouched();
                this.uploadContentImageForm.controls['alignment'].markAsTouched();
                this.uploadContentImageForm.controls['alternateTextValue'].markAsTouched();

                this.replaceImage = true;
            }
        } else if (event && event.target.localName === 'span' && event.target.parentElement.localName !== 'i') {
            if (event.target.className === 'hide-in-awl p-hidden') {
                let text = event.target.parentElement.innerHTML;
                text = event?.target?.parentElement?.parentElement?.outerHTML;
                this.getRemovePopulationHtmlAndText(text, true, '<span class="prevent-select" style="color:green;" ');
                this.selectedPopulation = this.defaultPopulation;
                this.replacePopulation = this.defaultPopulation;
                console.log(this.removePopText, 'removePopText in double click');
                console.log(this.removePop, 'removePop in double click');
                this.populationsDialog = true;
                this.removeFlagBydblClick = true;
            } else if (event.target.id === 'populationStart') {
                let text = event.target.parentElement.outerHTML;
                this.getRemovePopulationHtmlAndText(text, true);
            }
        } else if (
            event.target.localName === 'strong' &&
            event.target.parentElement.className === 'hide-in-awl p-hidden' &&
            event?.target.parentElement.parentElement.localName !== 'i'
        ) {
            if (
                event?.target?.parentElement?.parentElement?.parentElement?.outerHTML.includes('BEGIN ') &&
                event?.target.parentElement.parentElement.parentElement.outerHTML.includes('END ')
            ) {
                let text = event?.target?.parentElement?.parentElement?.parentElement?.outerHTML;
                this.getRemovePopulationHtmlAndText(text, true);
                this.selectedPopulation = this.defaultPopulation;
                this.replacePopulation = this.defaultPopulation;
                this.populationsDialog = true;
                this.removeFlagBydblClick = true;
            }
        } else if (event.target.parentElement.localName === 'i' && event.target.className === 'hide-in-awl p-hidden') {
            if (
                event?.target?.parentElement?.parentElement?.parentElement?.outerHTML.includes('BEGIN ') &&
                event?.target?.parentElement?.parentElement?.parentElement?.outerHTML.includes('END ')
            ) {
                let text = event?.target?.parentElement?.parentElement?.parentElement?.outerHTML;
                this.getRemovePopulationHtmlAndText(text, true);
                this.selectedPopulation = this.defaultPopulation;
                this.replacePopulation = this.defaultPopulation;
                this.populationsDialog = true;
                this.removeFlagBydblClick = true;
            }
        } else if (
            event &&
            event.target.localName === 'strong' &&
            event.target.parentElement.className === 'hide-in-awl p-hidden' &&
            event?.target.parentElement.parentElement.localName === 'i'
        ) {
            if (
                event?.target?.parentElement?.parentElement?.parentElement?.parentElement?.outerHTML.includes(
                    'BEGIN '
                ) &&
                event?.target?.parentElement?.parentElement?.parentElement?.parentElement?.outerHTML.includes('END ')
            ) {
                let text = event?.target?.parentElement?.parentElement?.parentElement?.parentElement?.outerHTML;
                this.getRemovePopulationHtmlAndText(text, true);
                this.selectedPopulation = this.defaultPopulation;
                this.replacePopulation = this.defaultPopulation;
                this.populationsDialog = true;
                this.removeFlagBydblClick = true;
            }
        }
    }

    capitilizeString(stringData) {
        if (stringData !== undefined && stringData !== '' && stringData.length > 0) {
            return stringData.charAt(0).toUpperCase() + stringData.slice(1);
        }
    }

    editorClick(event) {
        const editor = this.editorEvent;
        let modelElement;
        editor.model.document.on('change:data', () => {
            editor.editing.view.document.on('click', (evt, data) => {
                const viewElement = data.target;
                modelElement = editor.editing.mapper.toModelElement(viewElement);

                if (modelElement !== undefined) {
                    let wrapper = this.hasParentAccordion(modelElement, 'ah:expr');
                    if (wrapper && wrapper?._attrs?.get('id')) {
                        this.wrapperAccordionId = wrapper?._attrs?.get('id');
                    }
                }
            });
        });

        if (
            modelElement === undefined &&
            !event?.target?.offsetParent?.id.includes('contentd') &&
            event?.target?.offsetParent?.id !== undefined &&
            event?.target?.offsetParent?.id !== ''
        ) {
            this.wrapperAccordionId = event?.target?.offsetParent?.id;
        } else if (
            modelElement === undefined &&
            !event?.target?.offsetParent?.id.includes('contentd') &&
            event?.target?.attributes?.populationid?.nodeValue !== undefined
        ) {
            this.wrapperAccordionId = event?.target?.attributes?.populationid?.nodeValue;
        }
        this.checkForRemovePopulation(event);
        console.log(this.wrapperAccordionId, 'ID');
        this.nodesList = event.target.childNodes;
    }

    getParentId() {
        let parentId = null;

        let parentElement;

        if (this.editorEvent.model !== undefined) {
            parentElement = this.editorEvent.model.document.selection.getFirstPosition().parent;

            let idMap = new Map();

            if (parentElement.getAttributes()) {
                idMap = parentElement.getAttributes();
            }

            for (let item of idMap) {
                console.log(item[1]);
                parentId = item[1];
            }
        }
        return parentId;
    }

    showUnLink(event) {
        this.selectedText = window.getSelection().toString();
        const model = this.editorEvent.model;
        const selection = model.document.selection;
        const ranges = model.schema.getValidRanges(selection.getRanges(), 'linkHref');
        const linkCommand = this.editorEvent.commands.get('link');
        let parentId = this.getParentId();
        if (parentId === 'existing_document_editor_id') {
            this.selectedFileTitle = null;
        }
        if (selection.hasAttribute('linkHref')) {
            this.isEnabled = true;
        }
        if (this.isEnabled) {
            this.cursorPosition = this.getCursorPosition();
            console.log('cursor ', this.cursorPosition);
            this.editorEvent.model.change((writer) => {
                const rangesToUnlink = selection.isCollapsed
                    ? [
                          this.editorEvent.model.document.findAttributeRange(
                              selection.getFirstPosition()!,
                              'linkHref',
                              selection.getAttribute('linkHref'),
                              model
                          ),
                      ]
                    : model.schema.getValidRanges(selection.getRanges(), 'linkHref');
                console.log('rangesToUnlink ', rangesToUnlink);
                for (const range of rangesToUnlink) {
                    writer.removeAttribute('linkHref', range);
                    if (linkCommand) {
                        for (const manualDecorator of linkCommand.manualDecorators) {
                            writer.removeAttribute(manualDecorator.id, range);
                        }
                    }
                }
            });
            this.editorEvent.model.change((writer) => {
                writer.insertText(this.selectedText, this.cursorRange.start);
            });
        } else {
            this.cursorPosition = this.getCursorPosition();
            this.editorEvent.model.change((writer) => {
                writer.remove(writer.createRange(this.cursorRange.start, this.cursorRange.end));
            });
            this.editorEvent.model.change((writer) => {
                writer.insertText(this.selectedText, this.cursorRange.start);
            });
        }
        this.selectedText = '';
        this.isEnabled = false;
    }

    openExternalLinkDialog(data) {
        console.log('in show SSO dialog');
        this.publicDialog = true;
        this.linkDialog = false;
        if (data === 'intranet') {
            this.intranet = true;
            this.externalLinkHeader = 'Link to an Intranet Page';
            this.titleOfOpenLink = 'Intranet';
            this.linkEditorId = 'intranet_editor_id';
        } else {
            this.intranet = false;
            this.externalLinkHeader = 'Link to a Public Website';
            this.titleOfOpenLink = 'Public Website';
            this.linkEditorId = 'public_editor_id';
        }
    }

    setPublicLink() {
        console.log('in set Public Link ');
        console.log(this.publicUrl, this.organizationName);
        this.editorExistingValue = this.formEditorData;
        const selection = this.editorEvent.model.document.selection;
        const range = selection.getFirstRange();
        const cursorPosition = range ? range.start.offset : null;
        let tag = null;

        if (this.publicUrl.length === 0) {
            this.publicUrlError = true;
            return;
        } else {
            this.publicUrlError = false;
        }

        if (this.intranet) {
            if (this.publicUrl.startsWith('http://')) {
                this.publicUrl = this.publicUrl.replace('http:', 'https:');
            } else if (!this.publicUrl.startsWith('https://')) {
                this.publicUrl = 'https://' + this.publicUrl;
            }
        } else {
            if (!this.publicUrl.startsWith('http://') && !this.publicUrl.startsWith('https://')) {
                this.publicUrl = 'http://' + this.publicUrl;
            }
        }

        let org = '';
        if (this.selectedText.indexOf('(') > -1 && this.selectedText.endsWith(')')) {
            this.selectedText = this.selectedText.split('(')[0];
        }
        if (this.organizationName.length === 0) {
            tag = '<a href="' + this.publicUrl + '" class = "publicEditor_class">' + this.selectedText + '</a>';
        } else {
            tag = '<a href="' + this.publicUrl + '">' + this.selectedText + '(' + this.organizationName + ')</a>';
            org = '(' + this.organizationName + ')';
        }
        console.log();
        let str = '';
        if (this.editorEvent.model !== undefined) {
            const textToChange = this.editorEvent.model.change((writer) => {
                let parentElement = null;

                parentElement = this.editorEvent.model.document.selection.getFirstPosition().parent;
                this.editorEvent.model.schema.extend('paragraph', {
                    allowAttributes: 'id',
                });
                const link = writer.createText(this.selectedText + org, {
                    linkHref: this.publicUrl + '~' + this.linkEditorId,
                });
                let linkUrl = this.publicUrl + '~' + this.linkEditorId;
                let newLink = `<a href="${linkUrl}">${this.selectedText}${org}</a>`;

                if (this.boldFlagForIntranet === true) {
                    newLink = `<a href="${linkUrl}"><STRONG>${this.selectedText}${org}</STRONG></a>`;
                } else if (this.italicFlagIntranet === true) {
                    newLink = `<a href="${linkUrl}"><i>${this.selectedText}${org}</i></a>`;
                }

                str = link;
                writer.setAttribute('id', this.linkEditorId, parentElement);
                if (this.removeFlagBydblClick) {
                    let range1 = this.getLinkRange();
                    if (
                        this.hasParentNameForPredefinedPage(parentElement, 'tabNestedContent') ||
                        parentElement.parent.name == 'tableCell'
                    ) {
                    } else {
                        writer.remove(writer.createRange(this.cursorRange.start, this.cursorRange.end));
                    }
                }
                const htmlDP = this.editorEvent.data.processor;
                const viewFragment = htmlDP.toView(newLink.trim());
                const modelFragment = this.editorEvent.data.toModel(viewFragment);
                this.editorEvent.model.insertContent(modelFragment);
            });
            if (!this.removeFlagBydblClick) {
                this.editorEvent.model.change((writer) => {
                    writer.remove(writer.createRange(this.cursorRange.start, this.cursorRange.end));
                });
                this.removeBlankParagraph(this.publicUrl + '~' + this.linkEditorId);
            }
        }
        this.publicDialog = false;
        this.intranet = false;
        this.publicUrl = '';
        this.organizationName = '';
        this.linkEditorId = '';
        this.selectedText = '';
        this.removeFlagBydblClick = false;
        this.isMultilineSelection = false;
        this.boldFlagForIntranet = false;
        this.italicFlagIntranet = false;
        window.getSelection().empty();
    }

    openDialogForDocument(data) {
        this.linkDialog = false;
        if (data === 'New Document') {
            this.newDocumentFlag = true;
            this.newDocumentDialog = true;
            this.documentHeader = 'New Document';
            this.titleOfOpenLink = 'New Document';
            this.linkEditorId = 'new_document_editor_id';
            this.uploadDocumentForm.markAsPristine();
            this.uploadDocumentForm.markAsUntouched();
            this.notvalidForm = false;

            if (this.receivedLang) {
                this.uploadDocumentForm.controls['documentLanguage'].setValue(this.lang[0].languageCode);
                this.uploadDocumentForm.controls['documentLanguage'].markAllAsTouched();
            }
        } else {
            this.documentDialog = true;
            this.newDocumentFlag = false;
            this.newDocumentDialog = false;
            this.documentHeader = 'Choose Existing Document';
            this.titleOfOpenLink = 'Existing Document';
            this.linkEditorId = 'existing_document_editor_id';
        }
    }

    setDocumentLink(data) {
        console.log('selected file ', data.title);
        if (data.title === undefined || data.title === null) {
            return;
        } else {
            this.documentDialog = false;
            this.newDocumentFlag = false;
            this.selectedFileTitle = data.title;
            console.log('selectedFileTitle ---', data.title);
            let check = data.title.search('"');
            console.log('check ', check);
            if (check >= 0) {
                data.title = data.title.slice(0, check) + 'quote' + data.title.slice(check + 1, data.title.length);
            }

            this.editorExistingValue = this.formEditorData;
            this.indexselectedText = this.formEditorData.search(this.selectedText);
            let tag = '<a href="' + data.title + '"> ' + this.selectedText + '</a>';
            let parentElement = null;
            if (this.editorEvent.model !== undefined) {
                parentElement = this.editorEvent.model.document.selection.getFirstPosition().parent;
                const textToChange = this.editorEvent.model.change((writer) => {
                    this.editorEvent.model.schema.extend('paragraph', {
                        allowAttributes: 'id',
                    });
                    const link = writer.createText(this.selectedText, {
                        linkHref: data.title + '~' + this.linkEditorId,
                    });
                    const linkUrl =
                        '/web/' +
                        this.getClientName() +
                        '/client-tooling-login/-/ucceDownloader?fileId=' +
                        data.data.fileId +
                        '&ts=' +
                        data.data.lastUpdated +
                        '&source=chooseExist&fileTitle=' +
                        data.title;
                    const newLink = `<a href="${linkUrl}">${this.selectedText}</a>`;
                    writer.setAttribute('id', this.linkEditorId, parentElement);
                    if (this.removeFlagBydblClick) {
                        let range = this.getLinkRange();
                        if (
                            this.hasParentNameForPredefinedPage(parentElement, 'tabNestedContent') ||
                            parentElement.parent.name == 'tableCell'
                        ) {
                        } else {
                            writer.remove(writer.createRange(this.cursorRange.start, this.cursorRange.end));
                        }
                    }
                    const htmlDP = this.editorEvent.data.processor;
                    const viewFragment = htmlDP.toView(newLink.trim());
                    const modelFragment = this.editorEvent.data.toModel(viewFragment);
                    this.editorEvent.model.insertContent(modelFragment);
                });

                if (!this.removeFlagBydblClick) {
                    this.editorEvent.model.change((writer) => {
                        writer.remove(writer.createRange(this.cursorRange.start, this.cursorRange.end));
                    });
                    this.removeBlankParagraph(this.selectedFileTitle + '~' + this.linkEditorId);
                }
            }
            this.selectedText = '';
            this.linkEditorId = '';
            this.removeFlagBydblClick = false;
            this.selectedFileTitle = null;
            window.getSelection().empty();
        }
    }

    loadDocumentData() {
        this.documentSummaryData = [];
        this.dataForFilter = [];
        console.log('load document summary data');
        this.documentService.getDocumentSummaryData().subscribe(
            (data) => {
                this.documentSummaryDataLoader = false;
                console.log('data len ', data.length);
                this.documentSummaryData = data;
                this.dataForFilter = data;
            },
            (error) => {
                console.log(error);
                this.documentSummaryDataLoader = false;
            }
        );
    }

    search(data: any) {
        if (data !== undefined && data !== null) {
            this.documentSummaryData = data;
        }
    }
    changeTitleCount() {
        this.titleTextPending = this.titleTextLength - this.uploadDocumentForm.controls['documentTitle'].value.length;
        if (this.titleTextPending === 0) {
            return false;
        }
    }
    onKeyDown(event: KeyboardEvent) {
        if (event.key === ';' || event.key === ' ') {
            event.preventDefault();
            const element = event.target as HTMLElement;
            element.blur();
            element.focus();
        }
    }

    checkInput(event) {
        if (this.checkSpecialCharacter(event.value)) {
            this.uploadDocumentForm.controls['searchTags'].value?.pop(); // remove last entry from values
        }
    }

    checkSpecialCharacter(value) {
        let format = /[/&#@+/%><\/?]+/;
        if (format.test(value)) {
            return true;
        } else {
            return false;
        }
    }

    contentIDGenerator() {
        let regExValue = 'abcdefghijklmnopqrstuvwxyz1234567890';
        let text1 = '';
        let text2 = '';
        let text3 = '';
        let text4 = '';
        let text5 = '';
        for (let i = 0; i < 8; i++) {
            text1 += regExValue.charAt(Math.floor(Math.random() * regExValue.length));
        }
        for (let i = 0; i < 4; i++) {
            text3 += regExValue.charAt(Math.floor(Math.random() * regExValue.length));
        }
        for (let i = 0; i < 4; i++) {
            text4 += regExValue.charAt(Math.floor(Math.random() * regExValue.length));
        }
        for (let i = 0; i < 12; i++) {
            text5 += regExValue.charAt(Math.floor(Math.random() * regExValue.length));
        }
        text2 = Math.floor(1000 + Math.random() * 9000).toString();
        return text1 + '-' + text2 + '-' + text3 + '-' + text4 + '-' + text5;
    }

    convertFile(file: File): Observable<string> {
        const result = new ReplaySubject<string>(1);
        const reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onload = (event) => result.next(btoa(event.target.result.toString()));
        console.log(result);
        return result;
    }

    validateAllFormFields(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            if (control instanceof FormControl) {
                control.markAsTouched({ onlySelf: true });
            } else if (control instanceof FormGroup) {
                this.validateAllFormFields(control);
            }
        });
    }

    saveNewDocument(documentPage) {
        this.selectedImageIndex = documentPage.serverFilePath;
        this.newDocumentDialog = false;
        this.newDocumentFlag = false;
        let parentElement = null;
        if (this.editorEvent.model !== undefined) {
            parentElement = this.editorEvent.model.document.selection.getFirstPosition().parent;
            const textToChange = this.editorEvent.model.change((writer) => {
                this.editorEvent.model.schema.extend('paragraph', {
                    allowAttributes: 'id',
                });
                const link = writer.createText(this.selectedText, {
                    linkHref:
                        '/web/' +
                        this.getClientName() +
                        '/client-tooling-login/-/ucceDownloader?fileId=' +
                        documentPage.docFileId +
                        '&ts=' +
                        documentPage.data.lastUpdated +
                        '&newdocument=true&fileTitle=' +
                        documentPage.title,
                });
                writer.setAttribute('id', this.linkEditorId, parentElement);
                this.editorEvent.model.insertContent(link);
            });
            this.editorEvent.model.change((writer) => {
                writer.remove(writer.createRange(this.cursorRange.start, this.cursorRange.end));
            });
        }
        this.selectedText = '';
        this.linkEditorId = '';
    }

    getClientName() {
        let user = JSON.parse(sessionStorage.getItem('userMap'));
        if (user !== undefined && user !== null && Object.keys(user).length > 0 && 'orgName' in user) {
            return user['orgName'].toString().replace('/', '').toLowerCase();
        }
    }

    getClosePopupforDocumentPage(date) {
        this.newDocumentDialog = false;
        this.newDocumentFlag = false;
    }

    isFieldValid(field: string) {
        return this.uploadDocumentForm.controls[field].invalid && this.uploadDocumentForm.controls[field].touched;
    }

    isFieldValidForImage(field: string) {
        return (
            this.uploadContentImageForm.controls[field].invalid && this.uploadContentImageForm.controls[field].touched
        );
    }

    openCategory() {
        if (this.categoryFlag) {
            this.categoryFlag = false;
        } else {
            this.categoryFlag = true;
        }
        this.documentService.getCategories().subscribe({
            next: (data) => {
                this.categories = [];
                this.categories = data['categoryList'];
            },
            error: (error) => {
                console.log(error);
            },
        });
        console.log('open category ', this.uploadDocumentForm.controls);
    }

    selectCategory(data, index) {
        this.selectedCategories = [];
        let controlName = 'cat_checkBox' + index;
        console.log('selectCategory ', data);
        if (this.cat_map.has(controlName)) {
            this.cat_map.delete(controlName);
        } else {
            this.cat_map.set(controlName, data);
        }
        for (let i of this.cat_map.keys()) {
            console.log('map value ', this.cat_map.get(i));
            this.selectedCategories.push(this.cat_map.get(i));
            console.log('this.selectedCategories ', this.selectedCategories);
        }
        this.uploadDocumentForm.controls['categories'].setValue(this.selectedCategories);
        console.log('open category ', this.uploadDocumentForm.controls);
    }

    /**  Updated code for population search  */

    search1(data: any) {
        if (data !== undefined && data !== null) {
            this.populations = data;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        const formdata = this.formEditorData;
        if (changes !== undefined || changes !== null) {
            this.formEditorData = this.editorData;
        }
        if (this.languageFromParent !== undefined) {
            this.lang = [];
            this.receivedLang = true;
            this.lang = this.languageFromParent;
            if (this.languageFromParent.lenght === 0) {
                this.documentsLanguages = this.languageFromParent[0];
            } else if (this.languageFromParent.lenght === 1) {
                this.documentsLanguages = this.languageFromParent[1];
            }
        }
        if (this.allLanguagesList !== undefined) {
            this.languagesList = this.allLanguagesList;
        }
    }
    showOverlaypanel() {
        this.showOverlay = true;
        this.selectedTextInImage = this.getSelectedTextHTMLForLink();
        this.cursorPosition = this.getCursorPosition();
        console.log(this.selectedTextInImage, 'fjf');

        if (this.editorEvent !== undefined) {
            this.editorEvent.model.change((writer) => {
                const htmlDP = this.editorEvent.data.processor;
                const viewFragment = htmlDP.toView(this.selectedTextInImage);
                const modelFragment = this.editorEvent.data.toModel(viewFragment);
                this.editorEvent.model.insertContent(modelFragment, this.editorEvent.model.document.selection);
            });
        }
    }

    openDialogForImage(data) {
        this.showOverlay = false;
        this.showImageUploadDialog = true;
        if (data === 0) {
            this.newImageDialog = true;
            this.existingImageDialog = false;
            this.imageHeader = 'Upload Image';
            this.uploadContentImageForm.controls['textWrap'].setValue('block');
            this.uploadContentImageForm.controls['textValueName'].setValidators([Validators.required]);
            this.uploadContentImageForm.controls['uploadedImageForEditor'].setValidators([Validators.required]);
        } else {
            this.existingImageDialog = true;
            this.newImageDialog = false;
            this.getExistingUploadedImages();
            this.uploadContentImageForm.get('textValueName').clearValidators();
            this.uploadContentImageForm.get('textValueName').updateValueAndValidity();
            this.uploadContentImageForm.get('uploadedImageForEditor').clearValidators();

            this.uploadContentImageForm.controls['textWrap'].setValue('block');
            this.uploadContentImageForm.controls['textWrap'].markAsTouched();

            this.imageHeader = 'Choose Existing Image';
        }
    }

    onUpload(event: any) {
        if (event.files && event.files.length > 0) {
            const selectedImage = event.files[0];
            if (selectedImage && selectedImage.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.selectedImagePreview = e.target.result;
                };
                reader.readAsDataURL(selectedImage);
            } else {
                console.log('selected non image file type');
            }
        }
        let upsrc: any = '<img src=' + 'selectedImagePreview' + '>';
        this.formEditorData = this.formEditorData + upsrc;
    }

    loadImages() {
        for (let i = 1; i <= 7; i++) {
            const imagepath = '../../../assets/images/image' + i + '.jpg';
            let imgObj = {
                file: imagepath,
                filename: 'image' + i,
            };
            this.images.push(imgObj);
            this.allFiles.push(imgObj.filename);
            this.imagesCopy.push(imgObj);
        }
    }

    handleFileInput(event: any) {
        const file = event.target.files[0];
        if (file) {
            console.log('Uploaded image:', file);
        }
    }

    selectImage(image, index) {
        console.log(index);
        if (image.serverFilePath !== undefined && image.serverFilePath !== null) {
            this.selectedImageIndex = image.serverFilePath;
            this.selectedImageUrl = image?.serverFilePath;
            this.selectedExistingImage = image;
            let imageTitle = image?.title;
            this.uploadContentImageForm.controls['existingSelectedImage'].setValue(this.selectedImageUrl);
            this.uploadContentImageForm.controls['textValueName'].setValue(imageTitle);
            this.uploadContentImageForm.controls['alternateTextValue'].setValue(imageTitle);
            this.uploadContentImageForm.controls['textValueName'].markAsTouched();
            this.uploadContentImageForm.controls['existingSelectedImage'].markAsTouched();
        }
    }

    searchFiles() {
        if (this.searchTerm === '') {
            this.images = [];
            this.images = this.imagesCopy;
            this.isVisibleImage = true;
            this.filteredFiles = [];
        } else {
            this.images = [];
            this.filteredFiles = [];
            for (let i = 0; i < this.imagesCopy.length; i++) {
                if (this.imagesCopy[i].filename === this.searchTerm) {
                    this.images.push(this.imagesCopy[i]);
                }
            }
        }
    }

    clearImageSearch() {
        this.images = [];
        this.images = this.imagesCopy;
        this.isVisibleImage = true;
        this.searchTerm = '';
        this.filteredFiles = [];
        this.showClearImageSearch = false;
        this.existinguploadedImages = this.defaultexistinguploadedImages;
    }

    getNameCharLength() {
        this.imageNamePendingLength = this.imageNameMaxLength - this.textValueName.length;
        this.note = '(' + this.imageNamePendingLength + ' characters remaining)';
    }

    getAlternateTextLenth() {
        this.alternateTextpendingLength = 200 - this.alternateTextValue.length;
        this.note1 = '(' + this.alternateTextpendingLength + ' characters remaining)';
    }

    closeDialog() {
        this.uploadContentImageForm.markAsUntouched();
        this.showImageUploadDialog = false;
        this.uploadContentImageForm.reset();
    }
    onBeforeDialogHide() {
        this.uploadContentImageForm.markAsUntouched();
        this.showImageUploadDialog = false;
        this.uploadContentImageForm.reset();
    }

    getSelectedPopulation(population) {
        this.defaultPopulation = population;

        const selObj = window.getSelection();
        this.cursorPosition = this.getCursorPosition();
        let range1;
        let startPop = `[BEGIN ${this.defaultPopulation}]`;
        let endPop = `[END ${this.defaultPopulation}]`;

        let parentElement = null;

        parentElement = this.editorEvent.model.document.selection.getFirstPosition().parent;
        this.editorEvent.model.schema.extend('paragraph', {
            allowAttributes: 'id',
        });
        let populationId = this.idGenerator();
        if (this.enableAccordionPopulation) {
            sessionStorage.setItem('accordionPopulation', population);
            sessionStorage.setItem('accordionPopulationId', populationId);
            if (!this.populationExistOnAccordionFlag) {
                this.editorEvent.execute('insertPopulationUpdateAccordion');
            }
            this.populationExistOnAccordionFlag = false;
            return false;
        } else {
            sessionStorage.removeItem('accordionPopulation');
            sessionStorage.removeItem('accordionPopulationId');
        }

        if (selObj.toString() === '' && this.selectedDataBeforeApplyPopulation.length === 0) {
            if (this.editorEvent.model !== undefined) {
                const selection = this.editorEvent.model.document.selection;
                const range = selection.getFirstRange();
                const cursorPosition = range ? range.start.offset : null;
                this.indexselectedText = cursorPosition;

                if (cursorPosition !== null) {
                    let source =
                        '<label contenteditable="true"><span class="hide-in-awl p-hidden" style ="color: green;" contenteditable="false" id ="populationStart" populationid ="' +
                        populationId +
                        '" data-haspopulation = "custom-population"  class="prevent-select">' +
                        startPop +
                        ' </span> <span class="hide-in-awl p-hidden" style="color: green;" contenteditable="false" id ="populationEnd" populationid ="' +
                        populationId +
                        '" data-haspopulation = "custom-population"  class="prevent-select">' +
                        endPop +
                        '</span>&nbsp;</label>';
                    if (this.removeFlagBydblClick) {
                        source =
                            '<span class="hide-in-awl p-hidden" style ="color: green;" contenteditable="false" id ="populationStart" populationid ="' +
                            populationId +
                            '" data-haspopulation = "custom-population"  class="prevent-select">' +
                            startPop +
                            '</span> ' +
                            this.removePopText +
                            ' <span class="hide-in-awl p-hidden" style="color: green;" contenteditable="false" id ="populationEnd" populationid ="' +
                            populationId +
                            '" data-haspopulation = "custom-population"  class="prevent-select">' +
                            endPop +
                            '</span>';
                        console.log('in replace ', this.removePop);
                        console.log('in replace  source ', source);
                        if (this.boldFlag) {
                            source = '<strong>' + source + '</strong>';
                        }
                        if (this.italicFlag) {
                            source = '<i>' + source + '</i>';
                        }
                        source = this.removePop
                            .toString()
                            .replaceAll(this.replacePopulation, ' ' + this.defaultPopulation);
                        this.formEditorData = this.formEditorData.toString().replace(this.removePop, source);
                    } else {
                        if (this.editorEvent.model !== undefined) {
                            this.editorEvent.model.change((writer) => {
                                const htmlDP = this.editorEvent.data.processor;
                                const viewFragment = htmlDP.toView(source);
                                const modelFragment = this.editorEvent.data.toModel(viewFragment);
                                this.editorEvent.model.insertContent(
                                    modelFragment,
                                    this.editorEvent.model.document.selection
                                );
                            });
                        }
                    }
                }
            }
        } else {
            if (!this.removeFlagBydblClick) {
                console.log('   => 1');
                this.selectedText = this.getSelectedTextHTMLForPop();
                if (this.selectedText.length === 0) {
                    this.selectedText = this.selectedDataBeforeApplyPopulation;
                }
            } else {
                this.selectedText = this.removePopText;
                console.log('   => 2', this.selectedText);
            }
            const selection = this.editorEvent.model.document.selection;
            range1 = selection.getFirstRange();
            const cursorPosition = range1 ? range1.start.offset : null;
            let source =
                '<label contenteditable="true"><span class="hide-in-awl p-hidden" style ="color: green;" contenteditable="false" id ="populationStart" populationid ="' +
                populationId +
                '" data-haspopulation = "custom-population"  class="prevent-select">' +
                startPop +
                '</span> ' +
                this.selectedText +
                ' <span class="hide-in-awl p-hidden" style="color: green;" contenteditable="false" id ="populationEnd" populationid ="' +
                populationId +
                '" data-haspopulation = "custom-population"  class="prevent-select">' +
                endPop +
                '</span>&nbsp;</label>';
            if (this.boldFlag) {
                source = '<strong>' + source + '</strong>';
            }
            if (this.italicFlag) {
                source = '<i>' + source + '</i>';
            }

            if (cursorPosition !== null) {
                if (this.removeFlagBydblClick) {
                    source =
                        '<span class="hide-in-awl p-hidden" style ="color: green;" contenteditable="false" id ="populationStart" populationid ="' +
                        populationId +
                        '" data-haspopulation = "custom-population"  class="prevent-select">' +
                        startPop +
                        '</span> ' +
                        this.selectedText +
                        ' <span class="hide-in-awl p-hidden" style="color: green;" contenteditable="false" id ="populationEnd" populationid ="' +
                        populationId +
                        '" data-haspopulation = "custom-population"  class="prevent-select">' +
                        endPop +
                        '</span>';
                    if (this.boldFlag) {
                        source = '<strong>' + source + '</strong>';
                    }
                    if (this.italicFlag) {
                        source = '<i>' + source + '</i>';
                    }
                    console.log('in replace ', this.removePop);
                    console.log('in replace  source ', source);
                    source = this.removePop.toString().replaceAll(this.replacePopulation, ' ' + this.defaultPopulation);
                    this.formEditorData = this.formEditorData.toString().replace(this.removePop, source);
                } else {
                    console.log('in add');
                    if (!this.populationExistFlag) {
                        this.editorEvent.model.change((writer) => {
                            writer.remove(writer.createRange(this.cursorRange.start, this.cursorRange.end));
                        });
                        if (this.editorEvent.model !== undefined) {
                            this.editorEvent.model.change((writer) => {
                                const htmlDP = this.editorEvent.data.processor;
                                const viewFragment = htmlDP.toView(source);
                                const modelFragment = this.editorEvent.data.toModel(viewFragment);
                                this.editorEvent.model.insertContent(
                                    modelFragment,
                                    this.editorEvent.model.document.selection
                                );
                            });
                        }
                    }
                }
            }
        }
        this.populationsDialog = false;
        this.removeFlagBydblClick = false;
        this.nodeValuefromDobleClick = '';
        this.defaultPopulation = '';
        this.selectedPopulation = '';
        this.selectedText = '';
        this.boldFlag = false;
        this.italicFlag = false;
    }

    getClosepulation(status) {
        this.populationsDialog = false;
        this.defaultPopulation = '';
        this.selectedPopulation = '';
    }
    populationMethod() {
        this.selectedPopulation = '';
        this.populationsDialog = true;
        this.selectedDataBeforeApplyPopulation = this.getSelectedTextHTMLForPop();
    }

    insertImageIntoEditor(imgPath, imgTitle) {
        let altArr = [];
        let alignment = null;
        let textWrap = 'inline';
        let title = imgTitle ? imgTitle : '';
        if (this.uploadContentImageForm.controls['alignment'].value !== undefined) {
            alignment = this.uploadContentImageForm.controls['alignment'].value.toLowerCase();
        }
        if (this.uploadContentImageForm.controls['textWrap'].value === 'block') {
            textWrap = 'block';
        } else {
            textWrap = 'inline';
        }

        let width = this.uploadContentImageForm.controls['withforCrop'].value;
        let altTag = this.uploadContentImageForm.controls['alternateTextValue'].value;
        altArr.push(altTag);
        altArr.push(textWrap);
        altArr.push(alignment);
        altArr.push(width);

        let source = '';

        if (textWrap === 'block') {
            if (alignment !== 'right') {
                source = `<span style="width:${width}%; float:left;clear:left;margin:11px" contenteditable="false" data-customwidth="${width}">
      <img src="${imgPath}" alt="${altArr.toString()}" srcset="${imgPath}" align="${alignment}" title="${title}" style="width:100%; height:auto"  />
      </span><p><br />&nbsp;</p>`;
            } else {
                source = `<span style="width:${width}%; float:right;clear:right;margin:11px" contenteditable="false;" data-customwidth="${width}">
    <img src="${imgPath}" alt="${altArr.toString()}" srcset="${imgPath}" align="${alignment}" title="${title}"  style="width:100%; height:auto"  />
    </span><p><br />&nbsp;</p>`;
            }
        }
        if (textWrap === 'inline') {
            if (alignment !== 'right') {
                let marginRight = 100 - width;
                let inlineStyle =
                    'width: ' + width + '%; float: left; clear:left; margin: 11px ' + marginRight + '% 11px 11px;';

                source = `<span style="${inlineStyle}" contenteditable="false">
      <img src="${imgPath}" alt="${altArr.toString()}" srcset="${imgPath}" align="${alignment}" title="${title}" style="width:100%; height:auto"  />
      </span><p><br />&nbsp;</p>`;
            } else {
                let marginLeft = 100 - width;
                let inlineStyle =
                    'width: ' + width + '%; float: right; clear:right; margin: 11px 11px 11px ' + marginLeft + '%';
                source = `<span style="${inlineStyle}" contenteditable="false">
    <img src="${imgPath}" alt="${altArr.toString()}" srcset="${imgPath}" align="${alignment}" title="${title}" style="width:100%; height:auto" />
    </span><p><br />&nbsp;</p>`;
            }
        }
        if (this.editorEvent !== undefined && this.editorEvent.model !== undefined) {
            this.editorEvent.model.change((writer) => {
                const htmlDP = this.editorEvent.data.processor;
                const viewFragment = htmlDP.toView(source);
                const modelFragment = this.editorEvent.data.toModel(viewFragment);
                this.editorEvent.model.insertContent(modelFragment, this.editorEvent.model.document.selection);
            });
        } else {
            this.formEditorData = this.formEditorData + source;
        }
    }

    onContinueToUploadImage() {
        if (!this.replaceImage && this.uploadedFile) {
            let fileSize = this.uploadedFile.size;
            let fileName = this.uploadedFile.name;
            this.attachmentImageExtension = fileName.split('.').pop();
            this.attachmentImageFileName = fileName.split('.')[0];
            this.attachmentImageMimeType = this.uploadedFile.type;
            if (fileSize > this.maxUploadedImageSize) {
                this.isShowValidImageSizeError = true;
                this.uploadContentImageForm.controls['uploadedImageForEditor'].setValue(null);
            } else {
                this.isShowValidImageSizeError = false;
            }

            if (!this.acceptedImagesType.includes(this.attachmentImageExtension)) {
                this.uploadContentImageForm.controls['uploadedImageForEditor'].setValue(null);
                this.isShowImageAvailableError = true;
            } else {
                this.isShowImageAvailableError = false;
            }
        } else if (!this.replaceImage && this.uploadedFile === undefined) {
            this.isShowImageAvailableError = true;
        }

        if (this.editorEvent !== undefined) {
            this.editorEvent.model.change((writer) => {
                writer.remove(writer.createRange(this.cursorRange.start, this.cursorRange.end));
            });
            if (this.uploadContentImageForm.get('alignment').value === 'Left' && this.selectedTextInImage !== '') {
                this.editorEvent.execute('enter');
            }
            if (this.selectedTextInImage !== '') {
                this.editorEvent.execute('delete');
            }
        }

        const data = this.uploadContentImageForm.value;
        if (this.existingImageDialog) {
            this.uploadContentImageForm.get('uploadedImageForEditor').setValidators(null);
            this.uploadContentImageForm.get('uploadedImageForEditor').setErrors(null);
            this.uploadContentImageForm.controls['existingSelectedImage'].setValidators([Validators.required]);
        } else {
            this.uploadContentImageForm.controls['uploadedImageForEditor'].setValidators([Validators.required]);
            this.uploadContentImageForm.get('existingSelectedImage').setValidators(null);
            this.uploadContentImageForm.get('existingSelectedImage').setErrors(null);
        }

        if (this.uploadContentImageForm.valid) {
            if (this.existingImageDialog && this.selectedImageUrl) {
                this.insertImageIntoEditor(this.selectedImageUrl, this.selectedExistingImage?.title);
                this.closeDialog();
            } else if (this.uploadedFile) {
                this.uploadButtonDisabled = true;
                const dataToUpload = {
                    folderPath: 'UCEDocuments/CONTENTPAGE_IMAGES',
                    documentTitle: data.textValueName,
                    fileId: this.contentIDGenerator(),
                    attachmentMimeType: this.attachmentImageMimeType,
                    attachmentFileName: this.attachmentImageFileName,
                    attachmentFileExtension: this.attachmentImageExtension,
                    attachmentFileStream: this.imageFileStreamData,
                    aonExpression: 'All_Authenticated_Users',
                    documentLanguage: 'en_US',
                    lastUpdated: Date.now().toString(),
                    updatedBy: this.userEmail,
                    documentDescription: data.textValueName,
                    searchTags: '',
                    categories: '',
                    includeInContentLibrary: false,
                    upointLink: false,
                    topSearchResult: false,
                    searchable: true,
                    usage: 'test',

                    alignment: data.alignment,
                    alternateTextValue: data.alternateTextValue,
                    textValueName: data.textValueName,
                    textWrap: data.textWrap,
                    withforCrop: data.withforCrop,
                };

                this.documentService.uploadImageFile(dataToUpload).subscribe({
                    next: (result: any) => {
                        console.log(result, 'result');
                        this.uploadButtonDisabled = false;
                        this.messageService.clear();
                        this.messageService.add({
                            severity: 'success',
                            summary: result.responseStatus,
                            detail: 'Document uploaded successfully!',
                        });
                        const ImagePath = result.serverFilePath;
                        this.getExistingUploadedImages();
                        this.insertImageIntoEditor(ImagePath, dataToUpload.documentTitle);
                        this.closeDialog();
                    },

                    error: (error) => {
                        console.log(error.error);
                        this.uploadButtonDisabled = false;
                        let err = error.error;
                        this.messageService.add({
                            severity: 'error',
                            summary: err.responseStatus,
                            detail: err.responseMessage,
                        });
                    },
                });
            } else {
                if (this.selectedImageUrl) {
                    this.isShowExistingImageError = false;
                } else {
                    this.isShowExistingImageError = true;
                }
            }
        } else {
            this.uploadContentImageForm.markAllAsTouched();
        }
    }

    onContinue() {
        if (this.existingImageDialog) {
            const imgPath = this.selectedImageUrl;
            let source = '<img src=' + imgPath + ' ' + 'height="125px"' + '/>';
            this.formEditorData = this.formEditorData + source;
            console.log(this.formEditorData);
            this.closeDialog();
        } else {
            this.closeDialog();
        }
    }
    isDocFieldValid(field: string) {
        if (field !== undefined && field !== null) {
            return this.uploadDocumentForm.controls[field].invalid && this.uploadDocumentForm.controls[field].touched;
        }
    }
    handleUploadedImageFile(event) {
        this.uploadedFile = event.target.files[0];
        let fileData = this.uploadedFile.arrayBuffer();
        fileData
            .then((data) => {
                let btdata = new Uint8Array(data);
                let array = Array.from(btdata);
                console.log(array);
                this.imageFileStreamData = array;
            })
            .catch((error) => {
                console.log(error);
            });

        let fileSize = this.uploadedFile.size;
        let fileName = this.uploadedFile.name;
        this.attachmentImageExtension = fileName.split('.').pop();
        this.attachmentImageFileName = this.attachmentImageExtension.toLowerCase();
        this.attachmentImageMimeType = this.uploadedFile.type;
        if (fileSize <= this.maxUploadedImageSize) {
            this.isShowValidImageSizeError = false;
        }
        if (this.acceptedImagesType.includes(this.attachmentImageExtension)) {
            this.isShowImageAvailableError = false;
        }
    }

    uploadContentImage() {}

    validateNo(e): boolean {
        const charCode = e.which ? e.which : e.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        if (this.uploadContentImageForm.controls['withforCrop'].value > 100) {
            this.uploadContentImageForm.controls['withforCrop'].setValue('100');
        }
        return true;
    }

    convertOmageToStreamData(file: File): Observable<string> {
        const result = new ReplaySubject<string>(1);
        const reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onload = (event) => result.next(btoa(event.target.result.toString()));
        console.log(result);
        return result;
    }

    getExistingUploadedImages() {
        this.contentService.getExistingUploadedImages().subscribe({
            next: (ImagesData) => {
                this.existingImagesLoader = false;
                this.existinguploadedImages = ImagesData?.documentList;
                this.defaultexistinguploadedImages = ImagesData?.documentList;
                let dataSorted = this.defaultexistinguploadedImages.sort(function (a, b) {
                    return b.lastUpdated > a.lastUpdated ? 1 : a.lastUpdated > b.lastUpdated ? -1 : 0;
                });
                this.existinguploadedImages = dataSorted;
            },
            error: (error) => {
                this.existingImagesLoader = false;
                console.log(error.error);
            },
        });
    }

    SearchImageByTitle() {
        console.log(this.searchTerm);
        let topSearchResult = [];
        if (this.defaultexistinguploadedImages && this.defaultexistinguploadedImages.length > 0 && this.searchTerm) {
            this.defaultexistinguploadedImages.filter((image) => {
                console.log(image.title, '---', image.fileName, this.searchTerm);
                if (image.title && image.title.toLowerCase().includes(this.searchTerm.toLowerCase())) {
                    topSearchResult.push(image);
                }
            });
        }
        this.showClearImageSearch = true;
        this.existinguploadedImages = topSearchResult;
    }

    onAfterHideCheck() {}

    closeAlertDialog() {
        this.showAlertDialog = false;
    }

    isNumberKey(evt) {
        let charCode = evt.which ? evt.which : evt.keyCode;
        console.log(evt.target.value);
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    cancelExistingDocumentDialog(date) {
        this.documentDialog = false;
        this.newDocumentFlag = false;
        this.selectedFileTitle = null;
        this.removeFlagBydblClick = false;
        window.getSelection().empty();
    }

    cancelPredefinedDialog() {
        this.ssoDialog = false;
        this.selectedPredefinedList = null;
        this.removeFlagBydblClick = false;
        window.getSelection().empty();
    }

    cancelExternalSiteDialog() {
        this.publicUrl = '';
        this.organizationName = '';
        this.publicUrlError = false;
        this.publicDialog = false;
        this.intranet = false;
        this.removeFlagBydblClick = false;
    }

    insertSectionIntoEditor() {
        let countSection = 1;
        let sectionId = 'section_generated_' + countSection;
        let source = `
        <section class="toggle-container">
            <div class="title">
            <label class="toggle-title"> 
            <span id="${sectionId}" style="cursor:pointer; font-weight:700;" onclick="window.panelOnClickSectionTab(${sectionId})">+ Title</span>
            
            </label>
            </div>
            <div class="panel_content_hide">
                Your content goes here.
            </div>
        </section>`;

        return source;
    }
    copyUsingEditor() {
        console.log('in copyUsingEditor1');
        this.getHtmlUsingEditorMethod();
    }

    getHtmlUsingEditorMethod() {
        const selection = this.editorEvent.model.document.selection;
        const selectedContent = this.editorEvent.model.getSelectedContent(selection);
        console.log('html from editor .', this.editorEvent.data.stringify(selectedContent));
        this.selectedHTML = this.editorEvent.data.stringify(selectedContent);
    }

    pasteHTML() {
        const classCheck = 'ck-widget image_resized ck-widget_with-resizer ck-widget_selected';
        this.checkForTheImageStyle();

        if (this.editorEvent.model) {
            this.editorEvent.model.change((writer) => {
                const htmlDP = this.editorEvent.data.processor;
                const viewFragment = htmlDP.toView(this.selectedHTML);
                const modelFragment = this.editorEvent.data.toModel(viewFragment);
                this.editorEvent.model.insertContent(modelFragment, this.editorEvent.model.document.selection);
            });
        }

        const replaceCheck = ' ';
        const index = this.formEditorData.search(classCheck);
        if (index >= 0) {
            // additional logic if needed
        }
    }

    returnLanguageName(code) {
        return this.contentService.returnLanguageNameFromCode(this.languagesList, code);
    }

    checkForTheImageStyle() {
        const classCheck = 'ck-widget image_resized ck-widget_with-resizer ck-widget_selected';
        const tableString =
            '<figure class="table ck-widget ck-widget_with-selection-handle ck-widget_selected" contenteditable="false">';
        const tableReplaceString = '<figure class="table" contenteditable="false">';
        let splitData = this.selectedHTML.split('<img');

        splitData.forEach((data) => {
            let searchIndex = data.search('<span style="float:left');
            if (searchIndex >= 0) {
                const margin = data.match(/margin:11px (\d+)%/);
                if (margin) {
                    const marginRight = 100 - parseInt(margin[1], 10);
                    this.selectedHTML = this.selectedHTML.replace(
                        '<span class="image-inline ck-widget image_resized ck-widget_with-resizer ck-widget_selected" style="width:100%;"',
                        `<span class="image-inline" style="width:${marginRight}%;"`
                    );
                }
            } else {
                searchIndex = data.search('<span style="float:right');
                if (searchIndex >= 0) {
                    const margin = data.match(/margin:11px 11px 11px (\d+)%/);
                    if (margin) {
                        const marginRight = parseInt(margin[1], 10);
                        this.selectedHTML = this.selectedHTML.replace(
                            '<span class="image-inline ck-widget image_resized ck-widget_with-resizer ck-widget_selected" style="width:100%;"',
                            `<span class="image-inline" style="width:${marginRight}%;"`
                        );
                    }
                }
            }
            this.selectedHTML = this.selectedHTML.replace(tableString, tableReplaceString);
        });

        this.selectedHTML = this.selectedHTML.replace('class="ck-link_selected"', '');
        this.checkForPopulationOnPaste();
    }

    readyEditorEvent(event) {
        this.editorEvent = event;
    }

    getSelectedTextHTML() {
        if (this.editorEvent) {
            const selection = this.editorEvent.model.document.selection;
            const selectedContent = this.editorEvent.model.getSelectedContent(selection);
            const selectedHTML = this.editorEvent.data.stringify(selectedContent);

            console.log('selectedContent.', selectedContent);
            console.log('html from editor .', selectedHTML);

            if (selectedHTML.includes('<strong>')) {
                this.boldFlag = true;
            }
            if (selectedHTML.includes('<i>')) {
                this.italicFlag = true;
            }

            return selectedHTML;
        }
        return '';
    }

    getLinkRange() {
        const selection = this.editorEvent.model.document.selection;
        const parentElement = selection.getFirstPosition().parent;
        const range = { start: 0, end: 0 };

        for (let i = 0; i < parentElement.childCount; i++) {
            const child = parentElement.getChild(i);
            if (child.getAttribute('linkHref') === this.nodeValuefromDobleClick) {
                range.start = child.startOffset;
                range.end = child.endOffset;
                this.cursorRange.start.path[1] = range.start;
                this.cursorRange.end.path[1] = range.end;
                break;
            }
        }

        return range;
    }

    removeBlankParagraph(link) {
        if (this.multilineContent) {
            const matchString = this.multilineContent.split('\n')[0];
            const editor = this.editorEvent;
            const root = editor.model.document.getRoot();
            const removeIndexes = [];

            for (let i = 0; i < root.childCount; i++) {
                const child = root.getChild(i);
                if (
                    child.childCount > 0 &&
                    matchString === child.getChild(0).data &&
                    link === child.getChild(0).getAttribute('linkHref')
                ) {
                    removeIndexes.push(i - 1);
                }
                if (child.childCount === 0 && child.isEmpty) {
                    removeIndexes.push(i);
                }
            }

            editor.model.change((writer) => {
                removeIndexes.forEach((index) => {
                    const child = root.getChild(index);
                    writer.remove(child);
                });
            });

            this.multilineContent = '';
        }
    }

    getAnchorTagValue() {
        if (this.editorEvent) {
            const selection = this.editorEvent.model.document.selection;
            const selectedContent = this.editorEvent.model.getSelectedContent(selection);
            const selectedHTML = this.editorEvent.data.stringify(selectedContent);
            const anchorIndex = selectedHTML.search('<a href=');

            if (anchorIndex >= 0) {
                const nodeValue = selectedHTML.split('<a href=')[1].split('>')[0];
                this.nodeValuefromDobleClick = nodeValue.slice(1, -1);
                document.getElementById('openExternalLinks_Editor').click();
                this.removeFlagBydblClick = true;
            }
        }
    }

    getRemovePopulationHtmlAndText(innerHTML, flag, searchString = '') {
        let searchText = '<span style="color:green;"';
        let index = innerHTML.search(searchText);
        if (index === -1 && searchString) {
            index = innerHTML.search(searchString);
        }

        if (index >= 0) {
            const [start, ...rest] = innerHTML.split('<span');
            const endTag = this.italicFlag ? '</span></i></span>' : '</span></span>';
            const [content, ...remaining] = rest[2].split(endTag);

            const startRemovePop = `<span${rest[1]}<span${content}</span>${
                this.italicFlag ? '</i></span>' : '</span>'
            }`;
            const tempEndRemovePop = startRemovePop.replace('BEGIN ', 'END ');
            const endRemovePop = tempEndRemovePop.replace(
                'contenteditable="false"',
                'contenteditable="false" id="populationEnd"'
            );

            this.removePop = startRemovePop + remaining.join(endTag) + endRemovePop;
            this.removePopText = remaining[1]?.split('<span')[0] || '';

            const boldIndex = innerHTML.search('<strong>');
            this.boldFlag = boldIndex >= 0;
            this.italicFlag = innerHTML.search('<i>') >= 0;

            if (flag) {
                this.removeFlagBydblClick = true;
                this.populationsDialog = true;
                this.selectedPopulation = this.defaultPopulation;
            } else {
                this.removeFlagBydblClick = false;
                this.populationsDialog = false;
                this.selectedPopulation = '';
                this.boldFlag = false;
                this.italicFlag = false;
            }
        }
    }

    idGenerator() {
        const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
        const randomString = (length) =>
            Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');

        return `${randomString(8)}-${Math.floor(1000 + Math.random() * 9000)}-${randomString(4)}`;
    }

    addClass(elements, className) {
        elements.forEach((element) => {
            if (element.classList) {
                element.classList.add(className);
            } else {
                element.className += ` ${className}`;
            }
        });
    }

    removeClass(elements, className) {
        elements.forEach((element) => {
            if (element.classList) {
                element.classList.remove(className);
            } else {
                element.className = element.className.replace(
                    new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'),
                    ' '
                );
            }
        });
    }

    checkForPopulationOnPaste() {
        const searchString = 'populationid=';
        const occurrences = [];
        let index = -1;

        while ((index = this.selectedHTML.indexOf(searchString, index + 1)) !== -1) {
            occurrences.push(index);
        }

        const uniqueIds = new Set(occurrences.map((i) => this.selectedHTML.substring(i + 14, i + 32)));

        uniqueIds.forEach((id) => {
            const newId = this.idGenerator();
            this.selectedHTML = this.selectedHTML.replace(new RegExp(id, 'g'), newId);
        });
    }

    getRemovePopulationHtmlAndTextForLabel(innerHTML, flag, searchString = '') {
        let index = innerHTML.search('<span style="color:green;" ');
        if (searchString) {
            index = innerHTML.search(searchString);
        }

        if (index >= 0) {
            const [start, ...rest] = innerHTML.split('<span');
            const endTag = '</span>';
            const [content, ...remaining] = rest[2].split(endTag);

            this.removePop = `<span${rest[1]}<span${content}</span>`;
            this.removePopText = remaining[1]?.split('<span')[0] || '';
            this.defaultPopulation = innerHTML.split('[BEGIN')[1].split(']')[0];

            this.boldFlag = innerHTML.search('<strong>') >= 0;
            this.italicFlag = innerHTML.search('<i>') >= 0;

            if (flag) {
                this.removeFlagBydblClick = true;
                this.selectedPopulation = this.defaultPopulation.trim();
                this.populationsDialog = true;
            } else {
                this.removeFlagBydblClick = false;
                this.populationsDialog = false;
                this.selectedPopulation = '';
                this.boldFlag = false;
                this.italicFlag = false;
            }
        }
    }

    checkForDisableAccordion() {
        const AccordionBtn = document.querySelectorAll('.section-add-btn');
        const removeAccordionBtn = document.querySelectorAll('.remove-section-btn');
        const selection = this.editorEvent.model.document.selection;
        const currentElement = selection.getFirstPosition().parent;
        const hasParentSection = this.hasParentWithClass(currentElement, 'accordion-panel');
        const hasParentPopulationSection = this.ExistingSectionHasParentWithClass(currentElement, 'selectorTag');

        if (hasParentSection) {
            this.enableAccordionPopulation = true;
            sessionStorage.setItem('enableAccordionPopulation', 'true');
            this.removeClass(removeAccordionBtn, 'ck-disabled');
            this.addClass(AccordionBtn, 'ck-disabled');
        } else {
            if (this.handleEventforDisableAccordion()) {
                this.addClass(AccordionBtn, 'ck-disabled');
            } else {
                this.removeClass(AccordionBtn, 'ck-disabled');
            }
            sessionStorage.setItem('enableAccordionPopulation', 'false');
            this.enableAccordionPopulation = false;
            this.addClass(removeAccordionBtn, 'ck-disabled');
        }

        this.enableRemoveAccordionPopulation = hasParentPopulationSection;
    }

    ExistingSectionHasParentWithClass(element, className) {
        if (!element) return false;

        let parent = element;
        while (parent) {
            if (parent.name === 'normalDiv') return true;

            if (
                parent.name === 'paragraph' &&
                (parent.nextSibling?._attrs?.get('id') === 'populationEnd' ||
                    parent.nextSibling?._attrs?.get('id') === 'populationStart') &&
                (parent.nextSibling?.name === 'accordion' || parent.previousSibling?.name === 'accordion')
            ) {
                return true;
            }
            parent = parent.parent;
        }

        if (!parent) {
            const rootNodes = element._children._nodes;
            for (let node of rootNodes) {
                if (node.name === 'ah:expr' && node._attrs.get('id') === this.wrapperAccordionId) {
                    this.enableRemoveAccordionPopulation = true;
                    return true;
                }
            }
        }
        return false;
    }

    hasParentWithClass(element, className) {
        if (!element) return false;

        let parent = element.parent;
        while (parent) {
            if (parent.name === 'accordionPanel' || parent.name === 'accordion') {
                this.checkForPopulationExistOnAccordion(parent);
                return true;
            }
            parent = parent.parent;
        }

        if (!parent) {
            const rootNodes = element._children._nodes;
            for (let node of rootNodes) {
                if (node.name === 'ah:expr' && node._attrs.get('id') === this.wrapperAccordionId) {
                    this.enableRemoveAccordionPopulation = true;
                    return true;
                }
            }
        }
        return false;
    }

    handleEventforDisableAccordion() {
        if (this.editorEvent?.model) {
            const selection = this.editorEvent.model.document.selection;
            const selectedContent = this.editorEvent.model.getSelectedContent(selection);
            return selectedContent && !selectedContent.isEmpty;
        }
        return false;
    }

    checkwithMouseEvent() {
        const editor = this.editorEvent;

        const checkSelection = () => {
            const selection = editor.model.document.selection;
            return !selection.isEmpty;
        };

        editor.editing.view.document.on('mousedown', () => {
            this.isContentSelected = checkSelection();
        });

        editor.editing.view.document.on('mouseup', () => {
            const isContentNowSelected = checkSelection();
            if (this.isContentSelected && !isContentNowSelected) {
                // Handle case when content is deselected
            }
            this.isContentSelected = isContentNowSelected;
        });
    }

    getCursorPositionForMultiLine() {
        if (this.editorEvent?.model) {
            const selection = this.editorEvent.model.document.selection;
            this.cursorRangeforMultiPleLine = selection.getFirstRange();
            this.cursorPosition = this.cursorRangeforMultiPleLine?.start.offset || null;
        }
    }

    checkForPopulationExistOnAccordion(parent) {
        const removePopulationBtn = document.querySelectorAll('.removepopulaiontoolbar');

        if (
            parent.previousSibling?.nextSibling?.parent?.parent?.name === 'ah:expr' ||
            parent.parent?.name === 'ah:expr' ||
            this.isInsideAccordionWithPopulation
        ) {
            this.populationExistOnAccordionFlag = true;
            this.removeClass(removePopulationBtn, 'ck-disabled');
        } else {
            this.populationExistOnAccordionFlag = false;
            this.addClass(removePopulationBtn, 'ck-disabled');
        }
    }

    testCodeForRemovalOfPopulationFromAccordion(parent) {
        if (parent?.name === 'prevent-select') {
            return true;
        } else {
            const len = parent.childCount;
            for (let i = 0; i < len; i++) {
                const idMap = parent.getChild(i).getAttributes();
                for (let item of idMap) {
                    // process each attribute if needed
                }
            }
        }
        console.log(this.populationExistOnAccordionFlag, ' pop flag ');
    }

    checkForAccordionPopulationElement(parent) {
        // Function implementation here if needed
    }

    hasParentNameForPredefinedPage(element, elementName) {
        while (element) {
            if (element.name === elementName) {
                return true;
            }
            element = element.parent;
        }
        return false;
    }

    getSelectedElements(selection) {
        const selectedElements = [];
        for (const range of selection.getRanges()) {
            for (const item of [...range.getItems()]) {
                if (item.is('element')) {
                    selectedElements.push(item);
                }
            }
        }
        return selectedElements;
    }

    disableAddPopulationInCaseofMultipleSectionSelect() {
        const selectionForCheckAccordion = this.editorEvent.data.model.document.selection;
        const selectedElements = this.getSelectedElements(selectionForCheckAccordion);

        const accordionTabs = selectedElements.filter((element) => element.name === 'accordion');
        const addPopulaiontoolbar = document.querySelectorAll('.addPopulaiontoolbar');

        if (accordionTabs.length > 0) {
            this.addClass(addPopulaiontoolbar, 'ck-disabled');
        } else {
            this.removeClass(addPopulaiontoolbar, 'ck-disabled');
        }
    }

    enableRemovePopulationForAccordion() {
        const editor = this.editorEvent;

        const updateState = (modelElement) => {
            const hasAccordion = this.hasParentAccordion(modelElement, 'accordion');
            if (hasAccordion) {
                if (hasAccordion.parent?.name === 'ah:expr') {
                    this.isInsideAccordionWithPopulation = true;
                    this.wrapperAccordionId = hasAccordion.parent?._attrs?.get('id');
                    this.enableRemoveAccordionButton();
                } else {
                    this.isInsideAccordionWithPopulation = false;
                }
            }
        };

        editor.model.document.on('change:data', () => {
            editor.editing.view.document.on('click', (evt, data) => {
                const viewElement = data.target;
                const modelElement = editor.editing.mapper.toModelElement(viewElement);
                if (modelElement) {
                    updateState(modelElement);
                }
            });
        });

        // Handle initial state in case of edit
        const initialSelectionElement = editor.model.document.selection.getFirstPosition()?.parent;
        if (initialSelectionElement) {
            updateState(initialSelectionElement);

            if (
                initialSelectionElement.name === 'paragraph' &&
                ['populationStart', 'populationEnd'].includes(initialSelectionElement._attrs.get('id')) &&
                ['accordion'].includes(
                    initialSelectionElement.nextSibling?.name || initialSelectionElement.previousSibling?.name
                )
            ) {
                this.isInsideAccordionWithPopulation = true;
                const wrapperAccordion = initialSelectionElement._children._nodes[0]._attrs;
                const htmlSpan = wrapperAccordion.get('htmlSpan');
                this.wrapperAccordionId = htmlSpan.attributes.populationid;
            }
        }

        this.disableToAddPopulationIfSectionHasPopulation();
    }

    hasParentAccordion(element, elementName) {
        while (element) {
            if (element.name === elementName) {
                return element;
            }
            element = element.parent;
        }
        return false;
    }

    enableRemoveAccordionButton() {
        document.querySelectorAll('.removepopulaiontoolbar').forEach((btn) => btn.classList.remove('ck-disabled'));
        document.querySelectorAll('.addPopulaiontoolbar').forEach((toolbar) => toolbar.classList.add('ck-disabled'));
    }

    disableToAddPopulationIfSectionHasPopulation() {
        if (this.isInsideAccordionWithPopulation) {
            document
                .querySelectorAll('.addPopulaiontoolbar')
                .forEach((toolbar) => toolbar.classList.add('ck-disabled'));
            document.querySelectorAll('.removepopulaiontoolbar').forEach((btn) => btn.classList.remove('ck-disabled'));
        }
    }

    checkForRemovePopulation(event) {
        const isValidHtml = (html) => html && html.includes('BEGIN ') && html.includes('END ');

        const getOuterHtml = (element, depth = 0) => {
            if (!element) return '';
            if (depth === 0) return element.outerHTML;
            return getOuterHtml(element.parentElement, depth - 1);
        };

        const conditions = [
            { element: event?.target, depth: 0 },
            { element: event?.target?.parentElement?.parentElement, depth: 0 },
            { element: event?.target, depth: 0 },
            {
                element: event?.target?.parentElement?.parentElement?.parentElement,
                depth: 0,
                check: event?.target?.localName === 'strong',
            },
            {
                element: event?.target?.parentElement?.parentElement?.parentElement,
                depth: 0,
                check: event?.target?.parentElement?.localName === 'i',
            },
            {
                element: event?.target?.parentElement?.parentElement?.parentElement?.parentElement,
                depth: 0,
                check: event?.target?.parentElement?.parentElement?.parentElement?.parentElement?.outerHTML === '',
            },
            {
                element: event?.target?.parentElement?.parentElement?.parentElement?.parentElement,
                depth: 0,
                check:
                    event?.target?.localName === 'strong' &&
                    event?.target?.parentElement?.parentElement?.localName === 'i',
            },
        ];

        for (const condition of conditions) {
            if (condition.check === undefined || condition.check) {
                const outerHtml = getOuterHtml(condition.element, condition.depth);
                if (isValidHtml(outerHtml)) {
                    this.getRemovePopulationHtmlAndText(outerHtml, false);
                    return;
                }
            }
        }
    }
}
