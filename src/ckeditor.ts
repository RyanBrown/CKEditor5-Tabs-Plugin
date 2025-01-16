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
import AlightCopyPlugin from './plugins/alight-copy_plugin/alight-copy-plugin';
import AlightImagePlugin from './plugins/alight-image_plugin/alight-image-plugin';
import AlightLinkPlugin from './plugins/alight-link_plugin/alight-link-plugin';
import AlightPastePlugin from './plugins/alight-paste_plugin/alight-paste-plugin';
import AlightPopulationPlugin from './plugins/alight-population_plugin/alight-population-plugin';
import ModalTriggerPlugin from './plugins/modal-trigger_plugin/modal-trigger-plugin';
import TabsPlugin from './plugins/Tabs_Plugin/tabs-plugin';

// Import custom styles for headings, style definitions and custom plugins
import './styles/styles.css';

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
        AlightCopyPlugin,
        AlightImagePlugin,
        AlightLinkPlugin,
        AlightPastePlugin,
        AlightPopulationPlugin,
        ModalTriggerPlugin,
        TabsPlugin,
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
                'alightLinkPlugin',
                // 'modalTrigger',
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
            'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3Mzc1MDM5OTksImp0aSI6IjdlYjAxOGZhLTJkNWYtNDdkYS1hNjI1LWFmZmJhMjY2ODk2ZSIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6ImM3NDFjZTQ3In0.IXuphGLHOZU1I6T_L0QR2Ufd7lWIHEbjWPpD41b8olt3IACjAd8TxMaj6ClJmqx3XD6nWFqw49ctczRzornvCA',
    };
}

export default { Editor, EditorWatchdog };
