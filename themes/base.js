import merge from 'lodash.merge';
import Emitter from '../core/emitter';
import Theme from '../core/theme';
import ColorPicker from '../ui/color-picker';
import IconPicker from '../ui/icon-picker';
import Picker from '../ui/picker';
import Tooltip from '../ui/tooltip';

import Emojitool from "../ui/emojitool";
import LinkBlot from "../formats/link";
import {Range} from "../core/selection";

import emojiList from "../formats/emojilist";
import Emoji from "../formats/emoji";

const ALIGNS = [false, 'center', 'right', 'justify'];

const COLORS = [
    '#000000',
    '#e60000',
    '#ff9900',
    '#ffff00',
    '#008a00',
    '#0066cc',
    '#9933ff',
    '#ffffff',
    '#facccc',
    '#ffebcc',
    '#ffffcc',
    '#cce8cc',
    '#cce0f5',
    '#ebd6ff',
    '#bbbbbb',
    '#f06666',
    '#ffc266',
    '#ffff66',
    '#66b966',
    '#66a3e0',
    '#c285ff',
    '#888888',
    '#a10000',
    '#b26b00',
    '#b2b200',
    '#006100',
    '#0047b2',
    '#6b24b2',
    '#444444',
    '#5c0000',
    '#663d00',
    '#666600',
    '#003700',
    '#002966',
    '#3d1466',
];

const FONTS = [false, 'serif', 'monospace'];

const HEADERS = ['1', '2', '3', false];

const SIZES = ['small', false, 'large', 'huge'];

class BaseTheme extends Theme {
    constructor(quill, options) {
        super(quill, options);
        const listener = e => {
            if (!document.body.contains(quill.root)) {
                document.body.removeEventListener('click', listener);
                return;
            }
            if (
                this.tooltip != null &&
                !this.tooltip.root.contains(e.target) &&
                document.activeElement !== this.tooltip.textbox &&
                !this.quill.hasFocus()
            ) {
                this.tooltip.hide();
            }

            if (
                this.emojibox != null &&
                !this.emojibox.root.contains(e.target) &&
                document.activeElement !== this.emojibox.root &&
                !this.quill.hasFocus()
            ) {
                this.emojibox.hide();
            }

            if (this.pickers != null) {
                this.pickers.forEach(picker => {
                    if (!picker.container.contains(e.target)) {
                        picker.close();
                    }
                });
            }
        };
        quill.emitter.listenDOM('click', document.body, listener);
    }

    addModule(name) {
        const module = super.addModule(name);
        if (name === 'toolbar') {
            this.extendToolbar(module);
        }
        return module;
    }

    buildButtons(buttons, icons) {
        Array.from(buttons).forEach(button => {
            const className = button.getAttribute('class') || '';
            className.split(/\s+/).forEach(name => {
                if (!name.startsWith('ql-')) return;
                name = name.slice('ql-'.length);
                if (icons[name] == null) return;
                if (name === 'direction') {
                    button.innerHTML = icons[name][''] + icons[name].rtl;
                } else if (typeof icons[name] === 'string') {
                    button.innerHTML = icons[name];
                } else {
                    const value = button.value || '';
                    if (value != null && icons[name][value]) {
                        button.innerHTML = icons[name][value];
                    }
                }
            });
        });
    }

    buildPickers(selects, icons) {
        this.pickers = Array.from(selects).map(select => {
            if (select.classList.contains('ql-align')) {
                if (select.querySelector('option') == null) {
                    fillSelect(select, ALIGNS);
                }
                return new IconPicker(select, icons.align);
            }
            if (
                select.classList.contains('ql-background') ||
                select.classList.contains('ql-color')
            ) {
                const format = select.classList.contains('ql-background')
                    ? 'background'
                    : 'color';
                if (select.querySelector('option') == null) {
                    fillSelect(
                        select,
                        COLORS,
                        format === 'background' ? '#ffffff' : '#000000',
                    );
                }
                return new ColorPicker(select, icons[format]);
            }
            if (select.querySelector('option') == null) {
                if (select.classList.contains('ql-font')) {
                    fillSelect(select, FONTS);
                } else if (select.classList.contains('ql-header')) {
                    fillSelect(select, HEADERS);
                } else if (select.classList.contains('ql-size')) {
                    fillSelect(select, SIZES);
                }
            }
            return new Picker(select);
        });
        const update = () => {
            this.pickers.forEach(picker => {
                picker.update();
            });
        };
        this.quill.on(Emitter.events.EDITOR_CHANGE, update);
    }
}

