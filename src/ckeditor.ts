/**
 * @license Copyright (c) 2014-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import { ClassicEditor } from "@ckeditor/ckeditor5-editor-classic";
import { AccessibilityHelp } from "@ckeditor/ckeditor5-ui";
import { Alignment } from "@ckeditor/ckeditor5-alignment";
import { Autoformat } from "@ckeditor/ckeditor5-autoformat";
import { Autosave } from "@ckeditor/ckeditor5-autosave";
import { BlockQuote } from "@ckeditor/ckeditor5-block-quote";
import {
  Bold,
  Italic,
  Strikethrough,
  Subscript,
  Superscript,
  Underline
} from "@ckeditor/ckeditor5-basic-styles";
import { Clipboard, PastePlainText } from "@ckeditor/ckeditor5-clipboard";
import type { EditorConfig } from "@ckeditor/ckeditor5-core";
import { Essentials } from "@ckeditor/ckeditor5-essentials";
import { FindAndReplace } from "@ckeditor/ckeditor5-find-and-replace";
import {
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
} from "@ckeditor/ckeditor5-font";
import { Heading } from "@ckeditor/ckeditor5-heading";
import { Highlight } from "@ckeditor/ckeditor5-highlight";
import { HorizontalLine } from "@ckeditor/ckeditor5-horizontal-line";
import { HtmlEmbed } from "@ckeditor/ckeditor5-html-embed";
import {
  DataSchema,
  FullPage,
  GeneralHtmlSupport,
  HtmlComment,
} from "@ckeditor/ckeditor5-html-support";
import {
  AutoImage,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
} from "@ckeditor/ckeditor5-image";
import { Indent, IndentBlock } from "@ckeditor/ckeditor5-indent";
import { TextPartLanguage } from "@ckeditor/ckeditor5-language";
// import { Link, LinkImage } from "@ckeditor/ckeditor5-link";
import { List, ListProperties, TodoList } from "@ckeditor/ckeditor5-list";
import { Markdown } from "@ckeditor/ckeditor5-markdown-gfm";
import { MediaEmbed, MediaEmbedToolbar } from "@ckeditor/ckeditor5-media-embed";
import { Mention } from "@ckeditor/ckeditor5-mention";
import { PageBreak } from "@ckeditor/ckeditor5-page-break";
import { Paragraph } from "@ckeditor/ckeditor5-paragraph";
import { PasteFromOffice } from "@ckeditor/ckeditor5-paste-from-office";
import { RemoveFormat } from "@ckeditor/ckeditor5-remove-format";
import { StandardEditingMode } from "@ckeditor/ckeditor5-restricted-editing";
import { SelectAll } from "@ckeditor/ckeditor5-select-all";
import { ShowBlocks } from "@ckeditor/ckeditor5-show-blocks";
import { SourceEditing } from "@ckeditor/ckeditor5-source-editing";
import {
  SpecialCharacters,
  SpecialCharactersArrows,
  SpecialCharactersCurrency,
  SpecialCharactersEssentials,
  SpecialCharactersLatin,
  SpecialCharactersMathematical,
  SpecialCharactersText,
} from "@ckeditor/ckeditor5-special-characters";
import { Style } from "@ckeditor/ckeditor5-style";
import {
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
} from "@ckeditor/ckeditor5-table";
import { TextTransformation } from "@ckeditor/ckeditor5-typing";
import { Undo } from "@ckeditor/ckeditor5-undo";
import { WordCount } from "@ckeditor/ckeditor5-word-count";

// Custom Plugins
import AlightCopyPlugin from "./plugins/alight-copy-plugin/alight-copy-plugin";
import AlightImagePlugin from "./plugins/alight-image-plugin/alight-image-plugin";
import AlightPastePlugin from "./plugins/alight-paste-plugin/alight-paste-plugin";
import AlightPopulationPlugin from "./plugins/alight-population-plugin/alight-population-plugin";
import AlightTabsPlugin from "./plugins/alight-tabs-plugin/alight-tabs-plugin";

// Link Specific plugins
import AlightParentLinkPlugin from "./plugins/alight-parent-link-plugin"; // Use the index file
import type { LinkPluginConfig } from "./plugins/alight-parent-link-plugin"; // Import type
import AlightPredefinedLinkPlugin from "./plugins/alight-predefined-link-plugin/link";
import AlightNewDocumentLinkPlugin from "./plugins/alight-new-document-link-plugin/link";
// import AlightExistingDocumentLinkPlugin from "./plugins/alight-existing-document-link-plugin/alight-existing-document-link-plugin";
import AlightExistingDocumentLinkPlugin from "./plugins/alight-existing-document-link-plugin/link";
import AlightExternalLinkPlugin from "./plugins/alight-external-link-plugin/link";
import AlightEmailLinkPlugin from "./plugins/alight-email-link-plugin/link";


// Import custom styles for headings, style definitions and custom plugins
import "./styles/styles.scss";
import SessionService from "./services/session-service";

// import fontawesome
const script = document.createElement('script');
script.src = 'https://kit.fontawesome.com/019f6c532e.js';
script.crossOrigin = 'anonymous';
document.head.appendChild(script);

export const LICENSE_KEY = "eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NDcxODA3OTksImp0aSI6IjAwN2YzMTI1LTkyYTgtNDc0MS05NDNiLWViM2M3NjhjN2RhNiIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsic2giLCJkcnVwYWwiXSwid2hpdGVMYWJlbCI6dHJ1ZSwiZmVhdHVyZXMiOlsiRFJVUCIsIkRPIiwiRlAiLCJTQyIsIlRPQyIsIlRQTCIsIlBPRSIsIkNDIiwiTUYiXSwidmMiOiJjYjM3ZmEyOCJ9.pfNUO8YBnKbw1V6HXgFb9PZRMzfErUsssTFcQ83EftEDV-tFn_pPPmFpkaRb9Fjzj02osXclT6aKGsmyihJazg";

// Use default colors from the AWLDS
const awldsColorPalette = [
  // core colors
  { label: "Core Water Leaf", color: "#96e8e3" },
  { label: "Core Tropical Blue", color: "#c2d9fe" },
  { label: "Core Pale Lavender", color: "#e5cefd" },

  // accent colors
  { label: "Accent Canary Yellow", color: "#fff305" },
  { label: "Accent Grenadier", color: "#cc4400" },
  { label: "Accent Pink Orange", color: "#ff9966" },
  { label: "Accent Denim", color: "#165dd0" },
  { label: "Accent Navy Blue", color: "#266be3" },
  { label: "Accent Jordy Blue", color: "#7da6ed" },
  { label: "Accent Hawkes Blue", color: "#dbe8ff" },
  { label: "Accent Zircon", color: "#f5f8ff" },

  // tertiary colors
  { label: "Tertiary Viking", color: "#64d8d0" },
  { label: "Tertiary Cornflower Blue", color: "#629efe" },
  { label: "Tertiary Rich Lilac", color: "#bb69d8" },
  { label: "Tertiary Orchid", color: "#d584e1" },

  // neutral colors
  { label: "Neutral Black", color: "#292929" },
  { label: "Neutral Steel", color: "#666666" },
  { label: "Neutral Dove Gray", color: "#757575" },
  { label: "Neutral Mountain Mist", color: "#949494" },
  { label: "Neutral Athens Gray", color: "#dedede" },
  { label: "Neutral Gallery", color: "#f0f0f0" },
  { label: "Neutral White", color: "#ffffff" },

  // message colors
  { label: "Error Background", color: "#fdeded" },
  { label: "Error Shadow", color: "#ed4040" },
  { label: "Error", color: "#c71a1a" },
  { label: "Warning Background", color: "#ffefd1" },
  { label: "Warning", color: "#fbd037" },
  { label: "Success Background", color: "#e5f5e0" },
  { label: "Success Shadow", color: "#0fad01" },
  { label: "Success", color: "#107500" },
  { label: "Info", color: "#165dd0" },
  { label: "Info Background", color: "#dbe8ff" },
];

class AlightEditor extends ClassicEditor {
  public get textContent() { return this.getData().replace(/<[^>]*>/g, ''); }

  constructor(sourceElementOrData: HTMLElement | string, config?: any) {
    super(sourceElementOrData, config);
    SessionService.create(sessionStorage);

    // Suppress the unsafe attribute warning
    const originalConsoleWarn = console.warn;
    console.warn = function (...args) {
      // Check if this is the unsafe attribute warning
      if (args[0] && typeof args[0] === 'string' &&
        args[0].includes('domconverter-unsafe-attribute-detected')) {
        // Ignore this specific warning
        return;
      }
      // Pass through all other warnings
      originalConsoleWarn.apply(console, args);
    };
  }

  public static override builtinPlugins = [
    AccessibilityHelp,
    Alignment,
    Autoformat,
    AutoImage,
    Autosave,
    BlockQuote,
    Bold,
    Clipboard,
    DataSchema,
    Essentials,
    FindAndReplace,
    FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    FullPage,
    GeneralHtmlSupport,
    Heading,
    Highlight,
    HorizontalLine,
    HtmlComment,
    HtmlEmbed,
    Image,
    ImageCaption,
    ImageInsert,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    Indent,
    IndentBlock,
    Italic,
    // Link,
    // LinkImage,
    List,
    ListProperties,
    Markdown,
    MediaEmbed,
    MediaEmbedToolbar,
    Mention,
    PageBreak,
    Paragraph,
    PasteFromOffice,
    PastePlainText,
    RemoveFormat,
    SelectAll,
    ShowBlocks,
    SourceEditing,
    SpecialCharacters,
    SpecialCharactersArrows,
    SpecialCharactersCurrency,
    SpecialCharactersEssentials,
    SpecialCharactersLatin,
    SpecialCharactersMathematical,
    SpecialCharactersText,
    StandardEditingMode,
    Strikethrough,
    Style,
    Subscript,
    Superscript,
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar,
    TextPartLanguage,
    TextTransformation,
    TodoList,
    Underline,
    Undo,
    WordCount,
    // Alight Plugins
    AlightCopyPlugin,
    AlightEmailLinkPlugin,
    AlightExistingDocumentLinkPlugin,
    AlightExternalLinkPlugin,
    AlightImagePlugin,
    AlightNewDocumentLinkPlugin,
    // Alight Link Plugins
    AlightParentLinkPlugin,
    AlightPastePlugin,
    AlightPopulationPlugin,
    AlightPredefinedLinkPlugin,
    AlightTabsPlugin,
  ];

  public static override defaultConfig: EditorConfig = {
    toolbar: {
      items: [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "blockQuote",
        "subscript",
        "superscript",
        "|",
        "bulletedList",
        "numberedList",
        "todoList",
        "|",
        "outdent",
        "indent",
        "alignment",
        "|",
        // "link",
        "imageInsert",
        // "imageUpload",
        "mediaEmbed",
        "|",
        "insertTable",
        "|",
        "horizontalLine",
        "specialCharacters",
        "-",
        "style",
        "heading",
        "textPartLanguage",
        "|",
        "fontFamily",
        "fontSize",
        "pageBreak",
        "|",
        "fontColor",
        "fontBackgroundColor",
        "highlight",
        "findAndReplace",
        "|",
        "undo",
        "redo",
        "|",
        "selectAll",
        "|",
        "removeFormat",
        "-",
        // Custom Plugins
        "alightTabsPlugin",
        "alightCopyPlugin",
        "alightPastePlugin",
        "alightImagePlugin",
        "alightPopulationPlugin",
        // Alight Link Plugins
        "alightParentLinkPlugin",
        "alightExternalLinkPlugin",
        "alightPredefinedLinkPlugin",
        "alightEmailLinkPlugin",
        "alightExistingDocumentLinkPlugin",
        "alightNewDocumentLinkPlugin",
      ],
      shouldNotGroupWhenFull: true,
    },
    // Link plugins configuration - developers can override this
    alightParentLinkPlugin: {
      linkPlugins: [
        {
          id: "alightExternalLinkPlugin",
          name: "AlightExternalLinkPlugin",
          command: "alightExternalLinkPlugin",
          label: "External Site",
          order: 1,
          enabled: true
        },
        {
          id: "alightPredefinedLinkPlugin",
          name: "AlightPredefinedLinkPlugin",
          command: "alightPredefinedLinkPlugin",
          label: "Predefined Link",
          order: 2,
          enabled: true
        },
        {
          id: "alightEmailLinkPlugin",
          name: "AlightEmailLinkPlugin",
          command: "alightEmailLinkPlugin",
          label: "Email",
          order: 3,
          enabled: true
        },
        {
          id: "alightExistingDocumentLinkPlugin",
          name: "AlightExistingDocumentLinkPlugin",
          command: "alightExistingDocumentLinkPlugin",
          label: "Existing Document",
          order: 4,
          enabled: true
        },
        {
          id: "alightNewDocumentLinkPlugin",
          name: "AlightNewDocumentLinkPlugin",
          command: "alightNewDocumentLinkPlugin",
          label: "New Document",
          order: 5,
          enabled: true
        }
      ]
    },
    htmlSupport: {
      allow: [
        {
          name: "ah:expr",
          attributes: ["name", "class", "title", "assettype"],
          classes: ["*"],
          styles: ["*"]
        }, {
          name: "ah:link",
          attributes: ["*"],
          classes: ["*"],
          styles: ["*"]
        }, {
          name: "a",
          attributes: {
            "data-*": true,
            "data-cke-saved-href": true,
            href: true,
            id: true,
            onclick: true,
            orgnameattr: true,
            target: true,
          },
          classes: ["*"],
          styles: ["*"]
        }, {
          name: "figure",
          attributes: true,
          classes: ["*"],
          styles: ["*"]
        }, {
          name: "img",
          attributes: {
            alt: true,
            src: true,
            srcset: true,
            title: true,
            width: true,
          },
          classes: ["*"],
          styles: ["*"]
        }, {
          name: "svg",
          attributes: true,
          classes: ["*"],
          styles: ["*"]
        }, {
          name: "span", // Ensure spans inside ah:expr are allowed
          classes: [
            "cka-population-tag",
            "cka-population-begin",
            "cka-population-end",
            "*" // Added wildcard to allow all classes
          ],
          attributes: ["data-population-name", "data-*"]
        }, {
          name: /^(h[1-6])$/,
          attributes: true, // Allows all attributes, including href from links
          classes: ["*"],
          styles: ["*"]
        }
      ],
      disallow: [] // Optionally disallow conflicting elements
    },
    fontBackgroundColor: {
      colors: awldsColorPalette,
      colorPicker: false,
      columns: 5,
    },
    fontColor: {
      colors: awldsColorPalette,
      colorPicker: false,
      columns: 5,
    },
    fontSize: {
      options: ["default", 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72],
    },
    heading: {
      options: [
        { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
        { model: "heading1", view: "h1", title: "heading1", class: "ck-heading_heading1" },
        { model: "heading2", view: "h2", title: "heading2", class: "ck-heading_heading2" },
        { model: "heading3", view: "h3", title: "heading3", class: "ck-heading_heading3" },
        { model: "heading4", view: "h4", title: "heading4", class: "ck-heading_heading4" },
        { model: "heading5", view: "h5", title: "heading5", class: "ck-heading_heading5" },
        { model: "heading6", view: "h6", title: "heading6", class: "ck-heading_heading6" },
        { model: "headingFormatted", view: "pre", title: "Formatted", class: "ck-heading_headingFormatted" },
        { model: "headingAddress", view: "address", title: "Address", class: "ck-heading_headingAddress" },
        { model: "headingNormalDiv", view: "div", title: "Normal (Div)", class: "ck-heading_headingNormalDiv" },
      ],
    },
    image: {
      toolbar: [
        "imageTextAlternative",
        "toggleImageCaption",
        "imageStyle:inline",
        "imageStyle:block",
        "imageStyle:side",
        "linkImage",
      ],
    },
    indentBlock: {
      offset: 1,
      unit: "em",
    },
    language: {
      ui: "en",
      content: "en", // Ensures English is the default content language
      textPartLanguage: [
        { title: "English (American)", languageCode: "en" },
        { title: "Arabic", languageCode: "ar", textDirection: "rtl" },
        { title: "Chinese (China)", languageCode: "zh-cn" },
        { title: "Chinese (Taiwan)", languageCode: "zh-tw" },
        { title: "Dutch", languageCode: "nl" },
        { title: "French", languageCode: "fr" },
        { title: "French (Canada)", languageCode: "fr-ca" },
        { title: "German", languageCode: "de" },
        { title: "Italian", languageCode: "it" },
        { title: "Japanese", languageCode: "ja" },
        { title: "Portuguese (Brazilian)", languageCode: "pt-br" },
        { title: "Portuguese", languageCode: "pt" },
        { title: "Russian", languageCode: "ru" },
        { title: "Spanish", languageCode: "es" },
      ],
    },
    link: {
      decorators: {
        documentLink: {
          mode: 'manual',
          label: 'Document Link',
        },
        predefinedLink: {
          mode: 'manual',
          label: 'Predefined Link',
        }
      }
    },
    list: {
      properties: {
        startIndex: false,
        reversed: false,
        styles: {
          listStyleTypes: {
            numbered: ['decimal'],
            bulleted: ['disc']
          }
        }
      }
    },
    mediaEmbed: {
      toolbar: ["mediaEmbed"],
    },
    style: {
      definitions: [
        { name: "Italic Title", element: "h2", classes: ["italic-title"] },
        { name: "Subtitle", element: "p", classes: ["subtitle"] },
        { name: "Special Container", element: "p", classes: ["special-container"] },
        { name: "Big", element: "big", classes: ["big"] },
        { name: "Small", element: "small", classes: ["small"] },
        { name: "Typewriter", element: "tt", classes: ["typewriter"] },
        { name: "Computer Code", element: "code", classes: ["computer-code"] },
        { name: "Keyboard Phrase", element: "kbd", classes: ["keyboard-phrase"] },
        { name: "Sample Text", element: "samp", classes: ["sample-text"] },
        { name: "Variable", element: "var", classes: ["variable"] },
        { name: "Deleted Text", element: "del", classes: ["deleted-text"] },
        { name: "Inserted Text", element: "ins", classes: ["inserted-text"] },
        { name: "Cited Work", element: "cite", classes: ["cited-work"] },
        { name: "Inline Quotation", element: "q", classes: ["inline-quotation"] },
        { name: "Language: RTL", element: "span", classes: ["language-rtl"] },
        { name: "Language: LTR", element: "span", classes: ["language-ltr"] },
      ],
    },
    table: {
      contentToolbar: [
        "tableColumn",
        "tableRow",
        "mergeTableCells",
        "|",
        "tableProperties",
        "tableCellProperties",
      ],
      tableProperties: {
        // The default styles for tables in the editor.
        // They should be synchronized with the content styles.
        defaultProperties: {
          borderColor: "black",
          borderStyle: "solid",
          borderWidth: "2px",
          height: "100%",
          width: "100%",
        },
        // Keep the colors defined by AWLDS - removed color picker
        borderColors: awldsColorPalette,
        backgroundColors: awldsColorPalette,
        colorPicker: false,
      },
      // The default styles for table cells in the editor.
      // They should be synchronized with the content styles.
      tableCellProperties: {
        defaultProperties: {
          borderColor: "black",
          borderStyle: "solid",
          borderWidth: "1px",
          padding: "10px",
        },
        // Keep the colors defined by AWLDS - removed color picker
        borderColors: awldsColorPalette,
        backgroundColors: awldsColorPalette,
        colorPicker: false,
      },
    },
    placeholder: "",
    licenseKey: LICENSE_KEY,
  };
}

export default AlightEditor;
