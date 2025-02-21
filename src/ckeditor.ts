/**
 * @license Copyright (c) 2014-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';

import { AccessibilityHelp } from '@ckeditor/ckeditor5-ui';
import { Alignment } from '@ckeditor/ckeditor5-alignment';
import { Autoformat } from '@ckeditor/ckeditor5-autoformat';
import { Autosave } from '@ckeditor/ckeditor5-autosave';
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote';
import { Bold, Italic, Strikethrough, Subscript, Superscript, Underline } from '@ckeditor/ckeditor5-basic-styles';
import { Clipboard } from '@ckeditor/ckeditor5-clipboard';
import { DataSchema } from '@ckeditor/ckeditor5-html-support';
import type { EditorConfig } from '@ckeditor/ckeditor5-core';
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { FontBackgroundColor, FontColor, FontFamily, FontSize } from '@ckeditor/ckeditor5-font';
import { Heading, Title } from '@ckeditor/ckeditor5-heading';
import { Highlight } from '@ckeditor/ckeditor5-highlight';
import { HorizontalLine } from '@ckeditor/ckeditor5-horizontal-line';
import {
  AutoImage,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
} from '@ckeditor/ckeditor5-image';
import { Indent, IndentBlock } from '@ckeditor/ckeditor5-indent';
import { TextPartLanguage } from '@ckeditor/ckeditor5-language';
import { Link, LinkImage } from '@ckeditor/ckeditor5-link';
import { List, ListProperties, TodoList } from '@ckeditor/ckeditor5-list';
import { MediaEmbed, MediaEmbedToolbar } from '@ckeditor/ckeditor5-media-embed';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { PasteFromOffice } from '@ckeditor/ckeditor5-paste-from-office';
import { RemoveFormat } from '@ckeditor/ckeditor5-remove-format';
import { SelectAll } from '@ckeditor/ckeditor5-select-all';
import {
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
} from '@ckeditor/ckeditor5-table';
import { TextTransformation } from '@ckeditor/ckeditor5-typing';
import { Undo } from '@ckeditor/ckeditor5-undo';
import { WordCount } from '@ckeditor/ckeditor5-word-count';
import { EditorWatchdog } from '@ckeditor/ckeditor5-watchdog';

// Custom Plugins
import AlightCopyPlugin from './plugins/alight-copy-plugin/alight-copy-plugin';
import AlightImagePlugin from './plugins/alight-image-plugin/alight-image-plugin';
import AlightPastePlugin from './plugins/alight-paste-plugin/alight-paste-plugin';
import AlightPopulationPlugin from './plugins/alight-population-plugin/alight-population-plugin';
import TabsPlugin from './plugins/alight-tabs-plugin/alight-tabs-plugin';

import AlightParentLinkPlugin from './plugins/alight-parent-link-plugin/alight-parent-link-plugin';
import AlightPredefinedLinkPlugin from './plugins/alight-predefined-link-plugin/alight-predefined-link-plugin';
import AlightGenericLinkPlugin from './plugins/alight-generic-link-plugin/alight-generic-link-plugin';
import AlightNewDocumentLinkPlugin from './plugins/alight-new-document-link-plugin/alight-new-document-link-plugin';
import AlightExistingDocumentLinkPlugin from './plugins/alight-existing-document-link-plugin/alight-existing-document-link-plugin';
import AlightEmailLinkPlugin from './plugins/alight-email-link-plugin/alight-email-link-plugin';

// Import custom styles for headings, style definitions and custom plugins
import './styles/styles.scss';

// import fontawesome
const script = document.createElement('script');
script.src = 'https://kit.fontawesome.com/019f6c532e.js';
script.crossOrigin = 'anonymous';
document.head.appendChild(script);

export const LICENSE_KEY =
  'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NDcxODA3OTksImp0aSI6IjAwN2YzMTI1LTkyYTgtNDc0MS05NDNiLWViM2M3NjhjN2RhNiIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsic2giLCJkcnVwYWwiXSwid2hpdGVMYWJlbCI6dHJ1ZSwiZmVhdHVyZXMiOlsiRFJVUCIsIkRPIiwiRlAiLCJTQyIsIlRPQyIsIlRQTCIsIlBPRSIsIkNDIiwiTUYiXSwidmMiOiJjYjM3ZmEyOCJ9.pfNUO8YBnKbw1V6HXgFb9PZRMzfErUsssTFcQ83EftEDV-tFn_pPPmFpkaRb9Fjzj02osXclT6aKGsmyihJazg';

// Use default colors from the AWLDS
const awldsColorPalette = [
  // primary colors
  { label: 'Core Water Leaf', color: '#97e8e2' },
  { label: 'Core Tropical Blue', color: '#c2d9fe' },
  { label: 'Core Pale Lavender', color: '#e5cefd' },

  // secondary colors
  { label: 'Accent Apricot', color: '#ffcbb1' },
  { label: 'Accent Canary Yellow', color: '#fff200' },
  { label: 'Accent Denim', color: '#165bcf' },
  { label: 'Accent Grenadier', color: '#cd4400' },
  { label: 'Accent Hawks Blue', color: '#dce9ff' },
  { label: 'Accent Jordy Blue', color: '#7da7ed' },
  { label: 'Accent Navy Blue', color: '#266de2' },
  { label: 'Accent Pink Orange', color: '#ff9966' },
  { label: 'Accent Zircon', color: '#f6f9ff' },

  // tertiary colors
  { label: 'Tertiary Cornflower Blue', color: '#639dfe' },
  { label: 'Tertiary Orchid', color: '#d382e0' },
  { label: 'Tertiary Rich Lilac', color: '#bb6bd9' },
  { label: 'Tertiary Viking', color: '#64d9d2' },

  // neutral colors
  { label: 'Neutral Black', color: '#282828' },
  { label: 'Neutral Dove Gray', color: '#767676' },
  { label: 'Neutral Steel', color: '#666666' },
  { label: 'Neutral Mountain Mist', color: '#959595' },
  { label: 'Neutral Athens Gray', color: '#dedede' },
  { label: 'Neutral Gallery', color: '#efefef' },
  { label: 'Neutral White', color: '#ffffff' },

  // semantic colors
  { label: 'Error Background', color: '#fdebec' },
  { label: 'Error Shadow', color: '#ed3f3f' },
  { label: 'Error', color: '#c61a1a' },
  { label: 'Warning Background', color: '#ffefd2' },
  { label: 'Warning', color: '#fbcf35' },
  { label: 'Success Background', color: '#e6f6e1' },
  { label: 'Success Shadow', color: '#0fab01' },
  { label: 'Success', color: '#107400' },
  { label: 'Info', color: '#165dd0' },
  { label: 'Info Background', color: '#dbe8ff' },
];

class Editor extends ClassicEditor {
  public static override builtinPlugins = [
    AccessibilityHelp,
    Alignment,
    Autoformat,
    Autosave,
    AutoImage,
    BlockQuote,
    Bold,
    Clipboard,
    DataSchema,
    Essentials,
    FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    Heading,
    Highlight,
    HorizontalLine,
    Image,
    ImageCaption,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    ImageInsert,
    Indent,
    IndentBlock,
    Italic,
    Link,
    LinkImage,
    List,
    ListProperties,
    MediaEmbed,
    MediaEmbedToolbar,
    Paragraph,
    PasteFromOffice,
    RemoveFormat,
    SelectAll,
    Strikethrough,
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
    Title,
    TodoList,
    Underline,
    Undo,
    WordCount,

    // Custom Plugins
    AlightCopyPlugin,
    AlightImagePlugin,
    AlightPastePlugin,
    AlightPopulationPlugin,
    TabsPlugin,
    AlightParentLinkPlugin,
    AlightGenericLinkPlugin,
    AlightPredefinedLinkPlugin,
    AlightNewDocumentLinkPlugin,
    AlightExistingDocumentLinkPlugin,
    AlightEmailLinkPlugin,
  ];

  public static override defaultConfig: EditorConfig = {
    toolbar: {
      items: [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'blockQuote',
        'subscript',
        'superscript',
        '|',
        'horizontalLine',
        'link',
        '|',
        'bulletedList',
        'numberedList',
        'todoList',
        '|',
        'outdent',
        'indent',
        'alignment',
        '|',
        'imageUpload',
        'mediaEmbed',
        '|',
        'insertTable',
        '|',
        '-',
        'heading',
        '|',
        'textPartLanguage',
        // '|',
        // 'pageBreak',
        '|',
        'fontColor',
        'fontBackgroundColor',
        'fontFamily',
        'fontSize',
        'highlight',
        '|',
        'undo',
        'redo',
        '|',
        'selectAll',
        '|',
        'removeFormat',
        '-',
        'tabsPlugin',
        'alightCopyPlugin',
        'alightPastePlugin',
        'alightImagePlugin',
        'alightPopulationPlugin',
        'alightParentLinkPlugin',
        'alightGenericLinkPlugin',
        'alightPredefinedLinkPlugin',
        'alightEmailLinkPlugin',
        'alightExistingDocumentLinkPlugin',
        'alightNewDocumentLinkPlugin',
      ],
      shouldNotGroupWhenFull: true,
    },
    htmlSupport: {
      allow: [
        {
          name: 'svg',
          attributes: true,
          classes: true,
          styles: true
        },
        {
          name: 'span',
          classes: true,
          styles: true
        }
      ]
    },
    language: 'en',
    image: {
      toolbar: [
        'imageTextAlternative',
        'toggleImageCaption',
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side',
        'linkImage',
      ],
    },
    mediaEmbed: {
      toolbar: ['mediaEmbed'],
    },
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells',
        '|',
        'tableCellProperties',
        'tableProperties',
      ],
      tableProperties: {
        defaultProperties: {
          borderColor: 'black',
          borderStyle: 'solid',
          borderWidth: '2px',
          height: '100%',
          width: '100%',
        },
        borderColors: awldsColorPalette,
        backgroundColors: awldsColorPalette,
        colorPicker: false,
      },
      tableCellProperties: {
        defaultProperties: {
          borderColor: 'black',
          borderStyle: 'solid',
          borderWidth: '1px',
          padding: '10px',
        },
      },
    },
    indentBlock: {
      offset: 1,
      unit: 'em',
    },
    title: { placeholder: '' },
    placeholder: '',
    // Add the license key here:
    licenseKey: LICENSE_KEY,
  };
}

export default { Editor, EditorWatchdog };


