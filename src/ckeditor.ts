/**
 * @license Copyright (c) 2014-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';

import { Alignment } from '@ckeditor/ckeditor5-alignment';
import { Autoformat } from '@ckeditor/ckeditor5-autoformat';
import { Autosave } from '@ckeditor/ckeditor5-autosave';
import { Bold, Italic, Strikethrough, Subscript, Superscript, Underline } from '@ckeditor/ckeditor5-basic-styles';
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote';
import type { EditorConfig } from '@ckeditor/ckeditor5-core';
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { FontBackgroundColor, FontColor, FontFamily, FontSize } from '@ckeditor/ckeditor5-font';
import { Heading, Title } from '@ckeditor/ckeditor5-heading';
import { Highlight } from '@ckeditor/ckeditor5-highlight';
import { HorizontalLine } from '@ckeditor/ckeditor5-horizontal-line';
import { Image, ImageCaption, ImageResize, ImageStyle, ImageToolbar, ImageUpload } from '@ckeditor/ckeditor5-image';
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
import { EditorWatchdog } from '@ckeditor/ckeditor5-watchdog';

// Custom Plugins
import TabsPlugin from './plugins/Tabs_Plugin/tabs-plugin';
import AlightLinkPlugin from './plugins/alight-link_plugin/alight-link-plugin';
import ModalTriggerPlugin from './plugins/modal-trigger_plugin/modal-trigger-plugin';
import AlightLinkUrlPlugin from './plugins/alight-link-url-plugin/alight-link-url-plugin';

// You can read more about extending the build with additional plugins in the "Installing plugins" guide.
// See https://ckeditor.com/docs/ckeditor5/latest/installation/plugins/installing-plugins.html for details.

const awldsColorPalette = [
  // Primary colors
  { label: 'Core Water Leaf', color: '#96e8e2' },
  { label: 'Core Tropical Blue', color: '#c2d9fe' },
  { label: 'Core Pale Lavender', color: '#e5cdfd' },
];

class Editor extends ClassicEditor {
  public static override builtinPlugins = [
    Alignment,
    Autoformat,
    Autosave,
    BlockQuote,
    Bold,
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
    // Custom Plugins
    TabsPlugin,
    AlightLinkPlugin,
    ModalTriggerPlugin,
    AlightLinkUrlPlugin,
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
        '|',
        'tabsPlugin',
        'alightLinkPlugin',
        'modalTrigger',
        'alightLinkUrlPlugin',
      ],
      shouldNotGroupWhenFull: true,
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
    licenseKey:
      'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NDcxODA3OTksImp0aSI6IjAwN2YzMTI1LTkyYTgtNDc0MS05NDNiLWViM2M3NjhjN2RhNiIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsic2giLCJkcnVwYWwiXSwid2hpdGVMYWJlbCI6dHJ1ZSwiZmVhdHVyZXMiOlsiRFJVUCIsIkRPIiwiRlAiLCJTQyIsIlRPQyIsIlRQTCIsIlBPRSIsIkNDIiwiTUYiXSwidmMiOiJjYjM3ZmEyOCJ9.pfNUO8YBnKbw1V6HXgFb9PZRMzfErUsssTFcQ83EftEDV-tFn_pPPmFpkaRb9Fjzj02osXclT6aKGsmyihJazg',
  };
}

export default { Editor, EditorWatchdog };