BaseTheme.DEFAULTS = merge({}, Theme.DEFAULTS, {
    modules: {
        toolbar: {
            handlers: {
                formula() {
                    this.quill.theme.emojibox.cancel();
                    this.quill.theme.tooltip.edit('formula');
                },
                topic() {
                    this.quill.theme.emojibox.cancel();
                    this.quill.theme.tooltip.edit('topic');
                },
                aiteuser() {
                    this.quill.theme.emojibox.cancel();
                    this.quill.theme.tooltip.edit('aiteuser');
                },
                emoji() {
                    this.quill.theme.tooltip.cancel();
                    this.quill.theme.emojibox.showBox();
                },
                image() {
                    this.quill.theme.emojibox.cancel();

                    let fileInput = this.container.querySelector(
                        'input.ql-image[type=file]',
                    );
                    if (fileInput == null) {
                        fileInput = document.createElement('input');
                        fileInput.setAttribute('type', 'file');
                        fileInput.setAttribute(
                            'accept',
                            this.quill.uploader.options.mimetypes.join(', '),
                        );
                        fileInput.classList.add('ql-image');
                        fileInput.addEventListener('change', () => {
                            const range = this.quill.getSelection(true);
                            this.quill.uploader.upload(range, fileInput.files);
                            fileInput.value = '';
                        });
                        this.container.appendChild(fileInput);
                    }
                    fileInput.click();
                },
                video() {
                    this.quill.theme.emojibox.cancel();
                    this.quill.theme.tooltip.edit('video');
                },
            },
        },
    },
});

//表情
class EmojiBox extends Emojitool {
    constructor(quill, boundsContainer) {
        super(quill, boundsContainer);
        this.emojiData = emojiList;
        //this.emojiMap = {};
        this.listen();
    }


    listen() {
        this.root.querySelector('a.ql-cancel').addEventListener('click', event => {
            event.preventDefault();
            this.hide();
        });

        this.quill.on(
            Emitter.events.SELECTION_CHANGE,
            (range, oldRange, source) => {
                if (range == null) return;
                this.hide();
            },
        );

    }

    showBox() {
        this.root.classList.remove('ql-hidden');
        this.root.classList.add('ql-editing');
        let div = this.root.querySelector("ul.ql-emoji-content");
        let isLoad = div.getAttribute("data-load");
        if (isLoad === "false") {

            this.emojiData.imgs.forEach(item => {
                //this.emojiMap[item.title] = item;
                const node = document.createElement('li');
                let img = document.createElement("img");
                img.setAttribute("title",item.title);
                img.src="https://img.guibi.com/emot/qq/"+item.src;
                node.addEventListener('click', event => {
                    this.clickEmoji(item);
                    event.preventDefault();
                });
                node.appendChild(img);
                div.appendChild(node);

            });
            div.setAttribute("data-load", "true");
        }

        this.position(this.quill.getBounds(this.quill.selection.savedRange));
        //this.quill.hasFocus();

    }

    clickEmoji(data) {
        if (!data) return;
        const range = this.quill.getSelection(true);
        if (range != null) {
            const index = range.index + range.length;

            this.quill.insertEmbed(
                index,
                "emoji",
                JSON.stringify(data),
                Emitter.sources.USER,
            );
            this.quill.setSelection(index + 1, Emitter.sources.USER);
        }
        this.hide();
    }

    cancel() {
        this.hide();
    }


    restoreFocus() {
        const {scrollTop} = this.quill.scrollingContainer;
        this.quill.focus();
        this.quill.scrollingContainer.scrollTop = scrollTop;
    }

}

EmojiBox.TEMPLATE = [
    '<a class="ql-cancel">取消</a>',
    '<ul class="ql-emoji-content" data-load="false" ></ul>',
].join('');


class BaseTooltip extends Tooltip {
    constructor(quill, boundsContainer) {
        super(quill, boundsContainer);
        this.textbox = this.root.querySelector('input[type="text"]');


        this.textbox.addEventListener('input', event => {
            let mode = this.root.getAttribute('data-mode');
            if ((mode === "topic" && quill.options.searchTopic !== null) || (mode === "aiteuser" && quill.options.searchUser !== null)) {
                let {value} = this.textbox;
                let dom = this.root.querySelector('div.ql-search');

                let nodes = dom.querySelectorAll("span");
                nodes.forEach(e => e.parentNode.removeChild(e));
                if (mode === "topic") {
                    quill.options.searchTopic(this, value);
                } else {
                    quill.options.searchUser(this, value);
                }
            }
        });

        this.listen();
    }

    listen() {

        this.textbox.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                this.save();
                event.preventDefault();
            } else if (event.key === 'Escape') {
                this.cancel();
                event.preventDefault();
            }

        });
    }

    cancel() {
        this.hide();
    }

    edit(mode = 'link', preview = null) {
        this.root.classList.remove('ql-hidden');
        this.root.classList.add('ql-editing');

        if (mode === "topic" || mode === "aiteuser") {
            let dom = this.root.querySelector('div.ql-search');
            let nodes = dom.querySelectorAll("span");
            nodes.forEach(e => e.parentNode.removeChild(e));

            this.root.querySelector('div.ql-search').classList.remove("ql-hidden");
            this.root.querySelector('a.ql-cancel').classList.remove("ql-hidden");
            this.root.querySelector('a.ql-action').classList.add("ql-hidden");
        } else {
            this.root.querySelector('div.ql-search').classList.add("ql-hidden");
            this.root.querySelector('a.ql-cancel').classList.add("ql-hidden");
            this.root.querySelector('a.ql-action').classList.remove("ql-hidden");
        }

        if (preview != null) {
            this.textbox.value = preview;
        } else if (mode !== this.root.getAttribute('data-mode')) {
            this.textbox.value = '';
        }
        this.position(this.quill.getBounds(this.quill.selection.savedRange));
        this.textbox.select();
        this.textbox.setAttribute(
            'placeholder',
            this.textbox.getAttribute(`data-${mode}`) || '',
        );
        this.root.setAttribute('data-mode', mode);
    }

    restoreFocus() {
        const {scrollTop} = this.quill.scrollingContainer;
        this.quill.focus();
        this.quill.scrollingContainer.scrollTop = scrollTop;
    }

    save() {
        let {value} = this.textbox;
        switch (this.root.getAttribute('data-mode')) {
            case 'link': {
                const {scrollTop} = this.quill.root;
                if (this.linkRange) {
                    this.quill.formatText(
                        this.linkRange,
                        'link',
                        value,
                        Emitter.sources.USER,
                    );
                    delete this.linkRange;
                } else {
                    this.restoreFocus();
                    this.quill.format('link', value, Emitter.sources.USER);
                }
                this.quill.root.scrollTop = scrollTop;
                break;
            }
            case 'video': {
                value = extractVideoUrl(value);
            } // eslint-disable-next-line no-fallthrough
            case 'formula': {
                if (!value) break;
                const range = this.quill.getSelection(true);
                if (range != null) {
                    const index = range.index + range.length;
                    this.quill.insertEmbed(
                        index,
                        this.root.getAttribute('data-mode'),
                        value,
                        Emitter.sources.USER,
                    );
                    if (this.root.getAttribute('data-mode') === 'formula') {
                        this.quill.insertText(index + 1, ' ', Emitter.sources.USER);
                    }
                    this.quill.setSelection(index + 2, Emitter.sources.USER);
                }
                break;
            }
            default:
        }
        this.textbox.value = '';
        this.hide();
    }

    saveTopicOrAiteuser(id, value) {
        if (!value) return;
        const range = this.quill.getSelection(true);
        if (range != null) {
            const index = range.index + range.length;

            this.quill.insertEmbed(
                index,
                this.root.getAttribute('data-mode'),
                JSON.stringify({"target_name": value, "target_id": id}),
                Emitter.sources.USER,
            );
            if (this.root.getAttribute('data-mode') === 'topic' || this.root.getAttribute('data-mode') === 'aiteuser') {
                this.quill.insertText(index + 1, ' ', Emitter.sources.USER);
            }
            this.quill.setSelection(index + 2, Emitter.sources.USER);
        }
        this.textbox.value = '';
        this.hide();
    }


}

function extractVideoUrl(url) {
    let match =
        url.match(
            /^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/,
        ) ||
        url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (match) {
        return `${match[1] || 'https'}://www.youtube.com/embed/${
            match[2]
            }?showinfo=0`;
    }
    // eslint-disable-next-line no-cond-assign
    if ((match = url.match(/^(?:(https?):\/\/)?(?:www\.)?vimeo\.com\/(\d+)/))) {
        return `${match[1] || 'https'}://player.vimeo.com/video/${match[2]}/`;
    }
    return url;
}

function fillSelect(select, values, defaultValue = false) {
    values.forEach(value => {
        const option = document.createElement('option');
        if (value === defaultValue) {
            option.setAttribute('selected', 'selected');
        } else {
            option.setAttribute('value', value);
        }
        select.appendChild(option);
    });
}

export {EmojiBox, BaseTooltip, BaseTheme as default};
